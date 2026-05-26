/** RTDB path: ongis_sports_scoring/{key} = boolean */

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
  | "table_tennis";

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
  { key: "tennis", label: "Tennis", group: "Explore more" },
  { key: "volleyball", label: "Volleyball", group: "Explore more" },
  { key: "cricket", label: "Cricket", group: "Explore more" },
  { key: "golf", label: "Golf", group: "Explore more" },
  { key: "table_tennis", label: "Table Tennis", group: "Explore more" },
];

export const DEFAULT_SPORT_SCORING_FLAGS: SportScoringFlags = {
  padel: false,
  basketball: false,
  soccer: false,
  badminton: false,
  pickleball: false,
  tennis: false,
  volleyball: false,
  cricket: false,
  golf: false,
  table_tennis: false,
};

export function normalizeSportScoringFlags(
  raw: Record<string, unknown> | null,
): SportScoringFlags {
  const flags = { ...DEFAULT_SPORT_SCORING_FLAGS };
  if (!raw) return flags;

  for (const def of SPORT_SCORING_DEFINITIONS) {
    const value = raw[def.key];
    if (typeof value === "boolean") {
      flags[def.key] = value;
    } else if (typeof value === "number") {
      flags[def.key] = value !== 0;
    }
  }
  return flags;
}
