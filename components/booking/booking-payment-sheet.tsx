"use client";

import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type BookingPaymentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amountInr: number;
  venueName: string;
};

export function BookingPaymentSheet({
  open,
  onOpenChange,
  amountInr,
  venueName,
}: BookingPaymentSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8 pt-6">
        <SheetHeader className="text-left space-y-1">
          <SheetTitle className="font-display text-xl">Pay via UPI</SheetTitle>
          <SheetDescription>
            Scan with Google Pay, PhonePe, or any UPI app to pay{" "}
            <span className="font-semibold text-foreground">₹{amountInr}</span>{" "}
            for {venueName}.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <Image
              src="/payment-qr.png"
              alt="UPI payment QR code"
              width={280}
              height={280}
              className="h-auto w-[min(280px,75vw)]"
              priority
            />
          </div>
          <p className="text-center text-xs text-muted-foreground max-w-sm leading-relaxed">
            After payment, your slot hold stays for 15 minutes. The venue will
            confirm once they see the payment.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full max-w-sm"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
