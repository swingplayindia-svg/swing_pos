import { getFirebaseIdToken } from "@/lib/firebase-auth";
import type { SportScoringFlags, SportScoringKey } from "@/lib/sports-scoring-schema";

async function sportsScoringFetch<T>(
  init?: RequestInit,
): Promise<T> {
  const token = await getFirebaseIdToken();
  const res = await fetch("/api/admin/sports-scoring", {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchSportScoringFlags(): Promise<SportScoringFlags> {
  const { flags } = await sportsScoringFetch<{ flags: SportScoringFlags }>();
  return flags;
}

export async function setSportScoringEnabled(
  key: SportScoringKey,
  enabled: boolean,
): Promise<SportScoringFlags> {
  const { flags } = await sportsScoringFetch<{ flags: SportScoringFlags }>({
    method: "PATCH",
    body: JSON.stringify({ key, enabled }),
  });
  return flags;
}

export async function saveAllSportScoringFlags(
  flags: SportScoringFlags,
): Promise<SportScoringFlags> {
  const res = await sportsScoringFetch<{ flags: SportScoringFlags }>({
    method: "PATCH",
    body: JSON.stringify({ flags }),
  });
  return res.flags;
}

export async function seedDefaultSportScoringFlags(): Promise<SportScoringFlags> {
  const { flags } = await sportsScoringFetch<{ flags: SportScoringFlags }>({
    method: "PATCH",
    body: JSON.stringify({ action: "seed" }),
  });
  return flags;
}

export async function disableAllSportScoringFlags(): Promise<SportScoringFlags> {
  const { flags } = await sportsScoringFetch<{ flags: SportScoringFlags }>({
    method: "PATCH",
    body: JSON.stringify({ action: "disableAll" }),
  });
  return flags;
}
