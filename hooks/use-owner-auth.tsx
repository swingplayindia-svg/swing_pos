"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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

type TurfsLoadState = "idle" | "loading" | "ready" | "error";

type OwnerAuthValue = ReturnType<typeof useOwnerAuthState>;

const OwnerAuthContext = createContext<OwnerAuthValue | null>(null);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function useOwnerAuthState() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [ownedTurfs, setOwnedTurfs] = useState<Turf[]>([]);
  const [turfsLoadState, setTurfsLoadState] = useState<TurfsLoadState>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const explicitLogoutRef = useRef(false);

  const refreshTurfs = useCallback(async (userId: string) => {
    setTurfsLoadState("loading");
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await delay(400 * attempt);
        const turfs = await fetchOwnedTurfsForUser(userId);
        setOwnedTurfs(turfs);
        setTurfsLoadState("ready");
        return turfs;
      } catch (err) {
        lastError = err;
        console.warn("[owner-auth] fetchOwnedTurfs failed", attempt + 1, err);
      }
    }

    setOwnedTurfs([]);
    setTurfsLoadState("error");
    console.error("[owner-auth] could not load owned turfs", lastError);
    return [];
  }, []);

  useEffect(() => {
    const unsub = subscribeToFirebaseAuth((fbUser) => {
      void (async () => {
        if (!fbUser) {
          if (explicitLogoutRef.current) {
            explicitLogoutRef.current = false;
            setUid(null);
            setEmail("");
            setDisplayName("");
            setOwnedTurfs([]);
            setTurfsLoadState("idle");
            setIsLoading(false);
            return;
          }
          // Ignore transient null during Firebase session restore.
          return;
        }

        setIsLoading(true);
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
    explicitLogoutRef.current = true;
    await logoutFirebase();
    clearAllOwnerCache();
    setUid(null);
    setOwnedTurfs([]);
    setTurfsLoadState("idle");
    router.replace("/owner/login");
  };

  return {
    uid,
    email,
    displayName,
    ownedTurfs,
    turfsLoadState,
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
    const isSetup = pathname === "/owner/setup";
    const turfsReady = auth.turfsLoadState === "ready";
    const turfsFailed = auth.turfsLoadState === "error";

    if (!auth.isAuthenticated && !isLogin) {
      router.replace("/owner/login");
      return;
    }

    if (!auth.isAuthenticated) return;

    if (turfsReady && auth.ownedTurfs.length === 1 && (isLogin || isSetup)) {
      router.replace(`/owner/${auth.ownedTurfs[0].id}`);
      return;
    }

    if (turfsReady && auth.ownedTurfs.length > 1 && (isLogin || isSetup)) {
      router.replace("/owner");
      return;
    }

    if (
      turfsReady &&
      auth.ownedTurfs.length === 0 &&
      !isSetup &&
      !isLogin
    ) {
      router.replace("/owner/setup");
      return;
    }

    if (isLogin && turfsReady) {
      if (auth.ownedTurfs.length === 1) {
        router.replace(`/owner/${auth.ownedTurfs[0].id}`);
      } else if (auth.ownedTurfs.length > 1) {
        router.replace("/owner");
      } else {
        router.replace("/owner/setup");
      }
    }
  }, [
    auth.isLoading,
    auth.isAuthenticated,
    auth.ownedTurfs,
    auth.turfsLoadState,
    pathname,
    router,
  ]);

  return auth;
}
