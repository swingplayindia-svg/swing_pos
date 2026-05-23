import { addHours, format, isWeekend } from "date-fns";
import type {
  TimeSlotPeriod,
  TurfOperatingSlot,
  TurfPeriodPricing,
  TurfPricing,
} from "@/lib/turf-schema";

/** 0 = Sunday … 6 = Saturday (JS Date.getDay()) */
export const DAY_RATE_KEYS = ["0", "1", "2", "3", "4", "5", "6"] as const;
export type DayRateKey = (typeof DAY_RATE_KEYS)[number];

export const DAY_RATE_ROWS: { key: DayRateKey; label: string }[] = [
  { key: "1", label: "Monday" },
  { key: "2", label: "Tuesday" },
  { key: "3", label: "Wednesday" },
  { key: "4", label: "Thursday" },
  { key: "5", label: "Friday" },
  { key: "6", label: "Saturday" },
  { key: "0", label: "Sunday" },
];

export type SpecialDateRate = { date: string; rate: number };

export const DEFAULT_MORNING_SLOT: TurfOperatingSlot = {
  period: "morning",
  start: "05:00",
  end: "12:00",
  enabled: true,
};

export const DEFAULT_EVENING_SLOT: TurfOperatingSlot = {
  period: "evening",
  start: "16:00",
  end: "00:00",
  enabled: true,
};

export function minutesFromMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function normalizePeriodPricing(
  raw: unknown,
  fallbackWeekday: number,
  fallbackWeekend: number,
): TurfPeriodPricing | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const p = raw as Record<string, unknown>;
  const weekday = Number(p.weekday ?? 0);
  const weekend = Number(p.weekend ?? weekday) || weekday;
  const resolvedWeekday =
    Number.isFinite(weekday) && weekday > 0 ? weekday : fallbackWeekday;
  const resolvedWeekend =
    Number.isFinite(weekend) && weekend > 0 ? weekend : fallbackWeekend;

  const dayRates: Partial<Record<DayRateKey, number>> = {};
  const rawDay = p.dayRates as Record<string, unknown> | undefined;
  if (rawDay && typeof rawDay === "object") {
    for (const key of DAY_RATE_KEYS) {
      const v = Number(rawDay[key]);
      if (Number.isFinite(v) && v > 0) dayRates[key] = v;
    }
  }

  const dateRates: Record<string, number> = {};
  const rawDate = p.dateRates as Record<string, unknown> | undefined;
  if (rawDate && typeof rawDate === "object") {
    for (const [date, val] of Object.entries(rawDate)) {
      const v = Number(val);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(v) && v > 0) {
        dateRates[date] = v;
      }
    }
  }

  return {
    weekday: resolvedWeekday,
    weekend: resolvedWeekend,
    ...(Object.keys(dayRates).length > 0 ? { dayRates } : {}),
    ...(Object.keys(dateRates).length > 0 ? { dateRates } : {}),
  };
}

function normalizeOperatingSlots(raw: unknown): TurfOperatingSlot[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const slots: TurfOperatingSlot[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const period = s.period === "evening" ? "evening" : "morning";
    const start = String(s.start ?? (period === "morning" ? "05:00" : "16:00"));
    const end = String(s.end ?? (period === "morning" ? "12:00" : "00:00"));
    slots.push({
      period,
      start,
      end,
      enabled: s.enabled !== false,
    });
  }
  return slots.length > 0 ? slots : undefined;
}

export function normalizeTurfPricing(raw: unknown): TurfPricing {
  const p = (raw ?? {}) as Record<string, unknown>;
  const weekday = Number(p.weekday ?? 0);
  const weekend = Number(p.weekend ?? weekday) || weekday;

  const dayRates: Partial<Record<DayRateKey, number>> = {};
  const rawDay = p.dayRates as Record<string, unknown> | undefined;
  if (rawDay && typeof rawDay === "object") {
    for (const key of DAY_RATE_KEYS) {
      const v = Number(rawDay[key]);
      if (Number.isFinite(v) && v > 0) dayRates[key] = v;
    }
  }

  const dateRates: Record<string, number> = {};
  const rawDate = p.dateRates as Record<string, unknown> | undefined;
  if (rawDate && typeof rawDate === "object") {
    for (const [date, val] of Object.entries(rawDate)) {
      const v = Number(val);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(v) && v > 0) {
        dateRates[date] = v;
      }
    }
  }

  const usePeriodSlots = Boolean(p.usePeriodSlots);
  const operatingSlots = normalizeOperatingSlots(p.operatingSlots);
  const rawPeriod = p.periodPricing as Record<string, unknown> | undefined;
  const periodPricing: Partial<Record<TimeSlotPeriod, TurfPeriodPricing>> = {};
  if (rawPeriod && typeof rawPeriod === "object") {
    const morning = normalizePeriodPricing(rawPeriod.morning, weekday, weekend);
    const evening = normalizePeriodPricing(rawPeriod.evening, weekday, weekend);
    if (morning) periodPricing.morning = morning;
    if (evening) periodPricing.evening = evening;
  }

  return {
    weekday,
    weekend,
    ...(Object.keys(dayRates).length > 0 ? { dayRates } : {}),
    ...(Object.keys(dateRates).length > 0 ? { dateRates } : {}),
    ...(usePeriodSlots ? { usePeriodSlots: true } : {}),
    ...(usePeriodSlots && operatingSlots ? { operatingSlots } : {}),
    ...(usePeriodSlots && Object.keys(periodPricing).length > 0
      ? { periodPricing }
      : {}),
  };
}

