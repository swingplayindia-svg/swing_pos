import { NextResponse } from "next/server";
import { getBookingById } from "@/lib/admin-bookings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params;
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({
      customerName: booking.customerName,
      sport: booking.sport,
      startAt: booking.startAt,
      endAt: booking.endAt,
      amountInr: booking.amountInr,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
    });
  } catch {
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
