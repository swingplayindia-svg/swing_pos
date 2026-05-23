import { NextResponse } from "next/server";
import { parseISO } from "date-fns";
import {
  getBookingById,
  getPublicTurf,
  refreshBookingPhonePeOrderId,
  updateBookingAmountInr,
} from "@/lib/admin-bookings";
import { calculateBookingAmount } from "@/lib/booking-slots";
import { isLocalhostUrl, resolvePaymentAppUrl } from "@/lib/app-url";
import { createPhonePePayment, phonePeEnvironment } from "@/lib/phonepe";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      bookingId?: string;
      returnOrigin?: string;
    };
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

    const appUrl = resolvePaymentAppUrl(request, body.returnOrigin);
    // No query string — PhonePe whitelists an exact URL; ?bookingId= can break ui/v2/pay (400).
    const paymentReturnUrl = `${appUrl}/api/payments/phonepe/callback`;

    if (
      phonePeEnvironment() === "production" &&
      isLocalhostUrl(appUrl)
    ) {
      return NextResponse.json(
        {
          error:
            "Payments must start from your live site (https://swing-pos.vercel.app), not localhost. PhonePe will show 'Something went wrong' on UPI otherwise.",
        },
        { status: 400 },
      );
    }

    const merchantTransactionId = await refreshBookingPhonePeOrderId(
      booking.id,
    );

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
      redirectUrl: paymentReturnUrl,
      mobileNumber: booking.customerPhone.replace(/\D/g, "").slice(-10),
      bookingId: booking.id,
    });

    return NextResponse.json({
      redirectUrl: result.redirectUrl,
      mock: result.mock ?? false,
      amountInr,
      paymentReturnUrl,
    });
  } catch (err) {
    console.error("[phonepe/initiate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment failed to start." },
      { status: 500 },
    );
  }
}
