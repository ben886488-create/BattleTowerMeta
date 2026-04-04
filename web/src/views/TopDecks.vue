<template>
  <section class="top-decks-page">
    <div class="top-decks-wrap">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ t("pageTitle") }}</h1>
          <p class="page-subtitle">
            {{ deckSummaryLabel }}
          </p>
        </div>

        <div class="page-status mono">
          {{ t("loadedData", { loaded: loadedFilteredTournamentCount, total: filteredTournaments.length }) }}
        </div>
      </header>

      <div class="filters-grid">
        <label class="filter-card">
          <span class="filter-label">{{ t("set") }}</span>
          <select v-model="filters.set" class="filter-select">
            <option
              v-for="option in setOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="filter-card">
          <span class="filter-label">{{ t("topCut") }}</span>
          <select v-model="filters.topCut" class="filter-select">
            <option
              v-for="option in topCutOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
      </div>

      <div class="scope-card">
        <p class="scope-line">
          <strong>{{ t("scope") }}:</strong>
          {{ scopeSetLabel }} • {{ topCutLabel }}
        </p>

        <p class="scope-line">
          <strong>{{ t("stats") }}:</strong>
          {{ filteredTournaments.length.toLocaleString() }} {{ t("tournamentsUnit") }}
          • {{ aggregated.totalAllSamples.toLocaleString() }} {{ t("totalSamples") }}
          • {{ aggregated.totalSelectedSamples.toLocaleString() }} {{ t("selectedSamplePool") }}
        </p>

        <p class="scope-line">
          <strong>{{ t("note") }}:</strong>
          {{ noteText }}
        </p>

        <p class="scope-line mono muted">
          {{ t("loadingTournamentData", {
            loaded: loadedFilteredTournamentCount,
            total: filteredTournaments.length,
          }) }}
        </p>

        <p
          v-if="filteredTournaments.length > 0 && loadedFilteredTournamentCount < filteredTournaments.length"
          class="scope-line muted"
        >
          {{ t("progressiveLoading") }}
        </p>
      </div>

      <div class="table-card">
        <div class="table-scroll">
          <table class="decks-table">
            <thead>
              <tr>
                <th class="rank-col">
                  <button type="button" class="sort-btn" @click="toggleSort('baseRank')">
                    #
                    <span class="sort-indicator">{{ sortIndicator('baseRank') }}</span>
                  </button>
                </th>

                <th class="deck-col">{{ t("pokemon") }}</th>

                <th class="name-col">
                  <button type="button" class="sort-btn" @click="toggleSort('displayName')">
                    {{ t("deckName") }}
                    <span class="sort-indicator">{{ sortIndicator('displayName') }}</span>
                  </button>
                </th>

                <th class="tier-col">
                  <button type="button" class="sort-btn" @click="toggleSort('tier')">
                    {{ t("tier") }}
                    <span class="sort-indicator">{{ sortIndicator('tier') }}</span>
                  </button>
                </th>

                <th class="score-col">
                  <button type="button" class="sort-btn" @click="toggleSort('score')">
                    {{ t("score") }}
                    <span class="sort-indicator">{{ sortIndicator('score') }}</span>
                  </button>
                </th>

                <th class="samples-col divider-left">
                  <button type="button" class="sort-btn" @click="toggleSort('selectedSamples')">
                    {{ t("samples") }}
                    <span class="sort-indicator">{{ sortIndicator('selectedSamples') }}</span>
                  </button>
                </th>

                <th class="share-col">
                  <button type="button" class="sort-btn" @click="toggleSort('topCutShare')">
                    {{ selectedShareHeader }}
                    <span class="sort-indicator">{{ sortIndicator('topCutShare') }}</span>
                  </button>
                </th>

                <th class="winrate-col">
                  <button type="button" class="sort-btn" @click="toggleSort('winRate')">
                    {{ t("winPct") }}
                    <span class="sort-indicator">{{ sortIndicator('winRate') }}</span>
                  </button>
                </th>
              </tr>
            </thead>

            <tbody v-if="displayRows.length > 0">
              <tr v-for="row in displayRows" :key="row.key">
                <td class="mono">{{ row.baseRank.toLocaleString() }}</td>

                <td>
                  <RouterLink
                    :to="deckProfileTo(row.key)"
                    class="deck-platform-link"
                    :title="row.displayName"
                  >
                    <div class="deck-platform">
                      <div class="deck-sprites-row">
                        <template
                          v-for="(icon, iconIndex) in row.iconKeys.slice(0, 2)"
                          :key="`${row.key}-${icon}-${iconIndex}`"
                        >
                          <img
                            v-if="shouldRenderDeckIcon(row.key, icon, iconIndex)"
                            class="deck-sprite"
                            :class="{ 'deck-sprite--second': iconIndex === 1 }"
                            :src="currentDeckIconSrc(row.key, icon, iconIndex)"
                            :alt="row.displayName"
                            loading="lazy"
                            decoding="async"
                            draggable="false"
                            @error="onDeckIconError(row.key, icon, iconIndex)"
                          />

                          <span
                            v-else
                            class="deck-sprite-fallback"
                            :class="{ 'deck-sprite-fallback--second': iconIndex === 1 }"
                            :title="icon"
                          >
                            {{ iconBadgeText(icon) }}
                          </span>
                        </template>

                        <span
                          v-if="row.iconKeys.length === 0"
                          class="deck-sprite-fallback"
                          :title="row.displayName"
                        >
                          {{ deckInitials(row.displayName) }}
                        </span>
                      </div>
                    </div>
                  </RouterLink>
                </td>

                <td>
                  <RouterLink :to="deckProfileTo(row.key)" class="deck-name-link">
                    {{ row.displayName }}
                  </RouterLink>
                  
                </td>

                <td>
                  <span class="tier-pill" :class="`tier-${row.tier.toLowerCase()}`">
                    {{ row.tier }}
                  </span>
                </td>

                <td class="mono">{{ formatScore(row.score) }}</td>
                <td class="mono">{{ row.selectedSamples.toLocaleString() }}</td>
                <td class="mono">{{ formatPct(row.topCutShare) }}</td>
                <td class="mono">{{ row.winRate == null ? "—" : formatPct(row.winRate) }}</td>
              </tr>
            </tbody>

            <tbody v-else>
              <tr>
                <td colspan="8" class="empty-state">
                  {{ emptyStateMessage }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="sortedRows.length > DEFAULT_VISIBLE_ROWS" class="table-footer">
          <button
            v-if="!showAllRows"
            type="button"
            class="more-btn"
            @click="showAllRows = true"
          >
            {{ t("showAll", { count: sortedRows.length }) }}
          </button>

          <button
            v-else
            type="button"
            class="more-btn"
            @click="showAllRows = false"
          >
            {{ t("showLess") }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import { getLocalizedDeckNameFromIconKeys } from "../assets/pokemonNames";

const BASE_URL = import.meta.env.BASE_URL || "/";
const DEFAULT_VISIBLE_ROWS = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

const PRESET_CURRENT_7 = "__current_7__";
const PRESET_CURRENT_14 = "__current_14__";

type Locale = "zh" | "en";
type TopCutValue = "all" | "64" | "32" | "16" | "8" | "4" | "2" | "1";
type SetFilterValue = "" | typeof PRESET_CURRENT_7 | typeof PRESET_CURRENT_14 | string;
type SortDir = "asc" | "desc";

type SortKey =
  | "baseRank"
  | "displayName"
  | "tier"
  | "score"
  | "selectedSamples"
  | "topCutShare"
  | "winRate";

interface TournamentListItem {
  id: string;
  name?: string;
  date?: string;
  players?: number;
  game?: string;
  format?: string;
}

interface VersionMarker {
  code: string;
  name: string;
  startMs: number;
}

interface VersionWindow extends VersionMarker {
  label: string;
  endMs: number;
}

interface NormalizedTournament extends TournamentListItem {
  startMs: number;
  versionCode: string;
  versionName: string;
  versionLabel: string;
}

type StandingRow = Record<string, any>;
type PairingRow = Record<string, any>;

interface DeckIdentity {
  key: string;
  rawName: string;
  iconKeys: string[];
}

interface MutableDeckAggregate {
  key: string;
  rawName: string;
  iconKeys: string[];

  allSamples: number;
  baselineTop32Samples: number;
  weightedPoints: number;
  selectedSamples: number;
  selectedMatchPoints: number;
  selectedGames: number;
}

interface DeckRow {
  key: string;
  rawName: string;
  iconKeys: string[];

  displayName: string;
  sortName: string;

  allSamples: number;
  baselineTop32Samples: number;
  weightedPoints: number;
  baselineTop32SharePct: number;

  selectedSamples: number;
  topCutShare: number;
  winRate: number | null;

  score: number;
  tier: string;
  baseRank: number;
}

function utcMs(year: number, month: number, day: number) {
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
}

const VERSION_MARKERS: VersionMarker[] = [
  { code: "A1", name: "Genetic Apex", startMs: utcMs(2024, 10, 30) },
  { code: "A1a", name: "Mythical Island", startMs: utcMs(2024, 12, 17) },
  { code: "A2", name: "Space-Time Smackdown", startMs: utcMs(2025, 1, 29) },
  { code: "A2a", name: "Triumphant Light", startMs: utcMs(2025, 2, 28) },
  { code: "A2b", name: "Shining Revelry", startMs: utcMs(2025, 3, 27) },
  { code: "A3", name: "Celestial Guardians", startMs: utcMs(2025, 4, 30) },
  { code: "A3a", name: "Extradimensional Crisis", startMs: utcMs(2025, 5, 29) },
  { code: "A3b", name: "Eevee Grove", startMs: utcMs(2025, 6, 26) },
  { code: "A4", name: "Wisdom of Sea and Sky", startMs: utcMs(2025, 7, 30) },
  { code: "A4a", name: "Secluded Springs", startMs: utcMs(2025, 8, 28) },
  { code: "A4b", name: "Deluxe Pack: ex", startMs: utcMs(2025, 9, 30) },
  { code: "B1", name: "Mega Rising", startMs: utcMs(2025, 10, 30) },
  { code: "B1a", name: "Crimson Blaze", startMs: utcMs(2025, 12, 17) },
  { code: "B2", name: "Fantastical Parade", startMs: utcMs(2026, 1, 29) },
  { code: "B2a", name: "Paldean Wonders", startMs: utcMs(2026, 2, 26) },
  { code: "B2b", name: "Mega Shine", startMs: utcMs(2026, 3, 25) },
];

const VERSION_WINDOWS: VersionWindow[] = VERSION_MARKERS.map((item, index, arr) => ({
  ...item,
  label: `${item.code} - ${item.name}`,
  endMs: arr[index + 1]?.startMs ?? Number.POSITIVE_INFINITY,
}));

const VERSION_BY_CODE = new Map<string, VersionWindow>(
  VERSION_WINDOWS.map((item) => [item.code, item]),
);

const messages = {
  en: {
    pageTitle: "Top Decks",
    loadedData: "Loaded data {loaded} / {total}",
    set: "Set",
    topCut: "Top Cut",
    scope: "Scope",
    stats: "Stats",
    note: "Note",
    tournamentsUnit: "tournaments",
    totalSamples: "total samples",
    selectedSamplePool: "selected sample pool",
    loadingTournamentData: "Loading tournament data: {loaded} / {total}",
    progressiveLoading: "Results update progressively while standings + pairings are loading.",
    all: "All",
    top64: "Top 64",
    top32: "Top 32",
    top16: "Top 16",
    top8: "Top 8",
    top4: "Top 4",
    top2: "Top 2",
    winner: "Winner",
    allData: "All data",
    past7CurrentOnly: "Past 7 days (current set only)",
    past14CurrentOnly: "Past 14 days (current set only)",
    currentSuffix: "(current)",
    rank: "#",
    pokemon: "Pokémon",
    deckName: "Deck Name",
    tier: "Tier",
    score: "Score",
    samples: "Samples",
    fieldPct: "Field %",
    topCutPct: "Top Cut %",
    winPct: "Win %",
    showAll: "Show all ({count})",
    showLess: "Show less",
    loadingTournaments: "Loading tournaments...",
    noTournaments: "No tournaments match your filters.",
    noDecks: "No decks found for the current filters.",
    allDataScope: "All data",
    past7Scope: "Past 7 days · {version}",
    past14Scope: "Past 14 days · {version}",
    noteBody: "Tier / Score are based on the current set scope; Samples / {shareLabel} / Win % respond to the Top Cut filter.",
    summaryLabel: "{decks} decks • {tournaments} tournaments",
    loadTournamentsFailed: "Failed to load tournaments: {message}",
    unknown: "Unknown",
  },
  zh: {
    pageTitle: "熱門牌組",
    loadedData: "已載入資料 {loaded} / {total}",
    set: "版本",
    topCut: "Top Cut",
    scope: "範圍",
    stats: "統計",
    note: "說明",
    tournamentsUnit: "場賽事",
    totalSamples: "總樣本數",
    selectedSamplePool: "目前篩選樣本池",
    loadingTournamentData: "載入賽事資料中：{loaded} / {total}",
    progressiveLoading: "standings 與 pairings 載入中，結果會逐步更新。",
    all: "全部",
    top64: "前 64",
    top32: "前 32",
    top16: "前 16",
    top8: "前 8",
    top4: "前 4",
    top2: "前 2",
    winner: "冠軍",
    allData: "全部資料",
    past7CurrentOnly: "近 7 天（僅目前版本）",
    past14CurrentOnly: "近 14 天（僅目前版本）",
    currentSuffix: "（目前版本）",
    rank: "#",
    pokemon: "代表寶可夢",
    deckName: "牌組名稱",
    tier: "Tier",
    score: "分數",
    samples: "樣本數",
    fieldPct: "場域占比",
    topCutPct: "Top Cut 占比",
    winPct: "勝率",
    showAll: "顯示全部（{count}）",
    showLess: "顯示較少",
    loadingTournaments: "載入賽事中...",
    noTournaments: "沒有符合目前篩選條件的賽事。",
    noDecks: "目前篩選條件下沒有牌組資料。",
    allDataScope: "全部資料",
    past7Scope: "近 7 天 · {version}",
    past14Scope: "近 14 天 · {version}",
    noteBody: "Tier / Score 依目前版本範圍計算；Samples / {shareLabel} / Win % 會跟著 Top Cut 篩選變動。",
    summaryLabel: "{decks} 副牌組 • {tournaments} 場賽事",
    loadTournamentsFailed: "載入賽事失敗：{message}",
    unknown: "未知",
  },
} as const;

type MessageKey = keyof typeof messages.en;

const route = useRoute();

const locale = computed<Locale>(() => {
  return String(route.path).split("/")[1] === "en" ? "en" : "zh";
});

function t(key: MessageKey, params?: Record<string, string | number>) {
  let text: string = String(messages[locale.value][key] ?? messages.en[key] ?? key);
  if (!params) return text;

  for (const [name, value] of Object.entries(params)) {
    text = text.split(`{${name}}`).join(String(value));
  }
  return text;
}

function deckProfileTo(deckKey: string) {
  return {
    path: `/${locale.value}/top-decks/${encodeURIComponent(deckKey)}`,
    query: {
      set: filters.set,
      topCut: filters.topCut,
    },
  };
}

const tournaments = ref<NormalizedTournament[]>([]);
const loadingTournaments = ref(true);
const tournamentsError = ref("");

const standingsCache = reactive<Record<string, StandingRow[]>>({});
const pairingsCache = reactive<Record<string, PairingRow[]>>({});

const standingsLoading = reactive<Record<string, boolean>>({});
const pairingsLoading = reactive<Record<string, boolean>>({});

const filters = reactive({
  set: PRESET_CURRENT_7 as SetFilterValue,
  topCut: "all" as TopCutValue,
});

const sortKey = ref<SortKey>("baseRank");
const sortDir = ref<SortDir>("asc");
const showAllRows = ref(false);

function dataUrl(path: string) {
  return `${BASE_URL}${path}`;
}

function tournamentsUrl() {
  return dataUrl("data/tournaments.json");
}

function standingsUrl(id: string) {
  return dataUrl(`data/raw/${id}/standings.json`);
}

function pairingsUrl(id: string) {
  return dataUrl(`data/raw/${id}/pairings.json`);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function parseMs(value: unknown): number {
  const ms = Date.parse(String(value ?? ""));
  return Number.isFinite(ms) ? ms : NaN;
}

function inferVersionByStartMs(ms: number): VersionWindow | null {
  let hit: VersionWindow | null = null;

  for (const version of VERSION_WINDOWS) {
    if (ms >= version.startMs) {
      hit = version;
    } else {
      break;
    }
  }

  return hit;
}

function normalizeTournament(raw: TournamentListItem): NormalizedTournament | null {
  if (!raw?.id) return null;

  const startMs = parseMs(raw.date);
  if (!Number.isFinite(startMs)) return null;

  const version = inferVersionByStartMs(startMs);

  return {
    ...raw,
    startMs,
    versionCode: version?.code ?? "",
    versionName: version?.name ?? t("unknown"),
    versionLabel: version?.label ?? t("unknown"),
  };
}

async function loadTournaments() {
  loadingTournaments.value = true;
  tournamentsError.value = "";

  try {
    const rows = await fetchJson<TournamentListItem[]>(tournamentsUrl());
    const dedup = new Map<string, NormalizedTournament>();

    for (const row of rows ?? []) {
      const normalized = normalizeTournament(row);
      if (!normalized) continue;
      if (!dedup.has(normalized.id)) {
        dedup.set(normalized.id, normalized);
      }
    }

    tournaments.value = Array.from(dedup.values()).sort((a, b) => b.startMs - a.startMs);
  } catch (error: any) {
    tournaments.value = [];
    tournamentsError.value = error?.message ?? "Unknown error";
  } finally {
    loadingTournaments.value = false;
  }
}

function hasStandings(id: string) {
  return Object.prototype.hasOwnProperty.call(standingsCache, id);
}

function hasPairings(id: string) {
  return Object.prototype.hasOwnProperty.call(pairingsCache, id);
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  const queue = [...items];
  const count = Math.max(1, Math.min(limit, queue.length));

  await Promise.all(
    Array.from({ length: count }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item === undefined) return;
        await worker(item);
      }
    }),
  );
}

