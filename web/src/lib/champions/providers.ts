import type {
  ChampionsDataProvider,
  ChampionsFilters,
  ChampionsFormat,
  ChampionsListResult,
  ChampionsProviderOptions,
  LimitlessChampionsProvider,
  PokemonDetail,
  PokemonRankingItem,
  PokemonSpeedProfile,
  PokemonTeammate,
  TeamReferenceItem,
  UsageRankingItem,
} from "./types";
import {
  getChampionsMeta,
  getChampionsTournaments,
  getItemRankings,
  getMoveRankings,
  getPokemonDetail,
  getPokemonRankings,
  getTeamReferences,
} from "../../data/champions/championsDataProvider";
import type {
  ChampionsBattleRow,
  ChampionsPokemonCacheItem,
  ChampionsTeamCacheItem,
  ChampionsUsageCacheItem,
} from "../../data/champions/championsCacheTypes";

function emptyResult<T>(source: ChampionsFilters["source"] = "all"): ChampionsListResult<T> {
  return {
    items: [],
    synced: false,
    updatedAt: null,
    source: source ?? "all",
  };
}

export function createEmptyChampionsDataProvider(): ChampionsDataProvider {
  return {
    async getSeasons(): Promise<string[]> {
      return [];
    },
    async getFormats(): Promise<ChampionsFormat[]> {
      return ["singles", "doubles"];
    },
    async getPokemonRankings(
      filters: ChampionsFilters = {},
    ): Promise<ChampionsListResult<PokemonRankingItem>> {
      return emptyResult<PokemonRankingItem>(filters.source);
    },
    async getPokemonDetail(_slug: string): Promise<PokemonDetail | null> {
      return null;
    },
    async getPokemonSpeedProfiles(
      filters: ChampionsFilters = {},
    ): Promise<ChampionsListResult<PokemonSpeedProfile>> {
      return emptyResult<PokemonSpeedProfile>(filters.source);
    },
    async getMoveRankings(
      filters: ChampionsFilters = {},
    ): Promise<ChampionsListResult<UsageRankingItem>> {
      return emptyResult<UsageRankingItem>(filters.source);
    },
    async getItemRankings(
      filters: ChampionsFilters = {},
    ): Promise<ChampionsListResult<UsageRankingItem>> {
      return emptyResult<UsageRankingItem>(filters.source);
    },
    async getTeammates(_slug: string): Promise<ChampionsListResult<PokemonTeammate>> {
      return emptyResult<PokemonTeammate>("all");
    },
    async getTeamReferences(
      filters: ChampionsFilters = {},
    ): Promise<ChampionsListResult<TeamReferenceItem>> {
      return emptyResult<TeamReferenceItem>(filters.source);
    },
  };
}

export function createEmptyLimitlessChampionsProvider(): LimitlessChampionsProvider {
  return {
    async getChampionsTournaments(
      filters: ChampionsFilters = {},
    ): Promise<ChampionsListResult<unknown>> {
      return emptyResult<unknown>(filters.source);
    },
    async getTournamentTeams(_tournamentId: string): Promise<ChampionsListResult<TeamReferenceItem>> {
      return emptyResult<TeamReferenceItem>("limitless");
    },
    async getPlayerResults(filters: ChampionsFilters = {}): Promise<ChampionsListResult<unknown>> {
      return emptyResult<unknown>(filters.source);
    },
    async getTeamPlacements(
      filters: ChampionsFilters = {},
    ): Promise<ChampionsListResult<TeamReferenceItem>> {
      return emptyResult<TeamReferenceItem>(filters.source);
    },
  };
}

