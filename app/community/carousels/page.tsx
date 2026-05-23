"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CarouselSlideCard } from "@/components/community/carousel-slide-card";
import {
  IOS_DEFAULT_SLIDES,
  deleteCommunityCarouselSlideById,
  watchCommunityCarouselSlides,
  type CommunityCarouselSlide,
} from "@/lib/storage-community-carousels";
import { ensureFirebaseAuthReady } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Images, Plus, Radio } from "lucide-react";

export default function CommunityCarouselsPage() {
  const [slides, setSlides] = useState<CommunityCarouselSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rtdbError, setRtdbError] = useState("");

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        await ensureFirebaseAuthReady();
        unsubscribe = watchCommunityCarouselSlides(
          (next) => {
            setSlides(next);
            setIsLoading(false);
            setRtdbError("");
          },
          (err) => {
            setRtdbError(
              err.message ||
                "Could not load carousel slides. Check RTDB rules allow authenticated writes.",
            );
            setIsLoading(false);
          },
        );
      } catch (err) {
        setRtdbError(
          err instanceof Error ? err.message : "Failed to connect to Realtime Database.",
        );
        setIsLoading(false);
      }
    })();

    return () => unsubscribe?.();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Radio className="h-4 w-4 text-primary animate-pulse" />
          Live sync with Firebase Realtime Database
        </div>
        <Link href="/community/carousels/add">
          <Button className="btn-primary-glow">
            <Plus className="h-4 w-4 mr-2" />
            Add slide
          </Button>
        </Link>
      </div>

      {rtdbError && (
        <Alert variant="destructive">
          <AlertTitle>Realtime Database error</AlertTitle>
          <AlertDescription>{rtdbError}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="py-16 text-center text-muted-foreground text-sm">
          Loading slides…
        </p>
      ) : slides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {slides.map((slide) => (
            <CarouselSlideCard
              key={slide.id}
              slide={slide}
              onDelete={(id) => {
                if (
                  confirm(
                    "Remove this slide? The iOS app will fall back to defaults if no slides remain.",
                  )
                ) {
                  void (async () => {
                    await deleteCommunityCarouselSlideById(id);
                  })();
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-dashed border-primary/20 bg-gradient-to-b from-accent/30 to-background px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Images className="h-7 w-7 text-primary/60" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              No slides in RTDB
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              The iOS app shows bundled defaults (a / b / c) until you publish slides here.
            </p>
            <div className="mt-6">
              <Link href="/community/carousels/add">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Add first slide
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground mb-3">
              iOS fallback preview (not stored in RTDB)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {IOS_DEFAULT_SLIDES.map((slide) => (
                <div
                  key={slide.id}
                  className="rounded-lg border border-border/60 bg-card overflow-hidden"
                >
                  <div className="h-1.5" style={{ backgroundColor: slide.top_color }} />
                  <div className="p-3 text-sm space-y-1">
                    <p className="font-mono text-muted-foreground">asset {slide.imageUrl}</p>
                    <p className="font-mono">{slide.top_color}</p>
                    <p className="text-xs text-muted-foreground">order {slide.order}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
