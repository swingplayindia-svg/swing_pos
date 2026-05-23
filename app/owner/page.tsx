"use client";

import Link from "next/link";
import { useOwnerAuth } from "@/hooks/use-owner-auth";
import { MapPin, ChevronRight } from "lucide-react";

export default function OwnerHomePage() {
  const { ownedTurfs, displayName } = useOwnerAuth();

  if (ownedTurfs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">Hi, {displayName}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a venue to manage
        </p>
      </div>
      <ul className="space-y-3">
        {ownedTurfs.map((turf) => (
          <li key={turf.id}>
            <Link
              href={`/owner/${turf.id}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/30 transition-colors"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{turf.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {turf.area}, {turf.city}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
