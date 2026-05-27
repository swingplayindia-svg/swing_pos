/**
 * RTDB:
 *   onboarding_fandoms/{fandomId} => { name, imageUrl, enabled, order }
 *   onboarding_content/{screenKey} => { title?, subtitle?, options: [{ id?, title, subtitle?, imageUrl? }] }
 */

export type OnboardingFandom = {
  id: string;
  name: string;
  imageUrl: string;
  enabled: boolean;
  order: number;
};

export type OnboardingContentOption = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
};

export type OnboardingScreenContent = {
  title: string;
  subtitle: string;
  options: OnboardingContentOption[];
};

export const DEFAULT_SCREEN_CONTENT: OnboardingScreenContent = {
  title: "",
  subtitle: "",
  options: [],
};

export const SUGGESTED_SCREEN_KEYS = [
  "choose_sports",
  "choose_primary_sport",
  "upload_photo",
  "level_and_fandom",
  "favorite_team",
  "what_are_you_here_for",
  "lets_brief_it",
  "vibe_quiz",
  "personality_quiz",
  "final_touch",
  "login",
] as const;

export function normalizeScreenContent(
  raw: unknown,
): OnboardingScreenContent {
  const base = { ...DEFAULT_SCREEN_CONTENT };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const obj = raw as Record<string, unknown>;

  const title = typeof obj.title === "string" ? obj.title : "";
  const subtitle = typeof obj.subtitle === "string" ? obj.subtitle : "";
  const optionsRaw = Array.isArray(obj.options) ? obj.options : [];
  const options: OnboardingContentOption[] = optionsRaw
    .map((it, idx) => {
      if (!it || typeof it !== "object" || Array.isArray(it)) return null;
      const o = it as Record<string, unknown>;
      const id = typeof o.id === "string" && o.id.trim() ? o.id.trim() : String(idx);
      const t = typeof o.title === "string" ? o.title.trim() : "";
      if (!t) return null;
      const sub = typeof o.subtitle === "string" ? o.subtitle : "";
      const url = typeof o.imageUrl === "string" ? o.imageUrl : "";
      return { id, title: t, subtitle: sub, imageUrl: url };
    })
    .filter(Boolean) as OnboardingContentOption[];

  return { title, subtitle, options };
}

export function normalizeFandoms(raw: unknown): OnboardingFandom[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const dict = raw as Record<string, unknown>;
  const out: OnboardingFandom[] = [];
  for (const [id, v] of Object.entries(dict)) {
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const o = v as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    if (!name) continue;
    const imageUrl = typeof o.imageUrl === "string" ? o.imageUrl : "";
    const enabled =
      typeof o.enabled === "boolean"
        ? o.enabled
        : typeof o.enabled === "number"
          ? o.enabled !== 0
          : true;
    const order =
      typeof o.order === "number"
        ? o.order
        : typeof o.order === "string"
          ? Number(o.order) || 0
          : 0;
    out.push({ id, name, imageUrl, enabled, order });
  }
  return out.sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
}

