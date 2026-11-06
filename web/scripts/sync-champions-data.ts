import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ChampionsBattleDataClient } from "../src/data/champions/championsBattleDataClient";
import type {
  ChampionsBattleRow,
  ChampionsCacheFormat,
  ChampionsCacheStatus,
  ChampionsMetaCache,
  ChampionsPokemonCacheItem,
  ChampionsPokemonDetailCache,
  ChampionsSyncStatusCache,
  ChampionsTeamCacheItem,
  ChampionsTournamentCacheItem,
  ChampionsUsageCacheItem,
} from "../src/data/champions/championsCacheTypes";
import {
  asRecord,
  asRecordArray,
  buildChampionsAssetUrl,
  normalizeBattleRows,
  normalizeItemRows,
  normalizeMoveRows,
  normalizePokemonName,
  normalizeStats,
  normalizeTeammateRows,
  normalizeTypes,
  numberValue,
  slugifyPokemon,
  stringValue,
} from "../src/data/champions/championsNormalize";
import {
  LimitlessChampionsClient,
  type LimitlessApiObject,
} from "../src/data/champions/limitlessChampionsClient";

type SourceResult = {
  status: ChampionsCacheStatus;
  message: string;
};

type BattleDataSyncResult = {
  source: SourceResult;
  defaultSeason: string;
  seasons: string[];
  formats: ChampionsCacheFormat[];
  pokemon: ChampionsPokemonCacheItem[];
  details: Map<string, ChampionsPokemonDetailCache>;
  moves: ChampionsUsageCacheItem[];
  items: ChampionsUsageCacheItem[];
};

type LimitlessSyncResult = {
  source: SourceResult;
  tournaments: ChampionsTournamentCacheItem[];
  teams: ChampionsTeamCacheItem[];
};

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.resolve(webRoot, "public", "data", "champions");
const detailsDirectory = path.resolve(outputDirectory, "pokemon-details");
const deckIconsDirectory = path.resolve(webRoot, "src", "assets", "deck-icons");
const pokeApiIndexUrl = "https://pokeapi.co/api/v2/pokemon?limit=2000";
const officialArtworkBaseUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

const officialArtworkAliases: Record<string, string> = {
  "aegislash-shield-forme": "aegislash-shield",
  "alolan-ninetales": "ninetales-alola",
  "alolan-raichu": "raichu-alola",
  "florges-red-flower": "florges-red",
  "furfrou-natural-form": "furfrou-natural",
  "galarian-slowbro": "slowbro-galar",
  "galarian-slowking": "slowking-galar",
  "galarian-stunfisk": "stunfisk-galar",
  "gourgeist": "gourgeist-average",
  "gourgeist-jumbo-variety": "gourgeist-super",
  "gourgeist-large-variety": "gourgeist-large",
  "gourgeist-small-variety": "gourgeist-small",
  "hisuian-arcanine": "arcanine-hisui",
  "hisuian-avalugg": "avalugg-hisui",
  "hisuian-decidueye": "decidueye-hisui",
  "hisuian-goodra": "goodra-hisui",
  "hisuian-samurott": "samurott-hisui",
  "hisuian-typhlosion": "typhlosion-hisui",
  "hisuian-zoroark": "zoroark-hisui",
  "lycanroc": "lycanroc-midday",
  "lycanroc-dusk-form": "lycanroc-dusk",
  "lycanroc-midnight-form": "lycanroc-midnight",
  "meowstic": "meowstic-male",
  "mimikyu": "mimikyu-disguised",
  "morpeko": "morpeko-full-belly",
  "palafin-zero-form": "palafin-zero",
  "paldean-tauros-aqua-breed": "tauros-paldea-aqua-breed",
  "paldean-tauros-blaze-breed": "tauros-paldea-blaze-breed",
  "paldean-tauros-combat-breed": "tauros-paldea-combat-breed",
  "pyroar": "pyroar-male",
  "vivillon-fancy-pattern": "vivillon",
};

