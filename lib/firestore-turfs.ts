import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { requireFirebaseUser } from "@/lib/firebase-auth";
import { normalizeTurf, type Turf } from "@/lib/turf-schema";

const TURFS_COLLECTION = "turfs";

function docToTurf(id: string, data: Record<string, unknown>): Turf {
  return normalizeTurf(id, data);
}

async function assertAuth(): Promise<void> {
  await requireFirebaseUser();
}

export async function fetchTurfsFromFirestore(): Promise<Turf[]> {
  await assertAuth();
  const db = getDb();
  const q = query(collection(db, TURFS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToTurf(d.id, d.data()));
}

export async function fetchTurfByIdFromFirestore(
  id: string,
): Promise<Turf | undefined> {
  await assertAuth();
  const snap = await getDoc(doc(getDb(), TURFS_COLLECTION, id));
  if (!snap.exists()) return undefined;
  return docToTurf(snap.id, snap.data());
}

export async function createTurfInFirestore(
  turf: Omit<Turf, "id" | "createdAt" | "updatedAt">,
): Promise<Turf> {
  const [created] = await createTurfsBulkInFirestore([turf]);
  return created;
}

export async function createTurfsBulkInFirestore(
  items: Omit<Turf, "id" | "createdAt" | "updatedAt">[],
): Promise<Turf[]> {
  if (items.length === 0) return [];

  await assertAuth();
  const now = new Date().toISOString();
  const db = getDb();
  const batch = writeBatch(db);
  const created: Turf[] = [];

  for (const item of items) {
    const ref = doc(collection(db, TURFS_COLLECTION));
    const turf: Turf = {
      ...item,
      id: ref.id,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(ref, turf);
    created.push(turf);
  }

  await batch.commit();
  return created;
}

export async function updateTurfInFirestore(
  id: string,
  updates: Partial<Turf>,
): Promise<Turf | null> {
  await assertAuth();
  const existing = await fetchTurfByIdFromFirestore(id);
  if (!existing) return null;

  const updated: Turf = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(getDb(), TURFS_COLLECTION, id), updated);
  return updated;
}

export async function deleteTurfFromFirestore(id: string): Promise<boolean> {
  await assertAuth();
  const existing = await fetchTurfByIdFromFirestore(id);
  if (!existing) return false;
  await deleteDoc(doc(getDb(), TURFS_COLLECTION, id));
  return true;
}
