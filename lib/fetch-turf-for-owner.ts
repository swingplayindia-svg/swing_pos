import { getOwnerIdToken, withTimeout } from "@/lib/owner-api";
import { fetchTurfForOwner as fetchTurfForOwnerClient } from "@/lib/firestore-turf-owners";
import type { Turf } from "@/lib/turf-schema";

const FETCH_TIMEOUT_MS = 20_000;

async function fetchTurfViaApi(turfId: string): Promise<Turf | null> {
  const token = await getOwnerIdToken();
  const res = await withTimeout(
    fetch(`/api/owner/turfs/${turfId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    FETCH_TIMEOUT_MS,
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `API error ${res.status}`);
  }
  const data = (await res.json()) as { turf?: Turf };
  return data.turf ?? null;
}

/** Load one venue for owner portal — API first, client Firestore fallback. */
export async function fetchTurfForOwner(turfId: string): Promise<Turf | null> {
  try {
    const turf = await fetchTurfViaApi(turfId);
    if (turf) return turf;
  } catch (err) {
    console.warn("[fetch-turf-for-owner] API failed, trying client", err);
  }

  try {
    const turf = await withTimeout(
      fetchTurfForOwnerClient(turfId),
      FETCH_TIMEOUT_MS,
    );
    return turf ?? null;
  } catch (err) {
    console.warn("[fetch-turf-for-owner] client failed", err);
    return null;
  }
}