async function ensureTournamentDataForIds(ids: string[]) {
  const missing = ids.filter(
    (id) =>
      ((!hasStandings(id) && !standingsLoading[id]) ||
        (!hasPairings(id) && !pairingsLoading[id])),
  );

  if (missing.length === 0) return;

  await runWithConcurrency(missing, 4, async (id) => {
    if (!hasStandings(id) && !standingsLoading[id]) {
      standingsLoading[id] = true;
      try {
        const rows = await fetchJson<StandingRow[]>(standingsUrl(id));
        standingsCache[id] = Array.isArray(rows) ? rows : [];
      } catch {
        standingsCache[id] = [];
      } finally {
        standingsLoading[id] = false;
      }
    }

    if (!hasPairings(id) && !pairingsLoading[id]) {
      pairingsLoading[id] = true;
      try {
        const rows = await fetchJson<PairingRow[]>(pairingsUrl(id));
        pairingsCache[id] = Array.isArray(rows) ? rows : [];
      } catch {
        pairingsCache[id] = [];
      } finally {
        pairingsLoading[id] = false;
      }
    }
  });
}

function startOfUtcDayMs(ms: number) {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);
}

const currentVersionWindow = computed(() => inferVersionByStartMs(Date.now()));

const topCutOptions = computed<Array<{ value: TopCutValue; label: string }>>(() => [
  { value: "all", label: t("all") },
  { value: "64", label: t("top64") },
  { value: "32", label: t("top32") },
  { value: "16", label: t("top16") },
  { value: "8", label: t("top8") },
  { value: "4", label: t("top4") },
  { value: "2", label: t("top2") },
  { value: "1", label: t("winner") },
]);

