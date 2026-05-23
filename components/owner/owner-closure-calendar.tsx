"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useOwnerTurfData } from "@/hooks/use-owner-turf-data";
import {
  dateKeyFromDate,
  removeTurfClosure,
  setTurfClosure,
  type TurfClosure,
} from "@/lib/storage-owner";
import {
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function OwnerClosureCalendar({ turfId }: { turfId: string }) {
  const { getClosuresForMonth, invalidateClosures } = useOwnerTurfData();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [closures, setClosures] = useState<TurfClosure[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [sheetReason, setSheetReason] = useState("Closed");
  const [loadError, setLoadError] = useState<string | null>(null);

  const closedSet = useMemo(
    () => new Set(closures.map((c) => c.date)),
    [closures],
  );

  const selectedKey = selectedDay ? dateKeyFromDate(selectedDay) : null;
  const selectedClosed = selectedKey ? closedSet.has(selectedKey) : false;
  const selectedClosure = selectedKey
    ? closures.find((c) => c.date === selectedKey)
    : undefined;

  const refresh = async (force = false) => {
    setLoadError(null);
    const year = month.getFullYear();
    const monthNum = month.getMonth() + 1;
    try {
      const data = await getClosuresForMonth(year, monthNum, force);
      setClosures(data);
    } catch (err) {
      setClosures([]);
      setLoadError(
        err instanceof Error ? err.message : "Could not load calendar.",
      );
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await refresh(false);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, turfId]);

  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });

  const leadingBlanks = startOfMonth(month).getDay();

  const openDaySheet = (day: Date) => {
    const key = dateKeyFromDate(day);
    const closure = closures.find((c) => c.date === key);
    setSelectedDay(day);
    setSheetReason(closure?.reason?.trim() || "Closed");
    setSheetOpen(true);
  };

  const markUnavailable = async () => {
    if (!selectedDay || !selectedKey) return;
    setBusy(true);
    try {
      await setTurfClosure({
        turfId,
        date: selectedKey,
        reason: sheetReason.trim() || "Closed",
        allDay: true,
      });
      invalidateClosures();
      await refresh(true);
      setSheetOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const markAvailable = async () => {
    if (!selectedKey) return;
    setBusy(true);
    try {
      await removeTurfClosure(turfId, selectedKey);
      invalidateClosures();
      await refresh(true);
      setSheetOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-accent/50 to-card px-4 py-3.5 shadow-sm">
        <p className="text-sm text-foreground leading-relaxed">
          Tap any date to open options. Green days accept bookings; unavailable
          days block new customer bookings.
        </p>
      </div>

      {loadError && (
        <p className="text-sm text-destructive rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
          {loadError}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-card">
        <div className="flex items-center gap-3 border-b border-primary/8 bg-gradient-to-r from-primary/[0.06] to-accent/40 px-4 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            <CalendarDays className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground">
              Availability calendar
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(month, "MMMM yyyy")}
            </p>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-accent text-primary"
              onClick={() => setMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <p className="font-display font-semibold text-foreground">
              {format(month, "MMMM yyyy")}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-accent text-primary"
              onClick={() => setMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              Loading calendar…
            </p>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {days.map((day) => {
                const key = dateKeyFromDate(day);
                const closed = closedSet.has(key);
                const isToday = isSameDay(day, new Date());
                const inMonth = isSameMonth(day, month);
                const isSelected =
                  selectedDay && isSameDay(day, selectedDay) && sheetOpen;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!inMonth || busy}
                    onClick={() => openDaySheet(day)}
                    className={cn(
                      "aspect-square rounded-xl text-sm font-semibold transition-all active:scale-95",
                      closed
                        ? "bg-destructive/12 text-destructive border border-destructive/25 line-through decoration-destructive/50"
                        : "bg-accent text-primary border border-primary/25 shadow-sm hover:bg-primary/15 hover:border-primary/40",
                      isToday &&
                        "ring-2 ring-primary ring-offset-2 ring-offset-card",
                      isSelected && "ring-2 ring-primary scale-105 z-10",
                      !inMonth && "opacity-30 pointer-events-none",
                    )}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-md bg-accent border border-primary/25" />
              Available
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded-md bg-destructive/12 border border-destructive/25" />
              Unavailable
            </span>
          </div>
        </div>
      </section>

      {closures.length > 0 && (
        <section className="rounded-2xl border border-primary/10 bg-card p-4 shadow-card space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarX2 className="h-4 w-4 text-destructive" />
            Unavailable this month
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            {closures.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2"
              >
                <span className="font-medium text-foreground">
                  {format(new Date(`${c.date}T12:00:00`), "EEE, d MMM")}
                </span>
                {c.reason ? (
                  <span className="text-xs truncate">{c.reason}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-t border-primary/15 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 max-h-[85dvh] z-[60]"
        >
          {selectedDay && (
            <>
              <SheetHeader className="text-left px-0 pb-2">
                <SheetTitle className="font-display text-lg">
                  {format(selectedDay, "EEEE, d MMMM")}
                </SheetTitle>
                <SheetDescription asChild>
                  <div className="pt-1">
                    {selectedClosed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-1 text-xs font-semibold">
                        <CalendarX2 className="h-3.5 w-3.5" />
                        Unavailable — no bookings
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-primary border border-primary/20 px-2.5 py-1 text-xs font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Available for bookings
                      </span>
                    )}
                  </div>
                </SheetDescription>
              </SheetHeader>

              {selectedClosed ? (
                <div className="space-y-4 py-2">
                  {selectedClosure?.reason && (
                    <p className="text-sm text-muted-foreground rounded-xl bg-muted/50 px-3 py-2.5">
                      <span className="font-medium text-foreground">Note: </span>
                      {selectedClosure.reason}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Open this day again so customers can book slots online.
                  </p>
                  <SheetFooter className="flex-col gap-2 px-0 sm:flex-col">
                    <Button
                      type="button"
                      disabled={busy}
                      className="w-full h-11 btn-primary-glow rounded-xl"
                      onClick={() => void markAvailable()}
                    >
                      {busy ? "Updating…" : "Mark as available"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setSheetOpen(false)}
                    >
                      Cancel
                    </Button>
                  </SheetFooter>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Reason (optional)
                    </label>
                    <Input
                      value={sheetReason}
                      onChange={(e) => setSheetReason(e.target.value)}
                      placeholder="e.g. Maintenance, private event"
                      className="bg-background h-10 border-border/80"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customers will not be able to book this date while it is
                    marked unavailable.
                  </p>
                  <SheetFooter className="flex-col gap-2 px-0 sm:flex-col">
                    <Button
                      type="button"
                      disabled={busy}
                      variant="destructive"
                      className="w-full h-11 rounded-xl"
                      onClick={() => void markUnavailable()}
                    >
                      {busy ? "Saving…" : "Mark as unavailable"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setSheetOpen(false)}
                    >
                      Cancel
                    </Button>
                  </SheetFooter>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
