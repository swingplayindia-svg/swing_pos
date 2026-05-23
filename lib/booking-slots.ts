import {
  addDays,
  addHours,
  format,
  parseISO,
  setHours,
  setMinutes,
} from "date-fns";
import {
  calculateBookingAmount as calcAmount,
  getActiveOperatingSlots,
  hourlyRateAt,
  periodForClockTime,
  usesPeriodSlots,
} from "@/lib/turf-pricing";
import type { Turf } from "@/lib/turf-schema";
import type { TurfBooking, TurfClosure } from "@/lib/turf-owner-schema";

export type TimeSlot = {
  id: string;
  startAt: string;
  endAt: string;
  label: string;
  available: boolean;
  reason?: string;
};

const BLOCKING_STATUSES = new Set<TurfBooking["status"]>([
  "pending",
  "confirmed",
]);

/** Pending unpaid bookings expire after 15 minutes to free the slot. */
const PENDING_HOLD_MS = 15 * 60 * 1000;

export function isBookingBlockingSlot(booking: TurfBooking, now = Date.now()): boolean {
  if (booking.status === "cancelled") return false;
  if (booking.paymentStatus === "paid") return true;
  if (booking.status === "confirmed") return true;
  if (booking.status === "pending" && booking.paymentStatus === "unpaid") {
    const created = new Date(booking.createdAt).getTime();
    return now - created < PENDING_HOLD_MS;
  }
  return false;
}

function parseTimeOnDate(date: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return setMinutes(setHours(date, h ?? 0), m ?? 0);
}

function minutesFromMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Handles midnight close (00:00) and venues open past midnight. */
function resolveOperatingWindow(
  date: Date,
  openTime: string,
  closeTime: string,
  open24: boolean,
): { dayStart: Date; dayEnd: Date } {
  if (open24) {
    return {
      dayStart: parseTimeOnDate(date, "00:00"),
      dayEnd: addDays(parseTimeOnDate(date, "00:00"), 1),
    };
  }

  const dayStart = parseTimeOnDate(date, openTime);
  let dayEnd = parseTimeOnDate(date, closeTime);
  const openMin = minutesFromMidnight(openTime);
  const closeMin = minutesFromMidnight(closeTime);

  // e.g. 05:00–00:00 means until end of day (midnight next morning)
  if (closeMin === 0 || closeMin <= openMin) {
    dayEnd = addDays(dayEnd, 1);
  }

  return { dayStart, dayEnd };
}

export function hourlyRateForDate(turf: Turf, date: Date): number {
  return hourlyRateAt(turf.pricing, date);
}

export function calculateBookingAmount(
  turf: Turf,
  startAt: Date,
  hours: number,
): number {
  return calcAmount(turf.pricing, startAt, hours);
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isWithinOperatingHours(
  turf: Turf,
  startAt: Date,
  endAt: Date,
): boolean {
  if (turf.open_24_hours) return true;

  if (usesPeriodSlots(turf.pricing)) {
    let cursor = startAt;
    while (cursor < endAt) {
      const hhmm = format(cursor, "HH:mm");
      if (!periodForClockTime(turf.pricing, hhmm)) return false;
      cursor = addHours(cursor, 1);
    }
    return true;
  }

  const { dayStart, dayEnd } = resolveOperatingWindow(
    startAt,
    turf.open_time,
    turf.close_time,
    false,
  );
  return startAt >= dayStart && endAt <= dayEnd;
}

export function isRangeAvailable(
  startAt: Date,
  endAt: Date,
  bookings: TurfBooking[],
  closures: TurfClosure[],
  dateKey: string,
  turf?: Turf,
): { ok: boolean; reason?: string } {
  if (closures.some((c) => c.date === dateKey)) {
    return { ok: false, reason: "Turf is closed on this date." };
  }

  if (turf && !isWithinOperatingHours(turf, startAt, endAt)) {
    return {
      ok: false,
      reason: "Selected time is outside operating hours.",
    };
  }

  for (const b of bookings) {
    if (!isBookingBlockingSlot(b)) continue;
    const bStart = parseISO(b.startAt);
    const bEnd = parseISO(b.endAt);
    if (rangesOverlap(startAt, endAt, bStart, bEnd)) {
      return { ok: false, reason: "This slot is already booked." };
    }
  }

  return { ok: true };
}

function generateSlotsForWindow(
  turf: Turf,
  date: Date,
  dayStart: Date,
  dayEnd: Date,
  bookings: TurfBooking[],
  closures: TurfClosure[],
  dateKey: string,
  maxHours: number,
  slots: TimeSlot[],
  now: Date,
): void {
  let cursor = dayStart;

  while (cursor < dayEnd) {
    const slotEnd = addHours(cursor, 1);
    if (slotEnd > dayEnd) break;
    if (slotEnd <= now) {
      cursor = slotEnd;
      continue;
    }

    const startAt = cursor.toISOString();
    const endAt = slotEnd.toISOString();
    const rangeEnd = addHours(cursor, maxHours);
    let available = true;
    let reason: string | undefined;

    if (rangeEnd > dayEnd) {
      available = false;
      reason = "Not enough time before closing.";
    } else {
      const check = isRangeAvailable(
        cursor,
        rangeEnd,
        bookings,
        closures,
        dateKey,
        turf,
      );
      if (!check.ok) {
        available = false;
        reason = check.reason;
      }
    }

    slots.push({
      id: startAt,
      startAt,
      endAt,
      label: format(cursor, "h:mm a"),
      available,
      reason,
    });

    cursor = slotEnd;
  }
}

export function generateDaySlots(
  turf: Turf,
  date: Date,
  bookings: TurfBooking[],
  closures: TurfClosure[],
  maxHours = 4,
): TimeSlot[] {
  const dateKey = format(date, "yyyy-MM-dd");
  if (closures.some((c) => c.date === dateKey)) {
    return [];
  }

  const slots: TimeSlot[] = [];
  const now = new Date();

  if (usesPeriodSlots(turf.pricing)) {
    for (const opSlot of getActiveOperatingSlots(turf.pricing)) {
      const { dayStart, dayEnd } = resolveOperatingWindow(
        date,
        opSlot.start,
        opSlot.end,
        false,
      );
      generateSlotsForWindow(
        turf,
        date,
        dayStart,
        dayEnd,
        bookings,
        closures,
        dateKey,
        maxHours,
        slots,
        now,
      );
    }
    slots.sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    return slots;
  }

  const { dayStart, dayEnd } = resolveOperatingWindow(
    date,
    turf.open_time,
    turf.close_time,
    turf.open_24_hours,
  );
  generateSlotsForWindow(
    turf,
    date,
    dayStart,
    dayEnd,
    bookings,
    closures,
    dateKey,
    maxHours,
    slots,
    now,
  );

  return slots;
}
