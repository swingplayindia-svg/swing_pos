"use client";

import Link from "next/link";
import type { Turf } from "@/lib/turf-schema";
import { Star, ExternalLink } from "lucide-react";

const AMENITY_LABELS: Record<keyof Turf["amenities"], string> = {
  floodlights: "Floodlights",
  washrooms: "Washrooms",
  drinking_water: "Drinking water",
  parking: "Parking",
  changing_rooms: "Changing rooms",
  seating: "Seating",
};

export function TurfMapPopup({ turf }: { turf: Turf }) {
  const activeAmenities = (
    Object.entries(turf.amenities) as [keyof Turf["amenities"], boolean][]
  )
    .filter(([, on]) => on)
    .map(([key]) => AMENITY_LABELS[key]);

  return (
    <div className="min-w-[240px] max-w-[280px] space-y-2 text-sm">
      {turf.turfImage && turf.turfImage !== "/turf-default.jpg" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={turf.turfImage}
          alt={turf.name}
          className="h-24 w-full rounded-md object-cover"
        />
      )}
      <div>
        <p className="font-semibold text-foreground leading-snug">{turf.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{turf.area}, {turf.city}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{turf.address}</p>
      {turf.landmark && (
        <p className="text-xs text-muted-foreground">Near {turf.landmark}</p>
      )}
      <div className="flex items-center gap-1 text-xs">
        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
        <span className="font-medium">{turf.rating}</span>
        <span className="text-muted-foreground">({turf.total_reviews} reviews)</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {turf.open_24_hours
          ? "Open 24 hours"
          : `${turf.open_time} – ${turf.close_time}`}
        {" · "}
        {turf.turf_surface}
        {turf.turf_location ? ` · ${turf.turf_location}` : ""}
      </p>
      <p className="text-xs">
        <span className="font-medium text-foreground">₹{turf.pricing.weekday}</span>
        <span className="text-muted-foreground"> weekday</span>
        {" · "}
        <span className="font-medium text-foreground">₹{turf.pricing.weekend}</span>
        <span className="text-muted-foreground"> weekend</span>
      </p>
      <p className="text-xs text-muted-foreground">{turf.sports.join(" · ")}</p>
      {activeAmenities.length > 0 && (
        <p className="text-[11px] text-muted-foreground">{activeAmenities.join(" · ")}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {turf.contact.phone}
        {turf.contact.whatsapp !== turf.contact.phone &&
          ` · WA ${turf.contact.whatsapp}`}
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/turfs/${turf.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View details
        </Link>
        {turf.turf_url && (
          <a
            href={turf.turf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Listing
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