const topCutLabelMap = computed(
  () => new Map<TopCutValue, string>(topCutOptions.value.map((item) => [item.value, item.label])),
);

function versionDisplayLabel(version: VersionWindow, includeCurrentSuffix = false) {
  const isCurrent = currentVersionWindow.value?.code === version.code;
  if (includeCurrentSuffix && isCurrent) {
    return `${version.label} ${t("currentSuffix")}`;
  }
  return version.label;
}

const setOptions = computed<Array<{ value: SetFilterValue; label: string }>>(() => {
  return [
    { value: "", label: t("allData") },
    { value: PRESET_CURRENT_7, label: t("past7CurrentOnly") },
    { value: PRESET_CURRENT_14, label: t("past14CurrentOnly") },
    ...[...VERSION_WINDOWS]
      .reverse()
      .map((version) => ({
        value: version.code,
        label: versionDisplayLabel(version, true),
      })),
  ];
});

const filteredTournaments = computed(() => {
  const list = tournaments.value;

  if (!filters.set) {
    return list;
  }

  if (filters.set === PRESET_CURRENT_7 || filters.set === PRESET_CURRENT_14) {
    const current = currentVersionWindow.value;
    if (!current) return [];

    const days = filters.set === PRESET_CURRENT_7 ? 7 : 14;
    const todayUtcStart = startOfUtcDayMs(Date.now());
    const rollingStartMs = todayUtcStart - (days - 1) * DAY_MS;
    const effectiveStartMs = Math.max(rollingStartMs, current.startMs);

    return list.filter(
      (t) =>
        t.versionCode === current.code &&
        t.startMs >= effectiveStartMs &&
        t.startMs < current.endMs,
    );
  }

  return list.filter((t) => t.versionCode === filters.set);
});

