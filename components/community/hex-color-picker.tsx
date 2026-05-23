"use client";

import { useId, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeHexColor } from "@/lib/community-carousel-schema";
import { TOP_COLOR_PRESETS } from "@/lib/storage-community-carousels";
import { cn } from "@/lib/utils";
import { Pipette } from "lucide-react";

interface HexColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  description?: string;
  className?: string;
}

export function HexColorPicker({
  value,
  onChange,
  label = "Top bar color",
  description,
  className,
}: HexColorPickerProps) {
  const pickerId = useId();
  const hexId = useId();

  const normalized = useMemo(() => normalizeHexColor(value), [value]);
  const previewColor = normalized ?? "#1A237E";
  const pickerValue = (normalized ?? "#1A237E").toLowerCase();

  const setColor = (raw: string) => {
    const next = normalizeHexColor(raw);
    if (next) onChange(next);
    else onChange(raw);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Live preview — mimics iOS top bar */}
      <div className="overflow-hidden rounded-xl border border-border/80 shadow-sm">
        <div
          className="h-12 flex items-center justify-center transition-colors duration-200"
          style={{ backgroundColor: previewColor }}
        >
          <span
            className={cn(
              "text-sm font-semibold tracking-wide",
              isLightColor(previewColor) ? "text-gray-900" : "text-white",
            )}
          >
            Swing Leagues
          </span>
        </div>
        <div className="bg-muted/40 px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Preview</span>
          <span className="font-mono text-foreground">{previewColor}</span>
        </div>
      </div>

      {/* Native color picker + hex input */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Label htmlFor={pickerId} className="text-sm font-medium">
            {label}
          </Label>
          <div className="flex items-center gap-3">
            <label
              htmlFor={pickerId}
              className="relative flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-border shadow-sm transition-shadow hover:ring-2 hover:ring-primary/30"
              style={{ backgroundColor: previewColor }}
              title="Open color picker"
            >
              <input
                id={pickerId}
                type="color"
                value={pickerValue}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Pick a color"
              />
              <Pipette
                className={cn(
                  "h-4 w-4 drop-shadow-sm pointer-events-none",
                  isLightColor(previewColor) ? "text-gray-800" : "text-white",
                )}
              />
            </label>
            <div className="flex-1 min-w-[140px]">
              <Label htmlFor={hexId} className="sr-only">
                Hex value
              </Label>
              <Input
                id={hexId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={() => {
                  const next = normalizeHexColor(value);
                  if (next) onChange(next);
                }}
                placeholder="#1A237E"
                className="bg-white font-mono uppercase"
                spellCheck={false}
              />
            </div>
          </div>
          {!normalized && value.trim() !== "" && (
            <p className="text-xs text-destructive">
              Enter a valid hex color (#RGB or #RRGGBB)
            </p>
          )}
        </div>
      </div>

      {/* Quick presets */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Presets
        </p>
        <div className="flex flex-wrap gap-2">
          {TOP_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                normalized === preset.value
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                  : "border-border bg-white hover:border-primary/30",
              )}
            >
              <span
                className="h-5 w-5 rounded-md border border-black/10 shadow-inner"
                style={{ backgroundColor: preset.value }}
              />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Common palette swatches */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          More colors
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXTRA_SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              title={hex}
              onClick={() => onChange(hex)}
              className={cn(
                "h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110",
                normalized === hex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent hover:border-border",
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const EXTRA_SWATCHES = [
  "#000000",
  "#FFFFFF",
  "#F44336",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
  "#3F51B5",
  "#2196F3",
  "#00BCD4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#FFEB3B",
  "#FF9800",
  "#795548",
  "#607D8B",
] as const;

function isLightColor(hex: string): boolean {
  const n = normalizeHexColor(hex);
  if (!n) return false;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
