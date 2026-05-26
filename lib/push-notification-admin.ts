import { ServerValue } from "firebase-admin/database";
import {
  getFcmAccessToken,
  isApnsConfigurationError,
  sendFcmLegacyMessage,
  sendFcmV1Message,
} from "@/lib/fcm-v1-client";
import { getAdminDb, getAdminRtdb } from "@/lib/firebase-admin";

export type PushTarget = "all" | "user";

export type SendAdminPushInput = {
  title: string;
  body: string;
  target: PushTarget;
  userId?: string;
  /** Stored on in-app notification (message, system, match, etc.) */
  notificationType?: string;
  deepLinkType?: string;
  conversationId?: string;
  inviteId?: string;
};

export type SendAdminPushResult = {
  attempted: number;
  sent: number;
  failed: number;
  inAppWritten: number;
  errors: string[];
};

export class PushNotificationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const FCM_SETUP_HINT =
  "FCM auth failed for the Firebase Admin service account. In Google Cloud Console (same project as swing-b7a0c): enable “Firebase Cloud Messaging API”, grant your service account “Firebase Cloud Messaging Admin” (or Editor), and use the service account JSON from Firebase → Project settings → Service accounts.";

/** Only real FCM HTTP auth failures (not APNs — Google uses similar wording). */
function isFcmCredentialError(message: string): boolean {
  if (message.startsWith("in-app ")) return false;
  if (isApnsConfigurationError(message)) return false;
  return (
    message.includes("authentication credential") ||
    message.includes("OAuth 2 access token") ||
    message.includes("authenticate to the FCM")
  );
}

type TokenRecord = {
  uid: string;
  token: string;
};

export type PushTokenListEntry = {
  uid: string;
  platform: string;
  source: "rtdb" | "firestore";
  tokenPreview: string;
  updatedAt: number | null;
  appVersion: string | null;
};

function parsePushTokenValue(data: unknown): string | undefined {
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    const token = (data as { token?: unknown }).token;
    if (typeof token === "string" && token.trim()) return token.trim();
  }
  return undefined;
}

function resolveFirestoreUserId(
  docId: string,
  data: Record<string, unknown>,
): string {
  const idField = data.id;
  if (typeof idField === "string" && idField.trim()) return idField.trim();
  return docId;
}

function tokenPreview(token: string): string {
  if (token.length <= 24) return `${token.slice(0, 8)}…`;
  return `${token.slice(0, 12)}…${token.slice(-6)}`;
}

function firestoreUpdatedAtMs(data: Record<string, unknown>): number | null {
  const ts = data.fcmTokenUpdatedAt;
  if (ts && typeof ts === "object" && "toMillis" in ts) {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (typeof ts === "number") return ts;
  return null;
}

async function loadRtdbPushTokens(userId?: string): Promise<TokenRecord[]> {
  const rtdb = getAdminRtdb();
  const records: TokenRecord[] = [];

  if (userId) {
    const snap = await rtdb.ref(`userPushTokens/${userId}`).get();
    const token = parsePushTokenValue(snap.val());
    if (token) records.push({ uid: userId, token });
    return records;
  }

  const snap = await rtdb.ref("userPushTokens").get();
  const val = snap.val() as Record<string, unknown> | null;
  if (!val) return records;

  for (const [uid, data] of Object.entries(val)) {
    const token = parsePushTokenValue(data);
    if (token) records.push({ uid, token });
  }
  return records;
}

/** iOS app stores FCM token on Firestore users/{uid}.fcmToken */
async function loadFirestorePushTokens(userId?: string): Promise<TokenRecord[]> {
  const db = getAdminDb();
  const records: TokenRecord[] = [];

  if (userId) {
    const doc = await db.collection("users").doc(userId).get();
    if (doc.exists) {
      const data = doc.data() ?? {};
      const token = data.fcmToken;
      const uid = resolveFirestoreUserId(doc.id, data);
      if (typeof token === "string" && token.trim()) {
        records.push({ uid, token: token.trim() });
      }
    }
    return records;
  }

  const usersSnap = await db.collection("users").get();
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const token = data.fcmToken;
    if (typeof token !== "string" || !token.trim()) continue;
    records.push({
      uid: resolveFirestoreUserId(doc.id, data),
      token: token.trim(),
    });
  }
  return records;
}

/** RTDB userPushTokens wins over Firestore when both exist for a uid. */
function mergePushTokenRecords(
  rtdb: TokenRecord[],
  firestore: TokenRecord[],
): TokenRecord[] {
  const map = new Map<string, TokenRecord>();
  for (const r of firestore) map.set(r.uid, r);
  for (const r of rtdb) map.set(r.uid, r);
  return Array.from(map.values());
}

async function loadPushTokens(userId?: string): Promise<TokenRecord[]> {
  const [rtdbRecords, firestoreRecords] = await Promise.all([
    loadRtdbPushTokens(userId),
    loadFirestorePushTokens(userId),
  ]);
  return mergePushTokenRecords(rtdbRecords, firestoreRecords);
}