export const championsDataProvider: ChampionsDataProvider = {
  async getSeasons(options: ChampionsProviderOptions = {}): Promise<string[]> {
    return (await getChampionsMeta(options))?.seasons ?? [];
  },
  async getFormats(options: ChampionsProviderOptions = {}): Promise<ChampionsFormat[]> {
    const formats = (await getChampionsMeta(options))?.formats ?? [];
    return formats.map((format) => format.toLowerCase() as ChampionsFormat);
  },
  async getPokemonRankings(
    filters: ChampionsFilters = {},
    options: ChampionsProviderOptions = {},
  ): Promise<ChampionsListResult<PokemonRankingItem>> {
    if (filters.source === "limitless") return emptyResult<PokemonRankingItem>("limitless");
    const [meta, items] = await Promise.all([
      getChampionsMeta(options),
      getPokemonRankings({
        season: filters.season,
        format: filters.format,
        q: filters.search,
        type: filters.type,
        sort: filters.sortBy,
      }, options),
    ]);
    return {
      items: items.map(toPokemonRankingItem),
      synced: meta != null && meta.status !== "failed",
      updatedAt: meta?.lastSyncedAt ?? null,
      source: "championsBattleData",
    };
  },
  async getPokemonDetail(
    slug: string,
    options: ChampionsProviderOptions = {},
  ): Promise<PokemonDetail | null> {
    const [meta, detail] = await Promise.all([
      getChampionsMeta(options),
      getPokemonDetail(slug, options),
    ]);
    if (!detail) return null;
    return {
      ...toPokemonRankingItem(detail.pokemon),
      moveUsage: detail.moves.map(toMoveUsageItem),
      itemUsage: detail.items.map(toUsageItem),
      teammates: detail.teammates.map((row) => ({
        slug: slugify(row.name),
        name: row.name,
        usageTogetherRate: row.percentage,
        pairCount: null,
      })),
      teamReferences: detail.teams.map(toTeamReferenceItem),
      movePool: detail.movePool.map((name) => ({
        id: slugify(name),
        name,
        usageRate: null,
        sampleCount: null,
        commonUsers: [],
        power: null,
        accuracy: null,
      })),
      season: detail.pokemon.season || meta?.defaultSeason || "",
    };
  },
  async getPokemonSpeedProfiles(
    filters: ChampionsFilters = {},
    options: ChampionsProviderOptions = {},
  ): Promise<ChampionsListResult<PokemonSpeedProfile>> {
    if (filters.source === "limitless") return emptyResult<PokemonSpeedProfile>("limitless");
    const [meta, rankingItems] = await Promise.all([
      getChampionsMeta(options),
      getPokemonRankings({
        season: filters.season,
        format: filters.format,
        sort: filters.sortBy === "usage" ? "usage" : "speed",
      }, options),
    ]);
    const unique = [...new Map(rankingItems.map((item) => [item.slug, item])).values()].slice(0, 50);
    const details = await Promise.all(unique.map((item) => getPokemonDetail(item.slug, options)));
    return {
      items: unique.map((item, index) => toPokemonSpeedProfile(item, details[index] ?? null)),
      synced: meta != null && meta.status !== "failed",
      updatedAt: meta?.lastSyncedAt ?? null,
      source: "championsBattleData",
    };
  },
  async getMoveRankings(
    filters: ChampionsFilters = {},
    options: ChampionsProviderOptions = {},
  ): Promise<ChampionsListResult<UsageRankingItem>> {
    if (filters.source === "limitless") return emptyResult<UsageRankingItem>("limitless");
    const [meta, items] = await Promise.all([
      getChampionsMeta(options),
      getMoveRankings({ season: filters.season, format: filters.format }, options),
    ]);
    return usageResult(items, meta?.lastSyncedAt ?? null, meta?.status !== "failed");
  },
  async getItemRankings(
    filters: ChampionsFilters = {},
    options: ChampionsProviderOptions = {},
  ): Promise<ChampionsListResult<UsageRankingItem>> {
    if (filters.source === "limitless") return emptyResult<UsageRankingItem>("limitless");
    const [meta, items] = await Promise.all([
      getChampionsMeta(options),
      getItemRankings({ season: filters.season, format: filters.format }, options),
    ]);
    return usageResult(items, meta?.lastSyncedAt ?? null, meta?.status !== "failed");
  },
  async getTeammates(
    slug: string,
    options: ChampionsProviderOptions = {},
  ): Promise<ChampionsListResult<PokemonTeammate>> {
    const [meta, detail] = await Promise.all([
      getChampionsMeta(options),
      getPokemonDetail(slug, options),
    ]);
    return {
      items: (detail?.teammates ?? []).map((row) => ({
        slug: slugify(row.name),
        name: row.name,
        usageTogetherRate: row.percentage,
        pairCount: null,
      })),
      synced: meta != null && meta.status !== "failed",
      updatedAt: meta?.lastSyncedAt ?? null,
      source: "championsBattleData",
    };
  },
  async getTeamReferences(
    filters: ChampionsFilters = {},
    options: ChampionsProviderOptions = {},
  ): Promise<ChampionsListResult<TeamReferenceItem>> {
    const [meta, items] = await Promise.all([
      getChampionsMeta(options),
      filters.source === "championsBattleData"
        ? Promise.resolve([])
        : getTeamReferences({
            season: filters.season,
            format: filters.format === "singles" ? "__unsupported_singles__" : undefined,
            pokemon: filters.search,
          }, options),
    ]);
    return {
      items: items.map(toTeamReferenceItem),
      synced: meta != null && meta.status !== "failed",
      updatedAt: meta?.lastSyncedAt ?? null,
      source: "limitless",
    };
  },
};

export const limitlessChampionsProvider: LimitlessChampionsProvider = {
  async getChampionsTournaments(): Promise<ChampionsListResult<unknown>> {
    const [meta, items] = await Promise.all([getChampionsMeta(), getChampionsTournaments()]);
    return {
      items,
      synced: meta != null && meta.status !== "failed",
      updatedAt: meta?.lastSyncedAt ?? null,
      source: "limitless",
    };
  },
  async getTournamentTeams(tournamentId: string): Promise<ChampionsListResult<TeamReferenceItem>> {
    const [meta, items] = await Promise.all([getChampionsMeta(), getTeamReferences()]);
    return {
      items: items.filter((item) => item.id.startsWith(`${tournamentId}-`)).map(toTeamReferenceItem),
      synced: meta != null && meta.status !== "failed",
      updatedAt: meta?.lastSyncedAt ?? null,
      source: "limitless",
    };
  },
  async getPlayerResults(): Promise<ChampionsListResult<unknown>> {
    return emptyResult<unknown>("limitless");
  },
  async getTeamPlacements(filters: ChampionsFilters = {}): Promise<ChampionsListResult<TeamReferenceItem>> {
    return championsDataProvider.getTeamReferences({ ...filters, source: "limitless" });
  },
};

