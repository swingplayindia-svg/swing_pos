import { NextResponse } from "next/server";
import { getBookingById } from "@/lib/admin-bookings";
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const merchantTransactionId =
      booking.phonePeTransactionId ?? `SWING_${booking.id}`;

    const result = await createPhonePePayment({
      merchantTransactionId,
      amountPaise: booking.amountInr * 100,
      redirectUrl: `${appUrl}/api/payments/phonepe/callback?bookingId=${booking.id}`,
      mobileNumber: booking.customerPhone.replace(/\D/g, "").slice(-10),
      bookingId: booking.id,
    });

    return NextResponse.json({
      redirectUrl: result.redirectUrl,
      mock: result.mock ?? false,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment failed to start." },
      { status: 500 },
    );
  }
}