const filteredTournamentIds = computed(() => filteredTournaments.value.map((t) => t.id));
const filteredTournamentIdsKey = computed(() => filteredTournamentIds.value.join("|"));

watch(
  filteredTournamentIdsKey,
  () => {
    if (filteredTournamentIds.value.length === 0) return;
    void ensureTournamentDataForIds(filteredTournamentIds.value);
  },
  { immediate: true },
);

watch(
  () => `${filters.set}|${filters.topCut}`,
  () => {
    showAllRows.value = false;
  },
);

const loadedFilteredTournamentCount = computed(() => {
  return filteredTournamentIds.value.filter(
    (id) => hasStandings(id) && hasPairings(id),
  ).length;
});

function normalizeStringArray(value: unknown): string[] {
  const input = Array.isArray(value)
    ? value
    : value == null
      ? []
      : [value];

  const mapped = input
    .map((item) => {
      if (typeof item === "string") return item.trim();

      if (item && typeof item === "object") {
        const hit =
          (item as any).src ??
          (item as any).url ??
          (item as any).path ??
          (item as any).name ??
          "";
        return String(hit).trim();
      }

      return String(item).trim();
    })
    .filter(Boolean);

  return [...new Set(mapped)];
}

function isInvalidDeckToken(value: string) {
  const s = String(value ?? "").trim().toLowerCase();
  return !s || ["unknown", "undefined", "null", "none", "nan"].includes(s);
}

function cleanDeckText(value: string) {
  return isInvalidDeckToken(value) ? "" : String(value).trim();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeDeckId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();

      if (/^[ab]\d+[a-z]?$/i.test(part)) {
        return part.toUpperCase();
      }

      if (lower === "ex") return "ex";
      if (lower === "gx") return "GX";
      if (lower === "vstar") return "VSTAR";
      if (lower === "vmax") return "VMAX";
      if (lower === "mega") return "Mega";
      if (lower === "x" || lower === "y") return lower.toUpperCase();

      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function parseTwoFromDeckId(deckId?: string) {
  if (!deckId) return [];

  const tokens = String(deckId).toLowerCase().split("-").filter(Boolean);
  const isSetToken = (t: string) => /^[ab]\d+[a-z]?$/.test(t);

  const mons: string[] = [];
  let cur: string[] = [];

  for (const t of tokens) {
    if (isSetToken(t)) {
      if (cur.length) mons.push(cur.join("-"));
      cur = [];
      continue;
    }
    cur.push(t);
  }

  if (cur.length) mons.push(cur.join("-"));
  return mons.slice(0, 2);
}

function parseTwoFromDeckName(deckName?: string) {
  if (!deckName) return [];

  const s = String(deckName).trim();
  const re = /\bex\b/gi;
  const hits: number[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(s)) && hits.length < 2) {
    hits.push(m.index + m[0].length);
  }

  if (hits.length < 2) {
    return s ? [s] : [];
  }

  const firstEnd = hits[0];
  const secondEnd = hits[1];

  const part1 = s.slice(0, firstEnd).trim();
  const part2 = s.slice(firstEnd, secondEnd).trim();

  return [part1, part2].filter(Boolean);
}

