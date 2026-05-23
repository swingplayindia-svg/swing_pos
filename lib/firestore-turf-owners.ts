import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { requireFirebaseUser } from "@/lib/firebase-auth";
import { fetchTurfByIdFromFirestore } from "@/lib/firestore-turfs";
import type { TurfOwnerProfile } from "@/lib/turf-owner-schema";
import { ownerIdsInclude } from "@/lib/owner-ids";
import { normalizeTurf, type Turf } from "@/lib/turf-schema";

const TURFS_COLLECTION = "turfs";
const TURF_OWNERS_COLLECTION = "turfOwners";

async function assertAuth(): Promise<string> {
  const user = await requireFirebaseUser();
  return user.uid;
}

export function turfAllowsOwner(turf: Turf, uid: string): boolean {
  return ownerIdsInclude(turf.ownerIds, uid);
}

export async function fetchOwnedTurfsForUser(uid: string): Promise<Turf[]> {
  const user = await requireFirebaseUser();
  if (user.uid !== uid) {
    throw new Error("Signed-in user does not match requested owner.");
  }
  const db = getDb();
  const q = query(
    collection(db, TURFS_COLLECTION),
    where("ownerIds", "array-contains", uid),
  );
  const snapshot = await getDocs(q);
  const turfs = snapshot.docs.map((d) => normalizeTurf(d.id, d.data()));
  turfs.sort((a, b) => a.name.localeCompare(b.name));
  return turfs;
}

export async function fetchTurfForOwner(
  turfId: string,
): Promise<Turf | undefined> {
  const uid = await assertAuth();
  const turf = await fetchTurfByIdFromFirestore(turfId);
  if (!turf || !turfAllowsOwner(turf, uid)) return undefined;
  return turf;
}

export async function assertOwnerCanAccessTurf(turfId: string): Promise<Turf> {
  const turf = await fetchTurfForOwner(turfId);
  if (!turf) {
    throw new Error("You do not have access to this venue.");
  }
  return turf;
}

export async function fetchTurfOwnerProfile(
  uid: string,
): Promise<TurfOwnerProfile | undefined> {
  await requireFirebaseUser();
  const snap = await getDoc(doc(getDb(), TURF_OWNERS_COLLECTION, uid));
  if (!snap.exists()) return undefined;
  const data = snap.data();
  return {
    uid,
    turfIds: Array.isArray(data.turfIds) ? (data.turfIds as string[]) : [],
    displayName: String(data.displayName ?? ""),
    email: String(data.email ?? ""),
    phone: String(data.phone ?? ""),
    updatedAt: String(data.updatedAt ?? ""),
  };
}

export async function upsertTurfOwnerProfile(
  profile: Omit<TurfOwnerProfile, "updatedAt">,
): Promise<TurfOwnerProfile> {
  const uid = await assertAuth();
  if (profile.uid !== uid) {
    throw new Error("Cannot update another owner's profile.");
  }
  const updated: TurfOwnerProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(getDb(), TURF_OWNERS_COLLECTION, uid), updated, {
    merge: true,
  });
  return updated;
}
