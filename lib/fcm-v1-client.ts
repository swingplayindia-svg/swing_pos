import { JWT } from "google-auth-library";
import { request as httpsRequest } from "node:https";
import { readFirebaseAdminEnv } from "@/lib/firebase-admin-credentials";

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

export type FcmV1Message = {
  token: string;
  notification?: { title: string; body: string };
  data?: Record<string, string>;
  apns?: {
    payload: {
      aps: {
        sound?: string;
        badge?: number;
      };
    };
  };
};

export async function getFcmAccessToken(): Promise<string> {
  const env = readFirebaseAdminEnv();
  if (!env) {
    throw new Error(
      "Firebase Admin not configured (FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).",
    );
  }

  const client = new JWT({
    email: env.clientEmail,
    key: env.privateKey,
    scopes: [FCM_SCOPE],
  });

  const tokens = await client.authorize();
  const accessToken = tokens.access_token;
  if (!accessToken || accessToken.length < 20) {
    throw new Error("Could not obtain FCM OAuth access token for service account.");
  }
  return accessToken;
}

function postFcmJson(
  url: string,
  accessToken: string,
  payload: unknown,
): Promise<{ status: number; body: unknown }> {
  const body = JSON.stringify(payload);
  const parsed = new URL(url);

  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          let parsedBody: unknown = raw;
          try {
            parsedBody = JSON.parse(raw) as unknown;
          } catch {
            // keep raw string
          }
          resolve({ status: res.statusCode ?? 0, body: parsedBody });
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/** Send via FCM HTTP v1 with explicit service-account OAuth. */
export async function sendFcmV1Message(
  message: FcmV1Message,
  options?: { validateOnly?: boolean; accessToken?: string },
): Promise<void> {
  const env = readFirebaseAdminEnv();
  if (!env) {
    throw new Error("Firebase Admin not configured.");
  }

  const accessToken = options?.accessToken ?? (await getFcmAccessToken());
  const url = new URL(
    `https://fcm.googleapis.com/v1/projects/${env.projectId}/messages:send`,
  );
  if (options?.validateOnly) {
    url.searchParams.set("validate_only", "true");
  }

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[fcm-v1] send project=${env.projectId} validateOnly=${Boolean(options?.validateOnly)} authLen=${accessToken.length}`,
    );
  }

  const { status, body } = await postFcmJson(url.toString(), accessToken, {
    message,
  });

  if (status >= 200 && status < 300) return;

  throw new Error(formatFcmHttpError(status, body));
}

type FcmErrorBody = {
  error?: {
    message?: string;
    status?: string;
    details?: Array<{
      "@type"?: string;
      errorCode?: string;
    }>;
  };
};

function formatFcmHttpError(status: number, body: unknown): string {
  const err = body as FcmErrorBody;
  const details = err.error?.details ?? [];
  const fcmCode = details.find((d) => d.errorCode)?.errorCode;
  const googleMessage = err.error?.message ?? `FCM HTTP ${status}`;

  if (fcmCode === "THIRD_PARTY_AUTH_ERROR") {
    return (
      "APNs is not configured for this Firebase project. " +
      "Firebase Console → Project settings → Cloud Messaging → your iOS app → " +
      "upload APNs Authentication Key (.p8) plus Key ID, Team ID, and Bundle ID. " +
      "(Google shows a misleading OAuth error for this.)"
    );
  }

  if (fcmCode === "INVALID_ARGUMENT" && googleMessage.includes("registration token")) {
    return "Invalid or expired device token — user should reopen the iOS app and allow notifications.";
  }

  if (fcmCode === "UNREGISTERED") {
    return "Device token is no longer valid — user should reopen the app to refresh FCM token.";
  }

  return googleMessage;
}

/** Optional legacy fallback — Firebase Console → Cloud Messaging → Server key */
export async function sendFcmLegacyMessage(
  deviceToken: string,
  notification: { title: string; body: string },
  data?: Record<string, string>,
): Promise<void> {
  const serverKey = process.env.FCM_LEGACY_SERVER_KEY?.trim();
  if (!serverKey) {
    throw new Error("FCM_LEGACY_SERVER_KEY is not set.");
  }

  const body = JSON.stringify({
    to: deviceToken,
    notification,
    data: data ?? {},
  });

  await new Promise<void>((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: "fcm.googleapis.com",
        path: "/fcm/send",
        method: "POST",
        headers: {
          Authorization: `key=${serverKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => {
          raw += c;
        });
        res.on("end", () => {
          if ((res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300) {
            resolve();
            return;
          }
          reject(new Error(raw || `Legacy FCM HTTP ${res.statusCode}`));
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

export function isFcmCredentialsOkError(message: string): boolean {
  return (
    message.includes("not a valid FCM registration token") ||
    message.includes("registration-token-not-registered") ||
    message.includes("Invalid registration token")
  );
}

export function isApnsConfigurationError(message: string): boolean {
  return message.includes("APNs is not configured");
}