async function main(): Promise<void> {
  const startedAt = new Date();
  console.log("[Champions sync] Starting ChampionsBattleData and Limitless sync...");

  const [battleData, limitless] = await Promise.all([
    syncChampionsBattleData(),
    syncLimitlessChampions(),
  ]);

  for (const [slug, detail] of battleData.details) {
    detail.teams = limitless.teams.filter((team) =>
      team.pokemon.some((pokemon) => pokemon.slug === slug),
    );
  }

  const pixelIconResult = await syncChampionsPixelIcons(battleData.pokemon);
  console.log(`[Champions sync] Pixel icons: ${pixelIconResult.added} added, ${pixelIconResult.existing} existing, ${pixelIconResult.failed} failed`);

  const lastSyncedAt = new Date().toISOString();
  const status = overallStatus(battleData.source.status, limitless.source.status);
  const availableSources: ChampionsMetaCache["source"] = [];
  if (battleData.source.status !== "failed") availableSources.push("ChampionsBattleData");
  if (limitless.source.status !== "failed") availableSources.push("Limitless");

  const meta: ChampionsMetaCache = {
    source: availableSources,
    defaultSeason: battleData.defaultSeason,
    seasons: battleData.seasons,
    formats: battleData.formats,
    lastSyncedAt,
    status,
  };
  const syncStatus: ChampionsSyncStatusCache = {
    status,
    lastSyncedAt,
    sources: {
      championsBattleData: battleData.source,
      limitless: limitless.source,
    },
    counts: {
      pokemon: battleData.pokemon.length,
      details: battleData.details.size,
      moves: battleData.moves.length,
      items: battleData.items.length,
      teams: limitless.teams.length,
      tournaments: limitless.tournaments.length,
    },
  };

  await prepareOutputDirectories();
  await Promise.all([
    writeJson("meta.json", meta),
    writeJson("pokemon.json", battleData.pokemon),
    writeJson("moves.json", battleData.moves),
    writeJson("items.json", battleData.items),
    writeJson("teams.json", limitless.teams),
    writeJson("tournaments.json", limitless.tournaments),
    writeJson("sync-status.json", syncStatus),
    ...[...battleData.details.entries()].map(([slug, detail]) =>
      writeJson(path.join("pokemon-details", `${slug}.json`), detail),
    ),
  ]);

  const elapsedSeconds = ((Date.now() - startedAt.getTime()) / 1000).toFixed(1);
  console.log(`[Champions sync] ${status.toUpperCase()} in ${elapsedSeconds}s`);
  console.log(`[Champions sync] Pokémon ${battleData.pokemon.length}, details ${battleData.details.size}, teams ${limitless.teams.length}, tournaments ${limitless.tournaments.length}`);
}