export function defaultOperatingSlots(): TurfOperatingSlot[] {
  return [
    { ...DEFAULT_MORNING_SLOT },
    { ...DEFAULT_EVENING_SLOT },
  ];
}

export function usesPeriodSlots(pricing: TurfPricing): boolean {
  return Boolean(
    pricing.usePeriodSlots &&
      pricing.operatingSlots?.some((s) => s.enabled !== false),
  );
}

export function getActiveOperatingSlots(pricing: TurfPricing): TurfOperatingSlot[] {
  if (!usesPeriodSlots(pricing)) return [];
  return (pricing.operatingSlots ?? defaultOperatingSlots()).filter(
    (s) => s.enabled !== false,
  );
}

/** Which period (morning/evening) a clock time falls in, if any. */
export function periodForClockTime(
  pricing: TurfPricing,
  hhmm: string,
): TimeSlotPeriod | null {
  if (!usesPeriodSlots(pricing)) return null;
  const min = minutesFromMidnight(hhmm);
  for (const slot of getActiveOperatingSlots(pricing)) {
    const startMin = minutesFromMidnight(slot.start);
    let endMin = minutesFromMidnight(slot.end);
    if (endMin === 0) endMin = 24 * 60;
    if (endMin <= startMin) endMin = 24 * 60;
    if (min >= startMin && min < endMin) return slot.period;
  }
  return null;
}

function rateFromPeriodOrBase(
  period: TurfPeriodPricing | undefined,
  base: TurfPricing,
  date: Date,
): number {
  if (period) {
    const dateKey = format(date, "yyyy-MM-dd");
    if (period.dateRates?.[dateKey]) return period.dateRates[dateKey];
    const dow = String(date.getDay()) as DayRateKey;
    if (period.dayRates?.[dow]) return period.dayRates[dow];
    if (period.weekday > 0 || period.weekend > 0) {
      return isWeekend(date) ? period.weekend : period.weekday;
    }
  }
  return hourlyRateForDate(base, date);
}

/** ₹/hr for a calendar date (priority: special date → day override → weekend/weekday). */
export function hourlyRateForDate(pricing: TurfPricing, date: Date): number {
  const dateKey = format(date, "yyyy-MM-dd");
  if (pricing.dateRates?.[dateKey]) return pricing.dateRates[dateKey];

  const dow = String(date.getDay()) as DayRateKey;
  if (pricing.dayRates?.[dow]) return pricing.dayRates[dow];

  return isWeekend(date) ? pricing.weekend : pricing.weekday;
}

/** ₹/hr at a specific date-time (respects morning/evening period rates). */
export function hourlyRateAt(pricing: TurfPricing, at: Date): number {
  const dateKey = format(at, "yyyy-MM-dd");
  if (pricing.dateRates?.[dateKey]) return pricing.dateRates[dateKey];

  const period = periodForClockTime(pricing, format(at, "HH:mm"));
  if (period && pricing.periodPricing?.[period]) {
    return rateFromPeriodOrBase(pricing.periodPricing[period], pricing, at);
  }

  return hourlyRateForDate(pricing, at);
}

export function calculateBookingAmount(
  pricing: TurfPricing,
  startAt: Date,
  hours: number,
): number {
  let total = 0;
  let cursor = startAt;
  for (let i = 0; i < hours; i++) {
    total += hourlyRateAt(pricing, cursor);
    cursor = addHours(cursor, 1);
  }
  return Math.round(total);
}

export function hasCustomPricing(pricing: TurfPricing): boolean {
  return Boolean(
    usesPeriodSlots(pricing) ||
      (pricing.dayRates && Object.keys(pricing.dayRates).length > 0) ||
      (pricing.dateRates && Object.keys(pricing.dateRates).length > 0),
  );
}

