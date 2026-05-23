import { ownerApiFetch, withTimeout } from "@/lib/owner-api";
import { fetchOwnedTurfsForUser } from "@/lib/firestore-turf-owners";
import type { Turf } from "@/lib/turf-schema";

async function fetchOwnedTurfsViaApi(): Promise<Turf[]> {
  const data = await withTimeout(
    ownerApiFetch<{ turfs: Turf[] }>("/api/owner/venues"),
    20_000,
  );
  return data.turfs ?? [];
}

/** Prefer server API (Admin SDK); fall back to client Firestore query. */
export async function fetchOwnedTurfsForOwner(uid: string): Promise<Turf[]> {
  try {
    const apiTurfs = await fetchOwnedTurfsViaApi();
    if (apiTurfs.length > 0) return apiTurfs;
  } catch (err) {
    console.warn("[fetch-owned-turfs] API failed, trying Firestore client", err);
  }

  try {
    return await fetchOwnedTurfsForUser(uid);
  } catch (err) {
    console.warn("[fetch-owned-turfs] client Firestore failed", err);
    throw err;
  }
}
