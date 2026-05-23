"use client";

import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type BookingQueueScreenProps = {
  venueName: string;
  onClose?: () => void;
};

export function BookingQueueScreen({
  venueName,
  onClose,
}: BookingQueueScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Clock className="h-8 w-8" />
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
            Your booking is under queue
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Once confirmed, you&apos;ll receive a confirmation over WhatsApp.
          </p>
          <p className="text-sm font-medium text-foreground">
            Thank you for choosing {venueName}.
          </p>
        </div>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Back to home
          </Button>
        )}
      </div>
    </div>
  );
}
