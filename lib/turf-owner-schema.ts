import {
  buildTurfPricingFromOwnerInput,
  ownerFormFromTurfPricing,
  parsePriceString,
  type DayRateKey,
} from "@/lib/turf-pricing";
import type { Turf } from "@/lib/turf-schema";

export type TurfBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type TurfBookingPaymentStatus =
  | "unpaid"
  | "paid"
  | "failed";

export type TurfBooking = {
  id: string;
  turfId: string;
  customerName: string;
  customerPhone: string;
  startAt: string;
  endAt: string;
  sport: string;
  hours: number;
  amountInr: number;
  status: TurfBookingStatus;
  paymentStatus: TurfBookingPaymentStatus;
  phonePeTransactionId?: string;
  notes: string;
  source: "customer" | "app" | "owner" | "walk_in";
  createdAt: string;
  updatedAt: string;
};

export type TurfBookingInput = Omit<
  TurfBooking,
  "id" | "createdAt" | "updatedAt" | "phonePeTransactionId"
> & {
  phonePeTransactionId?: string;
};

export type TurfClosure = {
  id: string;
  turfId: string;
  /** YYYY-MM-DD */
  date: string;
  reason: string;
  allDay: boolean;
  createdAt: string;
};

export type TurfClosureInput = Omit<TurfClosure, "id" | "createdAt">;

export type TurfOwnerProfile = {
  uid: string;
  turfIds: string[];
  displayName: string;
  email: string;
  phone: string;
  updatedAt: string;
};

export type OwnerVenueForm = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  landmark: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  lat: string;
  lon: string;
  open_time: string;
  close_time: string;
  open_24_hours: boolean;
  turfImage: string;
  weekday: string;
  weekend: string;
  usePerDayRates: boolean;
  dayRates: Record<DayRateKey, string>;
  specialRates: Array<{ date: string; rate: string }>;
  usePeriodSlots: boolean;
  morningEnabled: boolean;
  morningStart: string;
  morningEnd: string;
  eveningEnabled: boolean;
  eveningStart: string;
  eveningEnd: string;
  morningWeekday: string;
  morningWeekend: string;
  morningUsePerDayRates: boolean;
  morningDayRates: Record<DayRateKey, string>;
  eveningWeekday: string;
  eveningWeekend: string;
  eveningUsePerDayRates: boolean;
  eveningDayRates: Record<DayRateKey, string>;
};

const EMPTY_DAY_RATES = (): Record<DayRateKey, string> => ({
  "0": "",
  "1": "",
  "2": "",
  "3": "",
  "4": "",
  "5": "",
  "6": "",
});

export const EMPTY_OWNER_VENUE_FORM: OwnerVenueForm = {
  name: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  landmark: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  lat: "",
  lon: "",
  open_time: "06:00",
  close_time: "23:00",
  open_24_hours: false,
  turfImage: "",
  weekday: "",
  weekend: "",
  usePerDayRates: false,
  dayRates: EMPTY_DAY_RATES(),
  specialRates: [],
  usePeriodSlots: false,
  morningEnabled: true,
  morningStart: "05:00",
  morningEnd: "12:00",
  eveningEnabled: true,
  eveningStart: "16:00",
  eveningEnd: "00:00",
  morningWeekday: "",
  morningWeekend: "",
  morningUsePerDayRates: false,
  morningDayRates: EMPTY_DAY_RATES(),
  eveningWeekday: "",
  eveningWeekend: "",
  eveningUsePerDayRates: false,
  eveningDayRates: EMPTY_DAY_RATES(),
};

export function turfToOwnerVenueForm(turf: Turf): OwnerVenueForm {
  const pricingFields = ownerFormFromTurfPricing(turf.pricing);
  return {
    name: turf.name,
    email: turf.email,
    phone: turf.contact.phone,
    whatsapp: turf.contact.whatsapp,
    address: turf.address,
    landmark: turf.landmark,
    area: turf.area,
    city: turf.city,
    state: turf.state,
    pincode: turf.pincode,
    country: turf.country,
    lat: turf.lat ? String(turf.lat) : "",
    lon: turf.lon ? String(turf.lon) : "",
    open_time: turf.open_time,
    close_time: turf.close_time,
    open_24_hours: turf.open_24_hours,
    turfImage: turf.turfImage,
    ...pricingFields,
  };
}

function parseNum(value: string, fallback = 0): number {
  return parsePriceString(value) || fallback;
}

