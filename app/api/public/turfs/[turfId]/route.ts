import { NextResponse } from "next/server";
import { getPublicTurf } from "@/lib/admin-bookings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ turfId: string }> },
) {
  try {
    const { turfId } = await params;
    const turf = await getPublicTurf(turfId);
    if (!turf) {
      return NextResponse.json({ error: "Venue not found." }, { status: 404 });
    }
    return NextResponse.json({
      id: turf.id,
      name: turf.name,
      area: turf.area,
      city: turf.city,
      address: turf.address,
      sports: turf.sports,
      pricing: turf.pricing,
      open_time: turf.open_time,
      close_time: turf.close_time,
      open_24_hours: turf.open_24_hours,
      turfImage: turf.turfImage,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load venue." },
      { status: 500 },
    );
  }
}
