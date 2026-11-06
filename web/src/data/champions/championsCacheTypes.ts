export type ChampionsCacheStatus = "success" | "partial" | "failed";
export type ChampionsCacheFormat = "Singles" | "Doubles";

export type ChampionsCacheStats = {
  hp: number | null;
  attack: number | null;
  defense: number | null;
  spAttack: number | null;
  spDefense: number | null;
  speed: number | null;
  total: number | null;
};

export type ChampionsBattleRow = {
  pokemon: string;
  position: number | null;
  category: string;
  rank: number | null;
  name: string;
  percentage: number | null;
  statUp: string | null;
  statDown: string | null;
  raw: Record<string, unknown>;
};

export type ChampionsPokemonCacheItem = {
  slug: string;
  name: string;
  baseName: string;
  savedName: string;
  form: string;
  types: string[];
  sprite: string;
  artwork: string;
  stats: ChampionsCacheStats;
  rank: number | null;
  usage: number | null;
  format: ChampionsCacheFormat;
  season: string;
  topMove: string | null;
  topItem: string | null;
  topTeammate: string | null;
};

export type ChampionsUsageCacheItem = {
  name: string;
  usage: number | null;
  users: string[];
  format?: ChampionsCacheFormat;
  season?: string;
};

export type ChampionsPokemonDetailCache = {
  pokemon: ChampionsPokemonCacheItem;
  moves: ChampionsBattleRow[];
  items: ChampionsBattleRow[];
  abilities: ChampionsBattleRow[];
  teammates: ChampionsBattleRow[];
  spreads: ChampionsBattleRow[];
  teams: ChampionsTeamCacheItem[];
  movePool: string[];
  raw: Record<string, unknown>;
};

export type ChampionsTeamPokemonCacheItem = {
  slug: string;
  name: string;
  item: string | null;
  ability: string | null;
  moves: string[];
};

export type ChampionsTeamCacheItem = {
  id: string;
  name: string;
  source: "Limitless" | "ChampionsBattleData";
  pokemon: ChampionsTeamPokemonCacheItem[];
  usage: number | null;
  winRate: number | null;
  sampleCount: number | null;
  tournament: string | null;
  placing: number | null;
  format: string;
  season: string;
  player: string | null;
  record: string | null;
};

export type ChampionsTournamentCacheItem = {
  id: string;
  name: string;
  date: string;
  players: number;
  format: string;
  url: string;
  standingsSynced: boolean;
};

export type ChampionsMetaCache = {
  source: Array<"ChampionsBattleData" | "Limitless">;
  defaultSeason: string;
  seasons: string[];
  formats: ChampionsCacheFormat[];
  lastSyncedAt: string;
  status: ChampionsCacheStatus;
};

export type ChampionsSyncSourceStatus = {
  status: ChampionsCacheStatus;
  message: string;
};

export type ChampionsSyncStatusCache = {
  status: ChampionsCacheStatus;
  lastSyncedAt: string;
  sources: {
    championsBattleData: ChampionsSyncSourceStatus;
    limitless: ChampionsSyncSourceStatus;
  };
  counts: {
    pokemon: number;
    details: number;
    moves: number;
    items: number;
    teams: number;
    tournaments: number;
  };
};
