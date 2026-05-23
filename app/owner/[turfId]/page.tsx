"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOwnerTurfData } from "@/hooks/use-owner-turf-data";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Link2,
  MapPin,
  Phone,
} from "lucide-react";
import { format, isPast, parseISO, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

export default function OwnerTurfDashboardPage() {
  const {
    turfId,
    turf,
    turfLoading,
    bookings,
    ensureBookings,
    getClosuresForMonth,
  } = useOwnerTurfData();

  const [bookUrl, setBookUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [closedDays, setClosedDays] = useState(0);

  useEffect(() => {
    setBookUrl(`${window.location.origin}/book/${turfId}`);
  }, [turfId]);

  useEffect(() => {
    void ensureBookings();
    const now = startOfMonth(new Date());
    void getClosuresForMonth(now.getFullYear(), now.getMonth() + 1).then(
      (closures) => setClosedDays(closures.length),
    );
  }, [ensureBookings, getClosuresForMonth]);

  const copyLink = async () => {
    if (!bookUrl) return;
    await navigator.clipboard.writeText(bookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bookingCount = bookings.filter(
    (b) =>
      b.status !== "cancelled" &&
      b.status !== "completed" &&
      !isPast(parseISO(b.endAt)),
  ).length;

  if (turfLoading && !turf) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Loading venue…
      </p>
    );
  }

  if (!turf) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Venue not found.
      </p>
    );
  }

  const base = `/owner/${turfId}`;

  return (
    <div className="space-y-4 pb-4">
      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-card">
        <div className="relative h-40">
          {turf.turfImage && turf.turfImage !== "/turf-default.jpg" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={turf.turfImage}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-primary/15 to-accent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="font-display text-lg font-semibold text-white leading-tight">
              {turf.name}
            </h2>
            <p className="text-sm text-white/85 mt-0.5">
              {turf.area}, {turf.city}
            </p>
          </div>
        </div>
        <div className="px-4 py-3 space-y-2 border-t border-border/60">
          <p className="flex items-center gap-2 text-sm text-foreground">
            <Phone className="h-4 w-4 text-primary shrink-0" />
            {turf.contact.phone}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {turf.address}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`${base}/bookings`}
          className="group rounded-xl border border-primary/10 bg-card p-4 shadow-sm hover:border-primary/25 hover:bg-accent/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-2xl font-semibold tabular-nums text-primary">
            {bookingCount}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Upcoming bookings</p>
        </Link>
        <Link
          href={`${base}/calendar`}
          className="group rounded-xl border border-primary/10 bg-card p-4 shadow-sm hover:border-primary/25 hover:bg-accent/30 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-2xl font-semibold tabular-nums text-primary">
            {closedDays}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Closed ({format(new Date(), "MMM")})
          </p>
        </Link>
      </div>

      <div className="rounded-xl border border-primary/15 bg-accent/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium text-foreground">
            Customer booking link
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Share this link so players can book and pay online.
        </p>
        <p className="text-xs break-all font-mono text-foreground bg-background/80 rounded-lg border border-border/80 px-3 py-2">
          {bookUrl || `/book/${turfId}`}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1 border-primary/20"
            onClick={() => void copyLink()}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-1 text-primary" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy link
              </>
            )}
          </Button>
          {bookUrl && (
            <Button size="sm" className="flex-1 btn-primary-glow" asChild>
              <a href={bookUrl} target="_blank" rel="noopener noreferrer">
                Open
              </a>
            </Button>
          )}
        </div>
      </div>

      <Link
        href={`${base}/venue`}
        className={cn(
          "flex items-center gap-3 rounded-xl border border-primary/15 bg-card p-4 shadow-sm",
          "hover:border-primary/30 hover:bg-accent/20 transition-colors group",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">Edit venue</p>
          <p className="text-xs text-muted-foreground">
            Hours, pricing, photo & location
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0" />
      </Link>
    </div>
  );
}
