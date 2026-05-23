import { NextResponse } from "next/server";
import { getFirebaseAdminStatus } from "@/lib/firebase-admin";

/** GET /api/health/firebase-admin — whether server-side Firebase Admin can start */
export async function GET() {
  const status = getFirebaseAdminStatus();
  return NextResponse.json(status, {
    status: status.ok ? 200 : 503,
  });
}
