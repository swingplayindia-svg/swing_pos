import { getAdminRtdb } from "@/lib/firebase-admin";
import {
  DEFAULT_SPORT_SCORING_STATE,
  normalizeSportScoringState,
  SPORT_SCORING_DEFINITIONS,
  sportScoringStateToFlags,
  sportScoringStateToRtdbUpdate,
  type SportScoringFlags,
  type SportScoringEntry,
  type SportScoringKey,
  type SportScoringState,
} from "@/lib/sports-scoring-schema";

const PATH = "ongis_sports_scoring";

function scoringRef() {
  return getAdminRtdb().ref(PATH);
}

export async function fetchSportScoringAdmin(): Promise<SportScoringState> {
  const snap = await scoringRef().get();
  return normalizeSportScoringState(
    snap.val() as Record<string, unknown> | null,
  );
}

/** @deprecated Use fetchSportScoringAdmin */
export async function fetchSportScoringFlagsAdmin(): Promise<SportScoringFlags> {
  return sportScoringStateToFlags(await fetchSportScoringAdmin());
}

async function writeSportEntry(
  key: SportScoringKey,
  patch: Partial<SportScoringEntry>,
): Promise<void> {
  const current = await fetchSportScoringAdmin();
  const next = {
    ...current[key],
    ...patch,
  };
  await scoringRef().child(key).set(next);
}

export async function setSportScoringEnabledAdmin(
  key: SportScoringKey,
  enabled: boolean,
): Promise<void> {
  await writeSportEntry(key, { enabled });
}

export async function setSportScoringImageUrlAdmin(
  key: SportScoringKey,
  imageUrl: string,
): Promise<void> {
  await writeSportEntry(key, { imageUrl });
}

export async function saveAllSportScoringAdmin(
  state: SportScoringState,
): Promise<void> {
  await scoringRef().update(sportScoringStateToRtdbUpdate(state));
}

/** @deprecated Use saveAllSportScoringAdmin */
export async function saveAllSportScoringFlagsAdmin(
  flags: SportScoringFlags,
): Promise<void> {
  const current = await fetchSportScoringAdmin();
  const next = { ...current };
  for (const def of SPORT_SCORING_DEFINITIONS) {
    next[def.key] = { ...next[def.key], enabled: flags[def.key] };
  }
  await saveAllSportScoringAdmin(next);
}

export async function seedDefaultSportScoringAdmin(): Promise<void> {
  await scoringRef().update(sportScoringStateToRtdbUpdate(DEFAULT_SPORT_SCORING_STATE));
}

/** @deprecated Use seedDefaultSportScoringAdmin */
export const seedDefaultSportScoringFlagsAdmin = seedDefaultSportScoringAdmin;

export async function disableAllSportScoringAdmin(): Promise<void> {
  const current = await fetchSportScoringAdmin();
  const next = { ...current };
  for (const def of SPORT_SCORING_DEFINITIONS) {
    next[def.key] = { ...next[def.key], enabled: false };
  }
  await saveAllSportScoringAdmin(next);
}
