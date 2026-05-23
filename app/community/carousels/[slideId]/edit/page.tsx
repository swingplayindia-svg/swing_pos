"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CarouselSlideForm } from "@/components/community/carousel-slide-form";
import {
  getCommunityCarouselSlideById,
  slideToForm,
} from "@/lib/storage-community-carousels";
import { Button } from "@/components/ui/button";

export default function EditCarouselSlidePage() {
  const params = useParams();
  const router = useRouter();
  const slideId = params.slideId as string;
  const [initial, setInitial] = useState<ReturnType<typeof slideToForm> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const slide = await getCommunityCarouselSlideById(slideId);
        if (slide) setInitial(slideToForm(slide));
      } finally {
        setLoading(false);
      }
    })();
  }, [slideId]);

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">Loading slide…</p>
    );
  }

  if (!initial) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">Slide not found.</p>
        <Button variant="outline" onClick={() => router.push("/community/carousels")}>
          Back to slides
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-2 max-w-lg">
        Editing <span className="font-mono text-foreground">{slideId}</span>
      </p>
      <p className="text-sm text-muted-foreground mb-6 max-w-lg">
        Save to push updates to the iOS Community screen immediately.
      </p>
      <CarouselSlideForm
        mode="edit"
        slideId={slideId}
        initialData={initial}
        onSuccess={() => router.push("/community/carousels")}
      />
    </div>
  );
}