/** e.g. "05:00" → "5:00 AM", "00:00" → "midnight" when isEnd */
export function formatHHmmDisplay(hhmm: string, isEnd = false): string {
  if (isEnd && hhmm === "00:00") return "midnight";
  const [h, m] = hhmm.split(":").map(Number);
  const date = new Date(2000, 0, 1, h ?? 0, m ?? 0);
  return format(date, "h:mm a");
}

export function formatOperatingHoursSummary(
  pricing: TurfPricing,
  openTime: string,
  closeTime: string,
  open24: boolean,
): string {
  if (open24) return "Open 24 hours";
  if (usesPeriodSlots(pricing)) {
    return getActiveOperatingSlots(pricing)
      .map((s) => {
        const label = s.period === "morning" ? "Morning" : "Evening";
        const endLabel = formatHHmmDisplay(s.end, true);
        return `${label} ${formatHHmmDisplay(s.start)} – ${endLabel}`;
      })
      .join(" · ");
  }
  const endLabel = formatHHmmDisplay(closeTime, closeTime === "00:00");
  return `${formatHHmmDisplay(openTime)} – ${endLabel}`;
}

export function formatPricingSummary(pricing: TurfPricing): string {
  if (usesPeriodSlots(pricing)) {
    const m = pricing.periodPricing?.morning;
    const e = pricing.periodPricing?.evening;
    const parts: string[] = [];
    if (m) parts.push(`Morning ₹${m.weekday}/₹${m.weekend}`);
    if (e) parts.push(`Evening ₹${e.weekday}/₹${e.weekend}`);
    const base = parts.length > 0 ? parts.join(" · ") : `₹${pricing.weekday}/hr`;
    if (pricing.dateRates && Object.keys(pricing.dateRates).length > 0) {
      return `${base} · special dates may apply`;
    }
    return base;
  }
  const base = `₹${pricing.weekday}/hr (Mon–Fri) · ₹${pricing.weekend}/hr (Sat–Sun)`;
  if (!hasCustomPricing(pricing)) return base;
  return `${base} · custom day/date rates may apply`;
}

