import { NextResponse } from "next/server";
import { resolvePaymentAppUrl } from "@/lib/app-url";
import { getPhonePeHealthStatus } from "@/lib/phonepe";

/** GET /api/health/phonepe — config checklist (no secrets). */
export async function GET(request: Request) {
  const appUrl = resolvePaymentAppUrl(request);
  const sampleRedirect = `${appUrl}/api/payments/phonepe/callback?bookingId=sample`;
  const status = await getPhonePeHealthStatus(sampleRedirect);

  return NextResponse.json(
    {
      ...status,
      appUrl,
    },
    { status: status.ok ? 200 : 503 },
  );
}
