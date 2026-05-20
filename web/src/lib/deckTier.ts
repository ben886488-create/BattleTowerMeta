export const TIER_EMA_HALF_LIFE_DAYS = 7;

export const TIER_SCORE_WEIGHTS = {
  top32: 0.34,
  weightedPoints: 0.425,
  top32Share: 0.085,
  emaTrend: 0.15,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export type TierScoreParts = {
  top32?: number;
  weightedPoints?: number;
  top32Share?: number;
  emaTrend?: number;
};

export type TierEmaInput = {
  dayMs: number;
  deckKey: string;
  top32Count?: number;
  weightedPoints?: number;
};

function safeNumber(value: number | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function calculateTierScore(parts: TierScoreParts) {
  return (
    TIER_SCORE_WEIGHTS.top32 * safeNumber(parts.top32) +
    TIER_SCORE_WEIGHTS.weightedPoints * safeNumber(parts.weightedPoints) +
    TIER_SCORE_WEIGHTS.top32Share * safeNumber(parts.top32Share) +
    TIER_SCORE_WEIGHTS.emaTrend * safeNumber(parts.emaTrend)
  );
}

export function buildTierDailySignal(top32Count: number, weightedPoints: number, top32SharePct: number) {
  return (
    0.4 * Math.log1p(Math.max(0, top32Count)) +
    0.5 * Math.log1p(Math.max(0, weightedPoints)) +
    0.1 * Math.log1p(Math.max(0, top32SharePct))
  );
}

export function buildTierEmaScores(
  deckKeys: Iterable<string>,
  records: TierEmaInput[],
  halfLifeDays = TIER_EMA_HALF_LIFE_DAYS,
): Record<string, number> {
  const keys = [...new Set([...deckKeys].map((key) => String(key ?? "").trim()).filter(Boolean))];
  if (keys.length === 0) return {};

  const daily = new Map<number, Map<string, { top32Count: number; weightedPoints: number }>>();
  const dailyTop32Totals = new Map<number, number>();

  for (const record of records) {
    const deckKey = String(record.deckKey ?? "").trim();
    const dayMs = Number(record.dayMs);
    if (!deckKey || !Number.isFinite(dayMs)) continue;

    const day = Math.floor(dayMs / DAY_MS) * DAY_MS;
    const top32Count = Math.max(0, Number(record.top32Count ?? 0));
    const weightedPoints = Math.max(0, Number(record.weightedPoints ?? 0));

    if (top32Count <= 0 && weightedPoints <= 0) continue;

    let dayMap = daily.get(day);
    if (!dayMap) {
      dayMap = new Map();
      daily.set(day, dayMap);
    }

    const item = dayMap.get(deckKey) ?? { top32Count: 0, weightedPoints: 0 };
    item.top32Count += top32Count;
    item.weightedPoints += weightedPoints;
    dayMap.set(deckKey, item);
    dailyTop32Totals.set(day, (dailyTop32Totals.get(day) ?? 0) + top32Count);
  }

  const ema = Object.fromEntries(keys.map((key) => [key, 0])) as Record<string, number>;
  const days = [...daily.keys()].sort((a, b) => a - b);
  if (days.length === 0) return ema;

  let previousDay: number | null = null;
  const safeHalfLifeDays = Number.isFinite(halfLifeDays) && halfLifeDays > 0 ? halfLifeDays : TIER_EMA_HALF_LIFE_DAYS;

  for (const day of days) {
    const dayMap = daily.get(day) ?? new Map();
    const totalTop32 = dailyTop32Totals.get(day) ?? 0;
    const deltaDays = previousDay == null ? 0 : Math.max(1, (day - previousDay) / DAY_MS);
    const alpha = previousDay == null ? 1 : 1 - Math.pow(0.5, deltaDays / safeHalfLifeDays);

    for (const key of keys) {
      const item = dayMap.get(key);
      const top32Count = item?.top32Count ?? 0;
      const weightedPoints = item?.weightedPoints ?? 0;
      const top32SharePct = totalTop32 > 0 ? (top32Count / totalTop32) * 100 : 0;
      const signal = buildTierDailySignal(top32Count, weightedPoints, top32SharePct);
      ema[key] = previousDay == null ? signal : alpha * signal + (1 - alpha) * ema[key];
    }

    previousDay = day;
  }

  return ema;
}

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
