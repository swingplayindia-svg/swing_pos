import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { assertOwnerCanAccessTurf } from "@/lib/firestore-turf-owners";
import {
  dateKeyFromDate,
  normalizeClosure,
  type TurfClosure,
  type TurfClosureInput,
} from "@/lib/turf-owner-schema";

const CLOSURES_COLLECTION = "turfClosures";

export async function fetchClosuresForTurf(
  turfId: string,
): Promise<TurfClosure[]> {
  await assertOwnerCanAccessTurf(turfId);
  const snapshot = await getDocs(
    query(
      collection(getDb(), CLOSURES_COLLECTION),
      where("turfId", "==", turfId),
    ),
  );
  return snapshot.docs
    .map((d) => normalizeClosure(d.id, d.data()))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchClosuresForMonth(
  turfId: string,
  year: number,
  month: number,
): Promise<TurfClosure[]> {
  const all = await fetchClosuresForTurf(turfId);
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return all.filter((c) => c.date.startsWith(prefix));
}

export async function setTurfClosure(
  input: TurfClosureInput,
): Promise<TurfClosure> {
  await assertOwnerCanAccessTurf(input.turfId);
  const closureId = `${input.turfId}_${input.date}`;
  const ref = doc(getDb(), CLOSURES_COLLECTION, closureId);
  const closure: TurfClosure = {
    ...input,
    id: closureId,
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, closure);
  return closure;
}

export async function removeTurfClosure(
  turfId: string,
  date: string,
): Promise<void> {
  await assertOwnerCanAccessTurf(turfId);
  const closureId = `${turfId}_${date}`;
  await deleteDoc(doc(getDb(), CLOSURES_COLLECTION, closureId));
}

export async function toggleTurfClosure(
  turfId: string,
  date: Date,
  reason = "Closed",
): Promise<boolean> {
  const dateKey = dateKeyFromDate(date);
  const existing = (await fetchClosuresForTurf(turfId)).find(
    (c) => c.date === dateKey,
  );
  if (existing) {
    await removeTurfClosure(turfId, dateKey);
    return false;
  }
  await setTurfClosure({
    turfId,
    date: dateKey,
    reason,
    allDay: true,
  });
  return true;
}
