import { createHash, randomInt } from "crypto";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { sendOwnerOtpEmail } from "@/lib/send-owner-otp-email";

const OTP_COLLECTION = "ownerLoginOtps";
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

export function normalizeOwnerEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

function hashOtp(email: string, code: string): string {
  const secret =
    process.env.OWNER_OTP_SECRET ??
    process.env.FIREBASE_PRIVATE_KEY?.slice(0, 32) ??
    "swing-owner-otp-dev";
  return createHash("sha256")
    .update(`${normalizeOwnerEmail(email)}:${code}:${secret}`)
    .digest("hex");
}

/** Firebase UID for an email that is listed on at least one turf's ownerIds. */
export async function resolveOwnerUidByEmail(email: string): Promise<string> {
  const normalized = normalizeOwnerEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("INVALID_EMAIL");
  }

  let uid: string;
  try {
    const user = await getAdminAuth().getUserByEmail(normalized);
    uid = user.uid;
  } catch {
    throw new Error("NOT_FOUND");
  }

  const snap = await getAdminDb()
    .collection("turfs")
    .where("ownerIds", "array-contains", uid)
    .limit(1)
    .get();

  if (snap.empty) throw new Error("NOT_OWNER");
  return uid;
}

export type SendOwnerOtpResult = {
  emailSent: boolean;
  /** Only set in local dev when email is not configured */
  devCode?: string;
};

export async function sendOwnerLoginOtp(
  email: string,
): Promise<SendOwnerOtpResult> {
  const normalized = normalizeOwnerEmail(email);
  await resolveOwnerUidByEmail(normalized);

  const now = Date.now();
  const ref = getAdminDb().collection(OTP_COLLECTION).doc(normalized);
  const existing = await ref.get();

  if (existing.exists) {
    const lastSentAt = Number(existing.data()?.lastSentAt ?? 0);
    if (now - lastSentAt < RESEND_COOLDOWN_MS) {
      throw new Error("COOLDOWN");
    }
  }

  const code = generateOtpCode();
  await ref.set({
    email: normalized,
    codeHash: hashOtp(normalized, code),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now,
  });

  const { emailSent } = await sendOwnerOtpEmail(normalized, code);

  const result: SendOwnerOtpResult = { emailSent };
  if (
    !emailSent &&
    process.env.NODE_ENV !== "production" &&
    process.env.OWNER_OTP_EXPOSE_DEV_CODE !== "false"
  ) {
    result.devCode = code;
  }
  return result;
}

export async function verifyOwnerLoginOtp(
  email: string,
  code: string,
): Promise<{ customToken: string; uid: string }> {
  const normalized = normalizeOwnerEmail(email);
  const uid = await resolveOwnerUidByEmail(normalized);

  const ref = getAdminDb().collection(OTP_COLLECTION).doc(normalized);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("EXPIRED");

  const data = snap.data()!;
  const now = Date.now();
  if (now > Number(data.expiresAt)) {
    await ref.delete();
    throw new Error("EXPIRED");
  }

  const attempts = Number(data.attempts ?? 0);
  if (attempts >= MAX_VERIFY_ATTEMPTS) {
    await ref.delete();
    throw new Error("TOO_MANY_ATTEMPTS");
  }

  const incoming = String(code).replace(/\D/g, "");
  if (incoming.length !== 6 || data.codeHash !== hashOtp(normalized, incoming)) {
    await ref.update({ attempts: attempts + 1 });
    throw new Error("INVALID_CODE");
  }

  await ref.delete();
  const customToken = await getAdminAuth().createCustomToken(uid);
  return { customToken, uid };
}

export function ownerOtpErrorMessage(code: string): string {
  switch (code) {
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    case "NOT_FOUND":
      return "No account found for this email. Ask your admin to add you as a turf owner.";
    case "NOT_OWNER":
      return "This account is not linked to any venue yet.";
    case "COOLDOWN":
      return "Please wait a minute before requesting another code.";
    case "EXPIRED":
      return "Code expired. Request a new one.";
    case "TOO_MANY_ATTEMPTS":
      return "Too many wrong attempts. Request a new code.";
    case "INVALID_CODE":
      return "Incorrect code. Try again.";
    case "EMAIL_FAILED":
      return "Could not send email. Try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
}
