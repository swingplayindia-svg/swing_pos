"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormSection } from "@/components/form-sections";
import { CarouselSlideImageUpload } from "@/components/community/carousel-slide-image-upload";
import { HexColorPicker } from "@/components/community/hex-color-picker";
import {
  EMPTY_CAROUSEL_SLIDE_FORM,
  addCommunityCarouselSlide,
  saveCommunityCarouselSlide,
  validateCarouselSlideForm,
  type CommunityCarouselSlideForm,
} from "@/lib/storage-community-carousels";
import { ExternalLink, Link2, Save } from "lucide-react";

type CarouselSlideFormProps = {
  mode: "add" | "edit";
  slideId?: string;
  initialData?: CommunityCarouselSlideForm;
  onSuccess: () => void;
};

export function CarouselSlideForm({
  mode,
  slideId,
  initialData,
  onSuccess,
}: CarouselSlideFormProps) {
  const storageFolderId = useRef(slideId ?? crypto.randomUUID()).current;
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const [customSlideId, setCustomSlideId] = useState("");
  const [formData, setFormData] = useState<CommunityCarouselSlideForm>(
    initialData ?? { ...EMPTY_CAROUSEL_SLIDE_FORM },
  );

  const busy = isLoading || imageUploading;

  const update = (patch: Partial<CommunityCarouselSlideForm>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateCarouselSlideForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "edit" && slideId) {
        await saveCommunityCarouselSlide(slideId, formData);
      } else {
        await addCommunityCarouselSlide(formData, {
          slideId: customSlideId.trim() || undefined,
        });
      }
      onSuccess();
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      const msg = err instanceof Error ? err.message : "";
      if (code === "PERMISSION_DENIED" || msg.includes("permission_denied")) {
        setError(
          "Permission denied writing to Carousels/community. Publish RTDB rules from swing_ios_app/database.rules.json, then add your UID under cmsAdmins in Firebase Console (see Settings).",
        );
      } else {
        setError(
          msg ||
            (mode === "edit" ? "Failed to update slide." : "Failed to save slide."),
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      <FormSection
        title="Banner image"
        description="HTTPS URL for remote images, or a, b, c for iOS bundled fallbacks."
      >
        <CarouselSlideImageUpload
          value={formData.imageUrl}
          onChange={(imageUrl) => update({ imageUrl })}
          slideId={storageFolderId}
          onUploadingChange={setImageUploading}
        />
      </FormSection>

      <FormSection
        title="Tap link (optional)"
        description="When set, tapping this banner in the iOS app opens https links in an in-app WebView sheet. Deep links (swing://) open externally."
      >
        <FormField label="Destination URL">
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              value={formData.linkUrl}
              onChange={(e) => update({ linkUrl: e.target.value })}
              placeholder="https://example.com/promo or swing://community"
              className="bg-white pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Leave empty for display-only banners.{" "}
            <code className="bg-muted px-1 rounded">https://</code> is added automatically if you omit the scheme.
          </p>
          {formData.linkUrl.trim() && (
            <a
              href={formData.linkUrl.trim().match(/^[a-z][a-z0-9+.-]*:\/\//i) ? formData.linkUrl.trim() : `https://${formData.linkUrl.trim()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              <ExternalLink className="h-3 w-3" />
              Preview link
            </a>
          )}
        </FormField>
      </FormSection>

      <FormSection title="Top bar color">
        <HexColorPicker
          value={formData.top_color}
          onChange={(top_color) => update({ top_color })}
          description="Pick any color for the Swing Leagues bar while this slide is visible in the iOS app."
        />
      </FormSection>

      <FormSection title="Ordering">
        <FormField label="Sort order" required>
          <p className="text-xs text-muted-foreground -mt-1 mb-2">
            Lower numbers appear first. iOS sorts slides by this field.
          </p>
          <Input
            type="number"
            min={0}
            value={formData.order}
            onChange={(e) => update({ order: e.target.value })}
            className="bg-white max-w-[140px]"
          />
        </FormField>

        {mode === "add" && (
          <FormField label="Slide ID (optional)">
            <p className="text-xs text-muted-foreground -mt-1 mb-2">
              Leave blank to auto-generate. Use short ids like slide-1 for readable keys.
            </p>
            <Input
              value={customSlideId}
              onChange={(e) => setCustomSlideId(e.target.value)}
              placeholder="Auto-generated"
              className="bg-white max-w-sm font-mono text-sm"
            />
          </FormField>
        )}
      </FormSection>

      {error && (
        <p className="text-sm text-destructive rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy} className="btn-primary-glow">
        <Save className="h-4 w-4 mr-2" />
        {busy ? "Saving…" : mode === "edit" ? "Save changes" : "Add slide"}
      </Button>
    </form>
  );
}
