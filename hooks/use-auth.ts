"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginWithFirebase,
  logoutFirebase,
  subscribeToFirebaseAuth,
} from "@/lib/firebase-auth";
import type { User } from "@/lib/auth";

function mapFirebaseUser(fbUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
}): User {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? "",
    name: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "User",
    role: "admin",
  };
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToFirebaseAuth((fbUser) => {
      setUser(fbUser ? mapFirebaseUser(fbUser) : null);
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    try {
      const session = await loginWithFirebase(email, password);
      setUser(session);
      router.push("/dashboard");
      return true;
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (code === "auth/user-not-found") {
        setError("No Firebase user with this email. Create the account in Firebase Console → Authentication.");
      } else {
        setError("Sign-in failed. Use an account from Firebase Authentication for project swing-b7a0c.");
      }
      return false;
    }
  };

  const handleLogout = async () => {
    await logoutFirebase();
    setUser(null);
    router.push("/login");
  };

  return {
    user,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated: user !== null,
  };
}

export async function ensureFirebaseAuthReady(): Promise<void> {
  const { requireFirebaseUser } = await import("@/lib/firebase-auth");
  await requireFirebaseUser();
}
