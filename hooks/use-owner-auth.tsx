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
  getFirebaseAuth,
  loginWithFirebase,
  logoutFirebase,
  subscribeToFirebaseAuth,
} from "@/lib/firebase-auth";
import { clearAllOwnerCache } from "@/lib/owner-cache";
import { fetchOwnedTurfsForOwner } from "@/lib/fetch-owned-turfs";
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
  const sessionUidRef = useRef<string | null>(null);
  const turfsReadyRef = useRef(false);

  const refreshTurfs = useCallback(async (userId: string) => {
    setTurfsLoadState("loading");
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await delay(400 * attempt);
        const turfs = await fetchOwnedTurfsForOwner(userId);
        setOwnedTurfs(turfs);
        setTurfsLoadState("ready");
        turfsReadyRef.current = true;
        return turfs;
      } catch (err) {
        lastError = err;
        console.warn("[owner-auth] fetchOwnedTurfs failed", attempt + 1, err);
      }
    }

    setOwnedTurfs([]);
    setTurfsLoadState("error");
    turfsReadyRef.current = false;
    console.error("[owner-auth] could not load owned turfs", lastError);
    return [];
  }, []);

  const applyUser = useCallback(
    async (fbUser: { uid: string; email: string | null; displayName: string | null }) => {
      sessionUidRef.current = fbUser.uid;
      setUid(fbUser.uid);
      setEmail(fbUser.email ?? "");
      setDisplayName(
        fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "Owner",
      );
      await refreshTurfs(fbUser.uid);
    },
    [refreshTurfs],
  );

  const clearSession = useCallback(() => {
    sessionUidRef.current = null;
    setUid(null);
    setEmail("");
    setDisplayName("");
    setOwnedTurfs([]);
    setTurfsLoadState("idle");
    turfsReadyRef.current = false;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const auth = getFirebaseAuth();
        await auth.authStateReady();
        if (cancelled) return;

        const current = auth.currentUser;
        if (current) {
          await applyUser({
            uid: current.uid,
            email: current.email,
            displayName: current.displayName,
          });
        } else {
          clearSession();
        }
      } catch (err) {
        console.error("[owner-auth] init failed", err);
        clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    const unsub = subscribeToFirebaseAuth((fbUser) => {
      void (async () => {
        if (!fbUser) {
          if (explicitLogoutRef.current) {
            explicitLogoutRef.current = false;
            clearSession();
            setIsLoading(false);
            return;
          }
          if (sessionUidRef.current) {
            return;
          }
          clearSession();
          setIsLoading(false);
          return;
        }

        if (fbUser.uid === sessionUidRef.current && turfsReadyRef.current) {
          return;
        }

        setIsLoading(true);
        try {
          await applyUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
          });
        } finally {
          setIsLoading(false);
        }
      })();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [applyUser, clearSession]);

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
    clearSession();
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
