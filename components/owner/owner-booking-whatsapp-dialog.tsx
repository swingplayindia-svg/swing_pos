"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageCircle } from "lucide-react";

type OwnerBookingWhatsAppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  messagePreview: string;
  customerPhone: string;
  busy?: boolean;
  confirmLabel?: string;
  onSendWhatsApp: () => void | Promise<void>;
};

export function OwnerBookingWhatsAppDialog({
  open,
  onOpenChange,
  title,
  description,
  messagePreview,
  customerPhone,
  busy = false,
  confirmLabel = "Open WhatsApp & send",
  onSendWhatsApp,
}: OwnerBookingWhatsAppDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-xl border border-border bg-muted/40 p-3 max-h-48 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-2">
            To: {customerPhone}
          </p>
          <pre className="text-xs whitespace-pre-wrap font-sans text-foreground leading-relaxed">
            {messagePreview}
          </pre>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Opens WhatsApp with this message pre-filled. Tap send in WhatsApp — no
          API required.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className="btn-primary-glow"
            onClick={(e) => {
              e.preventDefault();
              void onSendWhatsApp();
            }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {busy ? "Please wait…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