function toPokemonRankingItem(item: ChampionsPokemonCacheItem): PokemonRankingItem {
  return {
    slug: item.slug,
    name: item.name,
    form: item.form || undefined,
    spriteUrl: item.sprite || undefined,
    artworkUrl: item.artwork || undefined,
    types: item.types,
    usageRate: item.usage,
    rank: item.rank,
    format: item.format.toLowerCase() as ChampionsFormat,
    season: item.season,
    sampleCount: null,
    trend: null,
    stats: item.stats,
  };
}

function toPokemonSpeedProfile(
  item: ChampionsPokemonCacheItem,
  detail: Awaited<ReturnType<typeof getPokemonDetail>>,
): PokemonSpeedProfile {
  const natureRow = detail?.spreads.find((row) => row.category === "stat_alignment" && row.rank === 1)
    ?? detail?.spreads.find((row) => row.category === "stat_alignment")
    ?? null;
  const pointsRow = detail?.spreads.find((row) => row.category === "stat_points" && row.rank === 1)
    ?? detail?.spreads.find((row) => row.category === "stat_points")
    ?? null;
  const rawSpeedPoints = pointsRow?.raw.speed_points;
  const speedStatPoints = typeof rawSpeedPoints === "number"
    ? rawSpeedPoints
    : typeof rawSpeedPoints === "string" && rawSpeedPoints.trim() !== ""
      ? Number(rawSpeedPoints)
      : null;
  const sourceSpeedStat = item.stats.speed;
  // ChampionsBattleData metadata exposes the neutral level-50 stat with 31 IV and no
  // Stat Points. For non-HP stats that value is Base Stat + 20, so the game base stat
  // can be recovered without treating the displayed level-50 stat as Base Speed.
  const baseSpeed = sourceSpeedStat == null ? null : Math.max(1, Math.round(sourceSpeedStat) - 20);
  const abilities = detail?.abilities
    .filter((row) => Boolean(row.name))
    .sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER))
    .map((row) => row.name) ?? [];

  return {
    ...toPokemonRankingItem(item),
    baseSpeed,
    sourceSpeedStat,
    level: 50,
    nature: natureRow?.name || null,
    natureUsageRate: natureRow?.percentage ?? null,
    speedStatPoints: Number.isFinite(speedStatPoints) ? speedStatPoints : null,
    statPointsUsageRate: pointsRow?.percentage ?? null,
    speedIv: 31,
    abilities,
    dataStatus: baseSpeed == null
      ? "missing"
      : natureRow && Number.isFinite(speedStatPoints)
        ? "derived"
        : "fallback",
  };
}

function toMoveUsageItem(row: ChampionsBattleRow) {
  return {
    ...toUsageItem(row),
    power: null,
    accuracy: null,
  };
}

function toUsageItem(row: ChampionsBattleRow): UsageRankingItem {
  return {
    id: `${row.category}-${row.rank ?? slugify(row.name)}-${slugify(row.name)}`,
    name: row.name,
    category: row.category,
    usageRate: row.percentage,
    sampleCount: null,
    commonUsers: [],
  };
}

function usageResult(
  items: ChampionsUsageCacheItem[],
  updatedAt: string | null,
  synced: boolean,
): ChampionsListResult<UsageRankingItem> {
  return {
    items: items.map((item) => ({
      id: `${item.format ?? "all"}-${slugify(item.name)}`,
      name: item.name,
      category: item.format,
      usageRate: item.usage,
      sampleCount: item.users.length,
      commonUsers: item.users,
    })),
    synced,
    updatedAt,
    source: "championsBattleData",
  };
}

function toTeamReferenceItem(team: ChampionsTeamCacheItem): TeamReferenceItem {
  return {
    id: team.id,
    name: team.name,
    pokemon: team.pokemon.map((pokemon) => ({
      slug: pokemon.slug,
      name: pokemon.name,
      artworkUrl: undefined,
      types: [],
      usageRate: null,
      rank: null,
      format: "doubles",
      season: team.season,
      sampleCount: null,
      trend: null,
      stats: null,
    })),
    source: team.source === "Limitless" ? "limitless" : "championsBattleData",
    format: "doubles",
    season: team.season,
    usageRate: team.usage,
    winRate: team.winRate,
    sampleCount: team.sampleCount,
    tournamentResult: team.placing == null ? team.record : `#${team.placing}${team.record ? ` · ${team.record}` : ""}`,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
