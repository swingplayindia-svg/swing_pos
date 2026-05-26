import { getAdminRtdb } from "@/lib/firebase-admin";
import {
  DEFAULT_SPORT_SCORING_FLAGS,
  normalizeSportScoringFlags,
  type SportScoringFlags,
  type SportScoringKey,
} from "@/lib/sports-scoring-schema";

const PATH = "ongis_sports_scoring";

function scoringRef() {
  return getAdminRtdb().ref(PATH);
}

export async function fetchSportScoringFlagsAdmin(): Promise<SportScoringFlags> {
  const snap = await scoringRef().get();
  return normalizeSportScoringFlags(
    snap.val() as Record<string, unknown> | null,
  );
}

export async function setSportScoringEnabledAdmin(
  key: SportScoringKey,
  enabled: boolean,
): Promise<void> {
  await scoringRef().update({ [key]: enabled });
}

export async function saveAllSportScoringFlagsAdmin(
  flags: SportScoringFlags,
): Promise<void> {
  await scoringRef().update({ ...flags });
}

export async function seedDefaultSportScoringFlagsAdmin(): Promise<void> {
  await scoringRef().update({ ...DEFAULT_SPORT_SCORING_FLAGS });
}
