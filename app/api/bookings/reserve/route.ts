import { NextResponse } from "next/server";
import { reserveCustomerBooking } from "@/lib/admin-bookings";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      turfId?: string;
      customerName?: string;
      customerPhone?: string;
      startAt?: string;
      hours?: number;
      sport?: string;
    };

    if (
      !body.turfId ||
      !body.customerName?.trim() ||
      !body.customerPhone?.trim() ||
      !body.startAt ||
      !body.sport?.trim()
    ) {
      return NextResponse.json(
        { error: "Please fill all required fields." },
        { status: 400 },
      );
    }

    const hours = Math.min(8, Math.max(1, Number(body.hours) || 1));
    const booking = await reserveCustomerBooking({
      turfId: body.turfId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      startAt: body.startAt,
      hours,
      sport: body.sport,
    });

    return NextResponse.json({
      bookingId: booking.id,
      amountInr: booking.amountInr,
      merchantTransactionId: booking.phonePeTransactionId,
      startAt: booking.startAt,
      endAt: booking.endAt,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not reserve this slot.";
    const status = message.includes("booked") || message.includes("closed")
      ? 409
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
