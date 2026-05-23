import { NextResponse } from "next/server";
import { confirmBookingPayment } from "@/lib/admin-bookings";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const merchantTransactionId = url.searchParams.get("merchantTransactionId");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!merchantTransactionId) {
    return NextResponse.redirect(`${appUrl}/book/failed?reason=invalid`);
  }

  try {
    const booking = await confirmBookingPayment(merchantTransactionId);
    if (booking) {
      return NextResponse.redirect(
        `${appUrl}/book/${booking.turfId}/success?bookingId=${booking.id}`,
      );
    }
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(
      `${appUrl}/book/failed?reason=slot_taken`,
    );
  }

  return NextResponse.redirect(`${appUrl}/book/failed?reason=unknown`);
}
