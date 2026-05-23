import { NextResponse } from "next/server";
import {
  cancelPendingCustomerBooking,
  confirmBookingPayment,
  getBookingById,
  getBookingByPhonePeTxn,
  markBookingPaymentFailed,
} from "@/lib/admin-bookings";
import { resolvePaymentAppUrl } from "@/lib/app-url";
import { getPhonePeOrderStatus } from "@/lib/phonepe";

function canceledRedirect(
  appUrl: string,
  turfId: string,
  bookingId: string,
): NextResponse {
  return NextResponse.redirect(
    `${appUrl}/book/${turfId}/canceled?bookingId=${bookingId}`,
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appUrl = resolvePaymentAppUrl(request);

  const bookingIdParam = url.searchParams.get("bookingId") ?? "";
  let merchantOrderId =
    url.searchParams.get("merchantTransactionId") ??
    url.searchParams.get("merchantOrderId") ??
    "";

  let booking = bookingIdParam ? await getBookingById(bookingIdParam) : null;

  if (!merchantOrderId && booking?.phonePeTransactionId) {
    merchantOrderId = booking.phonePeTransactionId;
  }
  if (!booking && merchantOrderId) {
    booking = await getBookingByPhonePeTxn(merchantOrderId);
  }

  if (!booking && !merchantOrderId) {
    return NextResponse.redirect(`${appUrl}/book/failed?reason=invalid`);
  }

  const goCanceled = async (): Promise<NextResponse> => {
    if (booking) {
      await cancelPendingCustomerBooking(booking.id);
      return canceledRedirect(appUrl, booking.turfId, booking.id);
    }
    if (merchantOrderId) {
      await markBookingPaymentFailed(merchantOrderId);
      const b = await getBookingByPhonePeTxn(merchantOrderId);
      if (b) return canceledRedirect(appUrl, b.turfId, b.id);
    }
    return NextResponse.redirect(`${appUrl}/book/failed?reason=payment`);
  };

  if (!merchantOrderId) {
    return goCanceled();
  }

  try {
    const order = await getPhonePeOrderStatus(merchantOrderId);

    if (order.state === "COMPLETED") {
      const confirmed = await confirmBookingPayment(merchantOrderId);
      if (confirmed) {
        return NextResponse.redirect(
          `${appUrl}/book/${confirmed.turfId}/success?bookingId=${confirmed.id}`,
        );
      }
      return goCanceled();
    }

    if (order.state === "FAILED") {
      await markBookingPaymentFailed(merchantOrderId);
      return goCanceled();
    }

    // PENDING / abandoned checkout — customer canceled or closed PhonePe
    return goCanceled();
  } catch (err) {
    console.error("PhonePe callback:", err);
    return goCanceled();
  }
}
