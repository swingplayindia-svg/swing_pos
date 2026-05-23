"use client";

import {
  formatOperatingHoursSummary,
  formatPricingSummary,
} from "@/lib/turf-pricing";
import type { TurfPricing } from "@/lib/turf-schema";
import { Clock, IndianRupee, MapPin, Sparkles } from "lucide-react";

export type BookTurfVenue = {
  id?: string;
  name: string;
  area: string;
  city: string;
  address?: string;
  sports: string[];
  pricing: TurfPricing;
  open_time?: string;
  close_time?: string;
  open_24_hours?: boolean;
  turfImage?: string;
};

export function BookTurfHeader({ turf }: { turf: BookTurfVenue }) {
  const hasImage =
    turf.turfImage && turf.turfImage !== "/turf-default.jpg";
  const hours = formatOperatingHoursSummary(
    turf.pricing,
    turf.open_time ?? "06:00",
    turf.close_time ?? "23:00",
    Boolean(turf.open_24_hours),
  );
  const pricing = formatPricingSummary(turf.pricing);
  const location = [turf.area, turf.city].filter(Boolean).join(", ");

  return (
    <header className="relative">
      <div className="relative h-48 sm:h-52 overflow-hidden">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={turf.turfImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary-bright/80"
            aria-hidden
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-primary/20"
          aria-hidden
        />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white border border-white/20">
            <Sparkles className="h-3 w-3" />
            Swing Play
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-12">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {turf.name}
          </h1>
          {location && (
            <p className="text-sm text-white/85 flex items-center gap-1.5 mt-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {location}
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 -mt-3">
        <div className="surface-card p-4 space-y-3">
          {turf.sports.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {turf.sports.map((sport) => (
                <span
                  key={sport}
                  className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                >
                  {sport}
                </span>
              ))}
            </div>
          )}
          <div className="grid gap-2 text-sm">
            <div className="flex gap-2">
              <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-muted-foreground leading-snug">{hours}</span>
            </div>
            <div className="flex gap-2">
              <IndianRupee className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-muted-foreground leading-snug">{pricing}</span>
            </div>
          </div>
          {turf.address && turf.address !== location && (
            <p className="text-xs text-muted-foreground border-t border-border/60 pt-2 leading-relaxed">
              {turf.address}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

export function BookTurfHeaderSkeleton() {
  return (
    <header className="animate-pulse">
      <div className="h-48 sm:h-52 bg-muted" />
      <div className="max-w-lg mx-auto px-4 -mt-5">
        <div className="surface-card p-4 space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-muted" />
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
      </div>
    </header>
  );
}