async function syncChampionsBattleData(): Promise<BattleDataSyncResult> {
  const empty: BattleDataSyncResult = {
    source: { status: "failed", message: "ChampionsBattleData index unavailable." },
    defaultSeason: "",
    seasons: [],
    formats: [],
    pokemon: [],
    details: new Map(),
    moves: [],
    items: [],
  };

  try {
    const client = new ChampionsBattleDataClient({ concurrency: 5, maxRetries: 2 });
    const index = await client.getIndex();
    if (!index) return empty;

    const entries = asRecordArray(index.pokemon);
    const { seasons, formats } = discoverSeasonFormats(index, entries);
    const defaultSeasonCandidate = stringValue(index.defaultSeason);
    const defaultSeason = seasons.includes(defaultSeasonCandidate)
      ? defaultSeasonCandidate
      : seasons[0] ?? "";
    if (!defaultSeason || formats.length === 0 || entries.length === 0) {
      return {
        ...empty,
        source: { status: "failed", message: "ChampionsBattleData index did not contain usable season / format data." },
      };
    }

    console.log(`[Champions sync] ChampionsBattleData: ${entries.length} Pokémon, season ${defaultSeason}, formats ${formats.join(" / ")}`);

    const metadataByName = new Map<string, Record<string, unknown>[]>();
    const [officialArtworkIndex] = await Promise.all([
      loadOfficialArtworkIndex(),
      Promise.all(entries.map(async (entry, indexPosition) => {
      const summary = asRecord(entry.summary);
      const primary = asRecord(summary.primary);
      const requestName = stringValue(entry.name) || stringValue(primary.saved_name) || stringValue(primary.pokemon_name);
      if (!requestName) return;
      const response = await client.getMetadata(requestName);
      if (response) metadataByName.set(requestName, asRecordArray(response.rows));
      if ((indexPosition + 1) % 50 === 0) {
        console.log(`[Champions sync] Metadata ${indexPosition + 1}/${entries.length}`);
      }
      })),
    ]);

    const pokemon: ChampionsPokemonCacheItem[] = [];
    const details = new Map<string, ChampionsPokemonDetailCache>();
    const moveAccumulator = new Map<string, UsageAccumulator>();
    const itemAccumulator = new Map<string, UsageAccumulator>();

    for (const entry of entries) {
      const summary = asRecord(entry.summary);
      const primary = asRecord(summary.primary);
      const entryName = stringValue(entry.name) || stringValue(primary.pokemon_name);
      const metadataRows = metadataByName.get(entryName) ?? [];
      const savedName = stringValue(primary.saved_name) || entryName;
      const metadata = selectMetadataRow(metadataRows, savedName);
      const name = normalizePokemonName(metadata.title ?? primary.title ?? savedName);
      const baseName = normalizePokemonName(metadata.base_name ?? primary.pokemon_name ?? entryName) || name;
      const actualSavedName = normalizePokemonName(metadata.saved_name ?? savedName) || name;
      const slug = stringValue(primary.slug) || stringValue(entry.slug) || slugifyPokemon(actualSavedName);
      if (!slug || !name) continue;

      const basePokemon = {
        slug,
        name,
        baseName,
        savedName: actualSavedName,
        form: normalizePokemonName(metadata.form ?? primary.form_kind),
        types: normalizeTypes(metadata.types ?? primary.types ?? summary.types),
        sprite: buildChampionsAssetUrl(metadata.image_path ?? primary.image_path ?? summary.sprite),
        artwork: resolveOfficialArtwork(officialArtworkIndex, slug, baseName, actualSavedName),
        stats: normalizeStats(Object.keys(metadata).length > 0 ? metadata : primary),
      };

      const detailsByFormat = new Map<ChampionsCacheFormat, ChampionsPokemonDetailCache>();
      for (const format of formats) {
        const battle = getBattleSummary(summary, defaultSeason, format);
        let rawRows = battle.rows;
        if (rawRows.length === 0) {
          const fallback = await client.getBattle(format, entryName, defaultSeason);
          rawRows = asRecordArray(fallback?.rows);
        }
        const rows = normalizeBattleRows(rawRows);
        if (rows.length === 0) continue;

        const moves = normalizeMoveRows(rawRows);
        const items = normalizeItemRows(rawRows);
        const teammates = normalizeTeammateRows(rawRows);
        const abilities = rows.filter((row) => row.category === "ability" && row.name);
        const spreads = rows.filter((row) => row.category === "stat_alignment" || row.category === "stat_points");
        const rank = rows.find((row) => row.position != null)?.position ?? null;
        const item: ChampionsPokemonCacheItem = {
          ...basePokemon,
          rank,
          usage: null,
          format,
          season: defaultSeason,
          topMove: moves[0]?.name ?? null,
          topItem: items[0]?.name ?? null,
          topTeammate: teammates[0]?.name ?? null,
        };
        pokemon.push(item);

        collectUsage(moveAccumulator, moves, item, format, defaultSeason);
        collectUsage(itemAccumulator, items, item, format, defaultSeason);

        detailsByFormat.set(format, {
          pokemon: item,
          moves,
          items,
          abilities,
          teammates,
          spreads,
          teams: [],
          movePool: Array.isArray(entry.learnableMoveNames)
            ? entry.learnableMoveNames.map(normalizePokemonName).filter(Boolean)
            : [],
          raw: {
            metadata,
            battle: battle.raw,
            battleDataCsvs: entry.battleDataCsvs ?? [],
          },
        });
      }

      const preferredDetail = detailsByFormat.get(formats[0]) ?? detailsByFormat.values().next().value;
      if (preferredDetail) details.set(slug, preferredDetail);
    }

    return {
      source: {
        status: pokemon.length > 0 ? "success" : "failed",
        message: pokemon.length > 0
          ? `Synced ${pokemon.length} season / format Pokémon rows.`
          : "No usable Pokémon battle rows were returned.",
      },
      defaultSeason,
      seasons,
      formats,
      pokemon: pokemon.sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER)),
      details,
      moves: finalizeUsage(moveAccumulator),
      items: finalizeUsage(itemAccumulator),
    };
  } catch (error) {
    console.error("[Champions sync] ChampionsBattleData source failed", error);
    return {
      ...empty,
      source: { status: "failed", message: errorMessage(error) },
    };
  }
}

