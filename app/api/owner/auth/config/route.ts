import { NextResponse } from "next/server";

export async function GET() {
  const emailConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const from = process.env.OWNER_OTP_FROM_EMAIL?.toLowerCase() ?? "";
  const usesResendTestSender =
    from.includes("onboarding@resend.dev") || from.includes("@resend.dev");

  return NextResponse.json({
    emailConfigured,
    /** With onboarding@resend.dev, Resend only delivers to your Resend account email */
    resendTestSender: emailConfigured && usesResendTestSender,
  });
}
