"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { venueFormatTime, venueHHmm } from "@/lib/venue-time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateBookingAmount,
  formatPricingSummary,
  hourlyRateAt,
  periodForClockTime,
  usesPeriodSlots,
} from "@/lib/turf-pricing";
import { SPORTS_OPTIONS, type TurfPricing } from "@/lib/turf-schema";
import type { TimeSlot } from "@/lib/booking-slots";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  CreditCard,
  Loader2,
  Moon,
  Sun,
  User,
} from "lucide-react";

type PublicTurf = {
  id: string;
  name: string;
  area: string;
  city: string;
  sports: string[];
  pricing: TurfPricing;
};

function StepBadge({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
        {n}
      </span>
      <h2 className="font-semibold text-foreground">{label}</h2>
    </div>
  );
}

function SlotGrid({
  slots,
  selectedSlot,
  onSelect,
}: {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
}) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border px-3 py-6 text-center">
        No slots left for this date. Try another day or fewer hours.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.id}
          type="button"
          disabled={!slot.available}
          title={slot.reason}
          onClick={() => slot.available && onSelect(slot)}
          className={cn(
            "rounded-lg py-2.5 text-xs font-medium border transition-all",
            !slot.available &&
              "opacity-40 cursor-not-allowed line-through bg-muted",
            slot.available &&
              selectedSlot?.id === slot.id &&
              "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-[1.02]",
            slot.available &&
              selectedSlot?.id !== slot.id &&
              "bg-background border-border hover:border-primary/50 hover:bg-accent/50",
          )}
        >
          {slot.label}
        </button>
      ))}
    </div>
  );
}

