"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useOwnerTurfData } from "@/hooks/use-owner-turf-data";
import {
  createTurfBooking,
  deleteTurfBooking,
  updateTurfBookingStatus,
  type TurfBooking,
  type TurfBookingStatus,
} from "@/lib/storage-owner";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<TurfBookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-accent text-primary",
  cancelled: "bg-muted text-muted-foreground",
  completed: "bg-primary/15 text-primary",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export function OwnerBookingsPanel({ turfId }: { turfId: string }) {
  const {
    bookings,
    bookingsLoading,
    ensureBookings,
    refreshBookings,
  } = useOwnerTurfData();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<TurfBooking | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("19:00");
  const [saving, setSaving] = useState(false);

  const syncSelected = (list: TurfBooking[]) => {
    if (!selected) return;
    const updated = list.find((b) => b.id === selected.id);
    setSelected(updated ?? null);
    if (!updated) setSheetOpen(false);
  };

  const refresh = async () => {
    setLoadError(null);
    try {
      const data = await refreshBookings();
      syncSelected(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Could not load bookings.",
      );
    }
  };

  useEffect(() => {
    void ensureBookings().catch(() => {
      setLoadError("Could not load bookings.");
    });
  }, [ensureBookings]);

  useEffect(() => {
    syncSelected(bookings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  const openBooking = (b: TurfBooking) => {
    setSelected(b);
    setSheetOpen(true);
  };

  const runStatus = async (status: TurfBookingStatus) => {
    if (!selected) return;
    setActionBusy(true);
    try {
      await updateTurfBookingStatus(turfId, selected.id, status);
      await refresh();
    } finally {
      setActionBusy(false);
    }
  };

  const runDelete = async () => {
    if (!selected || !confirm("Delete this booking?")) return;
    setActionBusy(true);
    try {
      await deleteTurfBooking(turfId, selected.id);
      setSheetOpen(false);
      setSelected(null);
      await refresh();
    } finally {
      setActionBusy(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim() || !date) return;
    setSaving(true);
    try {
      const startAt = new Date(`${date}T${startTime}:00`).toISOString();
      const endAt = new Date(`${date}T${endTime}:00`).toISOString();
      const hours = Math.max(
        1,
        Math.round(
          (new Date(endAt).getTime() - new Date(startAt).getTime()) / 3600000,
        ),
      );
      await createTurfBooking({
        turfId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        startAt,
        endAt,
        sport: "—",
        hours,
        amountInr: 0,
        status: "confirmed",
        paymentStatus: "paid",
        notes: "",
        source: "owner",
      });
      setName("");
      setPhone("");
      setDate("");
      setShowAdd(false);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  if (bookingsLoading && bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Loading bookings…
      </p>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <p className="text-sm text-muted-foreground">
        Tap a booking for details. Online and walk-in bookings appear here.
      </p>

      {loadError && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
          {loadError}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {bookings.length} booking{bookings.length === 1 ? "" : "s"}
        </p>
        <Button
          size="sm"
          className="btn-primary-glow"
          onClick={() => setShowAdd((v) => !v)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-primary/20 bg-card p-4 space-y-3">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <Button
            className="w-full btn-primary-glow"
            disabled={saving}
            onClick={() => void handleAdd()}
          >
            {saving ? "Saving…" : "Save booking"}
          </Button>
        </div>
      )}

      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10 rounded-xl border border-dashed border-border">
          No bookings yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => openBooking(b)}
                className="w-full text-left rounded-xl border border-border bg-card p-4 space-y-2 hover:border-primary/30 hover:bg-accent/30 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{b.customerName}</p>
                    <p className="text-sm text-muted-foreground">{b.customerPhone}</p>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shrink-0",
                      STATUS_STYLES[b.status],
                    )}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {format(parseISO(b.startAt), "EEE, d MMM · h:mm a")} –{" "}
                  {format(parseISO(b.endAt), "h:mm a")}
                </p>
                {b.source === "customer" && (
                  <p className="text-xs text-muted-foreground">
                    {b.paymentStatus === "paid"
                      ? "Paid online"
                      : b.paymentStatus === "unpaid"
                        ? "Payment pending"
                        : "Payment failed"}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelected(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 z-[60]"
        >
          {selected && (
            <>
              <SheetHeader className="text-left px-0 pb-2">
                <SheetTitle className="font-display text-lg">
                  {selected.customerName}
                </SheetTitle>
                <span
                  className={cn(
                    "inline-flex w-fit text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full mt-1",
                    STATUS_STYLES[selected.status],
                  )}
                >
                  {selected.status}
                </span>
              </SheetHeader>

              <div className="rounded-xl border border-border bg-muted/30 px-3 py-1 my-3">
                <DetailRow label="Phone" value={selected.customerPhone} />
                <DetailRow
                  label="Date"
                  value={format(parseISO(selected.startAt), "EEEE, d MMMM yyyy")}
                />
                <DetailRow
                  label="Time"
                  value={`${format(parseISO(selected.startAt), "h:mm a")} – ${format(parseISO(selected.endAt), "h:mm a")}`}
                />
                <DetailRow label="Duration" value={`${selected.hours} hour(s)`} />
                {selected.sport && selected.sport !== "—" && (
                  <DetailRow label="Sport" value={selected.sport} />
                )}
                <DetailRow
                  label="Amount"
                  value={selected.amountInr > 0 ? `₹${selected.amountInr}` : "—"}
                />
                <DetailRow
                  label="Source"
                  value={
                    selected.source === "customer"
                      ? "Online booking"
                      : "Walk-in / phone"
                  }
                />
                {selected.source === "customer" && (
                  <DetailRow
                    label="Payment"
                    value={
                      selected.paymentStatus === "paid"
                        ? "Paid"
                        : selected.paymentStatus === "unpaid"
                          ? "Pending"
                          : "Failed"
                    }
                  />
                )}
                {selected.notes?.trim() && (
                  <DetailRow label="Notes" value={selected.notes} />
                )}
              </div>

              {selected.status !== "cancelled" && (
                <SheetFooter className="flex-col gap-2 px-0 sm:flex-col">
                  {selected.status !== "confirmed" && (
                    <Button
                      type="button"
                      disabled={actionBusy}
                      className="w-full btn-primary-glow"
                      onClick={() => void runStatus("confirmed")}
                    >
                      Mark confirmed
                    </Button>
                  )}
                  {selected.status !== "completed" && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionBusy}
                      className="w-full"
                      onClick={() => void runStatus("completed")}
                    >
                      Mark completed
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={actionBusy}
                    className="w-full text-destructive border-destructive/30"
                    onClick={() => void runStatus("cancelled")}
                  >
                    Cancel booking
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={actionBusy}
                    className="w-full text-destructive"
                    onClick={() => void runDelete()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
