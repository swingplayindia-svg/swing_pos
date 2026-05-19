"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getTurfs } from "@/lib/storage";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  FileSpreadsheet,
  LayoutGrid,
  Map,
  MapPin,
  Plus,
  Wind,
} from "lucide-react";

const NAV = [
  { href: "/turfs", label: "All Venues", icon: LayoutGrid },
  { href: "/turfs/map", label: "Map", icon: Map },
  { href: "/turfs/add", label: "Add New", icon: Plus },
  { href: "/turfs/import", label: "Import", icon: FileSpreadsheet },
] as const;

const HUB_ROUTES = new Set(["/turfs/add", "/turfs/import", "/turfs/map"]);

function isDetailPath(pathname: string) {
  if (HUB_ROUTES.has(pathname)) return false;
  if (pathname.endsWith("/edit")) return false;
  return /^\/turfs\/[^/]+$/.test(pathname);
}

function isEditPath(pathname: string) {
  return /^\/turfs\/[^/]+\/edit$/.test(pathname);
}

export function TurfsHubShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [venueCount, setVenueCount] = useState(0);
  const [cityCount, setCityCount] = useState(0);
  const onDetail = isDetailPath(pathname);
  const onEdit = isEditPath(pathname);
  const isMapView = pathname === "/turfs/map";

  useEffect(() => {
    void (async () => {
      try {
        const turfs = await getTurfs();
        setVenueCount(turfs.length);
        setCityCount(new Set(turfs.map((t) => t.city)).size);
      } catch {
        setVenueCount(0);
        setCityCount(0);
      }
    })();
  }, [pathname]);

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-border/80 bg-gradient-to-br from-primary/10 via-background to-accent/60 shadow-sm">
        <div className="px-6 pt-6 pb-4 max-w-6xl mx-auto w-full">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
                  Venue Manager
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Turfs
              </h1>
              <p className="text-sm text-muted-foreground max-w-md">
                Manage venues, add listings, and import from Excel — all in one place.
              </p>
            </div>

            <div className="flex gap-3">
              <StatPill label="Venues" value={venueCount} />
              <StatPill label="Cities" value={cityCount} />
            </div>
          </div>

          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Turfs section">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "bg-white/80 text-foreground border border-border/80 hover:border-primary/30 hover:bg-accent/60",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            {onDetail && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
                <MapPin className="h-3.5 w-3.5" />
                Venue details
              </span>
            )}
            {onEdit && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary font-medium">
                Editing
              </span>
            )}
          </nav>

          {(onDetail || onEdit) && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/turfs" className="hover:text-primary transition-colors">
                All Venues
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">
                {onEdit ? "Edit" : "Profile"}
              </span>
            </div>
          )}
        </div>
      </header>

      <div
        className={cn(
          "flex-1 w-full",
          isMapView ? "px-4 py-4 max-w-[1600px] mx-auto" : "px-6 py-6 max-w-6xl mx-auto",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/80 bg-white/95 px-4 py-2.5 min-w-[88px] shadow-card backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      <p className="text-xl font-semibold text-foreground font-display tabular-nums">
        {value}
      </p>
    </div>
  );
}
