"use client";

import { useRef, useState, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Camera,
  Clock,
  Mail,
  MapPin,
  Phone,
  CheckCircle2,
  Save,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TurfImageUpload } from "@/components/turfs/turf-image-upload";
import { OwnerMapPicker } from "@/components/owner/owner-map-picker";
import { OwnerPeriodSlotsEditor } from "@/components/owner/owner-period-slots-editor";
import { OwnerPricingEditor } from "@/components/owner/owner-pricing-editor";
import {
  EMPTY_OWNER_VENUE_FORM,
  updateOwnerVenue,
  validateOwnerVenueForm,
  type OwnerVenueForm,
} from "@/lib/storage-owner";
import { cn } from "@/lib/utils";

type OwnerVenueFormProps = {
  turfId: string;
  initialData?: OwnerVenueForm;
  onSuccess?: () => void;
};

function VenueSection({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-card",
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-primary/8 bg-gradient-to-r from-primary/[0.06] to-accent/40 px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
          <Icon className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="font-display text-sm font-semibold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputClass =
  "bg-background border-border/80 focus-visible:ring-primary/30 h-10";

export function OwnerVenueForm({
  turfId,
  initialData,
  onSuccess,
}: OwnerVenueFormProps) {
  const storageFolderId = useRef(turfId).current;
  const [form, setForm] = useState<OwnerVenueForm>(
    initialData ?? { ...EMPTY_OWNER_VENUE_FORM },
  );
  const [busy, setBusy] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const update = (patch: Partial<OwnerVenueForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const lat = Number(form.lat) || 0;
  const lon = Number(form.lon) || 0;

  const scrollToError = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    const validationError = validateOwnerVenueForm(form);
    if (validationError) {
      setError(validationError);
      scrollToError();
      return;
    }
    setBusy(true);
    try {
      await updateOwnerVenue(turfId, form);
      setSaved(true);
      onSuccess?.();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save venue.");
      scrollToError();
    } finally {
      setBusy(false);
    }
  };

  const saving = busy || imageUploading;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pb-32">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-accent/50 to-card px-4 py-3.5 shadow-sm">
        <p className="text-sm text-foreground leading-relaxed">
          Keep your venue details accurate so customers see the right hours,
          pricing, and location on the booking page.
        </p>
      </div>

      <VenueSection
        icon={Store}
        title="Contact & identity"
        description="How customers reach you and recognize your venue."
      >
        <Field label="Venue name">
          <Input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="e.g. Karun Sports Complex"
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="owner@venue.com"
              className={cn(inputClass, "pl-9")}
            />
          </div>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => update({ phone: e.target.value })}
                placeholder="10-digit mobile"
                className={cn(inputClass, "pl-9")}
              />
            </div>
          </Field>
          <Field label="WhatsApp" hint="Leave blank to use phone number.">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => update({ whatsapp: e.target.value })}
                placeholder="WhatsApp number"
                className={cn(inputClass, "pl-9")}
              />
            </div>
          </Field>
        </div>
      </VenueSection>

      <VenueSection
        icon={Camera}
        title="Cover photo"
        description="Shown on your public booking page and in the app."
      >
        <TurfImageUpload
          value={form.turfImage}
          onChange={(turfImage) => update({ turfImage })}
          folderId={storageFolderId}
          onUploadingChange={setImageUploading}
        />
      </VenueSection>

      <VenueSection
        icon={MapPin}
        title="Address"
        description="Helps players find you and powers map search."
      >
        <Field label="Street address">
          <Textarea
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="Building, street, locality"
            rows={2}
            className="bg-background border-border/80 resize-none min-h-[72px]"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={form.area}
            onChange={(e) => update({ area: e.target.value })}
            placeholder="Area"
            className={inputClass}
          />
          <Input
            value={form.city}
            onChange={(e) => update({ city: e.target.value })}
            placeholder="City"
            className={inputClass}
          />
          <Input
            value={form.state}
            onChange={(e) => update({ state: e.target.value })}
            placeholder="State"
            className={inputClass}
          />
          <Input
            value={form.pincode}
            onChange={(e) => update({ pincode: e.target.value })}
            placeholder="Pincode"
            className={inputClass}
          />
        </div>
        <Input
          value={form.landmark}
          onChange={(e) => update({ landmark: e.target.value })}
          placeholder="Landmark (optional)"
          className={inputClass}
        />
      </VenueSection>

      <VenueSection
        icon={MapPin}
        title="Map pin"
        description="Tap the map or drag the pin to set your exact location."
      >
        <div className="overflow-hidden rounded-xl border border-border/80 ring-1 ring-primary/5">
          <OwnerMapPicker
            lat={lat}
            lon={lon}
            onChange={(la, ln) =>
              update({ lat: String(la), lon: String(ln) })
            }
          />
        </div>
        <div className="flex gap-2">
          <span className="flex-1 rounded-lg bg-muted/60 px-3 py-2 text-xs font-mono text-muted-foreground">
            Lat {lat.toFixed(5)}
          </span>
          <span className="flex-1 rounded-lg bg-muted/60 px-3 py-2 text-xs font-mono text-muted-foreground">
            Lon {lon.toFixed(5)}
          </span>
        </div>
      </VenueSection>

      <VenueSection
        icon={Clock}
        title="Hours & pricing"
        description="Controls available slots and booking rates."
      >
        <OwnerPeriodSlotsEditor form={form} onChange={update} />

        {!form.usePeriodSlots && (
          <>
            <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-accent/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Open 24 hours
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Disable to set custom open and close times
                </p>
              </div>
              <Switch
                checked={form.open_24_hours}
                onCheckedChange={(open_24_hours) => update({ open_24_hours })}
              />
            </div>
            {!form.open_24_hours && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Opens">
                  <Input
                    type="time"
                    value={form.open_time}
                    onChange={(e) => update({ open_time: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Closes"
                  hint="Use 23:59 for midnight closing (not 00:00)."
                >
                  <Input
                    type="time"
                    value={form.close_time}
                    onChange={(e) => update({ close_time: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </>
        )}

        <OwnerPricingEditor
          form={form}
          onChange={update}
          hideBaseRates={form.usePeriodSlots}
        />
      </VenueSection>

      {error && (
        <p
          role="alert"
          className="text-sm text-destructive rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3"
        >
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-dashed border-primary/20 bg-accent/20 p-4">
        <Button
          type="submit"
          disabled={saving}
          variant="outline"
          className="w-full h-11 border-primary/25 text-primary hover:bg-accent"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving…" : "Save venue details"}
        </Button>
      </div>
    </form>
  );
}
