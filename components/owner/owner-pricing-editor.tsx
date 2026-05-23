"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DAY_RATE_ROWS,
  type DayRateKey,
} from "@/lib/turf-pricing";
import type { OwnerVenueForm } from "@/lib/turf-owner-schema";
import { IndianRupee, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "bg-background border-border/80 focus-visible:ring-primary/30 h-10 pl-9";

type Props = {
  form: OwnerVenueForm;
  onChange: (patch: Partial<OwnerVenueForm>) => void;
  /** When period slots are on, flat weekday/weekend are fallbacks only */
  hideBaseRates?: boolean;
};

export function OwnerPricingEditor({
  form,
  onChange,
  hideBaseRates = false,
}: Props) {
  const updateDayRate = (key: DayRateKey, value: string) => {
    onChange({
      dayRates: { ...form.dayRates, [key]: value },
    });
  };

  const addSpecialDate = () => {
    onChange({
      specialRates: [...form.specialRates, { date: "", rate: "" }],
    });
  };

  const updateSpecial = (
    index: number,
    patch: Partial<{ date: string; rate: string }>,
  ) => {
    const next = form.specialRates.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    onChange({ specialRates: next });
  };

  const removeSpecial = (index: number) => {
    onChange({
      specialRates: form.specialRates.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        All prices are <strong className="text-foreground">per hour</strong>.
        Special dates override everything.{" "}
        {!hideBaseRates &&
          "Daily rates override weekday/weekend defaults."}
      </p>

      {!hideBaseRates && (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Weekday default</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary pointer-events-none" />
            <Input
              type="number"
              min={1}
              value={form.weekday}
              onChange={(e) => onChange({ weekday: e.target.value })}
              placeholder="Mon–Fri"
              className={inputClass}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Mon–Fri fallback</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Weekend default</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary pointer-events-none" />
            <Input
              type="number"
              min={1}
              value={form.weekend}
              onChange={(e) => onChange({ weekend: e.target.value })}
              placeholder="Sat–Sun"
              className={inputClass}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Sat–Sun fallback</p>
        </div>
      </div>
      )}

      {hideBaseRates && (
        <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border px-3 py-2">
          Base weekday/weekend below are used only when a morning or evening
          rate is left blank.
        </p>
      )}

      {hideBaseRates && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fallback weekday</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary pointer-events-none" />
              <Input
                type="number"
                min={1}
                value={form.weekday}
                onChange={(e) => onChange({ weekday: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fallback weekend</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary pointer-events-none" />
              <Input
                type="number"
                min={1}
                value={form.weekend}
                onChange={(e) => onChange({ weekend: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {!hideBaseRates && (
      <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-accent/30 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            Price per day of week
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set a different ₹/hr for each day
          </p>
        </div>
        <Switch
          checked={form.usePerDayRates}
          onCheckedChange={(usePerDayRates) => onChange({ usePerDayRates })}
        />
      </div>
      )}

      {!hideBaseRates && form.usePerDayRates && (
        <div className="space-y-2 rounded-xl border border-border/80 p-3 bg-muted/20">
          {DAY_RATE_ROWS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">
                {label}
              </span>
              <div className="relative flex-1">
                <IndianRupee className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary pointer-events-none" />
                <Input
                  type="number"
                  min={1}
                  value={form.dayRates[key]}
                  onChange={(e) => updateDayRate(key, e.target.value)}
                  placeholder={`Default`}
                  className={cn(inputClass, "h-9 text-sm")}
                />
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground pt-1">
            Leave blank to use weekday/weekend default for that day.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Special dates</p>
            <p className="text-xs text-muted-foreground">
              Holidays, events, peak days (overrides everything)
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-primary/20"
            onClick={addSpecialDate}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {form.specialRates.length === 0 ? (
          <p className="text-xs text-muted-foreground rounded-lg border border-dashed border-border px-3 py-4 text-center">
            No special dates. Tap Add for custom pricing on a specific day.
          </p>
        ) : (
          <ul className="space-y-2">
            {form.specialRates.map((row, index) => (
              <li
                key={`${index}-${row.date}`}
                className="flex items-center gap-2"
              >
                <Input
                  type="date"
                  value={row.date}
                  onChange={(e) =>
                    updateSpecial(index, { date: e.target.value })
                  }
                  className="bg-background h-9 flex-1"
                />
                <div className="relative w-28">
                  <IndianRupee className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary pointer-events-none" />
                  <Input
                    type="number"
                    min={1}
                    value={row.rate}
                    onChange={(e) =>
                      updateSpecial(index, { rate: e.target.value })
                    }
                    placeholder="/hr"
                    className="bg-background h-9 pl-7"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 text-destructive"
                  onClick={() => removeSpecial(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
