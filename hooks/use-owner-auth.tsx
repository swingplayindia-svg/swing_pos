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
  loginWithFirebase,
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

  const login = async (loginEmail: string, password: string) => {
    setError(null);
    try {
      await loginWithFirebase(loginEmail, password);
      return true;
    } catch {
      setError("Invalid email or password.");
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
    login,
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
