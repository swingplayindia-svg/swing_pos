"use client";

import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";
import type { User } from "@/lib/auth";

const SESSION_KEY = "swing_session";

let persistenceReady: Promise<void> | null = null;

function firebaseUserToSession(fbUser: FirebaseUser): User {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? "",
    name: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "User",
    role: "admin",
  };
}

function clearLocalSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

async function ensurePersistence(): Promise<void> {
  if (!persistenceReady) {
    persistenceReady = setPersistence(
      getAuth(getFirebaseApp()),
      browserLocalPersistence,
    ).catch(() => undefined);
  }
  await persistenceReady;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export async function loginWithFirebase(
  email: string,
  password: string,
): Promise<User> {
  await ensurePersistence();
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  const session = firebaseUserToSession(credential.user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function loginWithCustomFirebaseToken(
  customToken: string,
): Promise<User> {
  await ensurePersistence();
  const credential = await signInWithCustomToken(
    getFirebaseAuth(),
    customToken,
  );
  const session = firebaseUserToSession(credential.user);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function logoutFirebase(): Promise<void> {
  await signOut(getFirebaseAuth());
  clearLocalSession();
}

export function waitForFirebaseAuth(): Promise<FirebaseUser | null> {
  return ensurePersistence().then(
    () =>
      new Promise((resolve) => {
        const auth = getFirebaseAuth();
        const unsub = onAuthStateChanged(auth, (user) => {
          unsub();
          resolve(user);
        });
      }),
  );
}

/** Waits until a user is signed in (ignores the initial null auth tick). */
export function waitForSignedInUser(
  timeoutMs = 12_000,
): Promise<FirebaseUser> {
  return ensurePersistence().then(
    () =>
      new Promise((resolve, reject) => {
        const auth = getFirebaseAuth();
        if (auth.currentUser) {
          resolve(auth.currentUser);
          return;
        }
        const timeout = setTimeout(() => {
          unsub();
          reject(new Error("Firebase sign-in timed out."));
        }, timeoutMs);
        const unsub = onAuthStateChanged(auth, (user) => {
          if (!user) return;
          clearTimeout(timeout);
          unsub();
          resolve(user);
        });
      }),
  );
}

/** Resolves only when Firebase Auth has a signed-in user (required for Firestore rules). */
export async function requireFirebaseUser(): Promise<FirebaseUser> {
  await ensurePersistence();
  const auth = getFirebaseAuth();
  if (auth.currentUser) return auth.currentUser;
  return waitForSignedInUser();
}

/** ID token for authenticated CMS API routes (Bearer). */
export async function getFirebaseIdToken(): Promise<string> {
  const user = await requireFirebaseUser();
  return user.getIdToken();
}

export function subscribeToFirebaseAuth(
  onUser: (user: FirebaseUser | null) => void,
): () => void {
  void ensurePersistence();
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (fbUser) => {
    if (!fbUser) clearLocalSession();
    onUser(fbUser);
  });
}
