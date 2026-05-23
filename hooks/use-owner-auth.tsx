"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  loginWithCustomFirebaseToken,
  logoutFirebase,
  subscribeToFirebaseAuth,
} from "@/lib/firebase-auth";
import { clearAllOwnerCache } from "@/lib/owner-cache";
import { fetchOwnedTurfsForUser } from "@/lib/storage-owner";
import type { Turf } from "@/lib/turf-schema";

type OwnerAuthValue = ReturnType<typeof useOwnerAuthState>;

const OwnerAuthContext = createContext<OwnerAuthValue | null>(null);

function useOwnerAuthState() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ownedTurfs, setOwnedTurfs] = useState<Turf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTurfs = useCallback(async (userId: string) => {
    try {
      const turfs = await fetchOwnedTurfsForUser(userId);
      setOwnedTurfs(turfs);
      return turfs;
    } catch {
      setOwnedTurfs([]);
      return [];
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeToFirebaseAuth((fbUser) => {
      void (async () => {
        if (!fbUser) {
          setUid(null);
          setEmail("");
          setDisplayName("");
          setOwnedTurfs([]);
          setIsLoading(false);
          return;
        }
        setUid(fbUser.uid);
        setEmail(fbUser.email ?? "");
        setDisplayName(
          fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "Owner",
        );
        await refreshTurfs(fbUser.uid);
        setIsLoading(false);
      })();
    });
    return unsub;
  }, [refreshTurfs]);

  const sendOtp = async (
    loginEmail: string,
  ): Promise<{ ok: true; emailSent: boolean; devCode?: string } | { ok: false }> => {
    setError(null);
    try {
      const res = await fetch("/api/owner/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      const data = (await res.json()) as {
        error?: string;
        emailSent?: boolean;
        devCode?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not send code.");
        return { ok: false };
      }
      return {
        ok: true,
        emailSent: Boolean(data.emailSent),
        devCode: data.devCode,
      };
    } catch {
      setError("Could not send code. Check your connection.");
      return { ok: false };
    }
  };

  const verifyOtp = async (loginEmail: string, code: string) => {
    setError(null);
    try {
      const res = await fetch("/api/owner/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, code }),
      });
      const data = (await res.json()) as {
        customToken?: string;
        error?: string;
      };
      if (!res.ok || !data.customToken) {
        setError(data.error ?? "Invalid code.");
        return false;
      }
      await loginWithCustomFirebaseToken(data.customToken);
      return true;
    } catch {
      setError("Sign-in failed. Try again.");
      return false;
    }
  };

  const logout = async () => {
    await logoutFirebase();
    clearAllOwnerCache();
    setUid(null);
    setOwnedTurfs([]);
    router.replace("/owner/login");
  };

  return {
    uid,
    email,
    displayName,
    ownedTurfs,
    isLoading,
    error,
    setError,
    sendOtp,
    verifyOtp,
    logout,
    refreshTurfs,
    isAuthenticated: uid !== null,
  };
}

export function OwnerAuthProvider({ children }: { children: ReactNode }) {
  const value = useOwnerAuthState();
  return (
    <OwnerAuthContext.Provider value={value}>{children}</OwnerAuthContext.Provider>
  );
}

export function useOwnerAuth() {
  const ctx = useContext(OwnerAuthContext);
  if (!ctx) {
    throw new Error("useOwnerAuth must be used within OwnerAuthProvider");
  }
  return ctx;
}

export function useOwnerRouteGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useOwnerAuth();

  useEffect(() => {
    if (auth.isLoading) return;
    const isLogin = pathname === "/owner/login";
    if (!auth.isAuthenticated && !isLogin) {
      router.replace("/owner/login");
      return;
    }
    if (auth.isAuthenticated && isLogin) {
      if (auth.ownedTurfs.length === 1) {
        router.replace(`/owner/${auth.ownedTurfs[0].id}`);
      } else if (auth.ownedTurfs.length > 1) {
        router.replace("/owner");
      } else {
        router.replace("/owner/setup");
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.ownedTurfs, pathname, router]);

  return auth;
}
