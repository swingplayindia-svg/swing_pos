import { NextResponse } from "next/server";
import { parseISO } from "date-fns";
import {
  getBookingById,
  getPublicTurf,
  updateBookingAmountInr,
} from "@/lib/admin-bookings";
import { calculateBookingAmount } from "@/lib/booking-slots";
import { createPhonePePayment } from "@/lib/phonepe";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { bookingId?: string };
    if (!body.bookingId) {
      return NextResponse.json({ error: "bookingId required." }, { status: 400 });
    }

    const booking = await getBookingById(body.bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "Already paid." }, { status: 400 });
    }

    const turf = await getPublicTurf(booking.turfId);
    if (!turf) {
      return NextResponse.json({ error: "Venue not found." }, { status: 404 });
    }

    const start = parseISO(booking.startAt);
    const hours =
      booking.hours > 0
        ? booking.hours
        : Math.max(
            1,
            Math.round(
              (parseISO(booking.endAt).getTime() - start.getTime()) / 3_600_000,
            ),
          );

    const amountInr = calculateBookingAmount(turf, start, hours);
    if (!Number.isFinite(amountInr) || amountInr < 1) {
      return NextResponse.json(
        { error: "Could not calculate a valid booking amount." },
        { status: 400 },
      );
    }

    if (booking.amountInr !== amountInr) {
      await updateBookingAmountInr(booking.id, amountInr);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const merchantTransactionId =
      booking.phonePeTransactionId ?? `SWING_${booking.id}`;

    const amountPaise = Math.round(amountInr * 100);
    if (amountPaise < 100) {
      return NextResponse.json(
        { error: "Amount must be at least ₹1." },
        { status: 400 },
      );
    }

    const result = await createPhonePePayment({
      merchantTransactionId,
      amountPaise,
      redirectUrl: `${appUrl}/api/payments/phonepe/callback?bookingId=${booking.id}`,
      mobileNumber: booking.customerPhone.replace(/\D/g, "").slice(-10),
      bookingId: booking.id,
    });

    return NextResponse.json({
      redirectUrl: result.redirectUrl,
      mock: result.mock ?? false,
      amountInr,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment failed to start." },
      { status: 500 },
    );
  }
}