/** Fields turf owners may update (subset of full Turf). */
export function buildOwnerTurfUpdates(
  form: OwnerVenueForm,
): Partial<Turf> {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    address: form.address.trim(),
    landmark: form.landmark.trim(),
    area: form.area.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    pincode: form.pincode.trim(),
    country: form.country.trim() || "India",
    lat: parseNum(form.lat),
    lon: parseNum(form.lon),
    open_24_hours: form.open_24_hours && !form.usePeriodSlots,
    contact: {
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim() || form.phone.trim(),
    },
    turfImage: form.turfImage.trim() || "/turf-default.jpg",
    open_time: form.usePeriodSlots
      ? form.morningEnabled
        ? form.morningStart.trim() || "05:00"
        : form.eveningStart.trim() || "16:00"
      : form.open_24_hours
        ? "00:00"
        : form.open_time.trim() || "06:00",
    close_time: form.usePeriodSlots
      ? form.eveningEnabled
        ? form.eveningEnd.trim() || "00:00"
        : form.morningEnd.trim() || "12:00"
      : form.open_24_hours
        ? "23:59"
        : form.close_time.trim() || "23:00",
    pricing: buildTurfPricingFromOwnerInput({
      weekday: form.weekday,
      weekend: form.weekend,
      usePerDayRates: form.usePerDayRates,
      dayRates: form.dayRates,
      specialRates: form.specialRates,
      usePeriodSlots: form.usePeriodSlots,
      morningEnabled: form.morningEnabled,
      morningStart: form.morningStart,
      morningEnd: form.morningEnd,
      eveningEnabled: form.eveningEnabled,
      eveningStart: form.eveningStart,
      eveningEnd: form.eveningEnd,
      morningWeekday: form.morningWeekday,
      morningWeekend: form.morningWeekend,
      morningUsePerDayRates: form.morningUsePerDayRates,
      morningDayRates: form.morningDayRates,
      eveningWeekday: form.eveningWeekday,
      eveningWeekend: form.eveningWeekend,
      eveningUsePerDayRates: form.eveningUsePerDayRates,
      eveningDayRates: form.eveningDayRates,
    }),
  };
}

export function validateOwnerVenueForm(form: OwnerVenueForm): string | null {
  if (!form.name.trim()) return "Venue name is required.";
  if (!form.phone.trim()) return "Phone number is required.";
  if (!form.area.trim()) return "Area is required.";
  if (!form.city.trim()) return "City is required.";
  if (parsePriceString(form.weekday) <= 0) return "Enter a valid weekday price.";
  if (form.usePeriodSlots) {
    if (!form.morningEnabled && !form.eveningEnabled) {
      return "Enable at least one time slot (morning or evening).";
    }
    if (form.morningEnabled) {
      if (parsePriceString(form.morningWeekday) <= 0 && parsePriceString(form.weekday) <= 0) {
        return "Enter morning weekday price.";
      }
    }
    if (form.eveningEnabled) {
      if (parsePriceString(form.eveningWeekday) <= 0 && parsePriceString(form.weekday) <= 0) {
        return "Enter evening weekday price.";
      }
    }
  }
  for (const row of form.specialRates) {
    if (row.date && parsePriceString(row.rate) <= 0) {
      return "Enter a price for each special date, or remove the row.";
    }
    if (row.rate && !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
      return "Pick a valid date for special pricing.";
    }
  }
  return null;
}

export function dateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function normalizeBooking(
  id: string,
  raw: Record<string, unknown>,
): TurfBooking {
  const status = (raw.status as TurfBookingStatus) ?? "pending";
  const paymentStatus =
    (raw.paymentStatus as TurfBookingPaymentStatus) ??
    (status === "confirmed" ? "paid" : "unpaid");
  return {
    id,
    turfId: String(raw.turfId ?? ""),
    customerName: String(raw.customerName ?? ""),
    customerPhone: String(raw.customerPhone ?? ""),
    startAt: String(raw.startAt ?? ""),
    endAt: String(raw.endAt ?? ""),
    sport: String(raw.sport ?? ""),
    hours: Number(raw.hours ?? 1) || 1,
    amountInr: Number(raw.amountInr ?? 0),
    status,
    paymentStatus,
    phonePeTransactionId: raw.phonePeTransactionId
      ? String(raw.phonePeTransactionId)
      : undefined,
    notes: String(raw.notes ?? ""),
    source: (raw.source as TurfBooking["source"]) ?? "owner",
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export function normalizeClosure(
  id: string,
  raw: Record<string, unknown>,
): TurfClosure {
  return {
    id,
    turfId: String(raw.turfId ?? ""),
    date: String(raw.date ?? ""),
    reason: String(raw.reason ?? ""),
    allDay: Boolean(raw.allDay ?? true),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}
