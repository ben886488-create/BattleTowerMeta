export type RankMatchResult = "win" | "loss" | "draw";

export type RankBallTier = "newbie" | "pokeball" | "greatball" | "ultraball" | "masterball";

export interface RankTierDefinition {
  id: string;
  ball: RankBallTier;
  floor: number;
  ceiling: number | null;
  winPoints: number;
  lossPenalty: number;
  protectedFloor: boolean;
  labelZh: string;
  labelEn: string;
}

export interface RankTrackerMatch {
  id: string;
  remoteLogId?: string | null;
  playerDeck: string;
  opponentDeck: string;
  result: RankMatchResult;
  createdAt: string;
}

export interface RankTrackerState {
  version: number;
  startPoints: number;
  startWins: number;
  startLosses: number;
  startStreak: number;
  currentPlayerDeck: string;
  lastOpponentDeck: string;
  matches: RankTrackerMatch[];
}

export interface RankTrackerComputedMatch extends RankTrackerMatch {
  index: number;
  pointsBefore: number;
  pointsAfter: number;
  delta: number;
  streakBefore: number;
  streakAfter: number;
  bonus: number;
}

export interface RankTrackerDeckSummary {
  key: string;
  name: string;
  count: number;
  wins: number;
  losses: number;
  draws: number;
  games: number;
  winRate: number | null;
}

export interface RankTrackerMatchupSummary {
  key: string;
  playerDeck: string;
  opponentDeck: string;
  wins: number;
  losses: number;
  draws: number;
  games: number;
  winRate: number | null;
}

export interface RankTrackerAnalysis {
  currentPoints: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  currentStreak: number;
  currentTier: RankTierDefinition;
  nextTier: RankTierDefinition | null;
  nextWinGain: number;
  winRate: number | null;
  matches: RankTrackerComputedMatch[];
  playerDecks: RankTrackerDeckSummary[];
  opponentDecks: RankTrackerDeckSummary[];
  matchups: RankTrackerMatchupSummary[];
}

