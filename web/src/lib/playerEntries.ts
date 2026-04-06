const BASE_URL = (import.meta as any).env?.BASE_URL ?? "/";

export type TopCutFilter = "" | "winner" | "top2" | "top4" | "top8" | "top16" | "top32";
export type TimeFilterValue = "all" | "past7" | "prev7" | "past4w" | string;

export interface GameVersion {
  code: string;
  nameZh: string;
  nameEn: string;
  releaseUtcIso: string;
  releaseMs: number;
}

export interface PlayerEntry {
  player: string;
  playerSlug?: string;
  country?: string;
  points: number;
  placing: number | null;
  tournamentId: string;
  tournamentName: string;
  tournamentDate?: string;
  tournamentPlayers?: number | null;
  matchesUrl?: string;
  deckId?: string;
  deckName?: string;
  deckIcons?: string[];
  wins?: number;
  losses?: number;
  ties?: number;
  drop?: unknown;
}

export interface DecoratedPlayerEntry extends PlayerEntry {
  startMs: number;
  versionCode: string;
  versionLabelZh: string;
  versionLabelEn: string;
}

export const GAME_VERSIONS: GameVersion[] = [
  { code: "A1", nameZh: "最強的基因", nameEn: "Genetic Apex", releaseUtcIso: "2024-10-30T01:00:00Z", releaseMs: Date.parse("2024-10-30T01:00:00Z") },
  { code: "A1a", nameZh: "幻遊島", nameEn: "Mythical Island", releaseUtcIso: "2024-12-17T06:00:00Z", releaseMs: Date.parse("2024-12-17T06:00:00Z") },
  { code: "A2", nameZh: "時空激鬥", nameEn: "Space-Time Smackdown", releaseUtcIso: "2025-01-30T06:00:00Z", releaseMs: Date.parse("2025-01-30T06:00:00Z") },
  { code: "A2a", nameZh: "超克之光", nameEn: "Triumphant Light", releaseUtcIso: "2025-02-28T06:00:00Z", releaseMs: Date.parse("2025-02-28T06:00:00Z") },
  { code: "A2b", nameZh: "嗨放異彩", nameEn: "Shining Revelry", releaseUtcIso: "2025-03-27T06:00:00Z", releaseMs: Date.parse("2025-03-27T06:00:00Z") },
  { code: "A3", nameZh: "雙天之守護者", nameEn: "Celestial Guardians", releaseUtcIso: "2025-04-30T06:00:00Z", releaseMs: Date.parse("2025-04-30T06:00:00Z") },
  { code: "A3a", nameZh: "異次元危機", nameEn: "Extradimensional Crisis", releaseUtcIso: "2025-05-29T06:00:00Z", releaseMs: Date.parse("2025-05-29T06:00:00Z") },
  { code: "A3b", nameZh: "伊布花園", nameEn: "Eevee Grove", releaseUtcIso: "2025-06-26T06:00:00Z", releaseMs: Date.parse("2025-06-26T06:00:00Z") },
  { code: "A4", nameZh: "智慧海與天", nameEn: "Wisdom of Sea and Sky", releaseUtcIso: "2025-07-30T06:00:00Z", releaseMs: Date.parse("2025-07-30T06:00:00Z") },
  { code: "A4a", nameZh: "隱世秘泉", nameEn: "Secluded Springs", releaseUtcIso: "2025-08-28T06:00:00Z", releaseMs: Date.parse("2025-08-28T06:00:00Z") },
  { code: "A4b", nameZh: "豪華包ex", nameEn: "Deluxe Pack: ex", releaseUtcIso: "2025-09-30T06:00:00Z", releaseMs: Date.parse("2025-09-30T06:00:00Z") },
  { code: "B1", nameZh: "超級進化", nameEn: "Mega Rising", releaseUtcIso: "2025-10-30T06:00:00Z", releaseMs: Date.parse("2025-10-30T06:00:00Z") },
  { code: "B1a", nameZh: "盛放火焰", nameEn: "Crimson Blaze", releaseUtcIso: "2025-12-17T06:00:00Z", releaseMs: Date.parse("2025-12-17T06:00:00Z") },
  { code: "B2", nameZh: "幻遊奇境", nameEn: "Fantastical Parade", releaseUtcIso: "2026-01-29T01:00:00Z", releaseMs: Date.parse("2026-01-29T01:00:00Z") },
  { code: "B2a", nameZh: "帕底亞的冒險", nameEn: "Paldean Wonders", releaseUtcIso: "2026-02-26T01:00:00Z", releaseMs: Date.parse("2026-02-26T01:00:00Z") },
  { code: "B2b", nameZh: "超級異彩", nameEn: "Mega Shine", releaseUtcIso: "2026-03-26T01:00:00Z", releaseMs: Date.parse("2026-03-26T01:00:00Z") },
].sort((a, b) => a.releaseMs - b.releaseMs);

