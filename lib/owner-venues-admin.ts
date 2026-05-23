import { getAdminDb } from "@/lib/firebase-admin";
import { ownerIdsInclude, parseOwnerIdsField } from "@/lib/owner-ids";
import { normalizeTurf, type Turf } from "@/lib/turf-schema";

/** Server-side lookup — reliable for owner portal (bypasses client Firestore quirks). */
export async function fetchOwnedTurfsAdmin(uid: string): Promise<Turf[]> {
  const db = getAdminDb();
  const trimmedUid = uid.trim();

  const byQuery = await db
    .collection("turfs")
    .where("ownerIds", "array-contains", trimmedUid)
    .get();

  if (!byQuery.empty) {
    const turfs = byQuery.docs.map((d) =>
      normalizeTurf(d.id, d.data() as Record<string, unknown>),
    );
    turfs.sort((a, b) => a.name.localeCompare(b.name));
    return turfs;
  }

  const ownerProfile = await db.collection("turfOwners").doc(trimmedUid).get();
  if (ownerProfile.exists) {
    const turfIds = parseOwnerIdsField(ownerProfile.data()?.turfIds);
    if (turfIds.length > 0) {
      const turfs: Turf[] = [];
      for (const turfId of turfIds) {
        const snap = await db.collection("turfs").doc(turfId).get();
        if (snap.exists) {
          turfs.push(
            normalizeTurf(snap.id, snap.data() as Record<string, unknown>),
          );
        }
      }
      if (turfs.length > 0) {
        turfs.sort((a, b) => a.name.localeCompare(b.name));
        return turfs;
      }
    }
  }

  const allSnap = await db.collection("turfs").get();
  const turfs = allSnap.docs
    .filter((d) => ownerIdsInclude(d.data().ownerIds, trimmedUid))
    .map((d) => normalizeTurf(d.id, d.data() as Record<string, unknown>));
  turfs.sort((a, b) => a.name.localeCompare(b.name));
  return turfs;
}

export async function fetchTurfForOwnerAdmin(
  uid: string,
  turfId: string,
): Promise<Turf | null> {
  const db = getAdminDb();
  const snap = await db.collection("turfs").doc(turfId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  if (!ownerIdsInclude(data.ownerIds, uid.trim())) return null;
  return normalizeTurf(snap.id, data);
}
