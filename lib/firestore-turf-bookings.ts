import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { assertOwnerCanAccessTurf } from "@/lib/firestore-turf-owners";
import {
  normalizeBooking,
  type TurfBooking,
  type TurfBookingInput,
} from "@/lib/turf-owner-schema";

const BOOKINGS_COLLECTION = "turfBookings";

export async function fetchBookingsForTurf(
  turfId: string,
): Promise<TurfBooking[]> {
  await assertOwnerCanAccessTurf(turfId);
  const db = getDb();
  const snapshot = await getDocs(
    query(collection(db, BOOKINGS_COLLECTION), where("turfId", "==", turfId)),
  );
  return snapshot.docs
    .map((d) => normalizeBooking(d.id, d.data()))
    .sort((a, b) => b.startAt.localeCompare(a.startAt));
}

export async function createTurfBooking(
  input: TurfBookingInput,
): Promise<TurfBooking> {
  await assertOwnerCanAccessTurf(input.turfId);
  const now = new Date().toISOString();
  const ref = doc(collection(getDb(), BOOKINGS_COLLECTION));
  const booking: TurfBooking = {
    ...input,
    sport: input.sport ?? "",
    hours: input.hours ?? 1,
    amountInr: input.amountInr ?? 0,
    paymentStatus: input.paymentStatus ?? "paid",
    id: ref.id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, booking);
  return booking;
}

export async function updateTurfBookingStatus(
  turfId: string,
  bookingId: string,
  status: TurfBooking["status"],
): Promise<void> {
  await assertOwnerCanAccessTurf(turfId);
  const ref = doc(getDb(), BOOKINGS_COLLECTION, bookingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Booking not found.");
  const data = normalizeBooking(snap.id, snap.data());
  if (data.turfId !== turfId) throw new Error("Booking not found.");
  await setDoc(ref, {
    ...data,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTurfBooking(
  turfId: string,
  bookingId: string,
): Promise<void> {
  await assertOwnerCanAccessTurf(turfId);
  const ref = doc(getDb(), BOOKINGS_COLLECTION, bookingId);
  await deleteDoc(ref);
}
