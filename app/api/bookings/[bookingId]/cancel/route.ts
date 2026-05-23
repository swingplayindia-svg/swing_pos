import { NextResponse } from "next/server";
import { cancelPendingCustomerBooking } from "@/lib/admin-bookings";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params;
    const booking = await cancelPendingCustomerBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    return NextResponse.json({
      id: booking.id,
      turfId: booking.turfId,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    });
  } catch (err) {
    console.error("[bookings/cancel]", err);
    return NextResponse.json(
      { error: "Could not cancel booking." },
      { status: 500 },
    );
  }
}