const RANK_LADDER: RankTierDefinition[] = [
  {
    id: "newbie-1",
    ball: "newbie",
    floor: 0,
    ceiling: 19,
    winPoints: 10,
    lossPenalty: 5,
    protectedFloor: true,
    labelZh: "\u65b0\u624b 1",
    labelEn: "Beginner 1",
  },
  {
    id: "newbie-2",
    ball: "newbie",
    floor: 20,
    ceiling: 49,
    winPoints: 10,
    lossPenalty: 5,
    protectedFloor: true,
    labelZh: "\u65b0\u624b 2",
    labelEn: "Beginner 2",
  },
  {
    id: "newbie-3",
    ball: "newbie",
    floor: 50,
    ceiling: 79,
    winPoints: 10,
    lossPenalty: 5,
    protectedFloor: true,
    labelZh: "\u65b0\u624b 3",
    labelEn: "Beginner 3",
  },
  {
    id: "newbie-4",
    ball: "newbie",
    floor: 80,
    ceiling: 109,
    winPoints: 10,
    lossPenalty: 5,
    protectedFloor: true,
    labelZh: "\u65b0\u624b 4",
    labelEn: "Beginner 4",
  },
  {
    id: "pokeball-1",
    ball: "pokeball",
    floor: 110,
    ceiling: 139,
    winPoints: 10,
    lossPenalty: 5,
    protectedFloor: true,
    labelZh: "\u7cbe\u9748\u7403 1",
    labelEn: "Poke Ball 1",
  },
  {
    id: "pokeball-2",
    ball: "pokeball",
    floor: 140,
    ceiling: 169,
    winPoints: 10,
    lossPenalty: 5,
    protectedFloor: true,
    labelZh: "\u7cbe\u9748\u7403 2",
    labelEn: "Poke Ball 2",
  },
  {
    id: "pokeball-3",
    ball: "pokeball",
    floor: 170,
    ceiling: 209,
    winPoints: 10,
    lossPenalty: 5,
    protectedFloor: true,
    labelZh: "\u7cbe\u9748\u7403 3",
    labelEn: "Poke Ball 3",
  },
  {
    id: "pokeball-4",
    ball: "pokeball",
    floor: 210,
    ceiling: 249,
    winPoints: 10,
    lossPenalty: 5,
    protectedFloor: true,
    labelZh: "\u7cbe\u9748\u7403 4",
    labelEn: "Poke Ball 4",
  },
  {
    id: "greatball-1",
    ball: "greatball",
    floor: 250,
    ceiling: 289,
    winPoints: 10,
    lossPenalty: 7,
    protectedFloor: true,
    labelZh: "\u9ad8\u7d1a\u7403 1",
    labelEn: "Great Ball 1",
  },
  {
    id: "greatball-2",
    ball: "greatball",
    floor: 290,
    ceiling: 329,
    winPoints: 10,
    lossPenalty: 7,
    protectedFloor: false,
    labelZh: "\u9ad8\u7d1a\u7403 2",
    labelEn: "Great Ball 2",
  },
  {
    id: "greatball-3",
    ball: "greatball",
    floor: 330,
    ceiling: 379,
    winPoints: 10,
    lossPenalty: 7,
    protectedFloor: false,
    labelZh: "\u9ad8\u7d1a\u7403 3",
    labelEn: "Great Ball 3",
  },
  {
    id: "greatball-4",
    ball: "greatball",
    floor: 380,
    ceiling: 439,
    winPoints: 10,
    lossPenalty: 7,
    protectedFloor: false,
    labelZh: "\u9ad8\u7d1a\u7403 4",
    labelEn: "Great Ball 4",
  },
  {
    id: "ultraball-1",
    ball: "ultraball",
    floor: 440,
    ceiling: 509,
    winPoints: 10,
    lossPenalty: 10,
    protectedFloor: true,
    labelZh: "\u8d85\u7d1a\u7403 1",
    labelEn: "Ultra Ball 1",
  },
  {
    id: "ultraball-2",
    ball: "ultraball",
    floor: 510,
    ceiling: 589,
    winPoints: 10,
    lossPenalty: 10,
    protectedFloor: false,
    labelZh: "\u8d85\u7d1a\u7403 2",
    labelEn: "Ultra Ball 2",
  },
  {
    id: "ultraball-3",
    ball: "ultraball",
    floor: 590,
    ceiling: 689,
    winPoints: 10,
    lossPenalty: 10,
    protectedFloor: false,
    labelZh: "\u8d85\u7d1a\u7403 3",
    labelEn: "Ultra Ball 3",
  },
  {
    id: "ultraball-4",
    ball: "ultraball",
    floor: 690,
    ceiling: 809,
    winPoints: 10,
    lossPenalty: 10,
    protectedFloor: false,
    labelZh: "\u8d85\u7d1a\u7403 4",
    labelEn: "Ultra Ball 4",
  },
  {
    id: "masterball",
    ball: "masterball",
    floor: 810,
    ceiling: null,
    winPoints: 10,
    lossPenalty: 10,
    protectedFloor: true,
    labelZh: "\u5927\u5e2b\u7403",
    labelEn: "Master Ball",
  },
];

const STORAGE_VERSION = 1;

export function createDefaultRankTrackerState(): RankTrackerState {
  return {
    version: STORAGE_VERSION,
    startPoints: 0,
    startWins: 0,
    startLosses: 0,
    startStreak: 0,
    currentPlayerDeck: "",
    lastOpponentDeck: "",
    matches: [],
  };
}

