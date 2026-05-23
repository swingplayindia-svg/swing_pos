import { addHours, format, parseISO } from "date-fns";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  calculateBookingAmount,
  isRangeAvailable,
} from "@/lib/booking-slots";
import {
  normalizeBooking,
  normalizeClosure,
  type TurfBooking,
} from "@/lib/turf-owner-schema";
import { normalizeTurf, type Turf } from "@/lib/turf-schema";

const TURFS = "turfs";
const BOOKINGS = "turfBookings";
const CLOSURES = "turfClosures";

export async function getPublicTurf(turfId: string): Promise<Turf | null> {
  const snap = await getAdminDb().collection(TURFS).doc(turfId).get();
  if (!snap.exists) return null;
  return normalizeTurf(snap.id, snap.data() as Record<string, unknown>);
}

export async function getBookingsForTurfAdmin(
  turfId: string,
  fromIso?: string,
  toIso?: string,
): Promise<TurfBooking[]> {
  // Single-field query avoids composite index; filter date range in memory.
  const snap = await getAdminDb()
    .collection(BOOKINGS)
    .where("turfId", "==", turfId)
    .get();

  let bookings = snap.docs.map((d) =>
    normalizeBooking(d.id, d.data() as Record<string, unknown>),
  );

  if (fromIso) {
    bookings = bookings.filter((b) => b.startAt >= fromIso);
  }
  if (toIso) {
    bookings = bookings.filter((b) => b.startAt <= toIso);
  }

  return bookings;
}

export async function getClosuresForTurfAdmin(
  turfId: string,
): Promise<ReturnType<typeof normalizeClosure>[]> {
  const snap = await getAdminDb()
    .collection(CLOSURES)
    .where("turfId", "==", turfId)
    .get();
  return snap.docs.map((d) =>
    normalizeClosure(d.id, d.data() as Record<string, unknown>),
  );
}

export async function getBookingById(
  bookingId: string,
): Promise<TurfBooking | null> {
  const snap = await getAdminDb().collection(BOOKINGS).doc(bookingId).get();
  if (!snap.exists) return null;
  return normalizeBooking(snap.id, snap.data() as Record<string, unknown>);
}

export async function getBookingByPhonePeTxn(
  merchantTransactionId: string,
): Promise<TurfBooking | null> {
  const snap = await getAdminDb()
    .collection(BOOKINGS)
    .where("phonePeTransactionId", "==", merchantTransactionId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return normalizeBooking(doc.id, doc.data() as Record<string, unknown>);
}

export type ReserveBookingInput = {
  turfId: string;
  customerName: string;
  customerPhone: string;
  startAt: string;
  hours: number;
  sport: string;
};

export async function reserveCustomerBooking(
  input: ReserveBookingInput,
): Promise<TurfBooking> {
  const turf = await getPublicTurf(input.turfId);
  if (!turf) throw new Error("Venue not found.");

  const start = parseISO(input.startAt);
  const end = addHours(start, input.hours);
  const dateKey = format(start, "yyyy-MM-dd");

  const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateKey}T23:59:59.999Z`);

  const [bookings, closures] = await Promise.all([
    getBookingsForTurfAdmin(input.turfId, dayStart.toISOString(), dayEnd.toISOString()),
    getClosuresForTurfAdmin(input.turfId),
  ]);

  const availability = isRangeAvailable(
    start,
    end,
    bookings,
    closures,
    dateKey,
    turf,
  );
  if (!availability.ok) {
    throw new Error(availability.reason ?? "Slot not available.");
  }

  const amountInr = calculateBookingAmount(turf, start, input.hours);
  const now = new Date().toISOString();
  const ref = getAdminDb().collection(BOOKINGS).doc();
  const merchantTransactionId = `SWING_${ref.id}_${Date.now()}`;

  const booking: TurfBooking = {
    id: ref.id,
    turfId: input.turfId,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    sport: input.sport.trim(),
    hours: input.hours,
    amountInr,
    status: "pending",
    paymentStatus: "unpaid",
    phonePeTransactionId: merchantTransactionId,
    notes: "",
    source: "customer",
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(booking);
  return booking;
}

export async function confirmBookingPayment(
  merchantTransactionId: string,
): Promise<TurfBooking | null> {
  const booking = await getBookingByPhonePeTxn(merchantTransactionId);
  if (!booking) return null;

  if (booking.paymentStatus === "paid") return booking;

  const start = parseISO(booking.startAt);
  const end = parseISO(booking.endAt);
  const dateKey = format(start, "yyyy-MM-dd");
  const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateKey}T23:59:59.999Z`);

  const bookings = await getBookingsForTurfAdmin(
    booking.turfId,
    dayStart.toISOString(),
    dayEnd.toISOString(),
  );

  const others = bookings.filter((b) => b.id !== booking.id);
  const closures = await getClosuresForTurfAdmin(booking.turfId);
  const turf = await getPublicTurf(booking.turfId);
  const availability = isRangeAvailable(
    start,
    end,
    others,
    closures,
    dateKey,
    turf ?? undefined,
  );
  if (!availability.ok) {
    await getAdminDb()
      .collection(BOOKINGS)
      .doc(booking.id)
      .update({
        paymentStatus: "failed",
        status: "cancelled",
        notes: "Slot taken before payment completed.",
        updatedAt: new Date().toISOString(),
      });
    throw new Error(availability.reason ?? "Slot no longer available.");
  }

  const now = new Date().toISOString();
  await getAdminDb().collection(BOOKINGS).doc(booking.id).update({
    paymentStatus: "paid",
    status: "confirmed",
    updatedAt: now,
  });

  return { ...booking, paymentStatus: "paid", status: "confirmed", updatedAt: now };
}

export async function markBookingPaymentFailed(
  merchantTransactionId: string,
): Promise<void> {
  const booking = await getBookingByPhonePeTxn(merchantTransactionId);
  if (!booking || booking.paymentStatus === "paid") return;
  await getAdminDb()
    .collection(BOOKINGS)
    .doc(booking.id)
    .update({
      paymentStatus: "failed",
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    });
}