async function syncLimitlessChampions(): Promise<LimitlessSyncResult> {
  const empty: LimitlessSyncResult = {
    source: { status: "failed", message: "Limitless Champions game unavailable." },
    tournaments: [],
    teams: [],
  };

  try {
    const client = new LimitlessChampionsClient({ concurrency: 4, maxRetries: 2 });
    const game = await client.findChampionsGame();
    if (!game) return empty;

    console.log(`[Champions sync] Limitless game discovered: ${game.name} (${game.id})`);
    const rawTournaments = await client.getTournaments(game.id, 50);
    const tournaments: ChampionsTournamentCacheItem[] = [];
    const teams: ChampionsTeamCacheItem[] = [];
    let failedStandings = 0;

    await Promise.all(rawTournaments.map(async (rawTournament) => {
      const id = stringValue(rawTournament.id);
      if (!id) return;
      const standings = await client.getTournamentStandings(id);
      if (standings == null) failedStandings += 1;

      const tournament = normalizeTournament(rawTournament, standings != null);
      tournaments.push(tournament);
      if (!standings) return;

      const topTeams = standings
        .map((standing) => normalizeStandingTeam(standing, tournament))
        .filter((team): team is ChampionsTeamCacheItem => team != null)
        .sort((a, b) => (a.placing ?? Number.MAX_SAFE_INTEGER) - (b.placing ?? Number.MAX_SAFE_INTEGER))
        .slice(0, 16);
      teams.push(...topTeams);
    }));

    tournaments.sort((a, b) => b.date.localeCompare(a.date));
    teams.sort((a, b) => {
      const tournamentCompare = (b.tournament ?? "").localeCompare(a.tournament ?? "");
      return tournamentCompare || (a.placing ?? Number.MAX_SAFE_INTEGER) - (b.placing ?? Number.MAX_SAFE_INTEGER);
    });

    return {
      source: {
        status: failedStandings > 0 ? "partial" : "success",
        message: failedStandings > 0
          ? `${failedStandings} tournament standings requests were unavailable.`
          : `Synced ${tournaments.length} tournaments and ${teams.length} top team references from ${game.name}.`,
      },
      tournaments,
      teams,
    };
  } catch (error) {
    console.error("[Champions sync] Limitless source failed", error);
    return {
      ...empty,
      source: { status: "failed", message: errorMessage(error) },
    };
  }
}

function discoverSeasonFormats(
  index: Record<string, unknown>,
  entries: Record<string, unknown>[],
): { seasons: string[]; formats: ChampionsCacheFormat[] } {
  const seasons = new Set<string>();
  const formats = new Set<ChampionsCacheFormat>();

  for (const entry of entries) {
    for (const csv of asRecordArray(entry.battleDataCsvs)) {
      const format = cacheFormat(csv.format);
      const season = stringValue(csv.season);
      if (format) formats.add(format);
      if (format && season) seasons.add(season);
    }
  }

  const defaultSeason = stringValue(index.defaultSeason);
  if (defaultSeason && entries.some((entry) => {
    const summary = asRecord(asRecord(entry.summary).battleSummary);
    return Object.keys(asRecord(summary[defaultSeason])).some((key) => cacheFormat(key));
  })) {
    seasons.add(defaultSeason);
  }

  return {
    seasons: [...seasons],
    formats: [...formats].sort((a, b) => formatOrder(a) - formatOrder(b)),
  };
}

function getBattleSummary(
  summary: Record<string, unknown>,
  season: string,
  format: ChampionsCacheFormat,
): { rows: Record<string, unknown>[]; raw: Record<string, unknown> } {
  const seasonBranch = asRecord(asRecord(summary.battleSummary)[season]);
  const raw = asRecord(seasonBranch[format]);
  return { rows: asRecordArray(raw.rows), raw };
}

function selectMetadataRow(
  rows: Record<string, unknown>[],
  savedName: string,
): Record<string, unknown> {
  const target = normalizePokemonName(savedName).toLocaleLowerCase();
  return rows.find((row) => normalizePokemonName(row.saved_name).toLocaleLowerCase() === target)
    ?? rows[0]
    ?? {};
}

