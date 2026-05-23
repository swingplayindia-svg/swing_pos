"use client";

import { useRouter } from "next/navigation";
import { CarouselSlideForm } from "@/components/community/carousel-slide-form";

export default function AddCarouselSlidePage() {
  const router = useRouter();

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6 max-w-lg">
        New slides are written to{" "}
        <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
          Carousels/community/&#123;slideId&#125;
        </code>{" "}
        with <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">imageUrl</code>,{" "}
        <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">top_color</code>,{" "}
        <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">order</code>, and optional{" "}
        <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">linkUrl</code>.
      </p>
      <CarouselSlideForm mode="add" onSuccess={() => router.push("/community/carousels")} />
    </div>
  );
}