export function sanitizeRankTrackerState(input: unknown): RankTrackerState {
  const fallback = createDefaultRankTrackerState();
  if (!input || typeof input !== "object") return fallback;

  const source = input as Partial<RankTrackerState>;

  return {
    version: STORAGE_VERSION,
    startPoints: normalizeNumber(source.startPoints),
    startWins: normalizeNumber(source.startWins),
    startLosses: normalizeNumber(source.startLosses),
    startStreak: normalizeNumber(source.startStreak),
    currentPlayerDeck: normalizeDeckName(source.currentPlayerDeck),
    lastOpponentDeck: normalizeDeckName(source.lastOpponentDeck),
    matches: Array.isArray(source.matches)
      ? source.matches
          .map((item) => sanitizeMatch(item))
          .filter((item): item is RankTrackerMatch => Boolean(item))
      : [],
  };
}

export function getRankTier(points: number) {
  const safePoints = Math.max(0, Math.floor(points));
  for (let index = RANK_LADDER.length - 1; index >= 0; index -= 1) {
    const entry = RANK_LADDER[index];
    if (safePoints >= entry.floor) return entry;
  }
  return RANK_LADDER[0];
}

export function getNextTier(points: number) {
  const current = getRankTier(points);
  const index = RANK_LADDER.findIndex((entry) => entry.id === current.id);
  return index >= 0 && index < RANK_LADDER.length - 1 ? RANK_LADDER[index + 1] : null;
}

export function getStreakBonus(nextWinStreak: number) {
  if (nextWinStreak >= 5) return 12;
  if (nextWinStreak === 4) return 9;
  if (nextWinStreak === 3) return 6;
  if (nextWinStreak === 2) return 3;
  return 0;
}

export function getProjectedDelta(points: number, currentStreak: number, result: RankMatchResult) {
  const tier = getRankTier(points);

  if (result === "win") {
    return tier.winPoints + getStreakBonus(currentStreak + 1);
  }

  if (result === "draw") {
    return 0;
  }

  const rawNext = points - tier.lossPenalty;
  if (tier.protectedFloor && rawNext < tier.floor) {
    return tier.floor - points;
  }

  return -tier.lossPenalty;
}

export function analyzeRankTrackerState(state: RankTrackerState): RankTrackerAnalysis {
  let points = normalizeNumber(state.startPoints);
  let wins = normalizeNumber(state.startWins);
  let losses = normalizeNumber(state.startLosses);
  let draws = 0;
  let streak = normalizeNumber(state.startStreak);

  const computedMatches: RankTrackerComputedMatch[] = [];

  for (const [index, match] of state.matches.entries()) {
    const pointsBefore = points;
    const streakBefore = streak;
    const delta = getProjectedDelta(pointsBefore, streakBefore, match.result);
    const bonus = match.result === "win" ? getStreakBonus(streakBefore + 1) : 0;

    if (match.result === "win") {
      wins += 1;
      streak += 1;
      points += delta;
    } else if (match.result === "loss") {
      losses += 1;
      streak = 0;
      points = Math.max(0, points + delta);
    } else {
      draws += 1;
      streak = 0;
    }

    computedMatches.push({
      ...match,
      index: index + 1,
      pointsBefore,
      pointsAfter: points,
      delta,
      streakBefore,
      streakAfter: streak,
      bonus,
    });
  }

  const playerDeckMap = new Map<string, RankTrackerDeckSummary>();
  const opponentDeckMap = new Map<string, RankTrackerDeckSummary>();
  const matchupMap = new Map<string, RankTrackerMatchupSummary>();

  for (const match of computedMatches) {
    const playerKey = summaryKey(match.playerDeck);
    const opponentKey = summaryKey(match.opponentDeck);
    const matchupKey = `${playerKey}__${opponentKey}`;

    const playerSummary =
      playerDeckMap.get(playerKey) ??
      createDeckSummary(match.playerDeck || "Unknown deck", playerKey);
    const opponentSummary =
      opponentDeckMap.get(opponentKey) ??
      createDeckSummary(match.opponentDeck || "Unknown deck", opponentKey);
    const matchupSummary =
      matchupMap.get(matchupKey) ??
      createMatchupSummary(match.playerDeck || "Unknown deck", match.opponentDeck || "Unknown deck");

    applyResultToSummary(playerSummary, match.result);
    applyResultToSummary(opponentSummary, match.result, true);
    applyResultToMatchup(matchupSummary, match.result);

    playerDeckMap.set(playerKey, playerSummary);
    opponentDeckMap.set(opponentKey, opponentSummary);
    matchupMap.set(matchupKey, matchupSummary);
  }

  const currentTier = getRankTier(points);
  const nextTier = getNextTier(points);

  return {
    currentPoints: points,
    totalWins: wins,
    totalLosses: losses,
    totalDraws: draws,
    currentStreak: streak,
    currentTier,
    nextTier,
    nextWinGain: getProjectedDelta(points, streak, "win"),
    winRate: wins + losses > 0 ? wins / (wins + losses) : null,
    matches: computedMatches.slice().reverse(),
    playerDecks: [...playerDeckMap.values()].sort(sortDeckSummaries),
    opponentDecks: [...opponentDeckMap.values()].sort(sortDeckSummaries),
    matchups: [...matchupMap.values()].sort(sortMatchups),
  };
}

