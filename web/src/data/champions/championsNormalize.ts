import type {
  ChampionsBattleRow,
  ChampionsCacheStats,
} from "./championsCacheTypes";

const CHAMPIONS_BATTLE_DATA_BASE_URL = "https://championsbattledata.com";

export function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord).filter((row) => Object.keys(row).length > 0) : [];
}

export function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizePokemonName(value: unknown): string {
  return stringValue(value).replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
}

export function slugifyPokemon(value: unknown): string {
  return normalizePokemonName(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/♀/g, "-female")
    .replace(/♂/g, "-male")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizePercentage(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = typeof value === "string"
    ? Number(value.replace(/[%\s,]/g, ""))
    : numberValue(value);
  if (numeric == null || !Number.isFinite(numeric)) return null;
  const ratio = numeric > 1 ? numeric / 100 : numeric;
  return Math.round(Math.min(1, Math.max(0, ratio)) * 10_000) / 10_000;
}

export function normalizeTypes(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[|,\/]/)
      : [];
  return [...new Set(values.map(normalizePokemonName).filter(Boolean))];
}

export function normalizeStats(value: unknown): ChampionsCacheStats {
  const row = asRecord(value);
  const hp = numberValue(row.hp);
  const attack = numberValue(row.attack ?? row.atk);
  const defense = numberValue(row.defense ?? row.def);
  const spAttack = numberValue(row.spAttack ?? row.sp_attack ?? row.spa);
  const spDefense = numberValue(row.spDefense ?? row.sp_defense ?? row.spd);
  const speed = numberValue(row.speed ?? row.spe);
  const listedTotal = numberValue(row.total ?? row.base_stat_total ?? row.baseStatTotal);
  const statValues = [hp, attack, defense, spAttack, spDefense, speed];
  const calculatedTotal = statValues.every((stat) => stat != null)
    ? statValues.reduce<number>((total, stat) => total + (stat ?? 0), 0)
    : null;

  return {
    hp,
    attack,
    defense,
    spAttack,
    spDefense,
    speed,
    total: listedTotal ?? calculatedTotal,
  };
}

export function normalizeBattleRows(value: unknown): ChampionsBattleRow[] {
  return asRecordArray(value).map((raw) => ({
    pokemon: normalizePokemonName(raw.pokemon),
    position: numberValue(raw.position ?? raw.column_position),
    category: stringValue(raw.category).toLowerCase(),
    rank: numberValue(raw.rank),
    name: normalizePokemonName(raw.name),
    percentage: normalizePercentage(raw.percentage_value ?? raw.percentage),
    statUp: normalizePokemonName(raw.stat_up) || null,
    statDown: normalizePokemonName(raw.stat_down) || null,
    raw,
  }));
}

export function normalizeMoveRows(value: unknown): ChampionsBattleRow[] {
  return normalizeBattleRows(value).filter((row) => row.category === "move" && row.name);
}

export function normalizeItemRows(value: unknown): ChampionsBattleRow[] {
  return normalizeBattleRows(value).filter((row) => row.category === "held_item" && row.name);
}

export function normalizeTeammateRows(value: unknown): ChampionsBattleRow[] {
  return normalizeBattleRows(value).filter((row) => row.category === "teammate" && row.name);
}

export function buildChampionsAssetUrl(value: unknown): string {
  const path = stringValue(value).replace(/\\+/g, "/").replace(/\/{2,}/g, "/");
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.replace(/^\/+/, ""), `${CHAMPIONS_BATTLE_DATA_BASE_URL}/`).toString();
}
