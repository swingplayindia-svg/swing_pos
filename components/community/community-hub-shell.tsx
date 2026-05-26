"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCommunityCarouselSlides } from "@/lib/storage-community-carousels";
import { cn } from "@/lib/utils";
import { Bell, ChevronRight, Images, LayoutGrid, Plus, Trophy } from "lucide-react";

const NAV = [
  { href: "/community/carousels", label: "All Slides", icon: LayoutGrid },
  { href: "/community/carousels/add", label: "Add Slide", icon: Plus },
  { href: "/community/scoring", label: "Sport scoring", icon: Trophy },
  { href: "/community/notifications", label: "Push", icon: Bell },
] as const;

function isEditPath(pathname: string) {
  return /^\/community\/carousels\/[^/]+\/edit$/.test(pathname);
}

export function CommunityHubShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [slideCount, setSlideCount] = useState(0);
  const onEdit = isEditPath(pathname);

  useEffect(() => {
    void (async () => {
      try {
        const slides = await getCommunityCarouselSlides();
        setSlideCount(slides.length);
      } catch {
        setSlideCount(0);
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
                  Community
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Community & app config
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Carousels, live scoring toggles, and push notifications sync to the
                iOS app in real time via Realtime Database.
              </p>
            </div>

            <div className="flex gap-3">
              <StatPill label="Slides" value={slideCount} />
            </div>
          </div>

          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Community section">
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
            {onEdit && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary font-medium">
                <Images className="h-3.5 w-3.5" />
                Editing slide
              </span>
            )}
          </nav>

          {onEdit && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link
                href="/community/carousels"
                className="hover:text-primary transition-colors"
              >
                All Slides
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">Edit</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 w-full px-6 py-6 max-w-6xl mx-auto">{children}</div>
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
