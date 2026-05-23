/**
 * Turf booking times are wall-clock in India (IST).
 * Vercel runs in UTC — always use these helpers for slots and ₹/hr, not `format(date, ...)`.
 */
export const VENUE_TZ_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** UTC instant for a calendar date + HH:mm in IST (YYYY-MM-DD). */
export function venueLocalToUtc(dateKey: string, hhmm: string): Date {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h ?? 0, mi ?? 0) - VENUE_TZ_OFFSET_MS);
}

function shiftedFromUtc(instant: Date): Date {
  return new Date(instant.getTime() + VENUE_TZ_OFFSET_MS);
}

export function venueDateKey(instant: Date): string {
  const s = shiftedFromUtc(instant);
  const y = s.getUTCFullYear();
  const mo = String(s.getUTCMonth() + 1).padStart(2, "0");
  const d = String(s.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function venueHHmm(instant: Date): string {
  const s = shiftedFromUtc(instant);
  return `${String(s.getUTCHours()).padStart(2, "0")}:${String(s.getUTCMinutes()).padStart(2, "0")}`;
}

export function venueDayOfWeek(instant: Date): number {
  return shiftedFromUtc(instant).getUTCDay();
}

/** Weekend = Friday, Saturday, Sunday (venue policy). Mon–Thu = weekday. */
export function isVenueWeekend(instant: Date): boolean {
  const dow = venueDayOfWeek(instant);
  return dow === 0 || dow === 5 || dow === 6;
}

export const VENUE_WEEKDAY_LABEL = "Mon–Thu";
export const VENUE_WEEKEND_LABEL = "Fri–Sun";

/** End of venue calendar day (exclusive) for booking queries. */
export function venueDayEndExclusive(dateKey: string): Date {
  return new Date(venueLocalToUtc(dateKey, "00:00").getTime() + 24 * 60 * 60 * 1000);
}

/** e.g. "5:00 AM" in IST for slot buttons (server-safe on Vercel UTC). */
export function venueFormatTime(instant: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instant);
}
