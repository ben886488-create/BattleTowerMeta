export function resolveDeckTier(score: number, nextScoreGap: number, isLeader = false) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const safeGap = Number.isFinite(nextScoreGap) ? nextScoreGap : 0;

  if (safeScore <= 0.1) return "F";
  if (safeScore <= 0.3) return "E";
  if (safeScore <= 0.5) return "D";
  if (safeScore <= 0.7) return "C";
  if (safeScore <= 0.8) return "B";
  if (safeScore <= 0.9) return "A";

  if (!isLeader) return "S";
  if (safeGap > 0.1) return "SSS";
  if (safeGap > 0.05) return "SS";
  return "S";
}
