import { format, parseISO } from "date-fns";

export type BookingWhatsAppContext = {
  customerName: string;
  customerPhone: string;
  venueName: string;
  startAt: string;
  endAt: string;
  sport: string;
  amountInr: number;
  hours: number;
};

export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.length >= 10) return digits;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const to = normalizePhoneForWhatsApp(phone);
  return `https://wa.me/${to}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppChat(phone: string, message: string): void {
  window.open(buildWhatsAppUrl(phone, message), "_blank", "noopener,noreferrer");
}

function formatSlotRange(startAt: string, endAt: string): string {
  const start = parseISO(startAt);
  const end = parseISO(endAt);
  return `${format(start, "EEE, d MMM yyyy")} · ${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
}

export function bookingConfirmedWhatsAppMessage(ctx: BookingWhatsAppContext): string {
  const slot = formatSlotRange(ctx.startAt, ctx.endAt);
  const amount =
    ctx.amountInr > 0 ? `₹${ctx.amountInr} (${ctx.hours} hr)` : `${ctx.hours} hr`;

  return [
    `Hi ${ctx.customerName},`,
    "",
    `Your booking at *${ctx.venueName}* is confirmed!`,
    "",
    `📅 ${slot}`,
    ctx.sport && ctx.sport !== "—" ? `⚽ ${ctx.sport}` : "",
    `💰 ${amount}`,
    "",
    "See you at the turf!",
    `Thank you for choosing ${ctx.venueName}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function bookingRejectedWhatsAppMessage(ctx: BookingWhatsAppContext): string {
  const slot = formatSlotRange(ctx.startAt, ctx.endAt);

  return [
    `Hi ${ctx.customerName},`,
    "",
    `We're sorry — your booking at *${ctx.venueName}* could not be confirmed.`,
    "",
    `Requested slot: ${slot}`,
    "",
    "Please try another date/time or contact the venue.",
    "",
    `Thank you,`,
    ctx.venueName,
  ].join("\n");
}

export function bookingFromRecord(
  booking: {
    customerName: string;
    customerPhone: string;
    startAt: string;
    endAt: string;
    sport: string;
    amountInr: number;
    hours: number;
  },
  venueName: string,
): BookingWhatsAppContext {
  return {
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    venueName,
    startAt: booking.startAt,
    endAt: booking.endAt,
    sport: booking.sport,
    amountInr: booking.amountInr,
    hours: booking.hours,
  };
}
