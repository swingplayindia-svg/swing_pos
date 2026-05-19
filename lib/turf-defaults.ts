import {
  DEFAULT_AMENITIES,
  slugify,
  type Turf,
  type TurfAmenities,
  type TurfInput,
} from "./turf-schema";

export type { TurfInput } from "./turf-schema";

export type TurfForm = {
  name: string;
  slug: string;
  pincode: string;
  address: string;
  landmark: string;
  area: string;
  city: string;
  state: string;
  country: string;
  lat: string;
  lon: string;
  open_time: string;
  close_time: string;
  open_24_hours: boolean;
  phone: string;
  whatsapp: string;
  email: string;
  rating: string;
  total_reviews: string;
  sports: string[];
  num_turfs: string;
  turf_surface: string;
  turf_location: string;
  amenities: TurfAmenities;
  turfImage: string;
  turf_url: string;
  weekday: string;
  weekend: string;
};

export const EMPTY_TURF_FORM: TurfForm = {
  name: "",
  slug: "",
  pincode: "",
  address: "",
  landmark: "",
  area: "",
  city: "",
  state: "",
  country: "India",
  lat: "",
  lon: "",
  open_time: "06:00",
  close_time: "23:00",
  open_24_hours: false,
  phone: "",
  whatsapp: "",
  email: "",
  rating: "4.5",
  total_reviews: "0",
  sports: [],
  num_turfs: "1",
  turf_surface: "Synthetic Grass",
  turf_location: "",
  amenities: { ...DEFAULT_AMENITIES },
  turfImage: "",
  turf_url: "",
  weekday: "",
  weekend: "",
};

function parseNum(value: string, fallback = 0): number {
  const n = Number(String(value).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

export function buildTurfFromForm(input: TurfForm): TurfInput {
  const name = input.name.trim();
  const area = input.area.trim();
  const city = input.city.trim();
  const state = input.state.trim();
  const weekday = parseNum(input.weekday);
  const weekend = parseNum(input.weekend) || weekday;

  return {
    name,
    slug: input.slug.trim() || slugify(name),
    pincode: input.pincode.trim(),
    address:
      input.address.trim() ||
      [area, city, state, input.pincode.trim()].filter(Boolean).join(", "),
    landmark: input.landmark.trim(),
    area,
    city,
    state,
    country: input.country.trim() || "India",
    lat: parseNum(input.lat),
    lon: parseNum(input.lon),
    open_time: input.open_24_hours ? "00:00" : input.open_time.trim() || "06:00",
    close_time: input.open_24_hours ? "23:59" : input.close_time.trim() || "23:00",
    open_24_hours: input.open_24_hours,
    contact: {
      phone: input.phone.trim(),
      whatsapp: input.whatsapp.trim() || input.phone.trim(),
    },
    rating: parseNum(input.rating, 4.5),
    total_reviews: parseNum(input.total_reviews, 0),
    sports: input.sports,
    num_turfs: Math.max(1, parseNum(input.num_turfs, 1)),
    turf_surface: input.turf_surface.trim() || "Synthetic Grass",
    turf_location: input.turf_location.trim(),
    amenities: { ...input.amenities },
    turfImage: input.turfImage.trim() || "/turf-default.jpg",
    turf_url: input.turf_url.trim(),
    pricing: { weekday, weekend },
    email: input.email.trim(),
  };
}

export function validateTurfForm(
  input: TurfForm,
  options?: { quick?: boolean },
): string | null {
  if (!input.name.trim()) return "Venue name is required.";
  if (!input.area.trim()) return "Area is required.";
  if (!input.city.trim()) return "City is required.";
  if (!input.phone.trim()) return "Phone is required.";
  if (input.sports.length === 0) return "Select at least one sport.";
  const weekday = parseNum(input.weekday);
  if (weekday <= 0) return "Enter a valid weekday price.";
  if (options?.quick) return null;
  return null;
}

export function turfToForm(turf: Turf): TurfForm {
  return {
    name: turf.name,
    slug: turf.slug,
    pincode: turf.pincode,
    address: turf.address,
    landmark: turf.landmark,
    area: turf.area,
    city: turf.city,
    state: turf.state,
    country: turf.country,
    lat: turf.lat ? String(turf.lat) : "",
    lon: turf.lon ? String(turf.lon) : "",
    open_time: turf.open_time,
    close_time: turf.close_time,
    open_24_hours: turf.open_24_hours,
    phone: turf.contact.phone,
    whatsapp: turf.contact.whatsapp,
    email: turf.email,
    rating: String(turf.rating),
    total_reviews: String(turf.total_reviews),
    sports: [...turf.sports],
    num_turfs: String(turf.num_turfs),
    turf_surface: turf.turf_surface,
    turf_location: turf.turf_location,
    amenities: { ...turf.amenities },
    turfImage: turf.turfImage,
    turf_url: turf.turf_url,
    weekday: String(turf.pricing.weekday),
    weekend: String(turf.pricing.weekend),
  };
}

/** @deprecated Use TurfForm + buildTurfFromForm */
export type SimpleTurfForm = Pick<
  TurfForm,
  "name" | "area" | "city" | "state" | "phone" | "email" | "sports" | "weekday" | "weekend"
> & { location?: string; pricing?: { weekday: number; weekend: number } };

export function buildTurfFromSimple(
  input: SimpleTurfForm & { location?: string },
): TurfInput {
  return buildTurfFromForm({
    ...EMPTY_TURF_FORM,
    name: input.name,
    area: input.area ?? input.location ?? "",
    city: input.city,
    state: input.state ?? "",
    phone: input.phone,
    whatsapp: input.phone,
    email: input.email ?? "",
    sports: input.sports,
    weekday: String(input.pricing?.weekday ?? input.weekday ?? ""),
    weekend: String(input.pricing?.weekend ?? input.weekend ?? ""),
  });
}
