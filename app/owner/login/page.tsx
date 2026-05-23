"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOwnerAuth } from "@/hooks/use-owner-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Wind } from "lucide-react";

export default function OwnerLoginPage() {
  const router = useRouter();
  const {
    login,
    error,
    setError,
    isAuthenticated,
    ownedTurfs,
    isLoading,
    turfsLoadState,
  } = useOwnerAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || turfsLoadState !== "ready") return;
    if (ownedTurfs.length === 1) {
      router.replace(`/owner/${ownedTurfs[0].id}`);
    } else if (ownedTurfs.length > 1) {
      router.replace("/owner");
    } else {
      router.replace("/owner/setup");
    }
  }, [isLoading, isAuthenticated, ownedTurfs, turfsLoadState, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) router.refresh();
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
            Manage bookings, calendar & venue details
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/80 bg-card p-5 shadow-premium space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="owner-email">
              Email
            </label>
            <Input
              id="owner-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background h-11"
              placeholder="owner@yourturf.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="owner-password">
              Password
            </label>
            <Input
              id="owner-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background h-11"
              required
            />
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
            disabled={submitting}
            className="w-full h-11 btn-primary-glow"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

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
