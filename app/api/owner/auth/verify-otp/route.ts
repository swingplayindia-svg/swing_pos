import { NextResponse } from "next/server";
import {
  ownerOtpErrorMessage,
  verifyOwnerLoginOtp,
} from "@/lib/owner-login-otp";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const email = body.email?.trim();
    const code = String(body.code ?? "").replace(/\D/g, "");

    if (!email || code.length !== 6) {
      return NextResponse.json(
        { error: "Enter the 6-digit code from your email." },
        { status: 400 },
      );
    }

    const result = await verifyOwnerLoginOtp(email, code);
    return NextResponse.json({
      customToken: result.customToken,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";
    const status =
      code === "INVALID_CODE" || code === "EXPIRED" || code === "TOO_MANY_ATTEMPTS"
        ? 401
        : code === "NOT_FOUND" || code === "NOT_OWNER"
          ? 404
          : 500;
    return NextResponse.json(
      { error: ownerOtpErrorMessage(code) },
      { status },
    );
  }
}