export function CustomerBookingForm({ turf }: { turf: PublicTurf }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [sport, setSport] = useState(turf.sports[0] ?? "");
  const [hours, setHours] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [closed, setClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  const sports = turf.sports.length > 0 ? turf.sports : [...SPORTS_OPTIONS];
  const hasPeriodSlots = usesPeriodSlots(turf.pricing);

  const loadSlots = useCallback(async () => {
    if (!date) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    setError("");
    try {
      const res = await fetch("/api/bookings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turfId: turf.id, date, hours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load slots.");
      setSlots(data.slots ?? []);
      setClosed(Boolean(data.closed));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load slots.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [date, hours, turf.id]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const groupedSlots = useMemo(() => {
    if (!hasPeriodSlots) return null;
    const morning: TimeSlot[] = [];
    const evening: TimeSlot[] = [];
    const other: TimeSlot[] = [];
    for (const slot of slots) {
      const period = periodForClockTime(
        turf.pricing,
        venueHHmm(parseISO(slot.startAt)),
      );
      if (period === "morning") morning.push(slot);
      else if (period === "evening") evening.push(slot);
      else other.push(slot);
    }
    return { morning, evening, other };
  }, [slots, hasPeriodSlots, turf.pricing]);

  const slotRate = useMemo(() => {
    if (!selectedSlot) return null;
    return hourlyRateAt(turf.pricing, parseISO(selectedSlot.startAt));
  }, [selectedSlot, turf.pricing]);

  const amount = useMemo(() => {
    if (!selectedSlot) return 0;
    return calculateBookingAmount(
      turf.pricing,
      parseISO(selectedSlot.startAt),
      hours,
    );
  }, [selectedSlot, hours, turf.pricing]);

  const handlePay = async () => {
    setError("");
    if (!name.trim() || !phone.trim() || !date || !sport || !selectedSlot) {
      setError("Please complete all fields and pick an available slot.");
      return;
    }
    if (!selectedSlot.available) {
      setError("Selected slot is no longer available.");
      return;
    }

    setPaying(true);
    try {
      const reserveRes = await fetch("/api/bookings/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turfId: turf.id,
          customerName: name,
          customerPhone: phone,
          startAt: selectedSlot.startAt,
          hours,
          sport,
        }),
      });
      const reserveData = (await reserveRes.json()) as {
        bookingId?: string;
        amountInr?: number;
        error?: string;
      };
      if (!reserveRes.ok) {
        throw new Error(reserveData.error ?? "Could not reserve slot.");
      }

      if (
        typeof reserveData.amountInr === "number" &&
        reserveData.amountInr !== amount
      ) {
        console.warn(
          "[booking] amount sync",
          { ui: amount, server: reserveData.amountInr },
        );
      }

      const payRes = await fetch("/api/payments/phonepe/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: reserveData.bookingId }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData.error ?? "Could not start payment.");
      }

      window.location.href = payData.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed.");
      setPaying(false);
    }
  };

  const minDate = format(new Date(), "yyyy-MM-dd");
  const canPay = Boolean(
    name.trim() && phone.trim() && date && sport && selectedSlot?.available,
  );

  return (
    <div className="space-y-4 pb-28">
      <section className="surface-card p-4">
        <StepBadge n={1} label="Your details" />
        <div className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background h-11 pl-10"
              autoComplete="name"
            />
          </div>
          <Input
            placeholder="Phone number"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-background h-11"
            autoComplete="tel"
          />
        </div>
      </section>

      <section className="surface-card p-4">
        <StepBadge n={2} label="Date & time" />
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Date
            </label>
            <Input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background h-11"
            />
          </div>

          {!date && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              Choose a date to see available slots
            </p>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Sport</p>
            <div className="flex flex-wrap gap-2">
              {sports.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSport(s)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors",
                    sport === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/30",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Duration</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHours(h)}
                  className={cn(
                    "rounded-lg py-2.5 text-sm font-semibold border transition-colors",
                    hours === h
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/30",
                  )}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {date && (
            <div className="space-y-3 pt-1 border-t border-border/60">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Available start times
              </p>

              {closed ? (
                <p className="text-sm text-destructive rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-3">
                  This venue is closed on the selected date.
                </p>
              ) : loadingSlots ? (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Loading slots…
                </p>
              ) : groupedSlots ? (
                <div className="space-y-4">
                  {groupedSlots.morning.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                        <Sun className="h-3.5 w-3.5 text-amber-500" />
                        Morning
                      </p>
                      <SlotGrid
                        slots={groupedSlots.morning}
                        selectedSlot={selectedSlot}
                        onSelect={setSelectedSlot}
                      />
                    </div>
                  )}
                  {groupedSlots.evening.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                        <Moon className="h-3.5 w-3.5 text-indigo-500" />
                        Evening
                      </p>
                      <SlotGrid
                        slots={groupedSlots.evening}
                        selectedSlot={selectedSlot}
                        onSelect={setSelectedSlot}
                      />
                    </div>
                  )}
                  {groupedSlots.other.length > 0 && (
                    <SlotGrid
                      slots={groupedSlots.other}
                      selectedSlot={selectedSlot}
                      onSelect={setSelectedSlot}
                    />
                  )}
                </div>
              ) : (
                <SlotGrid
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelect={setSelectedSlot}
                />
              )}
            </div>
          )}

          {selectedSlot && (
            <div className="rounded-lg bg-accent/60 border border-primary/10 px-3 py-2.5 text-sm">
              <p className="font-medium text-foreground">
                {format(parseISO(selectedSlot.startAt), "EEE, d MMM")} ·{" "}
                {venueFormatTime(parseISO(selectedSlot.startAt))}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ends at{" "}
                {format(
                  new Date(
                    new Date(selectedSlot.startAt).getTime() + hours * 3600000,
                  ),
                  "h:mm a",
                )}{" "}
                · {hours} hour{hours > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3"
        >
          {error}
        </p>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/80 bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="font-display text-2xl font-bold text-foreground">
                ₹{amount || "—"}
              </p>
              {slotRate != null && selectedSlot && amount > 0 && (
                <p className="text-[11px] text-muted-foreground truncate">
                  from ₹{slotRate}/hr · {formatPricingSummary(turf.pricing)}
                </p>
              )}
            </div>
            <Button
              className="h-12 px-6 btn-primary-glow shrink-0"
              disabled={paying || !canPay}
              onClick={() => void handlePay()}
            >
              {paying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
