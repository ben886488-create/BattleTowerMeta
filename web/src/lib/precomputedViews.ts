import { loadPublicJson } from "./publicData";

export interface PrecomputedTopDeckRow {
  key: string;
  rawName: string;
  iconKeys: string[];
  sortName?: string;
  allSamples: number;
  baselineTop32Samples: number;
  weightedPoints: number;
  baselineTop32SharePct: number;
  emaScore?: number;
  selectedSamples: number;
  topCutShare: number;
  winRate: number | null;
  score: number;
  tier: string;
  baseRank: number;
}

export interface PrecomputedTopDeckScope {
  tournamentCount: number;
  totalAllSamples: number;
  totalSelectedSamples: number;
  rows: PrecomputedTopDeckRow[];
  matchups?: Array<{
    deckA: string;
    deckB: string;
    winsA: number;
    lossesA: number;
    ties: number;
    total: number;
    winrateA: number;
  }>;
}

export interface PrecomputedTopDecksPayload {
  schemaVersion: number;
  generatedAt: string;
  generatedAtMs: number;
  currentVersionCode: string;
  versionCodes: string[];
  scopes: Record<string, PrecomputedTopDeckScope>;
}

export interface PrecomputedDeckProfileScope {
  tournamentCount: number;
  analytics: Record<string, any>;
  tierRow?: Record<string, any> | null;
}

export interface PrecomputedDeckProfilePayload {
  schemaVersion: number;
  generatedAt: string;
  generatedAtMs: number;
  deckKey: string;
  scopes: Record<string, PrecomputedDeckProfileScope>;
}

function minPlayersKey(minPlayers?: number | null) {
  return minPlayers != null && Number.isFinite(minPlayers) && minPlayers > 0
    ? String(minPlayers)
    : "";
}

export function buildTopDecksScopeKey(input: {
  time: string;
  set?: string;
  topCut: string;
  minPlayers?: number | null;
}) {
  return [
    `time=${input.time}`,
    `set=${input.set ?? ""}`,
    `topCut=${input.topCut}`,
    `minPlayers=${minPlayersKey(input.minPlayers)}`,
  ].join("|");
}

export function buildDeckProfileScopeKey(input: {
  set?: string;
  time: string;
  topCut: string;
  minPlayers?: number | null;
}) {
  return [
    `set=${input.set ?? ""}`,
    `time=${input.time}`,
    `topCut=${input.topCut}`,
    `minPlayers=${minPlayersKey(input.minPlayers)}`,
  ].join("|");
}

export function loadTopDecksPrecomputed() {
  return loadPublicJson<PrecomputedTopDecksPayload>("data/precomputed/top_decks.json");
}

export function loadDeckProfilePrecomputed(deckKey: string) {
  const safeKey = encodeURIComponent(String(deckKey ?? "").trim());
  if (!safeKey) {
    return Promise.reject(new Error("Missing deck key"));
  }
  return loadPublicJson<PrecomputedDeckProfilePayload>(
    `data/precomputed/deck_profiles/${safeKey}.json`,
  );
}