function extractDeckIconKeys(row: StandingRow) {
  const deck = row?.deck ?? {};

  const direct = normalizeStringArray(
    deck?.icons ??
    deck?.icon ??
    deck?.pokemon ??
    deck?.pokemons ??
    deck?.iconKeys ??
    row?.deckIconKeys,
  );

  if (direct.length > 0) {
    return direct.slice(0, 2);
  }

  const main =
    deck?.primaryIconKey ??
    deck?.mainIconKey ??
    row?.deckIconKeyMain ??
    row?.primaryIconKey ??
    row?.mainIconKey ??
    deck?.mainPokemon ??
    deck?.main;

  const sub =
    deck?.secondaryIconKey ??
    deck?.subIconKey ??
    row?.deckIconKeySub ??
    row?.secondaryIconKey ??
    row?.subIconKey ??
    deck?.subPokemon ??
    deck?.sub;

  const paired = normalizeStringArray([main, sub]);
  if (paired.length > 0) {
    return paired.slice(0, 2);
  }

  const fromId = parseTwoFromDeckId(String(deck?.id ?? ""));
  if (fromId.length > 0) {
    return fromId.slice(0, 2);
  }

  const fromName = parseTwoFromDeckName(String(deck?.name ?? deck?.archetype ?? row?.archetype ?? ""));
  return fromName.slice(0, 2);
}

function buildDeckIdentity(row: StandingRow): DeckIdentity | null {
  const deck = row?.deck ?? {};
  const rawName = cleanDeckText(String(deck?.name ?? deck?.archetype ?? row?.archetype ?? ""));
  const rawId = cleanDeckText(String(deck?.id ?? ""));
  const iconKeys = extractDeckIconKeys(row);
  const key = rawId || slugify(rawName) || slugify(iconKeys.join("-"));

  if (!key || isInvalidDeckToken(key)) {
    return null;
  }

  return {
    key,
    rawName: rawName || humanizeDeckId(key),
    iconKeys,
  };
}

function getPlace(row: StandingRow): number | null {
  const value = Number(row?.placing);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function pointsForPlace(place: number | null) {
  if (place == null) return 0;
  if (place === 1) return 10;
  if (place === 2) return 8;
  if (place >= 3 && place <= 4) return 6;
  if (place >= 5 && place <= 8) return 4;
  if (place >= 9 && place <= 16) return 2;
  if (place >= 17 && place <= 32) return 1;
  return 0;
}

function qualifiesByTopCut(place: number | null, cut: TopCutValue) {
  if (cut === "all") return true;
  if (place == null) return false;
  return place <= Number(cut);
}

function mapNumberRecord(
  input: Record<string, number>,
  fn: (value: number) => number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input)) {
    out[key] = fn(value);
  }
  return out;
}

function minmaxScale(input: Record<string, number>): Record<string, number> {
  const entries = Object.entries(input);
  if (entries.length === 0) return {};

  const values = entries.map(([, value]) => value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) {
    const fill = entries.length === 1 ? 1 : 0;
    return Object.fromEntries(entries.map(([key]) => [key, fill]));
  }

  return Object.fromEntries(
    entries.map(([key, value]) => [key, (value - min) / (max - min)]),
  );
}

function isPerfectScore(score: number) {
  return Math.abs(score - 1) < 1e-9;
}

