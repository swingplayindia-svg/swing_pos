"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadTurfImage, isDefaultTurfImage } from "@/lib/firebase-storage";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";

interface TurfImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folderId: string;
  onUploadingChange?: (uploading: boolean) => void;
  className?: string;
}

export function TurfImageUpload({
  value,
  onChange,
  folderId,
  onUploadingChange,
  className,
}: TurfImageUploadProps) {
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
      const url = await uploadTurfImage(file, folderId);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const hasImage = value && !isDefaultTurfImage(value);

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

      {hasImage ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Venue preview"
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
                Upload venue photo
              </span>
              <span className="text-xs text-muted-foreground">
                JPEG, PNG or WebP · max 5 MB
              </span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {hasImage && (
        <p className="text-xs text-muted-foreground truncate" title={value}>
          Stored in Firebase Storage
        </p>
      )}
    </div>
  );
}
