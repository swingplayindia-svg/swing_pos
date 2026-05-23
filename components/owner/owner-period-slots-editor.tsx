"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DAY_RATE_ROWS,
  type DayRateKey,
} from "@/lib/turf-pricing";
import type { OwnerVenueForm } from "@/lib/turf-owner-schema";
import { IndianRupee, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "bg-background border-border/80 focus-visible:ring-primary/30 h-10 pl-9";

type Props = {
  form: OwnerVenueForm;
  onChange: (patch: Partial<OwnerVenueForm>) => void;
};

function PeriodDayRates({
  label,
  dayRates,
  onDayRate,
}: {
  label: string;
  dayRates: Record<DayRateKey, string>;
  onDayRate: (key: DayRateKey, value: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border/80 p-3 bg-muted/20">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
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
              value={dayRates[key]}
              onChange={(e) => onDayRate(key, e.target.value)}
              placeholder="Default"
              className={cn(inputClass, "h-9 text-sm")}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PeriodPricingBlock({
  title,
  icon: Icon,
  weekday,
  weekend,
  usePerDay,
  dayRates,
  onWeekday,
  onWeekend,
  onUsePerDay,
  onDayRate,
}: {
  title: string;
  icon: typeof Sun;
  weekday: string;
  weekend: string;
  usePerDay: boolean;
  dayRates: Record<DayRateKey, string>;
  onWeekday: (v: string) => void;
  onWeekend: (v: string) => void;
  onUsePerDay: (v: boolean) => void;
  onDayRate: (key: DayRateKey, value: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-primary/15 bg-accent/20 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Mon–Thu ₹/hr</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary pointer-events-none" />
            <Input
              type="number"
              min={1}
              value={weekday}
              onChange={(e) => onWeekday(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Fri–Sun ₹/hr</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary pointer-events-none" />
            <Input
              type="number"
              min={1}
              value={weekend}
              onChange={(e) => onWeekend(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
        <p className="text-xs font-medium">Different price each day</p>
        <Switch checked={usePerDay} onCheckedChange={onUsePerDay} />
      </div>
      {usePerDay && (
        <PeriodDayRates
          label="₹/hr per day of week"
          dayRates={dayRates}
          onDayRate={onDayRate}
        />
      )}
    </div>
  );
}

export function OwnerPeriodSlotsEditor({ form, onChange }: Props) {
  const updateMorningDay = (key: DayRateKey, value: string) => {
    onChange({ morningDayRates: { ...form.morningDayRates, [key]: value } });
  };
  const updateEveningDay = (key: DayRateKey, value: string) => {
    onChange({ eveningDayRates: { ...form.eveningDayRates, [key]: value } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-accent/30 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            Morning & evening slots
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Split the day into two bookable windows with separate prices
          </p>
        </div>
        <Switch
          checked={form.usePeriodSlots}
          onCheckedChange={(usePeriodSlots) => onChange({ usePeriodSlots })}
        />
      </div>

      {form.usePeriodSlots && (
        <>
          <div className="space-y-3 rounded-xl border border-border/80 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-medium">Morning</p>
              </div>
              <Switch
                checked={form.morningEnabled}
                onCheckedChange={(morningEnabled) => onChange({ morningEnabled })}
              />
            </div>
            {form.morningEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">From</label>
                  <Input
                    type="time"
                    value={form.morningStart}
                    onChange={(e) => onChange({ morningStart: e.target.value })}
                    className="bg-background h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Until</label>
                  <Input
                    type="time"
                    value={form.morningEnd}
                    onChange={(e) => onChange({ morningEnd: e.target.value })}
                    className="bg-background h-10"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-border/80 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-500" />
                <p className="text-sm font-medium">Evening</p>
              </div>
              <Switch
                checked={form.eveningEnabled}
                onCheckedChange={(eveningEnabled) => onChange({ eveningEnabled })}
              />
            </div>
            {form.eveningEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">From</label>
                  <Input
                    type="time"
                    value={form.eveningStart}
                    onChange={(e) => onChange({ eveningStart: e.target.value })}
                    className="bg-background h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Until</label>
                  <Input
                    type="time"
                    value={form.eveningEnd}
                    onChange={(e) => onChange({ eveningEnd: e.target.value })}
                    className="bg-background h-10"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Use 00:00 for midnight
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Times between slots (e.g. 12 pm–4 pm) are not bookable. Multi-hour
            bookings must stay within one slot.
          </p>

          {form.morningEnabled && (
            <PeriodPricingBlock
              title="Morning pricing"
              icon={Sun}
              weekday={form.morningWeekday}
              weekend={form.morningWeekend}
              usePerDay={form.morningUsePerDayRates}
              dayRates={form.morningDayRates}
              onWeekday={(morningWeekday) => onChange({ morningWeekday })}
              onWeekend={(morningWeekend) => onChange({ morningWeekend })}
              onUsePerDay={(morningUsePerDayRates) =>
                onChange({ morningUsePerDayRates })
              }
              onDayRate={updateMorningDay}
            />
          )}

          {form.eveningEnabled && (
            <PeriodPricingBlock
              title="Evening pricing"
              icon={Moon}
              weekday={form.eveningWeekday}
              weekend={form.eveningWeekend}
              usePerDay={form.eveningUsePerDayRates}
              dayRates={form.eveningDayRates}
              onWeekday={(eveningWeekday) => onChange({ eveningWeekday })}
              onWeekend={(eveningWeekend) => onChange({ eveningWeekend })}
              onUsePerDay={(eveningUsePerDayRates) =>
                onChange({ eveningUsePerDayRates })
              }
              onDayRate={updateEveningDay}
            />
          )}
        </>
      )}
    </div>
  );
}
