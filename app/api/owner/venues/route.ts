import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { fetchOwnedTurfsAdmin } from "@/lib/owner-venues-admin";

export async function GET(request: Request) {
  try {
    const header = request.headers.get("authorization");
    const token = header?.startsWith("Bearer ")
      ? header.slice("Bearer ".length).trim()
      : null;

    if (!token) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const turfs = await fetchOwnedTurfsAdmin(decoded.uid);

    return NextResponse.json({ turfs, uid: decoded.uid });
  } catch (err) {
    console.error("[owner/venues]", err);
    const message =
      err instanceof Error ? err.message : "Failed to load venues.";
    const status = message.includes("auth") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
