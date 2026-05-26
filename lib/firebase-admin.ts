import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getDatabase, type Database } from "firebase-admin/database";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import {
  firebaseAdminConfigCode,
  readFirebaseAdminEnv,
} from "@/lib/firebase-admin-credentials";

let adminApp: App | undefined;
let adminDb: Firestore | undefined;
let adminAuth: Auth | undefined;
let adminRtdb: Database | undefined;
let adminMessaging: Messaging | undefined;
let initError: Error | undefined;

const ADMIN_APP_NAME = "swing-play-admin";

/** RTDB URL for Admin SDK — must match Firebase Console → Realtime Database. */
export function resolveFirebaseDatabaseUrl(projectId?: string): string | undefined {
  const explicit =
    process.env.FIREBASE_DATABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim();
  if (explicit) return explicit;
  if (projectId) {
    return `https://${projectId}-default-rtdb.firebaseio.com`;
  }
  return undefined;
}

function ensureAdminApp(): App {
  if (adminApp) return adminApp;
  if (initError) throw initError;

  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) {
    adminApp = existing;
    return adminApp;
  }

  const env = readFirebaseAdminEnv();
  if (!env) {
    initError = new Error(
      "Firebase Admin not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_JSON.",
    );
    throw initError;
  }

  const databaseURL = resolveFirebaseDatabaseUrl(env.projectId);

  try {
    adminApp = initializeApp(
      {
        projectId: env.projectId,
        credential: cert({
          projectId: env.projectId,
          clientEmail: env.clientEmail,
          privateKey: env.privateKey,
        }),
        ...(databaseURL ? { databaseURL } : {}),
      },
      ADMIN_APP_NAME,
    );
  } catch (err) {
    initError =
      err instanceof Error ? err : new Error("Firebase Admin init failed.");
    throw initError;
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (adminDb) return adminDb;
  adminDb = getFirestore(ensureAdminApp());
  return adminDb;
}

export function getAdminAuth(): Auth {
  if (adminAuth) return adminAuth;
  adminAuth = getAuth(ensureAdminApp());
  return adminAuth;
}

export function getAdminRtdb(): Database {
  if (adminRtdb) return adminRtdb;

  const env = readFirebaseAdminEnv();
  const databaseURL = resolveFirebaseDatabaseUrl(env?.projectId);
  if (!databaseURL) {
    throw new Error(
      "Set NEXT_PUBLIC_FIREBASE_DATABASE_URL in .env.local (Firebase Console → Realtime Database → database URL).",
    );
  }

  adminRtdb = getDatabase(ensureAdminApp());
  return adminRtdb;
}

export function getAdminMessaging(): Messaging {
  if (adminMessaging) return adminMessaging;
  adminMessaging = getMessaging(ensureAdminApp());
  return adminMessaging;
}

/** Lightweight check for deploy / Vercel env debugging (no secrets returned). */
export function getFirebaseAdminStatus(): {
  configured: boolean;
  ok: boolean;
  code: string;
} {
  const env = readFirebaseAdminEnv();
  if (!env) {
    return { configured: false, ok: false, code: "missing_env" };
  }
  try {
    ensureAdminApp();
    return { configured: true, ok: true, code: "ok" };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      code: firebaseAdminConfigCode(err),
    };
  }
}
