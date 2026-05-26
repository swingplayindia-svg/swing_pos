"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadSportScoringImage } from "@/lib/firebase-storage";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";

interface SportScoringImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  sportKey: string;
  label: string;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
  className?: string;
}

export function SportScoringImageUpload({
  value,
  onChange,
  sportKey,
  label,
  disabled,
  onUploadingChange,
  className,
}: SportScoringImageUploadProps) {
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
      const url = await uploadSportScoringImage(file, sportKey);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const busy = uploading || disabled;
  const hasImage = Boolean(value?.trim());

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {hasImage ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={`${label} card`}
            className="h-24 w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-8"
              disabled={busy}
              onClick={() => onChange("")}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-24 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/80 bg-muted/20 text-muted-foreground transition hover:bg-muted/40",
            busy && "pointer-events-none opacity-70",
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          <span className="text-xs font-medium">Upload card image</span>
        </button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
