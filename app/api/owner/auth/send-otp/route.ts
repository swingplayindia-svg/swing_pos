import { NextResponse } from "next/server";
import {
  ownerOtpErrorMessage,
  sendOwnerLoginOtp,
} from "@/lib/owner-login-otp";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim();
    if (!email) {
      return NextResponse.json(
        { error: ownerOtpErrorMessage("INVALID_EMAIL") },
        { status: 400 },
      );
    }

    const result = await sendOwnerLoginOtp(email);
    return NextResponse.json({
      ok: true,
      emailSent: result.emailSent,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";
    const status =
      code === "COOLDOWN"
        ? 429
        : code === "NOT_FOUND" || code === "NOT_OWNER"
          ? 404
          : code === "INVALID_EMAIL"
            ? 400
            : code === "EMAIL_FAILED"
              ? 502
              : 500;
    return NextResponse.json(
      { error: ownerOtpErrorMessage(code) },
      { status },
    );
  }
}