function normalizeNumber(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.floor(numeric));
}

function normalizeDeckName(value: unknown) {
  return String(value ?? "").trim().slice(0, 80);
}

function sanitizeMatch(input: unknown): RankTrackerMatch | null {
  if (!input || typeof input !== "object") return null;
  const source = input as Partial<RankTrackerMatch>;
  const result = source.result === "win" || source.result === "loss" || source.result === "draw"
    ? source.result
    : null;
  const playerDeck = normalizeDeckName(source.playerDeck);
  const opponentDeck = normalizeDeckName(source.opponentDeck);

  if (!result || !playerDeck || !opponentDeck) return null;

  return {
    id: String(source.id ?? `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
    remoteLogId: typeof source.remoteLogId === "string" && source.remoteLogId.trim() ? source.remoteLogId.trim() : null,
    playerDeck,
    opponentDeck,
    result,
    createdAt: String(source.createdAt ?? new Date().toISOString()),
  };
}

function summaryKey(value: string) {
  return String(value ?? "").trim().toLowerCase();
}

function createDeckSummary(name: string, key: string): RankTrackerDeckSummary {
  return {
    key,
    name,
    count: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    games: 0,
    winRate: null,
  };
}

function createMatchupSummary(playerDeck: string, opponentDeck: string): RankTrackerMatchupSummary {
  return {
    key: `${summaryKey(playerDeck)}__${summaryKey(opponentDeck)}`,
    playerDeck,
    opponentDeck,
    wins: 0,
    losses: 0,
    draws: 0,
    games: 0,
    winRate: null,
  };
}

function applyResultToSummary(
  summary: RankTrackerDeckSummary,
  result: RankMatchResult,
  invert = false,
) {
  summary.count += 1;
  summary.games += 1;

  if (result === "win") {
    if (invert) summary.losses += 1;
    else summary.wins += 1;
  } else if (result === "loss") {
    if (invert) summary.wins += 1;
    else summary.losses += 1;
  } else {
    summary.draws += 1;
  }

  summary.winRate = summary.wins + summary.losses > 0 ? summary.wins / (summary.wins + summary.losses) : null;
}

function applyResultToMatchup(summary: RankTrackerMatchupSummary, result: RankMatchResult) {
  summary.games += 1;

  if (result === "win") summary.wins += 1;
  else if (result === "loss") summary.losses += 1;
  else summary.draws += 1;

  summary.winRate = summary.wins + summary.losses > 0 ? summary.wins / (summary.wins + summary.losses) : null;
}

function sortDeckSummaries(a: RankTrackerDeckSummary, b: RankTrackerDeckSummary) {
  return b.count - a.count || b.wins - a.wins || a.name.localeCompare(b.name);
}

function sortMatchups(a: RankTrackerMatchupSummary, b: RankTrackerMatchupSummary) {
  return b.games - a.games || (b.winRate ?? -1) - (a.winRate ?? -1) || a.opponentDeck.localeCompare(b.opponentDeck);
}
