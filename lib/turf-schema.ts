/** Turf document shape aligned with the Swing.Play mobile app model */

export interface TurfContact {
  phone: string;
  whatsapp: string;
}

export interface TurfAmenities {
  floodlights: boolean;
  washrooms: boolean;
  drinking_water: boolean;
  parking: boolean;
  changing_rooms: boolean;
  seating: boolean;
}

export interface TurfPricing {
  weekday: number;
  weekend: number;
}

export interface Turf {
  id: string;
  name: string;
  slug: string;
  pincode: string;
  address: string;
  landmark: string;
  area: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  open_time: string;
  close_time: string;
  open_24_hours: boolean;
  contact: TurfContact;
  rating: number;
  total_reviews: number;
  sports: string[];
  num_turfs: number;
  turf_surface: string;
  turf_location: string;
  amenities: TurfAmenities;
  turfImage: string;
  turf_url: string;
  pricing: TurfPricing;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type TurfInput = Omit<Turf, "id" | "createdAt" | "updatedAt">;

export const DEFAULT_AMENITIES: TurfAmenities = {
  floodlights: true,
  washrooms: true,
  drinking_water: true,
  parking: true,
  changing_rooms: false,
  seating: false,
};

export const SPORTS_OPTIONS = [
  "Football",
  "Cricket",
  "Badminton",
  "Tennis",
  "Basketball",
  "Volleyball",
  "Padel",
  "Pickle Ball",
] as const;

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeTurf(id: string, raw: Record<string, unknown>): Turf {
  const legacyLocation = String(raw.location ?? raw.area ?? "");
  const legacyPhone = String(raw.phone ?? "");
  const legacyContact = raw.contact as TurfContact | undefined;
  const legacyAmenitiesList = Array.isArray(raw.amenities)
    ? (raw.amenities as string[])
    : null;
  const legacyAmenitiesObj = raw.amenities as TurfAmenities | undefined;
  const legacyHours = raw.operatingHours as { open?: string; close?: string } | undefined;

  const amenities: TurfAmenities = legacyAmenitiesObj?.floodlights !== undefined
    ? {
        floodlights: Boolean(legacyAmenitiesObj.floodlights),
        washrooms: Boolean(legacyAmenitiesObj.washrooms),
        drinking_water: Boolean(legacyAmenitiesObj.drinking_water),
        parking: Boolean(legacyAmenitiesObj.parking),
        changing_rooms: Boolean(legacyAmenitiesObj.changing_rooms),
        seating: Boolean(legacyAmenitiesObj.seating),
      }
    : {
        floodlights: Boolean(raw.lighting ?? legacyAmenitiesList?.includes("Floodlights")),
        washrooms: legacyAmenitiesList?.includes("Washrooms") ?? true,
        drinking_water: legacyAmenitiesList?.includes("Drinking Water") ?? false,
        parking: Boolean(raw.parking ?? legacyAmenitiesList?.includes("Parking")),
        changing_rooms: legacyAmenitiesList?.includes("Changing Rooms") ?? false,
        seating: legacyAmenitiesList?.includes("Seating") ?? false,
      };

  const name = String(raw.name ?? "");
  const area = String(raw.area ?? legacyLocation);

  return {
    id,
    name,
    slug: String(raw.slug ?? slugify(name)),
    pincode: String(raw.pincode ?? ""),
    address: String(raw.address ?? [area, raw.city, raw.state].filter(Boolean).join(", ")),
    landmark: String(raw.landmark ?? ""),
    area,
    city: String(raw.city ?? ""),
    state: String(raw.state ?? ""),
    country: String(raw.country ?? "India"),
    lat: Number(raw.lat ?? 0),
    lon: Number(raw.lon ?? raw.lng ?? 0),
    open_time: String(raw.open_time ?? legacyHours?.open ?? "06:00"),
    close_time: String(raw.close_time ?? legacyHours?.close ?? "23:00"),
    open_24_hours: Boolean(raw.open_24_hours ?? false),
    contact: {
      phone: String(legacyContact?.phone ?? legacyPhone),
      whatsapp: String(legacyContact?.whatsapp ?? legacyPhone),
    },
    rating: Number(raw.rating ?? 4.5),
    total_reviews: Number(raw.total_reviews ?? raw.reviews ?? 0),
    sports: Array.isArray(raw.sports) ? (raw.sports as string[]) : [],
    num_turfs: Number(raw.num_turfs ?? 1),
    turf_surface: String(raw.turf_surface ?? raw.surface ?? "Synthetic Grass"),
    turf_location: String(raw.turf_location ?? ""),
    amenities,
    turfImage: String(raw.turfImage ?? raw.image ?? "/turf-default.jpg"),
    turf_url: String(raw.turf_url ?? raw.googleMapsUrl ?? ""),
    pricing: {
      weekday: Number((raw.pricing as TurfPricing)?.weekday ?? 0),
      weekend: Number(
        (raw.pricing as TurfPricing)?.weekend ??
          (raw.pricing as TurfPricing)?.weekday ??
          0,
      ),
    },
    email: String(raw.email ?? ""),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}
