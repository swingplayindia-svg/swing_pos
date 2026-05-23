"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadCarouselImage } from "@/lib/firebase-storage";
import { isRemoteImageUrl } from "@/lib/storage-community-carousels";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";

interface CarouselSlideImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  slideId: string;
  onUploadingChange?: (uploading: boolean) => void;
  className?: string;
}

const LOCAL_ASSETS = ["a", "b", "c"] as const;

export function CarouselSlideImageUpload({
  value,
  onChange,
  slideId,
  onUploadingChange,
  className,
}: CarouselSlideImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };

  const handleFile = async (file: File) => {
    setError("");
    setBusy(true);
    try {
      const url = await uploadCarouselImage(file, slideId);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const hasRemoteImage = value && isRemoteImageUrl(value);
  const isLocalAsset = LOCAL_ASSETS.includes(
    value as (typeof LOCAL_ASSETS)[number],
  );

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {hasRemoteImage ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Banner preview"
            className="h-44 w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-white/95 hover:bg-white"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  Replace
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-white/95 hover:bg-white text-destructive"
              disabled={uploading}
              onClick={() => onChange("")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/25 bg-accent/30 px-4 py-10 text-center transition-colors",
            "hover:border-primary/40 hover:bg-accent/50",
            uploading && "pointer-events-none opacity-70",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading…</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Upload banner image
              </span>
              <span className="text-xs text-muted-foreground">
                JPEG, PNG or WebP · max 5 MB
              </span>
            </>
          )}
        </button>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Or use an iOS bundled asset name (shown when RTDB is empty):
        </p>
        <div className="flex flex-wrap gap-2">
          {LOCAL_ASSETS.map((asset) => (
            <Button
              key={asset}
              type="button"
              size="sm"
              variant={value === asset ? "default" : "outline"}
              className="h-8 min-w-10"
              disabled={uploading}
              onClick={() => onChange(asset)}
            >
              {asset}
            </Button>
          ))}
        </div>
        <Input
          placeholder="Custom image URL or asset name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={uploading}
          className="bg-white"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {hasRemoteImage && (
        <p className="text-xs text-muted-foreground truncate" title={value}>
          Stored in Firebase Storage
        </p>
      )}
    </div>
  );
}
