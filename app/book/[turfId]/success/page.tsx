"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

type BookingSummary = {
  customerName: string;
  sport: string;
  startAt: string;
  endAt: string;
  amountInr: number;
  paymentStatus: string;
};

function BookingSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const turfId = params.turfId as string;
  const bookingId = searchParams.get("bookingId");
  const [booking, setBooking] = useState<BookingSummary | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    void (async () => {
      const res = await fetch(`/api/bookings/${bookingId}/status`);
      if (res.ok) {
        setBooking(await res.json());
      }
    })();
  }, [bookingId]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
      <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Booking confirmed
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Payment received. Your slot is reserved.
        </p>
      </div>
      {booking && (
        <div className="rounded-xl border border-border bg-card p-4 text-left text-sm space-y-2">
          <p>
            <span className="text-muted-foreground">When:</span>{" "}
            {format(parseISO(booking.startAt), "EEE, d MMM · h:mm a")} –{" "}
            {format(parseISO(booking.endAt), "h:mm a")}
          </p>
          <p>
            <span className="text-muted-foreground">Sport:</span> {booking.sport}
          </p>
          <p>
            <span className="text-muted-foreground">Paid:</span> ₹{booking.amountInr}
          </p>
        </div>
      )}
      <Link href={`/book/${turfId}`}>
        <Button variant="outline">Book another slot</Button>
      </Link>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<p className="text-center py-16">Loading…</p>}>
      <BookingSuccessContent />
    </Suspense>
  );
}