function tierLabel(
  score: number,
  top32SharePct: number,
  hasAnotherDeckScoreAtLeast09: boolean,
) {
  if (top32SharePct < 0.5) return "F";

  if (isPerfectScore(score)) {
    return hasAnotherDeckScoreAtLeast09 ? "SS" : "SSS";
  }

  if (score >= 0.9) return "S";
  if (score >= 0.8) return "A";
  if (score >= 0.7) return "B";
  if (score >= 0.5) return "C";
  if (score >= 0.3) return "D";
  if (score >= 0.1) return "E";
  return "F";
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatScore(value: number) {
  return value.toFixed(4);
}

function deckInitials(name: string) {
  const tokens = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return "?";
  return tokens.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
}

function iconBadgeText(raw: string) {
  let text = String(raw ?? "").trim();
  if (!text) return "?";

  if (text.includes("/")) {
    const last = text.split("/").pop();
    if (last) {
      text = last.split(".")[0] || last;
    }
  }

  const tokens = text
    .toLowerCase()
    .split("-")
    .filter(Boolean)
    .filter(
      (token) =>
        ![
          "mega",
          "alolan",
          "galarian",
          "paldean",
          "hisuian",
          "origin",
          "forme",
          "formee",
          "ex",
        ].includes(token),
    );

  const chosen = tokens[0] || text;
  return chosen.slice(0, 2).toUpperCase();
}

const deckIconModules = import.meta.glob("../assets/deck-icons/*.{png,webp,jpg,jpeg,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const deckIconUrlMap = new Map<string, string>();
const iconCandidatesMemo = new Map<string, string[]>();
const iconFailedIndex = reactive<Record<string, number>>({});

function normalizeIconLookupKey(raw: string) {
  let text = String(raw ?? "").trim();
  if (!text) return "";

  text = text.split("?")[0]?.split("#")[0] ?? text;
  text = text.replace(/\\/g, "/");
  text = text.split("/").pop() ?? text;
  text = text.replace(/\.[a-z0-9]+$/i, "");
  text = text.replace(/_/g, "-");

  return slugify(text);
}

function rawIconVariants(raw: string) {
  const first = normalizeIconLookupKey(raw);
  if (!first) return [];

  const queue = [first];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const key = queue.shift()!;
    if (!key || seen.has(key)) continue;

    seen.add(key);

    if (key.startsWith("mega-")) {
      queue.push(`${key.slice(5)}-mega`);
    }

    if (key.endsWith("-mega")) {
      queue.push(`mega-${key.slice(0, -5)}`);
    }

    if (key.endsWith("-ex")) {
      queue.push(key.slice(0, -3));
    }

    if (key.endsWith("-gx")) {
      queue.push(key.slice(0, -3));
    }

    if (key.endsWith("-v")) {
      queue.push(key.slice(0, -2));
    }
  }

  return [...seen];
}

for (const [filePath, url] of Object.entries(deckIconModules)) {
  const fileName = filePath.split("/").pop() ?? "";
  for (const key of rawIconVariants(fileName)) {
    if (!deckIconUrlMap.has(key)) {
      deckIconUrlMap.set(key, url);
    }
  }
}

function deckIconCandidates(raw: string) {
  const cacheKey = String(raw ?? "").trim();
  if (!cacheKey) return [];

  const cached = iconCandidatesMemo.get(cacheKey);
  if (cached) return cached;

  const candidates: string[] = [];

  if (/^(https?:|data:|blob:)/i.test(cacheKey)) {
    candidates.push(cacheKey);
  } else if (cacheKey.startsWith("//")) {
    candidates.push(`https:${cacheKey}`);
  }

  for (const key of rawIconVariants(cacheKey)) {
    const hit = deckIconUrlMap.get(key);
    if (hit) {
      candidates.push(hit);
    }
  }

  const deduped = [...new Set(candidates.filter(Boolean))];
  iconCandidatesMemo.set(cacheKey, deduped);
  return deduped;
}

function iconStateKey(rowKey: string, icon: string, iconIndex: number) {
  return `${rowKey}__${iconIndex}__${icon}`;
}

function currentDeckIconSrc(rowKey: string, icon: string, iconIndex: number) {
  const stateKey = iconStateKey(rowKey, icon, iconIndex);
  const failed = iconFailedIndex[stateKey] ?? 0;
  const candidates = deckIconCandidates(icon);
  return candidates[failed] ?? "";
}

function shouldRenderDeckIcon(rowKey: string, icon: string, iconIndex: number) {
  return !!currentDeckIconSrc(rowKey, icon, iconIndex);
}

function onDeckIconError(rowKey: string, icon: string, iconIndex: number) {
  const stateKey = iconStateKey(rowKey, icon, iconIndex);
  const next = (iconFailedIndex[stateKey] ?? 0) + 1;
  const candidates = deckIconCandidates(icon);

  if (next < candidates.length) {
    iconFailedIndex[stateKey] = next;
  } else {
    iconFailedIndex[stateKey] = Number.MAX_SAFE_INTEGER;
  }
}


function filledCount(list: string[]) {
  return list.filter(Boolean).length;
}

function buildPreferredDeckName(
  iconKeys: string[],
  rawName: string,
  key: string,
  targetLocale: Locale,
) {
  const fromIcons = getLocalizedDeckNameFromIconKeys(iconKeys, targetLocale);

  if (targetLocale === "zh") {
    return fromIcons || rawName || humanizeDeckId(key);
  }

  return rawName || fromIcons || humanizeDeckId(key);
}


const aggregated = computed(() => {
  const map = new Map<string, MutableDeckAggregate>();

  let totalAllSamples = 0;
  let totalBaselineTop32Samples = 0;
  let totalSelectedSamples = 0;

  for (const tournament of filteredTournaments.value) {
    const standings = standingsCache[tournament.id];
    const pairings = pairingsCache[tournament.id];

    if (!Array.isArray(standings)) continue;

    const playerDeckKey = new Map<string, string>();
    const playerPlace = new Map<string, number | null>();

    for (const row of standings) {
      const deck = buildDeckIdentity(row);
      if (!deck) continue;

      const place = getPlace(row);

      let hit = map.get(deck.key);
      if (!hit) {
        hit = {
          key: deck.key,
          rawName: deck.rawName,
          iconKeys: deck.iconKeys,

          allSamples: 0,
          baselineTop32Samples: 0,
          weightedPoints: 0,

          selectedSamples: 0,
          selectedMatchPoints: 0,
          selectedGames: 0,
        };
        map.set(deck.key, hit);
      } else {
        if (
          deck.rawName &&
          (hit.rawName === humanizeDeckId(hit.key) || deck.rawName.length > hit.rawName.length)
        ) {
          hit.rawName = deck.rawName;
        }

        if (filledCount(deck.iconKeys) > filledCount(hit.iconKeys)) {
          hit.iconKeys = deck.iconKeys;
        }
      }

      if (!hit) continue;

      hit.allSamples += 1;
      totalAllSamples += 1;

      if (place != null && place <= 32) {
        hit.baselineTop32Samples += 1;
        totalBaselineTop32Samples += 1;
        hit.weightedPoints += pointsForPlace(place);
      }

      if (qualifiesByTopCut(place, filters.topCut)) {
        hit.selectedSamples += 1;
        totalSelectedSamples += 1;
      }

      const playerId = String(row?.player ?? "").trim();
      if (playerId) {
        playerDeckKey.set(playerId, deck.key);
        playerPlace.set(playerId, place);
      }
    }

    if (!Array.isArray(pairings)) continue;

    for (const match of pairings) {
      const p1 = String(match?.player1 ?? "").trim();
      const p2 = String(match?.player2 ?? "").trim();

      if (!p1 || !p2) continue;

      const deck1 = playerDeckKey.get(p1);
      const deck2 = playerDeckKey.get(p2);

      const place1 = playerPlace.get(p1) ?? null;
      const place2 = playerPlace.get(p2) ?? null;

      const winner = match?.winner;

      const isTie =
        winner === 0 ||
        winner === "0" ||
        winner === "draw" ||
        winner === "tie";

      const isDoubleLoss = winner === -1 || winner === "-1";
      const p1Won = winner === p1;
      const p2Won = winner === p2;

      if (!isTie && !isDoubleLoss && !p1Won && !p2Won) {
        continue;
      }

      if (deck1 && qualifiesByTopCut(place1, filters.topCut)) {
        const hit = map.get(deck1);
        if (hit) {
          hit.selectedGames += 1;
          if (p1Won) hit.selectedMatchPoints += 1;
          else if (isTie) hit.selectedMatchPoints += 0.5;
        }
      }

      if (deck2 && qualifiesByTopCut(place2, filters.topCut)) {
        const hit = map.get(deck2);
        if (hit) {
          hit.selectedGames += 1;
          if (p2Won) hit.selectedMatchPoints += 1;
          else if (isTie) hit.selectedMatchPoints += 0.5;
        }
      }
    }
  }

  const data1: Record<string, number> = {};
  const data2: Record<string, number> = {};
  const data3: Record<string, number> = {};

  for (const item of map.values()) {
    data1[item.key] = item.baselineTop32Samples;
    data2[item.key] = item.weightedPoints;
    data3[item.key] =
      totalBaselineTop32Samples > 0
        ? (item.baselineTop32Samples / totalBaselineTop32Samples) * 100
        : 0;
  }

  const log1 = mapNumberRecord(data1, (value) => Math.log1p(value));
  const log2 = mapNumberRecord(data2, (value) => Math.log1p(value));
  const log3 = mapNumberRecord(data3, (value) => Math.log1p(value));

  const std1 = minmaxScale(log1);
  const std2 = minmaxScale(log2);
  const std3 = minmaxScale(log3);

  const rows: DeckRow[] = Array.from(map.values())
    .map((item) => {
      const fieldShare = totalAllSamples > 0 ? item.allSamples / totalAllSamples : 0;

      const topCutShare =
        filters.topCut === "all"
          ? fieldShare
          : totalSelectedSamples > 0
            ? item.selectedSamples / totalSelectedSamples
            : 0;

      const winRate =
        item.selectedGames > 0
          ? item.selectedMatchPoints / item.selectedGames
          : null;
      
      const baselineTop32SharePct = data3[item.key] ?? 0;

      const score =
        0.4 * (std1[item.key] ?? 0) +
        0.5 * (std2[item.key] ?? 0) +
        0.1 * (std3[item.key] ?? 0);

      const englishName = buildPreferredDeckName(item.iconKeys, item.rawName, item.key, "en");
      const chineseName = buildPreferredDeckName(item.iconKeys, item.rawName, item.key, "zh");
      const displayName = locale.value === "zh" ? chineseName : englishName;
      

      return {
        key: item.key,
        rawName: item.rawName,
        iconKeys: item.iconKeys,

        displayName,
        sortName: englishName.toLowerCase(),

        allSamples: item.allSamples,
        baselineTop32Samples: item.baselineTop32Samples,
        weightedPoints: item.weightedPoints,

        selectedSamples: item.selectedSamples,
        topCutShare,
        winRate,
        baselineTop32SharePct,
        score,
        tier: "F",
        baseRank: 999999,
      };
    })
    .sort((a, b) => {
      return (
        b.score - a.score ||
        b.weightedPoints - a.weightedPoints ||
        b.baselineTop32Samples - a.baselineTop32Samples ||
        b.allSamples - a.allSamples ||
        a.sortName.localeCompare(b.sortName)
      );
    })
    .map((row, index, arr) => {
      const hasAnotherDeckScoreAtLeast09 = arr.some(
        (other) => other.key !== row.key && other.score >= 0.9,
      );

      return {
        ...row,
        baseRank: index + 1,
        tier: tierLabel(
          row.score,
          row.baselineTop32SharePct,
          hasAnotherDeckScoreAtLeast09,
        ),
      };
    });

  return {
    rows,
    totalAllSamples,
    totalSelectedSamples,
  };
});

const TIER_ORDER: Record<string, number> = {
  SSS: 8,
  SS: 7,
  S: 6,
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

function defaultSortDirection(key: SortKey): SortDir {
  if (key === "baseRank" || key === "displayName") return "asc";
  return "desc";
}

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    return;
  }

  sortKey.value = key;
  sortDir.value = defaultSortDirection(key);
}

