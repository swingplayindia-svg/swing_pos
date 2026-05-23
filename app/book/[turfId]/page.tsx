"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BookTurfHeader,
  BookTurfHeaderSkeleton,
  type BookTurfVenue,
} from "@/components/booking/book-turf-header";
import { CustomerBookingForm } from "@/components/booking/customer-booking-form";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function BookTurfPage() {
  const params = useParams();
  const turfId = params.turfId as string;
  const [turf, setTurf] = useState<BookTurfVenue | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTurf = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/public/turfs/${turfId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Venue not found.");
      setTurf(data as BookTurfVenue);
    } catch (err) {
      setTurf(null);
      setError(err instanceof Error ? err.message : "Failed to load venue.");
    } finally {
      setLoading(false);
    }
  }, [turfId]);

  useEffect(() => {
    void loadTurf();
  }, [loadTurf]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] pb-10">
        <BookTurfHeaderSkeleton />
        <div className="max-w-lg mx-auto px-4 mt-6 space-y-4 animate-pulse">
          <div className="surface-card h-36" />
          <div className="surface-card h-64" />
          <div className="h-12 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !turf) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Couldn&apos;t load venue
            </h1>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
          <Button
            variant="outline"
            className="border-primary/25"
            onClick={() => void loadTurf()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-8">
      <BookTurfHeader turf={turf} />

      <main className="max-w-lg mx-auto px-4 mt-6">
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Pick a date and time, then scan the UPI QR to pay.
        </p>
        <CustomerBookingForm turf={{ ...turf, id: turf.id ?? turfId }} />
      </main>

      <footer className="max-w-lg mx-auto px-4 mt-8 text-center">
        <p className="text-[11px] text-muted-foreground">
          Powered by Swing Play · Pay via UPI
        </p>
      </footer>
    </div>
  );
}
