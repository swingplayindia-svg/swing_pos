"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithFirebase } from "@/lib/firebase-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await loginWithFirebase(email, password);
      router.push("/dashboard");
    } catch {
      setError(
        "Invalid email or password. Use a Firebase Auth account for this project.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { email: "admin@swingplay.com", password: "admin123", role: "Admin" },
    { email: "manager@swingplay.com", password: "manager123", role: "Manager" },
  ] as const;

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Full-screen background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/login-bg.png)" }}
        aria-hidden
      />
      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl">
              Swing
            </h1>
            <p className="mt-2 text-sm text-white/80 sm:text-base">
              Admin Dashboard
            </p>
            <a
              href="/owner/login"
              className="mt-3 inline-block text-sm text-white/90 underline underline-offset-2 hover:text-white"
            >
              Turf owner portal →
            </a>
          </div>

          <Card className="border-white/15 bg-black/45 shadow-2xl shadow-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">Sign In</CardTitle>
              <CardDescription className="text-white/65">
                Access your turf management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:ring-primary"
                  />
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/15 p-3">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
