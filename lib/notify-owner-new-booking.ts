import { format, parseISO } from "date-fns";
import type { TurfBooking } from "@/lib/turf-owner-schema";
import type { Turf } from "@/lib/turf-schema";
import { sendResendEmail, isResendConfigured } from "@/lib/resend-mail";

function ownerPortalBookingsUrl(turfId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "https://swing-pos.vercel.app";
  return `${base}/owner/${turfId}/bookings`;
}

function buildEmailContent(turf: Turf, booking: TurfBooking) {
  const start = parseISO(booking.startAt);
  const end = parseISO(booking.endAt);
  const when = `${format(start, "EEE, d MMM yyyy")} · ${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
  const amount =
    booking.amountInr > 0 ? `₹${booking.amountInr}` : "—";
  const manageUrl = ownerPortalBookingsUrl(turf.id);

  const subject = `New booking — ${turf.name}`;

  const text = [
    `New booking at ${turf.name}`,
    "",
    `Customer: ${booking.customerName}`,
    `Phone: ${booking.customerPhone}`,
    `When: ${when}`,
    `Sport: ${booking.sport}`,
    `Duration: ${booking.hours} hour(s)`,
    `Amount: ${amount}`,
    `Status: Pending confirmation`,
    "",
    `Open owner portal: ${manageUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:520px">
      <h2 style="margin:0 0 12px;font-size:20px">New booking received</h2>
      <p style="margin:0 0 16px;color:#444">${escapeHtml(turf.name)} has a new online booking waiting in your queue.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${row("Customer", booking.customerName)}
        ${row("Phone", booking.customerPhone)}
        ${row("When", when)}
        ${row("Sport", booking.sport)}
        ${row("Duration", `${booking.hours} hour(s)`)}
        ${row("Amount", amount)}
        ${row("Status", "Pending — confirm via WhatsApp in the owner app")}
      </table>
      <p style="margin:24px 0 0">
        <a href="${manageUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">
          View bookings
        </a>
      </p>
      <p style="margin:20px 0 0;font-size:12px;color:#888">Swing Play · ${escapeHtml(turf.area)}, ${escapeHtml(turf.city)}</p>
    </div>
  `.trim();

  return { subject, html, text, manageUrl };
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px 8px 0;color:#666;vertical-align:top;width:100px">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-weight:500">${escapeHtml(value)}</td>
  </tr>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Email turf owner (turfs.email) when a customer books online.
 * No-op if Resend unset or turf has no email.
 */
export async function notifyOwnerOfNewBooking(
  turf: Turf,
  booking: TurfBooking,
): Promise<void> {
  if (booking.source !== "customer") return;

  const ownerEmail = turf.email?.trim();
  if (!ownerEmail) {
    console.warn(
      `[owner-booking-email] No email on turf ${turf.id} — skipped notification.`,
    );
    return;
  }

  if (!isResendConfigured()) {
    console.warn("[owner-booking-email] RESEND_API_KEY not set — skipped.");
    return;
  }

  const { subject, html, text } = buildEmailContent(turf, booking);
  const result = await sendResendEmail({
    to: ownerEmail,
    subject,
    html,
    text,
  });

  if (!result.ok) {
    console.error("[owner-booking-email]", result.error, {
      turfId: turf.id,
      bookingId: booking.id,
      to: ownerEmail,
    });
    return;
  }

  console.info("[owner-booking-email] sent", {
    turfId: turf.id,
    bookingId: booking.id,
    resendId: result.id,
  });
}
