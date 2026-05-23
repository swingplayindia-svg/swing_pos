const RESEND_API = "https://api.resend.com/emails";

export type SendOtpEmailResult = {
  /** True when Resend (or future provider) delivered the message */
  emailSent: boolean;
};

export async function sendOwnerOtpEmail(
  to: string,
  code: string,
): Promise<SendOtpEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.OWNER_OTP_FROM_EMAIL?.trim() ??
    "Swing Play <onboarding@resend.dev>";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not configured.");
    }
    console.info(`[owner-otp] ${to} → ${code} (RESEND_API_KEY not set — dev only)`);
    return { emailSent: false };
  }

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Your Swing Play owner login code",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px">
          <h1 style="font-size:20px;color:#0d3d24;margin:0 0 12px">Turf Owner sign-in</h1>
          <p style="color:#5c6b63;font-size:14px;line-height:1.5">
            Use this one-time code to sign in. It expires in 10 minutes.
          </p>
          <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#0d3d24;margin:24px 0">
            ${code}
          </p>
          <p style="color:#9ca3af;font-size:12px">
            If you didn't request this, you can ignore this email.
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[owner-otp] Resend error:", res.status, body);
    throw new Error("EMAIL_FAILED");
  }

  return { emailSent: true };
}
