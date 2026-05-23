/** Canonical RTDB fields written for the iOS app (Carousels/community/{slideId}). */
export type CommunityCarouselSlidePayload = {
  imageUrl: string;
  top_color: string;
  order: number;
  /** Optional tap target (https://, http://, or app deep link e.g. swing://). */
  linkUrl?: string;
};

export type CommunityCarouselSlide = CommunityCarouselSlidePayload & {
  id: string;
};

export type CommunityCarouselSlideForm = {
  imageUrl: string;
  top_color: string;
  order: string;
  linkUrl: string;
};

export const EMPTY_CAROUSEL_SLIDE_FORM: CommunityCarouselSlideForm = {
  imageUrl: "",
  top_color: "#1A237E",
  order: "0",
  linkUrl: "",
};

/** iOS fallback slides when RTDB is empty. */
export const IOS_DEFAULT_SLIDES: CommunityCarouselSlide[] = [
  { id: "a", imageUrl: "a", top_color: "#1A237E", order: 0 },
  { id: "b", imageUrl: "b", top_color: "#C62828", order: 1 },
  { id: "c", imageUrl: "c", top_color: "#F9A825", order: 2 },
];

export const TOP_COLOR_PRESETS = [
  { label: "Blue (default a)", value: "#1A237E" },
  { label: "Red (default b)", value: "#C62828" },
  { label: "Yellow (default c)", value: "#F9A825" },
] as const;

function pickString(
  raw: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(
  raw: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

export function normalizeCommunityCarouselSlide(
  id: string,
  raw: Record<string, unknown>,
  fallbackOrder?: number,
): CommunityCarouselSlide {
  const imageUrl =
    pickString(raw, ["imageUrl", "imageurl", "imageURL"]) ?? "";
  const top_color =
    pickString(raw, ["top_color", "topColor", "top_colour"]) ?? "#1A237E";
  const order =
    pickNumber(raw, ["order", "sort", "index"]) ??
    fallbackOrder ??
    0;
  const linkUrl =
    pickString(raw, ["linkUrl", "link", "link_url", "url", "actionUrl"]) ??
    undefined;

  return { id, imageUrl, top_color, order, ...(linkUrl ? { linkUrl } : {}) };
}

export function slideToForm(slide: CommunityCarouselSlide): CommunityCarouselSlideForm {
  return {
    imageUrl: slide.imageUrl,
    top_color: slide.top_color,
    order: String(slide.order),
    linkUrl: slide.linkUrl ?? "",
  };
}

/** Normalizes optional link; returns undefined when empty. */
export function normalizeCarouselLink(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export function validateOptionalCarouselLink(value: string): string | null {
  const normalized = normalizeCarouselLink(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (!url.protocol || url.protocol === ":") {
      return "Link must include a scheme (https://, http://, or swing://).";
    }
    return null;
  } catch {
    return "Enter a valid URL (e.g. https://swing.app/promo or swing://community).";
  }
}

/** Parses #RGB, #RRGGBB, or RRGGBB into canonical #RRGGBB (uppercase). */
export function normalizeHexColor(value: string): string | null {
  let v = value.trim();
  if (!v.startsWith("#")) v = `#${v}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    const [, r, g, b] = v;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return null;
}

export function validateCarouselSlideForm(
  form: CommunityCarouselSlideForm,
): string | null {
  if (!form.imageUrl.trim()) {
    return "Banner image is required (upload a photo or enter a local asset name: a, b, c).";
  }
  if (!normalizeHexColor(form.top_color)) {
    return "Top bar color must be a valid hex value (e.g. #1A237E or #FFF).";
  }
  const order = Number(form.order);
  if (form.order.trim() === "" || Number.isNaN(order)) {
    return "Sort order must be a number.";
  }
  if (order < 0) {
    return "Sort order cannot be negative.";
  }
  const linkError = validateOptionalCarouselLink(form.linkUrl);
  if (linkError) return linkError;
  return null;
}

export function buildSlidePayloadFromForm(
  form: CommunityCarouselSlideForm,
): CommunityCarouselSlidePayload {
  const linkUrl = normalizeCarouselLink(form.linkUrl);
  return {
    imageUrl: form.imageUrl.trim(),
    top_color: normalizeHexColor(form.top_color) ?? form.top_color.trim(),
    order: Number(form.order),
    ...(linkUrl ? { linkUrl } : {}),
  };
}

/** Shape written to RTDB; uses null to remove linkUrl on update when cleared. */
export function toRtdbSlideData(
  payload: CommunityCarouselSlidePayload,
  mode: "create" | "update",
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    imageUrl: payload.imageUrl,
    top_color: payload.top_color,
    order: payload.order,
  };
  if (payload.linkUrl?.trim()) {
    data.linkUrl = payload.linkUrl.trim();
  } else if (mode === "update") {
    data.linkUrl = null;
  }
  return data;
}

export function isRemoteImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}
