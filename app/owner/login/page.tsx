"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOwnerAuth } from "@/hooks/use-owner-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import Link from "next/link";
import { ArrowLeft, Mail, Wind } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";

type Step = "email" | "otp";

export default function OwnerLoginPage() {
  const router = useRouter();
  const {
    sendOtp,
    verifyOtp,
    error,
    setError,
    isAuthenticated,
    ownedTurfs,
    isLoading,
  } = useOwnerAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentHint, setSentHint] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);
  const [resendTestSender, setResendTestSender] = useState(false);

  useEffect(() => {
    void fetch("/api/owner/auth/config")
      .then((r) => r.json())
      .then((data: { emailConfigured?: boolean; resendTestSender?: boolean }) => {
        setEmailConfigured(Boolean(data.emailConfigured));
        setResendTestSender(Boolean(data.resendTestSender));
      })
      .catch(() => setEmailConfigured(false));
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (ownedTurfs.length === 1) {
      router.replace(`/owner/${ownedTurfs[0].id}`);
    } else if (ownedTurfs.length > 1) {
      router.replace("/owner");
    } else {
      router.replace("/owner/setup");
    }
  }, [isLoading, isAuthenticated, ownedTurfs, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSentHint("");
    setDevCode(null);
    setSubmitting(true);
    const result = await sendOtp(email);
    setSubmitting(false);
    if (result.ok) {
      setStep("otp");
      setOtp("");
      if (result.devCode) {
        setDevCode(result.devCode);
        setSentHint(
          "Email is not configured yet (local dev). Use the code below:",
        );
      } else if (result.emailSent) {
        setSentHint(
          `We sent a 6-digit code to ${email.trim().toLowerCase()}. Check inbox and spam.`,
        );
      } else {
        setSentHint(`Check your email at ${email.trim().toLowerCase()}.`);
      }
    }
  };

  const submitVerify = async (code: string) => {
    if (code.length !== 6 || submitting) return;
    setError(null);
    setSubmitting(true);
    const ok = await verifyOtp(email, code);
    setSubmitting(false);
    if (ok) router.refresh();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code.");
      return;
    }
    await submitVerify(otp);
  };

  const handleResend = async () => {
    setError(null);
    setSubmitting(true);
    const result = await sendOtp(email);
    setSubmitting(false);
    if (result.ok) {
      if (result.devCode) {
        setDevCode(result.devCode);
        setSentHint("New dev code (email not configured):");
      } else {
        setDevCode(null);
        setSentHint("A new code was sent to your email.");
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-primary/15 via-background to-accent/30 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-5 py-10 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Wind className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Turf Owner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in with a one-time code sent to your email
          </p>
        </div>

        {step === "email" ? (
          <form
            onSubmit={handleSendOtp}
            className="rounded-2xl border border-border/80 bg-card p-5 shadow-premium space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="owner-email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="owner-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background h-11 pl-10"
                  placeholder="owner@yourturf.com"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                No password — we&apos;ll send a 6-digit code to your email
              </p>
              {emailConfigured === false && (
                <p className="text-xs text-amber-800 bg-amber-500/10 rounded-lg px-2 py-1.5">
                  Email not configured: add{" "}
                  <code className="text-[10px]">RESEND_API_KEY</code> to
                  .env.local, restart the server, or use the dev code on the
                  next screen.
                </p>
              )}
              {emailConfigured && resendTestSender && (
                <p className="text-xs text-amber-800 bg-amber-500/10 rounded-lg px-2 py-1.5">
                  Using Resend test sender: OTP is only delivered to the email
                  you used to sign up at resend.com. Verify your own domain in
                  Resend to email any owner.
                </p>
              )}
              {emailConfigured && !resendTestSender && (
                <p className="text-xs text-primary bg-accent/50 rounded-lg px-2 py-1.5">
                  Login codes are sent by email. Check spam if you don&apos;t
                  see it within a minute.
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting || !email.trim()}
              className="w-full h-11 btn-primary-glow"
            >
              {submitting ? "Sending…" : "Send login code"}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyOtp}
            className="rounded-2xl border border-border/80 bg-card p-5 shadow-premium space-y-4"
          >
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
              onClick={() => {
                setStep("email");
                setOtp("");
                setError(null);
                setSentHint("");
                setDevCode(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Change email
            </button>

            {sentHint && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {sentHint}
              </p>
            )}

            {devCode && (
              <div
                className="rounded-xl border-2 border-dashed border-amber-500/50 bg-amber-500/10 px-4 py-4 text-center"
                role="status"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200 mb-2">
                  Development code
                </p>
                <p className="font-mono text-3xl font-bold tracking-[0.35em] text-foreground">
                  {devCode}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Add{" "}
                  <code className="text-[10px] bg-muted px-1 rounded">
                    RESEND_API_KEY
                  </code>{" "}
                  to .env.local to send real emails
                </p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium block text-center">
                Enter 6-digit code
              </label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={setOtp}
                  onComplete={(value) => void submitVerify(value)}
                >
                  <InputOTPGroup className="gap-1.5">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-12 w-11 text-lg font-semibold rounded-lg border-border first:rounded-lg last:rounded-lg"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Opens numeric keypad on your phone
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="text-sm text-destructive rounded-lg bg-destructive/10 px-3 py-2"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="w-full h-11 btn-primary-glow"
            >
              {submitting ? "Verifying…" : "Sign in"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              disabled={submitting}
              onClick={() => void handleResend()}
            >
              Resend code
            </Button>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Swing admin?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Admin dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
