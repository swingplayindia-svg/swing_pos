"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOwnerAuth } from "@/hooks/use-owner-auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Copy, Check, RefreshCw } from "lucide-react";

export default function OwnerSetupPage() {
  const router = useRouter();
  const { uid, email, logout, ownedTurfs, turfsLoadState, refreshTurfs } =
    useOwnerAuth();
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (ownedTurfs.length === 1) {
      router.replace(`/owner/${ownedTurfs[0].id}`);
    } else if (ownedTurfs.length > 1) {
      router.replace("/owner");
    }
  }, [ownedTurfs, router]);

  useEffect(() => {
    if (!uid || turfsLoadState !== "idle") return;
    void refreshTurfs(uid);
  }, [uid, turfsLoadState, refreshTurfs]);

  const copyUid = async () => {
    if (!uid) return;
    await navigator.clipboard.writeText(uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = async () => {
    if (!uid) return;
    setRetrying(true);
    const turfs = await refreshTurfs(uid);
    setRetrying(false);
    if (turfs.length === 1) {
      router.replace(`/owner/${turfs[0].id}`);
    } else if (turfs.length > 1) {
      router.replace("/owner");
    }
  };

  const loadFailed = turfsLoadState === "error";

  return (
    <div className="space-y-6 py-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-3">
        <h2 className="font-semibold text-foreground">
          {loadFailed ? "Could not load your venues" : "Venue not linked yet"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {loadFailed ? (
            <>
              Your account ({email}) is signed in, but we couldn&apos;t load
              venues from Firestore. This is usually temporary — tap Retry. If it
              keeps failing, check your connection and that your UID is in{" "}
              <code className="text-xs bg-muted px-1 rounded">ownerIds</code>.
            </>
          ) : (
            <>
              Your account ({email}) is signed in, but no turf has your owner
              ID yet. Ask Swing admin to add your Firebase UID to the
              venue&apos;s{" "}
              <code className="text-xs bg-muted px-1 rounded">ownerIds</code>{" "}
              in Firestore.
            </>
          )}
        </p>
        {loadFailed && (
          <Button
            variant="outline"
            size="sm"
            disabled={retrying}
            onClick={() => void handleRetry()}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${retrying ? "animate-spin" : ""}`}
            />
            {retrying ? "Checking…" : "Retry"}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Your Firebase UID</p>
        <code className="block text-xs break-all bg-muted p-2 rounded font-mono">
          {uid}
        </code>
        <Button variant="outline" size="sm" onClick={() => void copyUid()}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" /> Copy UID
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="outline" onClick={() => void logout()}>
          Sign out
        </Button>
        <Link
          href="/login"
          className="text-center text-sm text-primary hover:underline"
        >
          Go to admin dashboard
        </Link>
      </div>
    </div>
  );
}
