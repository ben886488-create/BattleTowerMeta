export type ChampionsFormat = "singles" | "doubles";
export type ChampionsSource = "championsBattleData" | "limitless";
export type ChampionsSortKey = "usage" | "speed" | "totalStats" | "rank" | "name";

export type ChampionsFilters = {
  season?: string;
  format?: ChampionsFormat | "all";
  regulation?: string;
  source?: ChampionsSource | "all";
  type?: string;
  search?: string;
  sortBy?: ChampionsSortKey;
};

export type ChampionsProviderOptions = {
  strict?: boolean;
};

export type ChampionsListResult<T> = {
  items: T[];
  synced: boolean;
  updatedAt: string | null;
  source: ChampionsSource | "all";
};

export type PokemonStats = {
  hp: number | null;
  attack: number | null;
  defense: number | null;
  spAttack: number | null;
  spDefense: number | null;
  speed: number | null;
  total: number | null;
};

export type PokemonRankingItem = {
  slug: string;
  name: string;
  form?: string;
  spriteUrl?: string;
  artworkUrl?: string;
  types: string[];
  usageRate: number | null;
  rank: number | null;
  format: ChampionsFormat;
  season: string;
  sampleCount: number | null;
  trend: number | null;
  stats: PokemonStats | null;
};

export type TeamReferenceItem = {
  id: string;
  name: string;
  pokemon: PokemonRankingItem[];
  source: ChampionsSource;
  format: ChampionsFormat;
  season: string;
  usageRate: number | null;
  winRate: number | null;
  sampleCount: number | null;
  tournamentResult: string | null;
};

export type UsageRankingItem = {
  id: string;
  name: string;
  type?: string;
  category?: string;
  usageRate: number | null;
  sampleCount: number | null;
  commonUsers: string[];
};

export type PokemonMoveUsage = UsageRankingItem & {
  power: number | null;
  accuracy: number | null;
};

export type PokemonTeammate = {
  slug: string;
  name: string;
  spriteUrl?: string;
  usageTogetherRate: number | null;
  pairCount: number | null;
};

export type PokemonDetail = PokemonRankingItem & {
  moveUsage: PokemonMoveUsage[];
  itemUsage: UsageRankingItem[];
  teammates: PokemonTeammate[];
  teamReferences: TeamReferenceItem[];
  movePool: PokemonMoveUsage[];
};

export type PokemonSpeedProfile = PokemonRankingItem & {
  baseSpeed: number | null;
  sourceSpeedStat: number | null;
  level: 50;
  nature: string | null;
  natureUsageRate: number | null;
  speedStatPoints: number | null;
  statPointsUsageRate: number | null;
  speedIv: 31;
  abilities: string[];
  dataStatus: "source" | "derived" | "fallback" | "missing";
};

export interface ChampionsDataProvider {
  getSeasons(options?: ChampionsProviderOptions): Promise<string[]>;
  getFormats(options?: ChampionsProviderOptions): Promise<ChampionsFormat[]>;
  getPokemonRankings(
    filters?: ChampionsFilters,
    options?: ChampionsProviderOptions,
  ): Promise<ChampionsListResult<PokemonRankingItem>>;
  getPokemonDetail(slug: string, options?: ChampionsProviderOptions): Promise<PokemonDetail | null>;
  getPokemonSpeedProfiles(
    filters?: ChampionsFilters,
    options?: ChampionsProviderOptions,
  ): Promise<ChampionsListResult<PokemonSpeedProfile>>;
  getMoveRankings(
    filters?: ChampionsFilters,
    options?: ChampionsProviderOptions,
  ): Promise<ChampionsListResult<UsageRankingItem>>;
  getItemRankings(
    filters?: ChampionsFilters,
    options?: ChampionsProviderOptions,
  ): Promise<ChampionsListResult<UsageRankingItem>>;
  getTeammates(
    slug: string,
    options?: ChampionsProviderOptions,
  ): Promise<ChampionsListResult<PokemonTeammate>>;
  getTeamReferences(
    filters?: ChampionsFilters,
    options?: ChampionsProviderOptions,
  ): Promise<ChampionsListResult<TeamReferenceItem>>;
}

export interface LimitlessChampionsProvider {
  getChampionsTournaments(filters?: ChampionsFilters): Promise<ChampionsListResult<unknown>>;
  getTournamentTeams(tournamentId: string): Promise<ChampionsListResult<TeamReferenceItem>>;
  getPlayerResults(filters?: ChampionsFilters): Promise<ChampionsListResult<unknown>>;
  getTeamPlacements(filters?: ChampionsFilters): Promise<ChampionsListResult<TeamReferenceItem>>;
}
