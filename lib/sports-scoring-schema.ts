/**
 * RTDB path: ongis_sports_scoring/{sportKey}
 *
 * Preferred shape (iOS + CMS):
 *   { enabled: boolean, imageUrl: string }
 *
 * Legacy shape (still read): bare boolean at {sportKey}.
 * iOS should load card art from imageUrl (Firebase Storage HTTPS URL) and cache by URL.
 */

export type SportScoringKey =
  | "padel"
  | "basketball"
  | "soccer"
  | "badminton"
  | "pickleball"
  | "tennis"
  | "volleyball"
  | "cricket"
  | "golf"
  | "table_tennis"
  | "bowling"
  | "combat_sports"
  | "running"
  | "swimming"
  | "esports"
  | "gokarting"
  | "gym"
  | "yoga";

/** UI group for secondary / explore-more sports in the app */
export const SPORT_SCORING_MORE_GROUP = "More sports";

export type SportScoringEntry = {
  enabled: boolean;
  imageUrl: string;
};

export type SportScoringState = Record<SportScoringKey, SportScoringEntry>;

/** @deprecated Use SportScoringState — enabled flags only */
export type SportScoringFlags = Record<SportScoringKey, boolean>;

export const SPORT_SCORING_DEFINITIONS: {
  key: SportScoringKey;
  label: string;
  group: string;
}[] = [
  { key: "padel", label: "Padel", group: "Featured" },
  { key: "basketball", label: "Basketball", group: "Featured" },
  { key: "soccer", label: "Soccer", group: "Featured" },
  { key: "badminton", label: "Badminton", group: "Featured" },
  { key: "pickleball", label: "Pickleball", group: "Featured" },
  { key: "tennis", label: "Tennis", group: SPORT_SCORING_MORE_GROUP },
  { key: "volleyball", label: "Volleyball", group: SPORT_SCORING_MORE_GROUP },
  { key: "cricket", label: "Cricket", group: SPORT_SCORING_MORE_GROUP },
  { key: "golf", label: "Golf", group: SPORT_SCORING_MORE_GROUP },
  { key: "table_tennis", label: "Table Tennis", group: SPORT_SCORING_MORE_GROUP },
  { key: "bowling", label: "Bowling", group: SPORT_SCORING_MORE_GROUP },
  { key: "combat_sports", label: "Combat Sports", group: SPORT_SCORING_MORE_GROUP },
  { key: "running", label: "Running", group: SPORT_SCORING_MORE_GROUP },
  { key: "swimming", label: "Swimming", group: SPORT_SCORING_MORE_GROUP },
  { key: "esports", label: "Esports", group: SPORT_SCORING_MORE_GROUP },
  { key: "gokarting", label: "Go-Karting", group: SPORT_SCORING_MORE_GROUP },
  { key: "gym", label: "Gym", group: SPORT_SCORING_MORE_GROUP },
  { key: "yoga", label: "Yoga", group: SPORT_SCORING_MORE_GROUP },
];

export function filterSportScoringDefinitions(
  query: string,
): typeof SPORT_SCORING_DEFINITIONS {
  const q = query.trim().toLowerCase();
  if (!q) return SPORT_SCORING_DEFINITIONS;
  return SPORT_SCORING_DEFINITIONS.filter(
    (d) =>
      d.label.toLowerCase().includes(q) ||
      d.key.toLowerCase().includes(q) ||
      d.key.replace(/_/g, " ").includes(q),
  );
}

export const DEFAULT_SPORT_SCORING_ENTRY: SportScoringEntry = {
  enabled: false,
  imageUrl: "",
};

export const DEFAULT_SPORT_SCORING_STATE: SportScoringState =
  Object.fromEntries(
    SPORT_SCORING_DEFINITIONS.map((d) => [d.key, { ...DEFAULT_SPORT_SCORING_ENTRY }]),
  ) as SportScoringState;

export const DEFAULT_SPORT_SCORING_FLAGS: SportScoringFlags = Object.fromEntries(
  SPORT_SCORING_DEFINITIONS.map((d) => [d.key, false]),
) as SportScoringFlags;

function parseEntry(value: unknown): SportScoringEntry | null {
  if (typeof value === "boolean") {
    return { enabled: value, imageUrl: "" };
  }
  if (typeof value === "number") {
    return { enabled: value !== 0, imageUrl: "" };
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const enabled =
      typeof obj.enabled === "boolean"
        ? obj.enabled
        : typeof obj.enabled === "number"
          ? obj.enabled !== 0
          : null;
    if (enabled === null) return null;
    const imageUrl =
      typeof obj.imageUrl === "string"
        ? obj.imageUrl
        : typeof obj.image_url === "string"
          ? obj.image_url
          : "";
    return { enabled, imageUrl };
  }
  return null;
}

export function normalizeSportScoringState(
  raw: Record<string, unknown> | null,
): SportScoringState {
  const state = { ...DEFAULT_SPORT_SCORING_STATE };
  if (!raw) return state;

  for (const def of SPORT_SCORING_DEFINITIONS) {
    const entry = parseEntry(raw[def.key]);
    if (entry) state[def.key] = entry;
  }
  return state;
}

export function sportScoringStateToFlags(state: SportScoringState): SportScoringFlags {
  return Object.fromEntries(
    SPORT_SCORING_DEFINITIONS.map((d) => [d.key, state[d.key].enabled]),
  ) as SportScoringFlags;
}

/** @deprecated Use normalizeSportScoringState */
export function normalizeSportScoringFlags(
  raw: Record<string, unknown> | null,
): SportScoringFlags {
  return sportScoringStateToFlags(normalizeSportScoringState(raw));
}

export function sportScoringStateToRtdbUpdate(
  state: SportScoringState,
): Record<string, SportScoringEntry> {
  return Object.fromEntries(
    SPORT_SCORING_DEFINITIONS.map((d) => [d.key, state[d.key]]),
  ) as Record<string, SportScoringEntry>;
}
