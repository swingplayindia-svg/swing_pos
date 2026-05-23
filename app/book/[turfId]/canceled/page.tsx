"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";

const REDIRECT_SECONDS = 5;

function BookingCanceledContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const turfId = params.turfId as string;
  const bookingId = searchParams.get("bookingId");
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  const bookUrl = `/book/${turfId}`;

  useEffect(() => {
    if (!bookingId) return;
    void fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
  }, [bookingId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          router.replace(bookUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [router, bookUrl]);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
      <Ban className="h-16 w-16 text-muted-foreground mx-auto" />
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Booking canceled
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Payment was not completed. No charge was made and your slot hold has
          been released.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Returning to booking in{" "}
        <span className="font-semibold text-foreground tabular-nums">
          {secondsLeft}
        </span>{" "}
        second{secondsLeft === 1 ? "" : "s"}…
      </p>
      <Link href={bookUrl}>
        <Button className="btn-primary-glow">Book again now</Button>
      </Link>
    </div>
  );
}

export default function BookingCanceledPage() {
  return (
    <Suspense fallback={<p className="text-center py-16">Loading…</p>}>
      <BookingCanceledContent />
    </Suspense>
  );
}
