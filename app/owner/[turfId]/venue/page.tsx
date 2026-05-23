"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { OwnerVenueForm } from "@/components/owner/owner-venue-form";
import { useOwnerTurfData } from "@/hooks/use-owner-turf-data";
import { turfToOwnerVenueForm } from "@/lib/turf-owner-schema";

export default function OwnerVenuePage() {
  const params = useParams();
  const turfId = params.turfId as string;
  const { turf, turfLoading, refreshTurf, invalidateTurf } = useOwnerTurfData();
  const [saved, setSaved] = useState(false);

  const initial = useMemo(
    () => (turf ? turfToOwnerVenueForm(turf) : null),
    [turf],
  );

  if (turfLoading && !initial) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
    );
  }

  if (!initial) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Venue not found.
      </p>
    );
  }

  return (
    <div>
      {saved && (
        <p className="mb-4 text-sm font-medium text-primary bg-accent border border-primary/20 rounded-xl px-4 py-3 shadow-sm">
          Venue updated successfully.
        </p>
      )}
      <OwnerVenueForm
        key={turf?.updatedAt ?? turfId}
        turfId={turfId}
        initialData={initial}
        onSuccess={() => {
          setSaved(true);
          invalidateTurf();
          void refreshTurf(true);
        }}
      />
    </div>
  );
}
