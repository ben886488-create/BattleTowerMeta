import type {
  ChampionsCacheFormat,
  ChampionsMetaCache,
  ChampionsPokemonCacheItem,
  ChampionsPokemonDetailCache,
  ChampionsSyncStatusCache,
  ChampionsTeamCacheItem,
  ChampionsTournamentCacheItem,
  ChampionsUsageCacheItem,
} from "./championsCacheTypes";

export type PokemonRankingQuery = {
  season?: string;
  format?: string;
  q?: string;
  type?: string;
  sort?: "usage" | "speed" | "totalStats" | "rank" | "name";
};

export type ChampionsUsageQuery = {
  season?: string;
  format?: string;
};

export type ChampionsTeamQuery = {
  season?: string;
  format?: string;
  pokemon?: string;
};

export type ChampionsCacheReadOptions = {
  strict?: boolean;
};

const BASE_URL = import.meta.env.BASE_URL || "/";
const cache = new Map<string, Promise<unknown>>();

export function getChampionsMeta(
  options: ChampionsCacheReadOptions = {},
): Promise<ChampionsMetaCache | null> {
  return readCacheJson<ChampionsMetaCache | null>("meta.json", null, options);
}

export function getChampionsSyncStatus(
  options: ChampionsCacheReadOptions = {},
): Promise<ChampionsSyncStatusCache | null> {
  return readCacheJson<ChampionsSyncStatusCache | null>("sync-status.json", null, options);
}

export async function getPokemonRankings(
  query: PokemonRankingQuery = {},
  options: ChampionsCacheReadOptions = {},
): Promise<ChampionsPokemonCacheItem[]> {
  const [items, meta] = await Promise.all([
    readCacheJson<ChampionsPokemonCacheItem[]>("pokemon.json", [], options),
    getChampionsMeta(options),
  ]);
  const format = normalizeFormat(query.format);
  const q = query.q?.trim().toLocaleLowerCase() ?? "";
  const type = query.type?.trim().toLocaleLowerCase() ?? "";

  let rows = items.filter((item) => {
    if (query.season && item.season !== query.season) return false;
    if (format && item.format !== format) return false;
    if (q && !`${item.name} ${item.baseName} ${item.savedName}`.toLocaleLowerCase().includes(q)) return false;
    if (type && !item.types.some((entry) => entry.toLocaleLowerCase() === type)) return false;
    return true;
  });

  if (!format) {
    const preferredFormat = meta?.formats[0] ?? "Doubles";
    const bySlug = new Map<string, ChampionsPokemonCacheItem>();
    for (const item of rows) {
      const current = bySlug.get(item.slug);
      if (!current || shouldReplacePokemon(current, item, preferredFormat)) bySlug.set(item.slug, item);
    }
    rows = [...bySlug.values()];
  }

  return rows.sort(pokemonSorter(query.sort ?? "rank"));
}

export function getPokemonDetail(
  slug: string,
  options: ChampionsCacheReadOptions = {},
): Promise<ChampionsPokemonDetailCache | null> {
  const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!normalizedSlug) return Promise.resolve(null);
  return readCacheJson<ChampionsPokemonDetailCache | null>(`pokemon-details/${normalizedSlug}.json`, null, options);
}

export async function getMoveRankings(
  query: ChampionsUsageQuery = {},
  options: ChampionsCacheReadOptions = {},
): Promise<ChampionsUsageCacheItem[]> {
  return filterUsageRows(await readCacheJson<ChampionsUsageCacheItem[]>("moves.json", [], options), query);
}

export async function getItemRankings(
  query: ChampionsUsageQuery = {},
  options: ChampionsCacheReadOptions = {},
): Promise<ChampionsUsageCacheItem[]> {
  return filterUsageRows(await readCacheJson<ChampionsUsageCacheItem[]>("items.json", [], options), query);
}

export async function getTeamReferences(
  query: ChampionsTeamQuery = {},
  options: ChampionsCacheReadOptions = {},
): Promise<ChampionsTeamCacheItem[]> {
  const pokemon = query.pokemon?.trim().toLocaleLowerCase() ?? "";
  const format = query.format?.trim().toLocaleLowerCase() ?? "";
  return (await readCacheJson<ChampionsTeamCacheItem[]>("teams.json", [], options))
    .filter((team) => {
      if (query.season && team.season !== query.season) return false;
      if (format && format !== "all" && team.format.toLocaleLowerCase() !== format) return false;
      return !pokemon || team.pokemon.some((entry) => entry.name.toLocaleLowerCase().includes(pokemon));
    })
    .sort((a, b) => compareNullableNumber(a.placing, b.placing));
}

export function getChampionsTournaments(
  options: ChampionsCacheReadOptions = {},
): Promise<ChampionsTournamentCacheItem[]> {
  return readCacheJson<ChampionsTournamentCacheItem[]>("tournaments.json", [], options);
}

export function clearChampionsDataCache(): void {
  cache.clear();
}

function filterUsageRows(
  rows: ChampionsUsageCacheItem[],
  query: ChampionsUsageQuery,
): ChampionsUsageCacheItem[] {
  const format = normalizeFormat(query.format);
  return rows
    .filter((item) => {
      if (query.season && item.season !== query.season) return false;
      return !format || item.format === format;
    })
    .sort((a, b) => compareNullableDescending(a.usage, b.usage) || a.name.localeCompare(b.name));
}

function normalizeFormat(value: string | undefined): ChampionsCacheFormat | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "singles") return "Singles";
  if (normalized === "doubles") return "Doubles";
  return null;
}

function shouldReplacePokemon(
  current: ChampionsPokemonCacheItem,
  candidate: ChampionsPokemonCacheItem,
  preferredFormat: ChampionsCacheFormat,
): boolean {
  if (candidate.format === preferredFormat && current.format !== preferredFormat) return true;
  if (candidate.format !== preferredFormat && current.format === preferredFormat) return false;
  return compareNullableNumber(candidate.rank, current.rank) < 0;
}

function pokemonSorter(sort: NonNullable<PokemonRankingQuery["sort"]>) {
  return (a: ChampionsPokemonCacheItem, b: ChampionsPokemonCacheItem): number => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "speed") return compareNullableDescending(a.stats.speed, b.stats.speed) || a.name.localeCompare(b.name);
    if (sort === "totalStats") return compareNullableDescending(a.stats.total, b.stats.total) || a.name.localeCompare(b.name);
    if (sort === "usage") return compareNullableDescending(a.usage, b.usage) || compareNullableNumber(a.rank, b.rank);
    return compareNullableNumber(a.rank, b.rank) || a.name.localeCompare(b.name);
  };
}

function compareNullableNumber(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

function compareNullableDescending(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b - a;
}

function championsDataUrl(fileName: string): string {
  const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  return `${base}data/champions/${fileName}`;
}

async function readCacheJson<T>(
  fileName: string,
  fallback: T,
  options: ChampionsCacheReadOptions = {},
): Promise<T> {
  const cacheKey = `${options.strict ? "strict" : "fallback"}:${fileName}`;
  let request = cache.get(cacheKey);
  if (!request) {
    request = fetch(championsDataUrl(fileName), { cache: "no-cache" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json() as unknown;
      })
      .catch((error: unknown) => {
        cache.delete(cacheKey);
        if (options.strict) throw error;
        console.warn(`[ChampionsDataProvider] ${fileName} unavailable`, error);
        return fallback;
      });
    cache.set(cacheKey, request);
  }
  return await request as T;
}
