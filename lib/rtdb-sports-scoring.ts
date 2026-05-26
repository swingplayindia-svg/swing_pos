/**
 * @deprecated Client RTDB writes are blocked by rules. Use rtdb-sports-scoring-api.
 */
export {
  disableAllSportScoring,
  disableAllSportScoringFlags,
  fetchSportScoring,
  fetchSportScoringFlags,
  saveAllSportScoring,
  saveAllSportScoringFlags,
  seedDefaultSportScoring,
  seedDefaultSportScoringFlags,
  setSportScoringEnabled,
  setSportScoringImageUrl,
} from "@/lib/rtdb-sports-scoring-api";