export function parsePriceString(value: string): number {
  const n = Number(String(value).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function buildPeriodPricing(input: {
  weekday: string;
  weekend: string;
  usePerDayRates: boolean;
  dayRates: Record<DayRateKey, string>;
  fallbackWeekday: number;
  fallbackWeekend: number;
}): TurfPeriodPricing | undefined {
  const weekday = parsePriceString(input.weekday) || input.fallbackWeekday;
  const weekend = parsePriceString(input.weekend) || input.fallbackWeekend;
  if (weekday <= 0 && weekend <= 0) return undefined;

  const period: TurfPeriodPricing = {
    weekday: weekday > 0 ? weekday : input.fallbackWeekday,
    weekend: weekend > 0 ? weekend : input.fallbackWeekend,
  };

  if (input.usePerDayRates) {
    const dayRates: Partial<Record<DayRateKey, number>> = {};
    for (const key of DAY_RATE_KEYS) {
      const v = parsePriceString(input.dayRates[key] ?? "");
      if (v > 0) dayRates[key] = v;
    }
    if (Object.keys(dayRates).length > 0) period.dayRates = dayRates;
  }

  return period;
}

export function buildTurfPricingFromOwnerInput(input: {
  weekday: string;
  weekend: string;
  usePerDayRates: boolean;
  dayRates: Record<DayRateKey, string>;
  specialRates: Array<{ date: string; rate: string }>;
  usePeriodSlots?: boolean;
  morningEnabled?: boolean;
  morningStart?: string;
  morningEnd?: string;
  eveningEnabled?: boolean;
  eveningStart?: string;
  eveningEnd?: string;
  morningWeekday?: string;
  morningWeekend?: string;
  morningUsePerDayRates?: boolean;
  morningDayRates?: Record<DayRateKey, string>;
  eveningWeekday?: string;
  eveningWeekend?: string;
  eveningUsePerDayRates?: boolean;
  eveningDayRates?: Record<DayRateKey, string>;
}): TurfPricing {
  const weekday = parsePriceString(input.weekday);
  const weekend = parsePriceString(input.weekend) || weekday;

  const pricing: TurfPricing = { weekday, weekend };

  if (input.usePerDayRates) {
    const dayRates: Partial<Record<DayRateKey, number>> = {};
    for (const key of DAY_RATE_KEYS) {
      const v = parsePriceString(input.dayRates[key] ?? "");
      if (v > 0) dayRates[key] = v;
    }
    if (Object.keys(dayRates).length > 0) pricing.dayRates = dayRates;
  }

  const dateRates: Record<string, number> = {};
  for (const row of input.specialRates) {
    const date = row.date.trim();
    const rate = parsePriceString(row.rate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && rate > 0) {
      dateRates[date] = rate;
    }
  }
  if (Object.keys(dateRates).length > 0) pricing.dateRates = dateRates;

  if (input.usePeriodSlots) {
    const operatingSlots: TurfOperatingSlot[] = [];
    if (input.morningEnabled !== false) {
      operatingSlots.push({
        period: "morning",
        start: input.morningStart?.trim() || DEFAULT_MORNING_SLOT.start,
        end: input.morningEnd?.trim() || DEFAULT_MORNING_SLOT.end,
        enabled: true,
      });
    } else {
      operatingSlots.push({ ...DEFAULT_MORNING_SLOT, enabled: false });
    }
    if (input.eveningEnabled !== false) {
      operatingSlots.push({
        period: "evening",
        start: input.eveningStart?.trim() || DEFAULT_EVENING_SLOT.start,
        end: input.eveningEnd?.trim() || DEFAULT_EVENING_SLOT.end,
        enabled: true,
      });
    } else {
      operatingSlots.push({ ...DEFAULT_EVENING_SLOT, enabled: false });
    }

    pricing.usePeriodSlots = true;
    pricing.operatingSlots = operatingSlots;

    const periodPricing: Partial<Record<TimeSlotPeriod, TurfPeriodPricing>> = {};
    const morning = buildPeriodPricing({
      weekday: input.morningWeekday ?? "",
      weekend: input.morningWeekend ?? "",
      usePerDayRates: Boolean(input.morningUsePerDayRates),
      dayRates: input.morningDayRates ?? ({} as Record<DayRateKey, string>),
      fallbackWeekday: weekday,
      fallbackWeekend: weekend,
    });
    const evening = buildPeriodPricing({
      weekday: input.eveningWeekday ?? "",
      weekend: input.eveningWeekend ?? "",
      usePerDayRates: Boolean(input.eveningUsePerDayRates),
      dayRates: input.eveningDayRates ?? ({} as Record<DayRateKey, string>),
      fallbackWeekday: weekday,
      fallbackWeekend: weekend,
    });
    if (morning) periodPricing.morning = morning;
    if (evening) periodPricing.evening = evening;
    if (Object.keys(periodPricing).length > 0) {
      pricing.periodPricing = periodPricing;
    }
  }

  return pricing;
}

export function ownerFormFromTurfPricing(pricing: TurfPricing): {
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
} {
  const dayRates = {} as Record<DayRateKey, string>;
  for (const key of DAY_RATE_KEYS) {
    dayRates[key] =
      pricing.dayRates?.[key] != null ? String(pricing.dayRates[key]) : "";
  }

  const emptyPeriodDayRates = () => {
    const r = {} as Record<DayRateKey, string>;
    for (const key of DAY_RATE_KEYS) r[key] = "";
    return r;
  };

  const morningSlot =
    pricing.operatingSlots?.find((s) => s.period === "morning") ??
    DEFAULT_MORNING_SLOT;
  const eveningSlot =
    pricing.operatingSlots?.find((s) => s.period === "evening") ??
    DEFAULT_EVENING_SLOT;
  const morning = pricing.periodPricing?.morning;
  const evening = pricing.periodPricing?.evening;

  const periodDayRates = (p?: TurfPeriodPricing) => {
    const r = emptyPeriodDayRates();
    if (!p?.dayRates) return r;
    for (const key of DAY_RATE_KEYS) {
      if (p.dayRates[key] != null) r[key] = String(p.dayRates[key]);
    }
    return r;
  };

  const specialRates = Object.entries(pricing.dateRates ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rate]) => ({ date, rate: String(rate) }));

  return {
    weekday: String(pricing.weekday),
    weekend: String(pricing.weekend),
    usePerDayRates: Boolean(
      pricing.dayRates && Object.keys(pricing.dayRates).length > 0,
    ),
    dayRates,
    specialRates,
    usePeriodSlots: usesPeriodSlots(pricing),
    morningEnabled: morningSlot.enabled !== false,
    morningStart: morningSlot.start,
    morningEnd: morningSlot.end,
    eveningEnabled: eveningSlot.enabled !== false,
    eveningStart: eveningSlot.start,
    eveningEnd: eveningSlot.end,
    morningWeekday: morning ? String(morning.weekday) : "",
    morningWeekend: morning ? String(morning.weekend) : "",
    morningUsePerDayRates: Boolean(
      morning?.dayRates && Object.keys(morning.dayRates).length > 0,
    ),
    morningDayRates: periodDayRates(morning),
    eveningWeekday: evening ? String(evening.weekday) : "",
    eveningWeekend: evening ? String(evening.weekend) : "",
    eveningUsePerDayRates: Boolean(
      evening?.dayRates && Object.keys(evening.dayRates).length > 0,
    ),
    eveningDayRates: periodDayRates(evening),
  };
}