function sortIndicator(key: SortKey) {
  if (sortKey.value !== key) return "↕";
  return sortDir.value === "asc" ? "↑" : "↓";
}

function sortMetric(row: DeckRow, key: SortKey): number | string | null {
  switch (key) {
    case "baseRank":
      return row.baseRank;
    case "displayName":
      return row.sortName;
    case "tier":
      return TIER_ORDER[row.tier] ?? 0;
    case "score":
      return row.score;
    case "selectedSamples":
      return row.selectedSamples;
    case "topCutShare":
      return row.topCutShare;
    case "winRate":
      return row.winRate;
    default:
      return null;
  }
}

function compareNullable(
  a: number | string | null,
  b: number | string | null,
  direction: SortDir,
) {
  const aNull = a == null;
  const bNull = b == null;

  if (aNull && bNull) return 0;
  if (aNull) return 1;
  if (bNull) return -1;

  let result = 0;

  if (typeof a === "string" && typeof b === "string") {
    result = a.localeCompare(b);
  } else {
    result = Number(a) - Number(b);
  }

  return direction === "asc" ? result : -result;
}

const sortedRows = computed(() => {
  const rows = [...aggregated.value.rows];

  rows.sort((a, b) => {
    const primary = compareNullable(
      sortMetric(a, sortKey.value),
      sortMetric(b, sortKey.value),
      sortDir.value,
    );

    if (primary !== 0) return primary;

    return (
      a.baseRank - b.baseRank ||
      a.sortName.localeCompare(b.sortName) ||
      a.key.localeCompare(b.key)
    );
  });

  return rows;
});

const displayRows = computed(() => {
  return showAllRows.value
    ? sortedRows.value
    : sortedRows.value.slice(0, DEFAULT_VISIBLE_ROWS);
});

const topCutLabel = computed(() => topCutLabelMap.value.get(filters.topCut) ?? t("all"));

const selectedShareHeader = computed(() => {
  return filters.topCut === "all" ? t("fieldPct") : t("topCutPct");
});

const noteText = computed(() => {
  return t("noteBody", {
    shareLabel: selectedShareHeader.value,
  });
});

const scopeSetLabel = computed(() => {
  if (filters.set === PRESET_CURRENT_7) {
    const current = currentVersionWindow.value;
    return current
      ? t("past7Scope", { version: current.label })
      : t("past7CurrentOnly");
  }

  if (filters.set === PRESET_CURRENT_14) {
    const current = currentVersionWindow.value;
    return current
      ? t("past14Scope", { version: current.label })
      : t("past14CurrentOnly");
  }

  if (!filters.set) {
    return t("allDataScope");
  }

  const version = VERSION_BY_CODE.get(filters.set);
  return version ? versionDisplayLabel(version, true) : filters.set;
});

const deckSummaryLabel = computed(() => {
  return t("summaryLabel", {
    decks: aggregated.value.rows.length.toLocaleString(),
    tournaments: filteredTournaments.value.length.toLocaleString(),
  });
});

const emptyStateMessage = computed(() => {
  if (loadingTournaments.value) {
    return t("loadingTournaments");
  }

  if (tournamentsError.value) {
    return t("loadTournamentsFailed", { message: tournamentsError.value });
  }

  if (filteredTournaments.value.length === 0) {
    return t("noTournaments");
  }

  if (
    sortedRows.value.length === 0 &&
    loadedFilteredTournamentCount.value < filteredTournaments.value.length
  ) {
    return t("loadingTournamentData", {
      loaded: loadedFilteredTournamentCount.value,
      total: filteredTournaments.value.length,
    });
  }

  if (sortedRows.value.length === 0) {
    return t("noDecks");
  }

  return "";
});

onMounted(() => {
  void loadTournaments();
});
</script>

<style scoped>
.top-decks-page {
  color: #e7edf6;
  padding: 24px;
  width: 100%;
}

