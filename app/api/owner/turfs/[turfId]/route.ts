import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { fetchTurfForOwnerAdmin } from "@/lib/owner-venues-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ turfId: string }> },
) {
  try {
    const { turfId } = await params;
    const header = request.headers.get("authorization");
    const token = header?.startsWith("Bearer ")
      ? header.slice("Bearer ".length).trim()
      : null;

    if (!token) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const turf = await fetchTurfForOwnerAdmin(decoded.uid, turfId);

    if (!turf) {
      return NextResponse.json(
        { error: "Venue not found or access denied." },
        { status: 404 },
      );
    }

    return NextResponse.json({ turf });
  } catch (err) {
    console.error("[owner/turfs/turfId]", err);
    return NextResponse.json(
      { error: "Failed to load venue." },
      { status: 500 },
    );
  }
}
