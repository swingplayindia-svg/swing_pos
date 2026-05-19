"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AmenityToggle,
  FormField,
  FormSection,
  SportsChipSelect,
} from "@/components/form-sections";
import {
  buildTurfFromForm,
  EMPTY_TURF_FORM,
  validateTurfForm,
  type TurfForm,
} from "@/lib/turf-defaults";
import { slugify, SPORTS_OPTIONS } from "@/lib/turf-schema";
import { addTurf, updateTurf } from "@/lib/storage";
import { TurfImageUpload } from "@/components/turfs/turf-image-upload";
import { ChevronDown, ChevronUp, Save, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type TurfFormProps = {
  mode: "add" | "edit";
  turfId?: string;
  initialData?: TurfForm;
  onSuccess: () => void;
};

export function TurfForm({ mode, turfId, initialData, onSuccess }: TurfFormProps) {
  const storageFolderId = useRef(turfId ?? crypto.randomUUID()).current;
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [quickMode, setQuickMode] = useState(mode === "add");
  const [formData, setFormData] = useState<TurfForm>(
    initialData ?? { ...EMPTY_TURF_FORM },
  );

  const busy = isLoading || imageUploading;

  const update = (patch: Partial<TurfForm>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const updateAmenity = (
    key: keyof TurfForm["amenities"],
    checked: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [key]: checked },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateTurfForm(formData, {
      quick: quickMode && mode === "add",
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const payload = buildTurfFromForm(formData);
      if (mode === "edit" && turfId) {
        await updateTurf(turfId, payload);
      } else {
        await addTurf(payload);
      }
      onSuccess();
    } catch {
      setError(mode === "edit" ? "Failed to update venue." : "Failed to save venue.");
    } finally {
      setIsLoading(false);
    }
  };

  const showFull = mode === "edit" || !quickMode;

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      {mode === "add" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/[0.06] to-accent/50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Quick add</p>
              <p className="text-xs text-muted-foreground">
                Essentials only — expand for full venue details
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border bg-white"
            onClick={() => setQuickMode((q) => !q)}
          >
            {quickMode ? (
              <>
                All fields <ChevronDown className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                Quick mode <ChevronUp className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className={cn("surface-card p-5 space-y-4", !showFull && "shadow-premium")}>
        <h3 className="font-display text-base font-semibold text-foreground">
          {mode === "edit" ? "Edit venue" : "Core details"}
        </h3>

        <FormField label="Venue name" required>
          <Input
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              update({
                name,
                slug: formData.slug || slugify(name),
              });
            }}
            placeholder="CoPlay TurfPark – Mahalaxmi"
            className="bg-background"
          />
        </FormField>

        <FormField label="Venue photo">
          <TurfImageUpload
            value={formData.turfImage}
            onChange={(turfImage) => update({ turfImage })}
            folderId={storageFolderId}
            onUploadingChange={setImageUploading}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Area" required>
            <Input
              value={formData.area}
              onChange={(e) => update({ area: e.target.value })}
              placeholder="Mahalakshmi"
            />
          </FormField>
          <FormField label="City" required>
            <Input
              value={formData.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder="Mumbai"
            />
          </FormField>
          <FormField label="Phone" required>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder="+91…"
            />
          </FormField>
        </div>

        <FormField label="Sports" required>
          <SportsChipSelect
            value={formData.sports}
            onChange={(sports) => update({ sports })}
            options={[...SPORTS_OPTIONS]}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Weekday ₹/hr" required>
            <Input
              type="number"
              min={1}
              value={formData.weekday}
              onChange={(e) => update({ weekday: e.target.value })}
            />
          </FormField>
          <FormField label="Weekend ₹/hr">
            <Input
              type="number"
              min={1}
              value={formData.weekend}
              onChange={(e) => update({ weekend: e.target.value })}
              placeholder="Same as weekday"
            />
          </FormField>
        </div>

        {quickMode && mode === "add" && (
          <Button
            type="submit"
            disabled={busy}
            className="w-full btn-primary-glow"
          >
            <Save className="w-4 h-4 mr-2" />
            {busy ? "Please wait…" : "Save venue"}
          </Button>
        )}
      </div>

      {showFull && (
        <>
          <FormSection title="Listing" description="Slug and external booking link">
            <FormField label="Slug">
              <Input
                value={formData.slug}
                onChange={(e) => update({ slug: e.target.value })}
              />
            </FormField>
            <FormField label="Booking URL">
              <Input
                value={formData.turf_url}
                onChange={(e) => update({ turf_url: e.target.value })}
                placeholder="https://…"
              />
            </FormField>
          </FormSection>

          <FormSection title="Location">
            <FormField label="Address">
              <Input
                value={formData.address}
                onChange={(e) => update({ address: e.target.value })}
              />
            </FormField>
            <FormField label="Landmark">
              <Input
                value={formData.landmark}
                onChange={(e) => update({ landmark: e.target.value })}
              />
            </FormField>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <FormField label="State">
                <Input
                  value={formData.state}
                  onChange={(e) => update({ state: e.target.value })}
                />
              </FormField>
              <FormField label="Pincode">
                <Input
                  value={formData.pincode}
                  onChange={(e) => update({ pincode: e.target.value })}
                />
              </FormField>
              <FormField label="Lat">
                <Input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => update({ lat: e.target.value })}
                />
              </FormField>
              <FormField label="Lon">
                <Input
                  type="number"
                  step="any"
                  value={formData.lon}
                  onChange={(e) => update({ lon: e.target.value })}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Hours & contact">
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Checkbox
                checked={formData.open_24_hours}
                onCheckedChange={(v) => update({ open_24_hours: Boolean(v) })}
              />
              <label className="text-sm font-medium">Open 24 hours</label>
            </div>
            {!formData.open_24_hours && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Open">
                  <Input
                    type="time"
                    value={formData.open_time}
                    onChange={(e) => update({ open_time: e.target.value })}
                  />
                </FormField>
                <FormField label="Close">
                  <Input
                    type="time"
                    value={formData.close_time}
                    onChange={(e) => update({ close_time: e.target.value })}
                  />
                </FormField>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="WhatsApp">
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => update({ whatsapp: e.target.value })}
                />
              </FormField>
              <FormField label="Email">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => update({ email: e.target.value })}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Turf details">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <FormField label="Rating">
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={formData.rating}
                  onChange={(e) => update({ rating: e.target.value })}
                />
              </FormField>
              <FormField label="Reviews">
                <Input
                  type="number"
                  min={0}
                  value={formData.total_reviews}
                  onChange={(e) => update({ total_reviews: e.target.value })}
                />
              </FormField>
              <FormField label="# Turfs">
                <Input
                  type="number"
                  min={1}
                  value={formData.num_turfs}
                  onChange={(e) => update({ num_turfs: e.target.value })}
                />
              </FormField>
              <FormField label="Surface">
                <Input
                  value={formData.turf_surface}
                  onChange={(e) => update({ turf_surface: e.target.value })}
                />
              </FormField>
            </div>
            <FormField label="Turf location">
              <Input
                value={formData.turf_location}
                onChange={(e) => update({ turf_location: e.target.value })}
              />
            </FormField>
          </FormSection>

          <FormSection title="Amenities">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(
                [
                  ["floodlights", "Floodlights"],
                  ["washrooms", "Washrooms"],
                  ["drinking_water", "Drinking water"],
                  ["parking", "Parking"],
                  ["changing_rooms", "Changing rooms"],
                  ["seating", "Seating"],
                ] as const
              ).map(([key, label]) => (
                <AmenityToggle
                  key={key}
                  label={label}
                  checked={formData.amenities[key]}
                  onChange={(c) => updateAmenity(key, c)}
                />
              ))}
            </div>
          </FormSection>

          <Button type="submit" disabled={busy} className="btn-primary-glow">
            <Save className="w-4 h-4 mr-2" />
            {busy
              ? "Please wait…"
              : mode === "edit"
                ? "Update venue"
                : "Save venue"}
          </Button>
        </>
      )}
    </form>
  );
}