/** For admin UI — tokens from RTDB and/or Firestore users.fcmToken */
export async function listPushTokenUsersForAdmin(): Promise<PushTokenListEntry[]> {
  const rtdb = getAdminRtdb();
  const snap = await rtdb.ref("userPushTokens").get();
  const rtdbVal = snap.val() as Record<string, unknown> | null;

  const byUid = new Map<string, PushTokenListEntry>();

  for (const [uid, data] of Object.entries(rtdbVal ?? {})) {
    const token = parsePushTokenValue(data);
    if (!token) continue;
    const meta =
      data && typeof data === "object"
        ? (data as {
            platform?: string;
            updatedAt?: number;
            appVersion?: string;
          })
        : {};
    byUid.set(uid, {
      uid,
      platform: meta.platform ?? "ios",
      source: "rtdb",
      tokenPreview: tokenPreview(token),
      updatedAt: meta.updatedAt ?? null,
      appVersion: meta.appVersion ?? null,
    });
  }

  const usersSnap = await getAdminDb().collection("users").get();
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const token = data.fcmToken;
    if (typeof token !== "string" || !token.trim()) continue;
    const uid = resolveFirestoreUserId(doc.id, data);
    if (byUid.has(uid)) continue;
    byUid.set(uid, {
      uid,
      platform: "ios",
      source: "firestore",
      tokenPreview: tokenPreview(token.trim()),
      updatedAt: firestoreUpdatedAtMs(data),
      appVersion: null,
    });
  }

  return Array.from(byUid.values()).sort(
    (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
  );
}

async function writeInAppNotification(
  uid: string,
  payload: {
    title: string;
    body: string;
    type: string;
    senderId?: string;
    conversationId?: string;
    inviteId?: string;
  },
): Promise<void> {
  const ref = getAdminRtdb().ref(`userNotifications/${uid}`).push();
  await ref.set({
    type: payload.type,
    title: payload.title,
    message: payload.body,
    senderId: payload.senderId ?? null,
    conversationId: payload.conversationId ?? null,
    inviteId: payload.inviteId ?? null,
    isRead: false,
    createdAt: ServerValue.TIMESTAMP,
  });
}

export async function sendAdminPush(
  input: SendAdminPushInput,
  adminUid: string,
): Promise<SendAdminPushResult> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) {
    throw new PushNotificationError("Title and body are required.");
  }

  const tokens = await loadPushTokens(
    input.target === "user" ? input.userId : undefined,
  );

  if (input.target === "user" && !input.userId) {
    throw new PushNotificationError("userId is required for single-user sends.");
  }

  if (tokens.length === 0) {
    const hint =
      input.target === "user"
        ? `No push token for user ${input.userId}. They must open the iOS app, sign in, and allow notifications.`
        : "No FCM tokens found in Realtime Database (userPushTokens) or Firestore (users.fcmToken).";
    throw new PushNotificationError(hint);
  }

  const type = input.notificationType ?? "system";
  const result: SendAdminPushResult = {
    attempted: tokens.length,
    sent: 0,
    failed: 0,
    inAppWritten: 0,
    errors: [],
  };

  const data: Record<string, string> = {
    type,
    notificationId: `admin_${Date.now()}`,
  };
  if (input.conversationId) data.conversationId = input.conversationId;
  if (input.inviteId) data.inviteId = input.inviteId;
  if (input.deepLinkType) data.deepLinkType = input.deepLinkType;
  data.senderId = adminUid;

  const useLegacy = Boolean(process.env.FCM_LEGACY_SERVER_KEY?.trim());
  let fcmAccessToken: string | undefined;
  if (!useLegacy) {
    try {
      fcmAccessToken = await getFcmAccessToken();
    } catch (err) {
      throw new PushNotificationError(
        err instanceof Error ? err.message : "FCM auth failed.",
        503,
      );
    }
  }

  for (const { uid, token } of tokens) {
    try {
      if (useLegacy) {
        await sendFcmLegacyMessage(token, { title, body }, data);
      } else {
        await sendFcmV1Message(
          {
            token,
            notification: { title, body },
            data,
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
          },
          { accessToken: fcmAccessToken },
        );
      }
      result.sent += 1;
    } catch (err) {
      result.failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      const entry = `${uid}: ${msg}`;
      result.errors.push(entry);
      console.error("[push] FCM send failed", entry);
      if (
        msg.includes("registration-token-not-registered") ||
        msg.includes("invalid-registration-token") ||
        msg.includes("not a valid FCM registration token")
      ) {
        await getAdminRtdb().ref(`userPushTokens/${uid}`).remove();
      }
    }

    try {
      await writeInAppNotification(uid, {
        title,
        body,
        type,
        senderId: adminUid,
        conversationId: input.conversationId,
        inviteId: input.inviteId,
      });
      result.inAppWritten += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`in-app ${uid}: ${msg}`);
    }
  }

  await getAdminRtdb().ref("adminPushLogs").push().set({
    title,
    body,
    target: input.target,
    userId: input.userId ?? null,
    sentBy: adminUid,
    attempted: result.attempted,
    sent: result.sent,
    failed: result.failed,
    createdAt: ServerValue.TIMESTAMP,
  });

  if (result.sent === 0 && result.errors.some((e) => isFcmCredentialError(e))) {
    result.errors.unshift(`fcm-auth: ${FCM_SETUP_HINT}`);
  }

  return result;
}
