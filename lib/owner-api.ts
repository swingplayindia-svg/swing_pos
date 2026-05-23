import { getFirebaseAuth } from "@/lib/firebase-auth";

export async function getOwnerIdToken(): Promise<string> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in.");
  return user.getIdToken();
}

export async function ownerApiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getOwnerIdToken();
  const res = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out.")), ms);
    }),
  ]);
}
