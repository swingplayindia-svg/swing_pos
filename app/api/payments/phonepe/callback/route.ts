import { NextResponse } from "next/server";
import {
  confirmBookingPayment,
  getBookingById,
  markBookingPaymentFailed,
} from "@/lib/admin-bookings";
import { getPhonePeOrderStatus } from "@/lib/phonepe";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const bookingId = url.searchParams.get("bookingId") ?? "";
  let merchantOrderId =
    url.searchParams.get("merchantTransactionId") ??
    url.searchParams.get("merchantOrderId") ??
    "";

  if (!merchantOrderId && bookingId) {
    const booking = await getBookingById(bookingId);
    merchantOrderId = booking?.phonePeTransactionId ?? "";
  }

  if (!merchantOrderId) {
    return NextResponse.redirect(`${appUrl}/book/failed?reason=invalid`);
  }

  try {
    const order = await getPhonePeOrderStatus(merchantOrderId);

    if (order.state === "COMPLETED") {
      const booking = await confirmBookingPayment(merchantOrderId);
      if (booking) {
        return NextResponse.redirect(
          `${appUrl}/book/${booking.turfId}/success?bookingId=${booking.id}`,
        );
      }
    } else if (order.state === "FAILED") {
      await markBookingPaymentFailed(merchantOrderId);
    } else if (bookingId) {
      const booking = await getBookingById(bookingId);
      if (booking?.paymentStatus === "paid") {
        return NextResponse.redirect(
          `${appUrl}/book/${booking.turfId}/success?bookingId=${booking.id}`,
        );
      }
    }
  } catch (err) {
    console.error("PhonePe callback:", err);
  }

  const failQuery = bookingId ? `&bookingId=${bookingId}` : "";
  return NextResponse.redirect(
    `${appUrl}/book/failed?reason=payment${failQuery}`,
  );
}