type UsageAccumulator = {
  name: string;
  total: number;
  observations: number;
  users: Set<string>;
  format: ChampionsCacheFormat;
  season: string;
};

function collectUsage(
  target: Map<string, UsageAccumulator>,
  rows: ChampionsBattleRow[],
  pokemon: ChampionsPokemonCacheItem,
  format: ChampionsCacheFormat,
  season: string,
): void {
  for (const row of rows) {
    const key = `${season}\u0000${format}\u0000${row.name.toLocaleLowerCase()}`;
    const current = target.get(key) ?? {
      name: row.name,
      total: 0,
      observations: 0,
      users: new Set<string>(),
      format,
      season,
    };
    if (row.percentage != null) {
      current.total += row.percentage;
      current.observations += 1;
    }
    current.users.add(pokemon.name);
    target.set(key, current);
  }
}

function finalizeUsage(source: Map<string, UsageAccumulator>): ChampionsUsageCacheItem[] {
  return [...source.values()]
    .map((item) => ({
      name: item.name,
      usage: item.observations > 0
        ? Math.round((item.total / item.observations) * 10_000) / 10_000
        : null,
      users: [...item.users].sort(),
      format: item.format,
      season: item.season,
    }))
    .sort((a, b) => b.users.length - a.users.length || (b.usage ?? -1) - (a.usage ?? -1));
}

function normalizeTournament(
  raw: LimitlessApiObject,
  standingsSynced: boolean,
): ChampionsTournamentCacheItem {
  const id = stringValue(raw.id);
  return {
    id,
    name: stringValue(raw.name) || id,
    date: stringValue(raw.date),
    players: numberValue(raw.players) ?? 0,
    format: stringValue(raw.format),
    url: `https://play.limitlesstcg.com/tournament/${encodeURIComponent(id)}`,
    standingsSynced,
  };
}

function normalizeStandingTeam(
  standing: LimitlessApiObject,
  tournament: ChampionsTournamentCacheItem,
): ChampionsTeamCacheItem | null {
  const decklist = Array.isArray(standing.decklist) ? standing.decklist.map(asRecord) : [];
  const pokemon = decklist.flatMap((raw) => {
    const name = normalizePokemonName(raw.name ?? raw.id);
    if (!name) return [];
    return [{
      slug: slugifyPokemon(name),
      name,
      item: normalizePokemonName(raw.item) || null,
      ability: normalizePokemonName(raw.ability) || null,
      moves: Array.isArray(raw.attacks) ? raw.attacks.map(normalizePokemonName).filter(Boolean) : [],
    }];
  });
  if (pokemon.length === 0) return null;

  const placing = numberValue(standing.placing);
  const player = standingPlayerName(standing);
  const record = standingRecord(standing.record);
  return {
    id: `${tournament.id}-${stringValue(standing.player) || placing || slugifyPokemon(player)}`,
    name: player ? `${player} · ${tournament.name}` : tournament.name,
    source: "Limitless",
    pokemon,
    usage: null,
    winRate: record.winRate,
    sampleCount: record.games,
    tournament: tournament.name,
    placing,
    format: tournament.format,
    season: tournament.format,
    player: player || null,
    record: record.label,
  };
}

function standingPlayerName(standing: LimitlessApiObject): string {
  if (typeof standing.name === "string") return standing.name.trim();
  const name = asRecord(standing.name);
  return stringValue(name.name ?? name.username);
}

function standingRecord(value: unknown): { label: string | null; games: number | null; winRate: number | null } {
  if (typeof value === "string") return { label: value, games: null, winRate: null };
  const record = asRecord(value);
  const wins = numberValue(record.wins) ?? 0;
  const losses = numberValue(record.losses) ?? 0;
  const ties = numberValue(record.ties) ?? 0;
  const games = wins + losses + ties;
  return {
    label: games > 0 ? `${wins}-${losses}-${ties}` : null,
    games: games || null,
    winRate: games > 0 ? wins / games : null,
  };
}

function cacheFormat(value: unknown): ChampionsCacheFormat | null {
  const format = stringValue(value).toLocaleLowerCase();
  if (format === "singles") return "Singles";
  if (format === "doubles") return "Doubles";
  return null;
}