.top-decks-wrap {
  max-width: 1320px;
  margin: 0 auto;
  width: 100%;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 2rem;
  line-height: 1.1;
  font-weight: 800;
  color: #f5f8fc;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #8fb0d8;
  font-size: 1.05rem;
  font-weight: 600;
}

.page-status {
  color: #9fb3cf;
  font-size: 0.98rem;
  white-space: nowrap;
}

.filters-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.7fr);
  gap: 16px;
  margin-bottom: 16px;
}

.filter-card,
.scope-card,
.table-card {
  border: 1px solid rgba(90, 130, 180, 0.28);
  background:
    linear-gradient(180deg, rgba(18, 40, 73, 0.92), rgba(10, 25, 45, 0.95));
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}

.filter-card {
  padding: 14px;
}

.filter-label {
  display: block;
  margin-bottom: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #c6d6ea;
}

.filter-select {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(104, 146, 196, 0.34);
  background: rgba(8, 22, 40, 0.95);
  color: #eef4fb;
  padding: 12px 14px;
  font-size: 1rem;
  outline: none;
}

.filter-select:focus {
  border-color: rgba(115, 180, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(80, 150, 255, 0.14);
}

.scope-card {
  padding: 16px;
  margin-bottom: 16px;
}

.scope-line {
  margin: 0;
  color: #d5e2f2;
  line-height: 1.6;
}

.scope-line + .scope-line {
  margin-top: 4px;
}

.table-card {
  overflow: hidden;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
}

.decks-table {
  width: 100%;
  min-width: 1020px;
  border-collapse: collapse;
}

.decks-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(13, 28, 50, 0.98);
  color: #c7d7eb;
  font-size: 0.95rem;
  font-weight: 800;
  text-align: left;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(97, 134, 179, 0.22);
  white-space: nowrap;
}

.decks-table tbody td {
  padding: 16px;
  border-top: 1px solid rgba(97, 134, 179, 0.16);
  vertical-align: middle;
}

.decks-table tbody tr:hover {
  background: rgba(34, 64, 104, 0.16);
}

.rank-col {
  width: 80px;
}

.deck-col {
  width: 160px;
}

.name-col {
  min-width: 320px;
}

.tier-col,
.score-col,
.samples-col,
.share-col,
.winrate-col {
  width: 140px;
}

.divider-left {
  border-left: 2px solid rgba(78, 127, 191, 0.45);
}

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: inherit;
  cursor: pointer;
}

.sort-indicator {
  color: #70b4ff;
  font-size: 0.95rem;
  line-height: 1;
}

.deck-platform {
  position: relative;
  width: 96px;
  min-width: 96px;
  height: 64px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.deck-sprites-row {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  line-height: 0;
  margin-top: 2px;
}

.deck-sprite {
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  outline: none;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.deck-sprite--second {
  margin-left: -8px;
}

.deck-sprite-fallback {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(14, 33, 59, 0.8);
  border: 1px solid rgba(117, 180, 255, 0.24);
  color: #eef6ff;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  line-height: 1;
}

.deck-sprite-fallback--second {
  margin-left: -8px;
}



.deck-name {
  font-size: 1rem;
  font-weight: 800;
  color: #eef5fb;
  line-height: 1.35;
  word-break: break-word;
}

.tier-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  font-weight: 900;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 16px rgba(0, 0, 0, 0.14);
}

.tier-sss,
.tier-ss,
.tier-s {
  background: linear-gradient(180deg, rgba(178, 97, 56, 0.96) 0%, rgba(103, 49, 22, 0.98) 100%);
  border-color: rgba(226, 164, 98, 0.38);
}

.tier-sss {
  color: #fff4d1;
}

.tier-ss {
  color: #ffe7bf;
}

.tier-s {
  color: #f8f1e3;
}

.tier-a {
  background: linear-gradient(180deg, rgba(156, 110, 53, 0.95) 0%, rgba(89, 61, 23, 0.98) 100%);
  color: #fff0d6;
  border-color: rgba(203, 154, 92, 0.34);
}

.tier-b {
  background: linear-gradient(180deg, rgba(145, 128, 55, 0.95) 0%, rgba(84, 73, 24, 0.98) 100%);
  color: #fff6cc;
  border-color: rgba(188, 169, 86, 0.3);
}

.tier-c {
  background: linear-gradient(180deg, rgba(97, 146, 82, 0.94) 0%, rgba(55, 92, 46, 0.98) 100%);
  color: #ebffe8;
  border-color: rgba(132, 181, 118, 0.3);
}

.tier-d {
  background: linear-gradient(180deg, rgba(84, 110, 144, 0.94) 0%, rgba(46, 61, 86, 0.98) 100%);
  color: #e8f1ff;
  border-color: rgba(118, 145, 184, 0.32);
}

.tier-e {
  background: linear-gradient(180deg, rgba(105, 92, 140, 0.94) 0%, rgba(59, 49, 84, 0.98) 100%);
  color: #ece5ff;
  border-color: rgba(145, 128, 190, 0.26);
}

.tier-f {
  background: linear-gradient(180deg, rgba(78, 86, 99, 0.94) 0%, rgba(41, 46, 55, 0.98) 100%);
  color: #dde5ef;
  border-color: rgba(122, 132, 146, 0.24);
}


.empty-state {
  text-align: center;
  color: #c7d4e6;
  padding: 28px 20px !important;
  font-size: 1rem;
}

.table-footer {
  display: flex;
  justify-content: center;
  padding: 16px 18px 18px;
  border-top: 1px solid rgba(97, 134, 179, 0.16);
}

.more-btn {
  border: 1px solid rgba(117, 180, 255, 0.32);
  background: rgba(25, 67, 116, 0.46);
  color: #eef6ff;
  border-radius: 999px;
  padding: 10px 16px;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.more-btn:hover {
  background: rgba(36, 88, 148, 0.62);
  transform: translateY(-1px);
}

.muted {
  color: #97adc8;
}

.mono {
  font-variant-numeric: tabular-nums;
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    "Courier New",
    monospace;
}

@media (max-width: 960px) {
  .top-decks-page {
    padding: 16px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 1.7rem;
  }

  .deck-platform {
    width: 88px;
    min-width: 88px;
    height: 60px;
  }

  .deck-sprite {
    width: 44px;
    height: 44px;
  }

  .deck-sprite--second {
    margin-left: -7px;
  }

 
}
</style>