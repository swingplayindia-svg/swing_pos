import { getFirebaseIdToken } from "@/lib/firebase-auth";
import type {
  SportScoringFlags,
  SportScoringKey,
  SportScoringState,
} from "@/lib/sports-scoring-schema";
import { sportScoringStateToFlags } from "@/lib/sports-scoring-schema";

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

export async function fetchSportScoring(): Promise<SportScoringState> {
  const { sports } = await sportsScoringFetch<{ sports: SportScoringState }>();
  return sports;
}

/** @deprecated Use fetchSportScoring */
export async function fetchSportScoringFlags(): Promise<SportScoringFlags> {
  return sportScoringStateToFlags(await fetchSportScoring());
}

export async function setSportScoringEnabled(
  key: SportScoringKey,
  enabled: boolean,
): Promise<SportScoringState> {
  const { sports } = await sportsScoringFetch<{ sports: SportScoringState }>({
    method: "PATCH",
    body: JSON.stringify({ key, enabled }),
  });
  return sports;
}

export async function setSportScoringImageUrl(
  key: SportScoringKey,
  imageUrl: string,
): Promise<SportScoringState> {
  const { sports } = await sportsScoringFetch<{ sports: SportScoringState }>({
    method: "PATCH",
    body: JSON.stringify({ key, imageUrl }),
  });
  return sports;
}

export async function saveAllSportScoring(
  sports: SportScoringState,
): Promise<SportScoringState> {
  const res = await sportsScoringFetch<{ sports: SportScoringState }>({
    method: "PATCH",
    body: JSON.stringify({ sports }),
  });
  return res.sports;
}

/** @deprecated Use saveAllSportScoring */
export async function saveAllSportScoringFlags(
  flags: SportScoringFlags,
): Promise<SportScoringFlags> {
  const sports = await fetchSportScoring();
  const next = { ...sports };
  for (const key of Object.keys(flags) as SportScoringKey[]) {
    next[key] = { ...next[key], enabled: flags[key] };
  }
  return sportScoringStateToFlags(await saveAllSportScoring(next));
}

export async function seedDefaultSportScoring(): Promise<SportScoringState> {
  const { sports } = await sportsScoringFetch<{ sports: SportScoringState }>({
    method: "PATCH",
    body: JSON.stringify({ action: "seed" }),
  });
  return sports;
}

/** @deprecated Use seedDefaultSportScoring */
export const seedDefaultSportScoringFlags = seedDefaultSportScoring;

export async function disableAllSportScoring(): Promise<SportScoringState> {
  const { sports } = await sportsScoringFetch<{ sports: SportScoringState }>({
    method: "PATCH",
    body: JSON.stringify({ action: "disableAll" }),
  });
  return sports;
}

/** @deprecated Use disableAllSportScoring */
export const disableAllSportScoringFlags = disableAllSportScoring;
