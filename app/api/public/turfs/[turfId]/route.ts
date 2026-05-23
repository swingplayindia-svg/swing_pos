import { NextResponse } from "next/server";
import { getPublicTurf } from "@/lib/admin-bookings";
import { firebaseAdminConfigCode } from "@/lib/firebase-admin-credentials";

function apiError(err: unknown) {
  const code = firebaseAdminConfigCode(err);
  if (code === "missing_env" || code === "invalid_private_key") {
    return NextResponse.json(
      {
        error:
          code === "invalid_private_key"
            ? "Server misconfiguration: invalid Firebase private key on host."
            : "Server misconfiguration: Firebase Admin is not set up.",
        code,
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: "Failed to load venue.", code }, { status: 500 });
}

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
    console.error("[public/turf]", err);
    return apiError(err);
  }
}
