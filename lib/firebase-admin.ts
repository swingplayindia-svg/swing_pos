import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import {
  firebaseAdminConfigCode,
  readFirebaseAdminEnv,
} from "@/lib/firebase-admin-credentials";

let adminApp: App | undefined;
let adminDb: Firestore | undefined;
let adminAuth: Auth | undefined;
let initError: Error | undefined;

function ensureAdminApp(): App {
  if (adminApp) return adminApp;
  if (initError) throw initError;

  if (getApps().length) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const env = readFirebaseAdminEnv();
  if (!env) {
    initError = new Error(
      "Firebase Admin not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_JSON.",
    );
    throw initError;
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: env.projectId,
        clientEmail: env.clientEmail,
        privateKey: env.privateKey,
      }),
    });
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