function formatOrder(format: ChampionsCacheFormat): number {
  return format === "Doubles" ? 0 : 1;
}

function overallStatus(
  championsBattleData: ChampionsCacheStatus,
  limitless: ChampionsCacheStatus,
): ChampionsCacheStatus {
  if (championsBattleData === "failed") return "failed";
  if (championsBattleData === "success" && limitless === "success") return "success";
  return "partial";
}

async function loadOfficialArtworkIndex(): Promise<Map<string, string>> {
  const artwork = new Map<string, string>();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(pokeApiIndexUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = asRecord(await response.json());
    for (const row of asRecordArray(payload.results)) {
      const name = stringValue(row.name);
      const id = stringValue(row.url).match(/\/(\d+)\/?$/)?.[1] ?? "";
      if (name && id) artwork.set(name, `${officialArtworkBaseUrl}/${id}.png`);
    }
    console.log(`[Champions sync] Official artwork index: ${artwork.size} Pokémon forms`);
  } catch (error) {
    console.warn(`[Champions sync] Official artwork index unavailable: ${errorMessage(error)}`);
  } finally {
    clearTimeout(timeout);
  }

  return artwork;
}

function resolveOfficialArtwork(
  artwork: Map<string, string>,
  slug: string,
  baseName: string,
  savedName: string,
): string {
  const candidates = [
    officialArtworkAliases[slug],
    slug,
    slugifyPokemon(savedName),
    slugifyPokemon(baseName),
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const hit = artwork.get(candidate);
    if (hit) return hit;
  }
  return "";
}

async function syncChampionsPixelIcons(
  items: ChampionsPokemonCacheItem[],
): Promise<{ added: number; existing: number; failed: number }> {
  const uniquePokemon = new Map<string, ChampionsPokemonCacheItem>();
  for (const item of items) {
    if (!uniquePokemon.has(item.slug)) uniquePokemon.set(item.slug, item);
  }

  await mkdir(deckIconsDirectory, { recursive: true });
  const result = { added: 0, existing: 0, failed: 0 };
  await mapWithConcurrency([...uniquePokemon.values()], 6, async (pokemon) => {
    const fileName = `${pokemon.slug}.png`;
    const target = path.resolve(deckIconsDirectory, fileName);
    if (!target.startsWith(`${deckIconsDirectory}${path.sep}`)) {
      result.failed += 1;
      return;
    }

    try {
      await access(target);
      result.existing += 1;
      return;
    } catch {
      // Missing assets are downloaded from the source already attached to the cache row.
    }

    try {
      const source = new URL(pokemon.sprite);
      if (source.protocol !== "https:" || source.hostname !== "championsbattledata.com") {
        throw new Error("Unexpected pixel icon source host.");
      }
      const response = await fetch(source, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) throw new Error(`Unexpected content type ${contentType}`);
      await writeFile(target, new Uint8Array(await response.arrayBuffer()));
      result.added += 1;
    } catch (error) {
      result.failed += 1;
      console.warn(`[Champions sync] Pixel icon unavailable for ${pokemon.slug}: ${errorMessage(error)}`);
    }
  });
  return result;
}

async function mapWithConcurrency<T>(
  values: T[],
  concurrency: number,
  task: (value: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  async function worker(): Promise<void> {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      const value = values[index];
      if (value !== undefined) await task(value);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
}

async function prepareOutputDirectories(): Promise<void> {
  if (!detailsDirectory.startsWith(`${outputDirectory}${path.sep}`)) {
    throw new Error("Refusing to clear a details directory outside the Champions cache output.");
  }
  await mkdir(outputDirectory, { recursive: true });
  await rm(detailsDirectory, { recursive: true, force: true });
  await mkdir(detailsDirectory, { recursive: true });
}

async function writeJson(fileName: string, value: unknown): Promise<void> {
  const target = path.resolve(outputDirectory, fileName);
  if (target !== outputDirectory && !target.startsWith(`${outputDirectory}${path.sep}`)) {
    throw new Error(`Refusing to write outside Champions cache output: ${fileName}`);
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

void main().catch((error: unknown) => {
  console.error("[Champions sync] Fatal output error", error);
  process.exitCode = 1;
});
