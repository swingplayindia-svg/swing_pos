import {
  createTurfInFirestore,
  createTurfsBulkInFirestore,
  deleteTurfFromFirestore,
  fetchTurfByIdFromFirestore,
  fetchTurfsFromFirestore,
  updateTurfInFirestore,
} from "@/lib/firestore-turfs";

export type {
  Turf,
  TurfInput,
  TurfContact,
  TurfAmenities,
  TurfPricing,
} from "@/lib/turf-schema";

export async function getTurfs() {
  return fetchTurfsFromFirestore();
}

export async function getTurfById(id: string) {
  return fetchTurfByIdFromFirestore(id);
}

export async function addTurf(
  turf: import("@/lib/turf-schema").TurfInput,
) {
  return createTurfInFirestore(turf);
}

export async function addTurfsBulk(
  items: import("@/lib/turf-schema").TurfInput[],
) {
  return createTurfsBulkInFirestore(items);
}

export async function updateTurf(
  id: string,
  updates: Partial<import("@/lib/turf-schema").Turf>,
) {
  return updateTurfInFirestore(id, updates);
}

export async function deleteTurf(id: string) {
  return deleteTurfFromFirestore(id);
}