export const VERSION_BY_CODE: Record<string, GameVersion> = Object.fromEntries(
  GAME_VERSIONS.map((version) => [version.code, version]),
);

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return (await res.json()) as T;
}

export function parseMs(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function inferVersionByStartMs(startMs: number): GameVersion | undefined {
  if (!startMs) return undefined;
  let current: GameVersion | undefined;
  for (const version of GAME_VERSIONS) {
    if (startMs >= version.releaseMs) current = version;
    else break;
  }
  return current;
}

function fallbackPlayerSlug(player: string): string {
  const base = player
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "player";
}

function decorateEntry(entry: PlayerEntry): DecoratedPlayerEntry {
  const startMs = parseMs(entry.tournamentDate);
  const version = inferVersionByStartMs(startMs);
  const versionCode = version?.code ?? "";
  return {
    ...entry,
    playerSlug: entry.playerSlug || fallbackPlayerSlug(entry.player),
    startMs,
    versionCode,
    versionLabelZh: version ? `${version.code} - ${version.nameZh}` : "",
    versionLabelEn: version ? `${version.code} - ${version.nameEn}` : "",
  };
}

export async function loadPlayerEntries(): Promise<DecoratedPlayerEntry[]> {
  const primary = `${BASE_URL}data/player_entries.json`;
  const fallback = new URL("../data/player_entries.json", import.meta.url).toString();
  const rows = await fetchJson<PlayerEntry[]>(primary).catch(() => fetchJson<PlayerEntry[]>(fallback));
  return Array.isArray(rows) ? rows.map(decorateEntry) : [];
}

export function matchesTopCut(placing: number | null | undefined, filter: TopCutFilter): boolean {
  if (!filter) return true;
  if (placing == null || !Number.isFinite(placing)) return false;
  if (filter === "winner") return placing === 1;
  if (filter === "top2") return placing <= 2;
  if (filter === "top4") return placing <= 4;
  if (filter === "top8") return placing <= 8;
  if (filter === "top16") return placing <= 16;
  if (filter === "top32") return placing <= 32;
  return true;
}

export function inTimeRange(startMs: number, value: TimeFilterValue): boolean {
  if (value === "all") return true;
  if (!startMs) return false;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (value === "past7") return startMs >= now - 7 * day;
  if (value === "prev7") return startMs >= now - 14 * day && startMs < now - 7 * day;
  if (value === "past4w") return startMs >= now - 28 * day;
  if (value.startsWith("month:")) {
    const ym = value.slice("month:".length);
    const [yearText, monthText] = ym.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) return true;
    const start = Date.UTC(year, month - 1, 1, 0, 0, 0);
    const end = Date.UTC(year, month, 1, 0, 0, 0);
    return startMs >= start && startMs < end;
  }
  return true;
}

export function filterPlayerEntries(
  entries: DecoratedPlayerEntry[],
  options: {
    playerKeyword?: string;
    time?: TimeFilterValue;
    set?: string;
    topCut?: TopCutFilter;
  },
): DecoratedPlayerEntry[] {
  const keyword = String(options.playerKeyword ?? "").trim().toLowerCase();
  const time = options.time ?? "all";
  const set = String(options.set ?? "").trim();
  const topCut = options.topCut ?? "";

  return entries.filter((entry) => {
    if (keyword && !entry.player.toLowerCase().includes(keyword)) return false;
    if (!inTimeRange(entry.startMs, time)) return false;
    if (set && entry.versionCode !== set) return false;
    if (!matchesTopCut(entry.placing, topCut)) return false;
    return true;
  });
}

export function compareText(a: string, b: string): number {
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

