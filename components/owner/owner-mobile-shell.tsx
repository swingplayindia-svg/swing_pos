"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useOwnerAuth } from "@/hooks/use-owner-auth";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  Home,
  LogOut,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { suffix: "", label: "Home", icon: Home },
  { suffix: "/bookings", label: "Bookings", icon: ClipboardList },
  { suffix: "/calendar", label: "Calendar", icon: CalendarDays },
  { suffix: "/venue", label: "Venue", icon: MapPin },
] as const;

function OwnerHeader({
  eyebrow,
  title,
  subtitle,
  backHref,
  onLogout,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  onLogout?: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 overflow-hidden shadow-md shadow-primary/15">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e1a] via-primary to-[#1a9d55]" />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, white 0%, transparent 45%), radial-gradient(circle at 90% 100%, white 0%, transparent 40%)",
        }}
      />
      <div className="relative max-w-lg mx-auto w-full px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            {backHref && (
              <Link
                href={backHref}
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition-colors hover:bg-white/25"
                aria-label="Back to venues"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 items-center rounded-md bg-white/15 px-2 text-[10px] font-bold uppercase tracking-widest text-white/95 ring-1 ring-white/20">
                  {eyebrow}
                </span>
              </div>
              <h1 className="font-display mt-1.5 text-lg font-semibold text-white truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-white/75 truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {onLogout && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="shrink-0 h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function OwnerMobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const turfId = params.turfId as string | undefined;
  const { displayName, logout, ownedTurfs } = useOwnerAuth();

  if (!turfId) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-accent/60 via-background to-background">
        <OwnerHeader
          eyebrow="Swing Owner"
          title={`Hi, ${displayName}`}
          subtitle="Manage your venues"
          onLogout={() => void logout()}
        />
        <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5">{children}</main>
      </div>
    );
  }

  const base = `/owner/${turfId}`;
  const turf = ownedTurfs.find((t) => t.id === turfId);
  const turfName = turf?.name ?? "Your venue";
  const turfSubtitle = turf ? `${turf.area}, ${turf.city}` : undefined;
  const showVenueSwitcher = ownedTurfs.length > 1;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-accent/50 via-background to-muted/30 pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
      <OwnerHeader
        eyebrow="Swing Owner"
        title={turfName}
        subtitle={turfSubtitle}
        backHref={showVenueSwitcher ? "/owner" : undefined}
        onLogout={() => void logout()}
      />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto rounded-2xl border border-border/70 bg-card/95 backdrop-blur-xl shadow-premium ring-1 ring-primary/5">
          <div className="grid grid-cols-4 gap-1 p-1.5">
            {NAV.map(({ suffix, label, icon: Icon }) => {
              const href = `${base}${suffix}`;
              const active =
                suffix === "" ? pathname === base : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[10px] font-semibold transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "text-muted-foreground hover:bg-accent hover:text-primary",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      active && "scale-105",
                    )}
                    strokeWidth={active ? 2.25 : 2}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
