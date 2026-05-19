"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Pencil, Star, Trash2, Wind } from "lucide-react";
import type { Turf } from "@/lib/turf-schema";

export type TurfCardData = Pick<
  Turf,
  "id" | "name" | "area" | "city" | "rating" | "total_reviews" | "sports" | "pricing" | "turfImage"
>;

interface TurfVenueCardProps {
  turf: TurfCardData;
  onDelete: (id: string) => void;
}

export function TurfVenueCard({ turf, onDelete }: TurfVenueCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-premium">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        {turf.turfImage && turf.turfImage !== "/turf-default.jpg" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={turf.turfImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_20%,_var(--primary)_0%,_transparent_50%)]" />
            <Wind className="absolute right-4 top-4 h-10 w-10 text-primary/20" />
          </>
        )}
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium shadow-sm border border-border/50">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          <span className="text-foreground">{turf.rating}</span>
          <span className="text-muted-foreground">· {turf.total_reviews}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
          {turf.name}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {turf.area}, {turf.city}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {turf.sports.slice(0, 3).map((sport) => (
            <span
              key={sport}
              className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground"
            >
              {sport}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2.5 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Weekday</p>
            <p className="font-semibold text-foreground">₹{turf.pricing.weekday}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Weekend</p>
            <p className="font-semibold text-foreground">₹{turf.pricing.weekend}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2 pt-1">
          <Link href={`/turfs/${turf.id}`} className="flex-1">
            <Button size="sm" className="w-full btn-primary-glow">
              Open
            </Button>
          </Link>
          <Link href={`/turfs/${turf.id}/edit`}>
            <Button size="sm" variant="outline" className="border-border" title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
            onClick={() => onDelete(turf.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
