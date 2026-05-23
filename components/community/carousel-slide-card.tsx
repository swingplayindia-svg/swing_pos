"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link2, Pencil, Trash2 } from "lucide-react";
import {
  isRemoteImageUrl,
  type CommunityCarouselSlide,
} from "@/lib/storage-community-carousels";

interface CarouselSlideCardProps {
  slide: CommunityCarouselSlide;
  onDelete: (id: string) => void;
}

export function CarouselSlideCard({ slide, onDelete }: CarouselSlideCardProps) {
  const showImage = isRemoteImageUrl(slide.imageUrl);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-premium">
      <div
        className="h-2 w-full"
        style={{ backgroundColor: slide.top_color }}
        title={slide.top_color}
      />
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-lg bg-white/90 px-3 py-1.5 font-mono text-sm font-semibold text-foreground border border-border/60">
              Asset: {slide.imageUrl || "—"}
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-4 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium shadow-sm border border-border/50 tabular-nums">
          Order {slide.order}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-mono text-xs text-muted-foreground truncate" title={slide.id}>
          {slide.id}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="h-5 w-5 rounded border border-border/80"
            style={{ backgroundColor: slide.top_color }}
          />
          <span className="text-sm font-mono text-foreground">{slide.top_color}</span>
        </div>
        {slide.linkUrl ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-primary">
            <Link2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <a
              href={slide.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {slide.linkUrl}
            </a>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">No tap link</p>
        )}

        <div className="mt-4 flex gap-2 pt-1">
          <Link href={`/community/carousels/${slide.id}/edit`} className="flex-1">
            <Button size="sm" className="w-full btn-primary-glow">
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
            onClick={() => onDelete(slide.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
