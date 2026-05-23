"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

function BookingFailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const bookingId = searchParams.get("bookingId");

  const message =
    reason === "slot_taken"
      ? "Someone else booked this slot before payment completed. Please pick another time."
      : reason === "payment"
        ? "Payment was not completed. No charge was confirmed."
        : "Booking could not be completed.";

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
      <XCircle className="h-16 w-16 text-destructive mx-auto" />
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Booking failed
        </h1>
        <p className="text-sm text-muted-foreground mt-2">{message}</p>
      </div>
      {bookingId ? (
        <p className="text-xs text-muted-foreground">Reference: {bookingId}</p>
      ) : null}
      <Link href="/">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}

export default function BookingFailedPage() {
  return (
    <Suspense fallback={<p className="text-center py-16">Loading…</p>}>
      <BookingFailedContent />
    </Suspense>
  );
}
