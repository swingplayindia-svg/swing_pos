"use client";

import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
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

/** Resolves only when Firebase Auth has a signed-in user (required for Firestore rules). */
export async function requireFirebaseUser(): Promise<FirebaseUser> {
  const user = await waitForFirebaseAuth();
  if (!user) {
    throw new Error(
      "You must sign in with Firebase Auth before accessing turfs.",
    );
  }
  return user;
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
