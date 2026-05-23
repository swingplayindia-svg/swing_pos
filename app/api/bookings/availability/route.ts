import { NextResponse } from "next/server";
import { venueDayEndExclusive, venueLocalToUtc } from "@/lib/venue-time";
import {
  getBookingsForTurfAdmin,
  getClosuresForTurfAdmin,
  getPublicTurf,
} from "@/lib/admin-bookings";
import { generateDaySlots } from "@/lib/booking-slots";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      turfId?: string;
      date?: string;
      hours?: number;
    };

    if (!body.turfId || !body.date) {
      return NextResponse.json(
        { error: "turfId and date are required." },
        { status: 400 },
      );
    }

    const turf = await getPublicTurf(body.turfId);
    if (!turf) {
      return NextResponse.json({ error: "Venue not found." }, { status: 404 });
    }

    const dateKey = body.date;
    const hours = Math.min(8, Math.max(1, Number(body.hours) || 1));
    const dayStart = venueLocalToUtc(dateKey, "00:00");
    const dayEnd = venueDayEndExclusive(dateKey);

    const [bookings, closures] = await Promise.all([
      getBookingsForTurfAdmin(body.turfId, dayStart.toISOString(), dayEnd.toISOString()),
      getClosuresForTurfAdmin(body.turfId),
    ]);

    const slots = generateDaySlots(turf, dateKey, bookings, closures, hours);
    const closed = closures.some((c) => c.date === dateKey);

    return NextResponse.json({ slots, closed, date: dateKey });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to check availability." },
      { status: 500 },
    );
  }
}
