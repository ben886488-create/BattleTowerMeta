<template>
  <section class="topCardsPage">
    <div class="topCardsShell">
      <header class="topCardsHero">
        <div class="topCardsHero__copy">
          <p class="topCardsHero__eyebrow mono">{{ ui.heroEyebrow }}</p>
          <h1 class="topCardsHero__title">{{ ui.pageTitle }}</h1>
          <p class="topCardsHero__subtitle">
            {{ viewMode === "inclusion" ? ui.pageSubtitleInclusion : ui.pageSubtitleCatalog }}
          </p>
        </div>

        <div class="topCardsModeToggle" role="tablist" :aria-label="ui.modeLabel">
          <button
            type="button"
            class="topCardsModeToggle__button"
            :class="{ 'topCardsModeToggle__button--active': viewMode === 'inclusion' }"
            @click="viewMode = 'inclusion'"
          >
            {{ ui.modeInclusion }}
          </button>
          <button
            type="button"
            class="topCardsModeToggle__button"
            :class="{ 'topCardsModeToggle__button--active': viewMode === 'catalog' }"
            @click="viewMode = 'catalog'"
          >
            {{ ui.modeCatalog }}
          </button>
        </div>
      </header>

      <section class="topCardsPanel topCardsPanel--filters">
        <div class="topCardsFilters">
          <template v-if="viewMode === 'inclusion'">
            <label class="topCardsField">
              <span>{{ ui.players }}</span>
              <input
                v-model.number="filters.minPlayers"
                type="number"
                min="0"
                inputmode="numeric"
                :placeholder="ui.playersPlaceholder"
              />
            </label>

            <label class="topCardsField">
              <span>{{ ui.time }}</span>
              <select v-model="filters.time">
                <option
                  v-for="option in timeOptionGroups.base"
                  :key="`base-${option.value}`"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
                <optgroup :label="ui.month" v-if="timeOptionGroups.months.length > 0">
                  <option
                    v-for="option in timeOptionGroups.months"
                    :key="`month-${option.value}`"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </optgroup>
              </select>
            </label>

            <label class="topCardsField">
              <span>{{ ui.set }}</span>
              <select v-model="filters.set">
                <option v-for="option in inclusionSetOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="topCardsField">
              <span>{{ ui.topCut }}</span>
              <select v-model="filters.topCut">
                <option
                  v-for="option in topCutOptions"
                  :key="`cut-${option.value}`"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
          </template>

          <template v-else>
            <label class="topCardsField topCardsField--wide">
              <span>{{ ui.pack }}</span>
              <select v-model="selectedCatalogSet">
                <option v-for="option in catalogSetOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
          </template>

          <label class="topCardsField topCardsField--search">
            <span>{{ ui.search }}</span>
            <input v-model.trim="cardSearch" type="search" :placeholder="searchPlaceholder" />
          </label>
        </div>

        <div class="topCardsCategoryBar" role="tablist" :aria-label="ui.categoryLabel">
          <button
            v-for="option in categoryOptions"
            :key="option.value"
            type="button"
            class="topCardsCategoryBar__button"
            :class="{ 'topCardsCategoryBar__button--active': categoryFilter === option.value }"
            @click="categoryFilter = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </section>

      <section class="topCardsPanel topCardsPanel--summary">
        <template v-if="viewMode === 'inclusion'">
          <div class="topCardsSummary">
            <div class="topCardsSummary__block">
              <span class="topCardsSummary__label mono">{{ ui.scope }}</span>
              <strong>{{ inclusionScopeText }}</strong>
            </div>
            <div class="topCardsSummary__block">
              <span class="topCardsSummary__label mono">{{ ui.stats }}</span>
              <strong>{{ inclusionStatsText }}</strong>
            </div>
            <div class="topCardsSummary__block topCardsSummary__block--note">
              <span class="topCardsSummary__label mono">{{ ui.note }}</span>
              <strong>{{ ui.inclusionNote }}</strong>
            </div>
          </div>

          <p v-if="isInclusionLoading" class="topCardsLoading mono">
            {{ ui.loadingInclusion.replace("{loaded}", String(loadedInclusionTournamentCount)).replace("{total}", String(filteredInclusionTournaments.length)) }}
          </p>
        </template>

        <template v-else>
          <div v-if="selectedCatalogSetMeta" class="topCardsSummary">
            <div class="topCardsSummary__block">
              <span class="topCardsSummary__label mono">{{ ui.pack }}</span>
              <strong>{{ selectedCatalogSetMeta.label }}</strong>
            </div>
            <div class="topCardsSummary__block">
              <span class="topCardsSummary__label mono">{{ ui.releaseDate }}</span>
              <strong>{{ selectedCatalogSetMeta.releaseDateLabel }}</strong>
            </div>
            <div class="topCardsSummary__block">
              <span class="topCardsSummary__label mono">{{ ui.cardCount }}</span>
              <strong>
                {{ catalogDisplayCards.length.toLocaleString() }} / {{ selectedCatalogSetMeta.cardsInSet.toLocaleString() }}
              </strong>
            </div>
          </div>
        </template>
      </section>

      <section class="topCardsPanel topCardsPanel--grid">
        <div
          v-if="viewMode === 'catalog' && isCatalogLoading"
          class="topCardsEmpty"
        >
          <span class="mono">{{ ui.loadingCatalog }}</span>
        </div>

        <div
          v-else-if="viewMode === 'inclusion' && filteredInclusionTournaments.length === 0"
          class="topCardsEmpty"
        >
          <span class="mono">{{ ui.noTournaments }}</span>
        </div>

        <div
          v-else-if="viewMode === 'inclusion' && inclusionDisplayCards.length === 0"
          class="topCardsEmpty"
        >
          <span class="mono">{{ ui.noInclusionCards }}</span>
        </div>

        <div
          v-else-if="viewMode === 'catalog' && catalogDisplayCards.length === 0"
          class="topCardsEmpty"
        >
          <span class="mono">{{ ui.noCatalogCards }}</span>
        </div>

        <template v-else>
          <div v-if="viewMode === 'inclusion'" class="topCardsGrid">
            <article
              v-for="card in pagedInclusionCards"
              :key="card.key"
              class="topCardTile topCardTile--inclusion"
              :title="`${card.name} | ${ui.totalInclusion}: ${formatPercentValue(card.inclusionPct)} | 2x ${formatPercentValue(card.twoCopyPct)} | 1x ${formatPercentValue(card.oneCopyPct)}`"
            >
              <div class="topCardTile__imageWrap">
                <img
                  v-if="card.imageUrl"
                  class="topCardTile__image"
                  :src="card.imageUrl"
                  :alt="card.name"
                  loading="lazy"
                  draggable="false"
                />
                <div v-else class="topCardTile__fallback">
                  <strong>{{ card.name }}</strong>
                  <span class="mono">{{ card.codeLabel }}</span>
                </div>

                <div
                  class="topCardTile__stats"
                  :style="{
                    '--one-rate': `${card.oneCopyPct}%`,
                    '--two-rate': `${card.twoCopyPct}%`,
                  }"
                >
                  <div class="topCardTile__rateDial">
                    <span class="topCardTile__rateDialLabel">{{ ui.rateLabel }}</span>
                    <strong class="topCardTile__rateDialValue mono">
                      {{ formatPercentValue(card.inclusionPct) }}
                    </strong>
                  </div>

                  <div class="topCardTile__copyBreakdown">
                    <span
                      class="topCardTile__copyStat topCardTile__copyStat--two"
                      :aria-label="`2 copies ${formatPercentValue(card.twoCopyPct)}`"
                    >
                      <img class="topCardTile__copyIcon" :src="twoCopyDiskIcon" alt="" draggable="false" />
                      <strong class="topCardTile__copyValue mono">{{ formatPercentValue(card.twoCopyPct) }}</strong>
                    </span>
                    <span
                      class="topCardTile__copyStat topCardTile__copyStat--one"
                      :aria-label="`1 copy ${formatPercentValue(card.oneCopyPct)}`"
                    >
                      <img class="topCardTile__copyIcon" :src="oneCopyDiskIcon" alt="" draggable="false" />
                      <strong class="topCardTile__copyValue mono">{{ formatPercentValue(card.oneCopyPct) }}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="topCardsGrid">
            <article
              v-for="card in pagedCatalogCards"
              :key="card.key"
              class="topCardTile topCardTile--catalog"
            >
              <a
                class="topCardTile__imageWrap topCardTile__imageWrap--link"
                :href="card.detailUrl || undefined"
                :target="card.detailUrl ? '_blank' : undefined"
                :rel="card.detailUrl ? 'noreferrer noopener' : undefined"
              >
                <img
                  v-if="card.imageUrl"
                  class="topCardTile__image"
                  :src="card.imageUrl"
                  :alt="card.name"
                  loading="lazy"
                  draggable="false"
                />
                <div v-else class="topCardTile__fallback">
                  <strong>{{ card.name }}</strong>
                  <span class="mono">{{ card.codeLabel }}</span>
                </div>
              </a>

              <div class="topCardTile__body">
                <div class="topCardTile__head">
                  <h3 class="topCardTile__name">{{ card.name }}</h3>
                  <p class="topCardTile__meta mono">{{ card.codeLabel }}</p>
                </div>

                <div class="topCardTile__catalogMeta">
                  <span class="topCardTile__catalogChip">{{ categoryLabel(card.category) }}</span>
                  <span v-if="card.subtype" class="topCardTile__catalogChip topCardTile__catalogChip--alt">
                    {{ card.subtype }}
                  </span>
                </div>
              </div>
            </article>
          </div>

          <nav v-if="pageCount > 1" class="topCardsPager" aria-label="pagination">
            <button
              type="button"
              class="topCardsPager__button"
              :disabled="currentPage <= 1"
              @click="currentPage -= 1"
            >
              {{ ui.previous }}
            </button>
            <span class="topCardsPager__status mono">{{ currentPage }} / {{ pageCount }}</span>
            <button
              type="button"
              class="topCardsPager__button"
              :disabled="currentPage >= pageCount"
              @click="currentPage += 1"
            >
              {{ ui.next }}
            </button>
          </nav>
        </template>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";
import { loadTournamentList, loadTournamentStandings } from "../lib/publicData";
import cardsCatalogUrl from "../assets/limitless_dump/limitless_cards.json?url";
import setsCatalogUrl from "../assets/limitless_dump/limitless_sets.json?url";
import oneCopyDiskIcon from "../assets/deck-disks/3.png";
import twoCopyDiskIcon from "../assets/deck-disks/4.png";

const DAY_MS = 24 * 60 * 60 * 1000;
const CARDS_PER_PAGE = 30;
const CARD_CODE_RE = /\b((?:[A-Z]\d+[a-z]?|P-[A-Z])-\d+[a-z]?)\b/i;

type AnyRecord = Record<string, any>;
type Locale = "zh" | "en";
type ViewMode = "inclusion" | "catalog";
type CardCategory = "Pokemon" | "Trainer" | "Energy" | "Other";
type CategoryFilter = "all" | CardCategory;
type TimeFilterValue = "all" | "past7" | "prev7" | "past4w" | string;
type TopCutValue = "all" | "64" | "32" | "16" | "8" | "4" | "2" | "1";
type SetFilterValue = "" | string;

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

interface RawCatalogCard {
  id?: string;
  name?: string;
  set_name?: string;
  set_code?: string;
  number?: number | string;
  detail_url?: string;
  image_url?: string;
  page_line?: string;
  rarity?: string;
  page_badges?: string[];
  extra_text?: string;
}

interface RawCatalogSet {
  set_code?: string;
  set_name?: string;
  release_date?: string | null;
  cards_in_set?: number;
  index_order?: number;
}

interface CatalogSet {
  code: string;
  name: string;
  label: string;
  releaseDateLabel: string;
  cardsInSet: number;
  order: number;
}

interface CatalogCard {
  key: string;
  code: string;
  codeLabel: string;
  setCode: string;
  setName: string;
  numberLabel: string;
  numberSort: number;
  name: string;
  imageUrl: string;
  detailUrl: string;
  category: CardCategory;
  subtype: string;
  searchText: string;
}

interface NormalizedDeckCard {
  key: string;
  code: string;
  set: string;
  number: string;
  name: string;
  count: number;
  image: string;
  category: CardCategory;
}

interface InclusionCard {
  key: string;
  code: string;
  codeLabel: string;
  setCode: string;
  numberLabel: string;
  name: string;
  imageUrl: string;
  category: CardCategory;
  totalCopies: number;
  deckCount: number;
  oneCopyDeckCount: number;
  twoCopyDeckCount: number;
  inclusionPct: number;
  oneCopyPct: number;
  twoCopyPct: number;
}

interface InclusionAnalytics {
  totalDeckRows: number;
  cards: InclusionCard[];
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
  { code: "B3", name: "Pulsing Aura", startMs: utcMs(2026, 4, 28) },
];

const VERSION_WINDOWS: VersionWindow[] = VERSION_MARKERS.map((item, index, arr) => ({
  ...item,
  label: `${item.code} - ${item.name}`,
  endMs: arr[index + 1]?.startMs ?? Number.POSITIVE_INFINITY,
}));

function inferVersionByStartMs(ms: number) {
  let hit: VersionWindow | null = null;

  for (const version of VERSION_WINDOWS) {
    if (ms >= version.startMs) hit = version;
    else break;
  }

  return hit;
}

const route = useRoute();
const locale = computed<Locale>(() => (String(route.path).split("/")[1] === "en" ? "en" : "zh"));

const messages = {
  en: {
    heroEyebrow: "CARD ATLAS",
    pageTitle: "Top Cards",
    pageSubtitleInclusion:
      "Track how often each card appears across the current deck pool, including 2x and 1x splits.",
    pageSubtitleCatalog:
      "Browse every card in a set like a pocket encyclopedia, starting from the latest pack.",
    modeLabel: "Top cards view",
    modeInclusion: "Card inclusion",
    modeCatalog: "Card catalog",
    players: "Players",
    playersPlaceholder: "e.g. 32",
    time: "Time",
    month: "Month",
    set: "Meta set",
    pack: "Card set",
    topCut: "Top Cut",
    search: "Search",
    searchPlaceholderInclusion: "Search by card name",
    searchPlaceholderCatalog: "Search this set",
    categoryLabel: "Card category",
    categoryAll: "All",
    categoryPokemon: "Pokemon",
    categoryTrainer: "Trainer",
    categoryEnergy: "Energy",
    scope: "Scope",
    stats: "Stats",
    note: "Note",
    tournamentsUnit: "tournaments",
    loadedUnit: "loaded",
    decklistsUnit: "decklists",
    cardsUnit: "cards",
    inclusionNote: "2x and 1x show the share of all filtered decklists, not just decks that include the card.",
    loadingInclusion: "Loading standings {loaded} / {total}",
    loadingCatalog: "Loading card catalog...",
    rateLabel: "Rate",
    totalInclusion: "Total inclusion",
    releaseDate: "Release",
    cardCount: "Cards",
    noTournaments: "No tournaments match the current filters.",
    noInclusionCards: "No cards were found in the filtered deck pool.",
    noCatalogCards: "No cards match this catalog filter.",
    allData: "All data",
    all: "All",
    past7: "Past 7 days",
    prev7: "Previous 7 days",
    past4w: "Past 4 weeks",
    top64: "Top 64",
    top32: "Top 32",
    top16: "Top 16",
    top8: "Top 8",
    top4: "Top 4",
    top2: "Top 2",
    winner: "Winner",
    currentSuffix: "(current)",
    previous: "Previous",
    next: "Next",
    allDates: "All dates",
    unknownDate: "Unknown",
  },
  zh: {
    heroEyebrow: "CARD ATLAS",
    pageTitle: "泛用卡片",
    pageSubtitleInclusion: "用圖鑑式版面查看整個環境裡每張卡的投入率，並拆出投放 2 張與 1 張的比例。",
    pageSubtitleCatalog: "像卡片圖鑑一樣按版本瀏覽整包卡片，預設直接打開最新卡包。",
    modeLabel: "泛用卡片檢視模式",
    modeInclusion: "卡片投入率",
    modeCatalog: "卡片圖鑑",
    players: "玩家數",
    playersPlaceholder: "例如 32",
    time: "時間",
    month: "月份",
    set: "環境版本",
    pack: "卡包版本",
    topCut: "Top Cut",
    search: "搜尋",
    searchPlaceholderInclusion: "搜尋卡片名稱",
    searchPlaceholderCatalog: "搜尋這個版本的卡片",
    categoryLabel: "卡片分類",
    categoryAll: "全部",
    categoryPokemon: "寶可夢",
    categoryTrainer: "訓練家",
    categoryEnergy: "能量",
    scope: "範圍",
    stats: "統計",
    note: "說明",
    tournamentsUnit: "場賽事",
    loadedUnit: "已載入",
    decklistsUnit: "副牌樣本",
    cardsUnit: "張卡",
    inclusionNote: "2x 與 1x 顯示的是在所有篩選後副牌中的占比，不是只在有投入這張卡的副牌中計算。",
    loadingInclusion: "載入 standings 中：{loaded} / {total}",
    loadingCatalog: "載入卡片圖鑑中...",
    rateLabel: "投入率",
    totalInclusion: "總投入",
    releaseDate: "發售日",
    cardCount: "卡片數",
    noTournaments: "目前條件下沒有符合的賽事。",
    noInclusionCards: "目前篩選下沒有卡片投入資料。",
    noCatalogCards: "目前條件下沒有符合的卡片。",
    allData: "全部資料",
    all: "全部",
    past7: "近 7 天",
    prev7: "過去一週",
    past4w: "近 4 週",
    top64: "Top 64",
    top32: "Top 32",
    top16: "Top 16",
    top8: "Top 8",
    top4: "Top 4",
    top2: "亞軍以上",
    winner: "冠軍",
    currentSuffix: "（目前版本）",
    previous: "上一頁",
    next: "下一頁",
    allDates: "全部時間",
    unknownDate: "未知",
  },
} satisfies Record<Locale, Record<string, string>>;

const ui = computed(() => messages[locale.value]);
const currentVersionWindow = computed(() => inferVersionByStartMs(Date.now()));

const viewMode = ref<ViewMode>("inclusion");
const categoryFilter = ref<CategoryFilter>("all");
const cardSearch = ref("");
const currentPage = ref(1);
const selectedCatalogSet = ref("");

const filters = reactive<{
  minPlayers: number | undefined;
  time: TimeFilterValue;
  set: SetFilterValue;
  topCut: TopCutValue;
}>({
  minPlayers: undefined,
  time: "past4w",
  set: currentVersionWindow.value?.code ?? "",
  topCut: "all",
});

const tournaments = shallowRef<NormalizedTournament[]>([]);
const catalogCards = shallowRef<CatalogCard[]>([]);
const catalogSets = shallowRef<CatalogSet[]>([]);

const isCatalogLoading = ref(false);
const isTournamentListLoading = ref(false);
const isStandingsLoading = ref(false);
const standingsProgress = reactive({
  loaded: 0,
  total: 0,
});

const standingsCache = new Map<string, AnyRecord[]>();
const standingsPromises = new Map<string, Promise<AnyRecord[]>>();
const standingsTick = ref(0);
let standingsRequestToken = 0;

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isInvalidToken(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();
  return !text || ["unknown", "undefined", "null", "none", "nan"].includes(text);
}

function cleanText(value: unknown) {
  return isInvalidToken(value) ? "" : String(value ?? "").trim();
}

function normalizeSearchableText(value: unknown) {
  const text = cleanText(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\u2019\u2018\u2035`\u00b4]/g, "'")
    .replace(/pok[e\u00e9]mon/gi, "pokemon");

  return text.replace(/\s+/g, " ").trim();
}

function slugify(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSetCode(value: unknown) {
  const raw = String(value ?? "").trim().replace(/_/g, "-");
  if (!raw) return "";

  const promoMatch = raw.match(/^P-([A-Z])$/i);
  if (promoMatch?.[1]) {
    return `P-${promoMatch[1].toUpperCase()}`;
  }

  const mainMatch = raw.match(/^([A-Z])(\d+)([A-Z]?)$/i);
  if (mainMatch?.[1] && mainMatch?.[2]) {
    return `${mainMatch[1].toUpperCase()}${mainMatch[2]}${(mainMatch[3] ?? "").toLowerCase()}`;
  }

  return raw;
}

function normalizeCardCode(value: unknown) {
  const raw = String(value ?? "")
    .trim()
    .replace(/_/g, "-")
    .replace(/\s+/g, "");

  if (!raw) return "";

  const match = raw.match(/^((?:[A-Z]\d+[a-z]?|P-[A-Z]))-(\d+[a-z]?)$/i);
  if (!match?.[1] || !match?.[2]) return "";
  return `${normalizeSetCode(match[1])}-${match[2].toLowerCase()}`;
}

function extractCardCodeFromText(value: unknown) {
  const match = String(value ?? "").match(CARD_CODE_RE);
  return match?.[1] ? normalizeCardCode(match[1]) : "";
}

function stripCardCodeFromName(value: unknown) {
  return cleanText(
    String(value ?? "").replace(
      /\s*(?:\(((?:[A-Z]\d+[a-z]?|P-[A-Z])-\d+[a-z]?)\)|((?:[A-Z]\d+[a-z]?|P-[A-Z])-\d+[a-z]?))\s*$/i,
      "",
    ),
  );
}

function normalizeMaybeAbsoluteUrl(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return "";
  return /^(https?:\/\/|data:|blob:|\/)/i.test(raw) ? raw : "";
}

function normalizeCardCategory(value: unknown): CardCategory {
  const text = cleanText(value).toLowerCase();

  if (text.includes("pokemon")) return "Pokemon";
  if (text.includes("pokémon")) return "Pokemon";
  if (text.includes("trainer")) return "Trainer";
  if (text.includes("supporter")) return "Trainer";
  if (text.includes("item")) return "Trainer";
  if (text.includes("stadium")) return "Trainer";
  if (text.includes("energy")) return "Energy";

  return "Other";
}

function normalizeCardNumberLabel(value: unknown) {
  const raw = String(value ?? "").trim().toUpperCase();
  return raw || "?";
}

function sortCardNumberValue(value: unknown) {
  const raw = normalizeCardNumberLabel(value);
  const match = raw.match(/^(\d+)([A-Z]?)$/i);
  if (!match?.[1]) return Number.MAX_SAFE_INTEGER;
  const base = Number(match[1]);
  const suffix = match[2] ? match[2].toUpperCase().charCodeAt(0) / 1000 : 0;
  return base + suffix;
}

function getPlace(row: AnyRecord) {
  const candidates = [
    row.place,
    row.placing,
    row.rank,
    row.position,
    row.standing,
    row.result?.place,
    row.meta?.place,
  ];

  for (const candidate of candidates) {
    const value = toNumber(candidate);
    if (value != null && value > 0) return Math.trunc(value);
  }

  return null;
}

function qualifiesByTopCut(place: number | null, topCut: TopCutValue) {
  if (place == null) return false;
  if (topCut === "all") return true;
  const cutoff = Number(topCut);
  return Number.isFinite(cutoff) ? place <= cutoff : true;
}

async function fetchJsonAsset<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status})`);
  return (await response.json()) as T;
}

function inferCatalogCategorySafe(card: RawCatalogCard): CardCategory {
  const extraText = normalizeSearchableText(card.extra_text).toLowerCase();
  const lineText = normalizeSearchableText(card.page_line).toLowerCase();

  if (/\bpokemon\b/.test(extraText) || /\bpokemon\b/.test(lineText)) return "Pokemon";
  if (/\btrainer\b|\bsupporter\b|\bitem\b|\bstadium\b/.test(extraText)) return "Trainer";
  if (/\benergy\b/.test(extraText) || /\b(?:basic|special)\s+energy\b/.test(lineText)) return "Energy";
  if (/\bsupporter\b|\bitem\b|\bstadium\b/.test(lineText)) return "Trainer";
  return "Other";
}

function inferCatalogSubtypeSafe(card: RawCatalogCard, category: CardCategory) {
  const extraText = normalizeSearchableText(card.extra_text);
  const lineText = normalizeSearchableText(card.page_line);
  const source = `${extraText} ${lineText}`;

  if (category === "Trainer") {
    const trainerMatch =
      extraText.match(/\b(Supporter|Item|Stadium)\b/i) ?? source.match(/\b(Supporter|Item|Stadium)\b/i);
    return trainerMatch?.[1] ?? "";
  }

  if (category === "Energy") {
    const energyMatch =
      extraText.match(/\b(Basic|Special)\s+Energy\b/i) ?? source.match(/\b(Basic|Special)\s+Energy\b/i);
    return energyMatch ? `${energyMatch[1]} Energy` : "Energy";
  }

  const pokemonMatch =
    extraText.match(/\b(Basic|Stage 1|Stage 2|Baby)\b/i) ?? source.match(/\b(Basic|Stage 1|Stage 2|Baby)\b/i);
  if (pokemonMatch?.[1]) return pokemonMatch[1];
  if (/\bex\b/i.test(cleanText(card.name))) return "ex";
  return "";
}

function inferCatalogCategory(card: RawCatalogCard): CardCategory {
  const text = `${cleanText(card.page_line)} ${cleanText(card.extra_text)}`.toLowerCase();
  if (/\btrainer\b|\bsupporter\b|\bitem\b|\bstadium\b/.test(text)) return "Trainer";
  if (/\benergy\b/.test(text)) return "Energy";
  if (/pokémon|pokemon/.test(text)) return "Pokemon";
  return "Other";
}

function inferCatalogSubtype(card: RawCatalogCard, category: CardCategory) {
  const source = `${cleanText(card.page_line)} ${cleanText(card.extra_text)}`.replace(/Pokémon/g, "Pokemon");

  if (category === "Trainer") {
    const trainerMatch = source.match(/\b(Supporter|Item|Stadium)\b/i);
    return trainerMatch?.[1] ?? "";
  }

  if (category === "Energy") {
    const energyMatch = source.match(/\b(Basic|Special)\s+Energy\b/i);
    return energyMatch ? `${energyMatch[1]} Energy` : "Energy";
  }

  const pokemonMatch = source.match(/\b(Basic|Stage 1|Stage 2|Baby)\b/i);
  if (pokemonMatch?.[1]) return pokemonMatch[1];
  if (/\bex\b/i.test(cleanText(card.name))) return "ex";
  return "";
}

function buildCatalogCard(raw: RawCatalogCard): CatalogCard | null {
  const setCode = normalizeSetCode(raw.set_code);
  const numberLabel = normalizeCardNumberLabel(raw.number);
  const code = normalizeCardCode(`${setCode}-${String(raw.number ?? "").toLowerCase()}`);
  const name = cleanText(raw.name) || code;
  if (!setCode || !name) return null;

  const category = inferCatalogCategorySafe(raw);
  const subtype = inferCatalogSubtypeSafe(raw, category);
  const codeLabel = `${setCode} #${numberLabel}`;

  return {
    key: raw.id || code || `${setCode}-${numberLabel}-${slugify(name)}`,
    code,
    codeLabel,
    setCode,
    setName: cleanText(raw.set_name) || setCode,
    numberLabel,
    numberSort: sortCardNumberValue(raw.number),
    name,
    imageUrl: normalizeMaybeAbsoluteUrl(raw.image_url),
    detailUrl: normalizeMaybeAbsoluteUrl(raw.detail_url),
    category,
    subtype,
    searchText: normalizeSearchableText([name, setCode, cleanText(raw.set_name), subtype].join(" ")).toLowerCase(),
  };
}

async function loadCatalogData() {
  isCatalogLoading.value = true;

  try {
    const [rawCards, rawSets] = await Promise.all([
      fetchJsonAsset<RawCatalogCard[]>(cardsCatalogUrl),
      fetchJsonAsset<RawCatalogSet[]>(setsCatalogUrl),
    ]);

    const normalizedSets = (rawSets ?? [])
      .map((item) => {
        const code = normalizeSetCode(item.set_code);
        if (!code) return null;
        const name = cleanText(item.set_name) || code;
        return {
          code,
          name,
          label: `${code} - ${name}`,
          releaseDateLabel: cleanText(item.release_date) || ui.value.unknownDate,
          cardsInSet: Math.max(0, Math.trunc(toNumber(item.cards_in_set) ?? 0)),
          order: Math.max(0, Math.trunc(toNumber(item.index_order) ?? Number.MAX_SAFE_INTEGER)),
        } satisfies CatalogSet;
      })
      .filter((item): item is CatalogSet => item !== null)
      .sort((a, b) => a.order - b.order || a.code.localeCompare(b.code));

    const normalizedCards = (rawCards ?? [])
      .map(buildCatalogCard)
      .filter((item): item is CatalogCard => item !== null)
      .sort((a, b) => {
        return (
          a.setCode.localeCompare(b.setCode) ||
          a.numberSort - b.numberSort ||
          a.name.localeCompare(b.name)
        );
      });

    catalogSets.value = normalizedSets;
    catalogCards.value = normalizedCards;

    if (!selectedCatalogSet.value) {
      selectedCatalogSet.value =
        normalizedSets.find((item) => !item.code.startsWith("P-"))?.code ?? normalizedSets[0]?.code ?? "";
    }
  } finally {
    isCatalogLoading.value = false;
  }
}

function versionDisplayLabel(version: VersionWindow, includeCurrentSuffix = false) {
  const isCurrent = currentVersionWindow.value?.code === version.code;
  if (includeCurrentSuffix && isCurrent) {
    return `${version.label} ${ui.value.currentSuffix}`;
  }
  return version.label;
}

async function loadTournaments() {
  isTournamentListLoading.value = true;

  try {
    const payload = await loadTournamentList<TournamentListItem[]>();

    tournaments.value = (payload ?? [])
      .map((item) => {
        const startMs = Date.parse(String(item.date ?? ""));
        if (!Number.isFinite(startMs)) return null;
        const version = inferVersionByStartMs(startMs);

        return {
          ...item,
          startMs,
          versionCode: version?.code ?? "",
          versionName: version?.name ?? "",
          versionLabel: version ? versionDisplayLabel(version, true) : "",
        } satisfies NormalizedTournament;
      })
      .filter((item): item is NormalizedTournament => item !== null)
      .sort((a, b) => b.startMs - a.startMs);
  } finally {
    isTournamentListLoading.value = false;
  }
}

async function ensureTournamentStandings(id: string) {
  const cached = standingsCache.get(id);
  if (cached) return cached;

  const pending = standingsPromises.get(id);
  if (pending) return pending;

  const task = loadTournamentStandings<AnyRecord[]>(id)
    .then((rows) => {
      const normalized = Array.isArray(rows) ? rows : [];
      standingsCache.set(id, normalized);
      standingsPromises.delete(id);
      standingsTick.value += 1;
      return normalized;
    })
    .catch(() => {
      const fallback: AnyRecord[] = [];
      standingsCache.set(id, fallback);
      standingsPromises.delete(id);
      standingsTick.value += 1;
      return fallback;
    });

  standingsPromises.set(id, task);
  return task;
}

async function ensureStandingsForIds(ids: string[]) {
  const token = ++standingsRequestToken;
  standingsProgress.total = ids.length;
  standingsProgress.loaded = ids.filter((id) => standingsCache.has(id)).length;

  if (ids.length === 0) {
    isStandingsLoading.value = false;
    return;
  }

  isStandingsLoading.value = true;

  try {
    await Promise.all(
      ids.map(async (id) => {
        await ensureTournamentStandings(id);

        if (token !== standingsRequestToken) return;
        standingsProgress.loaded = ids.filter((item) => standingsCache.has(item)).length;
      }),
    );
  } finally {
    if (token === standingsRequestToken) {
      standingsProgress.loaded = ids.filter((item) => standingsCache.has(item)).length;
      isStandingsLoading.value = false;
    }
  }
}

const monthOptions = computed<Array<{ value: TimeFilterValue; label: string }>>(() => {
  const seen = new Set<string>();
  const items: Array<{ value: TimeFilterValue; label: string }> = [];

  for (const tournament of tournaments.value) {
    const date = new Date(tournament.startMs);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ value: `month:${key}`, label: key });
  }

  return items.sort((a, b) => (a.value < b.value ? 1 : -1));
});

const timeOptionGroups = computed(() => ({
  base: [
    { value: "all" as TimeFilterValue, label: ui.value.allDates },
    { value: "past7" as TimeFilterValue, label: ui.value.past7 },
    { value: "prev7" as TimeFilterValue, label: ui.value.prev7 },
    { value: "past4w" as TimeFilterValue, label: ui.value.past4w },
  ],
  months: monthOptions.value,
}));

function inTimeRange(tournament: NormalizedTournament) {
  if (filters.time === "all") return true;

  const now = Date.now();
  if (filters.time === "past7") return tournament.startMs >= now - 7 * DAY_MS;
  if (filters.time === "prev7") {
    return tournament.startMs < now - 7 * DAY_MS && tournament.startMs >= now - 14 * DAY_MS;
  }
  if (filters.time === "past4w") return tournament.startMs >= now - 28 * DAY_MS;

  if (String(filters.time).startsWith("month:")) {
    const ym = String(filters.time).slice("month:".length);
    const [yearText, monthText] = ym.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) return true;
    const start = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
    const end = Date.UTC(year, month, 1, 0, 0, 0, 0);
    return tournament.startMs >= start && tournament.startMs < end;
  }

  return true;
}

const inclusionSetOptions = computed<Array<{ value: SetFilterValue; label: string }>>(() => [
  { value: "", label: ui.value.allData },
  ...[...VERSION_WINDOWS].reverse().map((version) => ({
    value: version.code,
    label: versionDisplayLabel(version, true),
  })),
]);

const topCutOptions = computed<Array<{ value: TopCutValue; label: string }>>(() => [
  { value: "all", label: ui.value.all },
  { value: "64", label: ui.value.top64 },
  { value: "32", label: ui.value.top32 },
  { value: "16", label: ui.value.top16 },
  { value: "8", label: ui.value.top8 },
  { value: "4", label: ui.value.top4 },
  { value: "2", label: ui.value.top2 },
  { value: "1", label: ui.value.winner },
]);

const categoryOptions = computed<Array<{ value: CategoryFilter; label: string }>>(() => [
  { value: "all", label: ui.value.categoryAll },
  { value: "Pokemon", label: ui.value.categoryPokemon },
  { value: "Trainer", label: ui.value.categoryTrainer },
  { value: "Energy", label: ui.value.categoryEnergy },
]);

const catalogSetOptions = computed<Array<{ value: string; label: string }>>(() => {
  return catalogSets.value.map((item) => ({
    value: item.code,
    label: item.label,
  }));
});

const selectedCatalogSetMeta = computed(() => {
  return catalogSets.value.find((item) => item.code === selectedCatalogSet.value) ?? null;
});

const catalogByCode = computed(() => {
  const map = new Map<string, CatalogCard>();
  for (const card of catalogCards.value) {
    if (card.code && !map.has(card.code)) map.set(card.code, card);
  }
  return map;
});

const catalogBySetNumber = computed(() => {
  const map = new Map<string, CatalogCard>();
  for (const card of catalogCards.value) {
    const key = `${card.setCode}-${card.numberLabel.toLowerCase()}`;
    if (card.setCode && card.numberLabel && !map.has(key)) map.set(key, card);
  }
  return map;
});

const catalogByName = computed(() => {
  const map = new Map<string, CatalogCard>();
  for (const card of catalogCards.value) {
    const key = slugify(card.name);
    if (key && !map.has(key)) map.set(key, card);
  }
  return map;
});

function resolveCatalogCard(
  input: Partial<Pick<NormalizedDeckCard, "code" | "set" | "number" | "name">>,
) {
  const normalizedCode = normalizeCardCode(input.code);
  if (normalizedCode) {
    const byCode = catalogByCode.value.get(normalizedCode);
    if (byCode) return byCode;
  }

  const setCode = normalizeSetCode(input.set);
  const numberLabel = normalizeCardNumberLabel(input.number);
  if (setCode && numberLabel !== "?") {
    const bySetNumber = catalogBySetNumber.value.get(`${setCode}-${numberLabel.toLowerCase()}`);
    if (bySetNumber) return bySetNumber;
  }

  const byName = catalogByName.value.get(slugify(input.name));
  if (byName) return byName;

  return null;
}

function looksLikeCardEntry(value: AnyRecord) {
  const hasName = Boolean(cleanText(value.name ?? value.cardName ?? value.title ?? value.label ?? ""));
  const hasCount = [
    value.count,
    value.qty,
    value.quantity,
    value.copies,
    value.amount,
    value.num,
  ].some((candidate) => toNumber(candidate) != null);

  return hasName && (hasCount || value.code || value.cardCode || value.set || value.number);
}

function parseDecklistText(source: string, categoryHint = "Other"): NormalizedDeckCard[] {
  return String(source)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^(\d+)\s*[xX]?\s+(.+)$/);
      const count = Number(match?.[1]);
      const rawText = match?.[2] ?? "";
      if (!Number.isFinite(count) || count <= 0 || !rawText) return null;

      const code = extractCardCodeFromText(rawText);
      const name = stripCardCodeFromName(rawText) || cleanText(rawText);
      const codeParts = code.split("-");

      return {
        key: code || slugify(name),
        code,
        set: normalizeSetCode(codeParts[0] ?? ""),
        number: normalizeCardNumberLabel(codeParts.slice(1).join("-")),
        name,
        count,
        image: "",
        category: normalizeCardCategory(categoryHint),
      } satisfies NormalizedDeckCard;
    })
    .filter((item): item is NormalizedDeckCard => item !== null);
}

function pickCardCode(merged: AnyRecord, rawName: string) {
  const candidates = [
    merged.code,
    merged.cardCode,
    merged.card_code,
    merged.cardId,
    merged.card_id,
    merged.identifier,
    merged.id,
    merged.set && merged.number ? `${merged.set}-${merged.number}` : "",
    merged.setCode && merged.number ? `${merged.setCode}-${merged.number}` : "",
    merged.set && merged.no ? `${merged.set}-${merged.no}` : "",
    merged.setCode && merged.no ? `${merged.setCode}-${merged.no}` : "",
    rawName,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeCardCode(candidate);
    if (normalized) return normalized;
    const embedded = extractCardCodeFromText(candidate);
    if (embedded) return embedded;
  }

  return "";
}

function normalizeDeckCardsSource(source: unknown, categoryHint = "Other"): NormalizedDeckCard[] {
  if (!source) return [];
  if (typeof source === "string") return parseDecklistText(source, categoryHint);
  if (Array.isArray(source)) return source.flatMap((item) => normalizeDeckCardsSource(item, categoryHint));
  if (typeof source !== "object") return [];

  const merged = source as AnyRecord;

  if (looksLikeCardEntry(merged)) {
    const rawName = cleanText(merged.name ?? merged.cardName ?? merged.title ?? merged.label ?? "");
    const name = stripCardCodeFromName(rawName) || rawName;
    const count = Number(
      merged.count ??
        merged.qty ??
        merged.quantity ??
        merged.copies ??
        merged.amount ??
        merged.num ??
        1,
    );
    if (!name || !Number.isFinite(count) || count <= 0) return [];

    const code = pickCardCode(merged, rawName);
    const setCode = normalizeSetCode(
      merged.set ?? merged.setCode ?? merged.set_code ?? code.split("-")[0] ?? "",
    );
    const numberLabel = normalizeCardNumberLabel(
      merged.number ?? merged.no ?? merged.cardNumber ?? merged.card_number ?? code.split("-")[1] ?? "",
    );

    return [
      {
        key: code || `${setCode}-${numberLabel}` || slugify(name),
        code,
        set: setCode,
        number: numberLabel,
        name,
        count,
        image:
          normalizeMaybeAbsoluteUrl(
            merged.image ??
              merged.imageUrl ??
              merged.img ??
              merged.art ??
              merged.thumb ??
              merged.cardImage ??
              merged.images?.small ??
              merged.images?.large ??
              "",
          ) || "",
        category: normalizeCardCategory(
          merged.category ?? merged.section ?? merged.supertype ?? merged.type ?? categoryHint,
        ),
      },
    ];
  }

  const sectionOutput: NormalizedDeckCard[] = [];
  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue;
    if (
      [
        "pokemon",
        "pokemons",
        "trainer",
        "trainers",
        "energy",
        "energies",
        "supporters",
        "items",
        "stadiums",
        "cards",
        "decklist",
        "deckList",
        "list",
      ].includes(key)
    ) {
      sectionOutput.push(...normalizeDeckCardsSource(value, key));
    }
  }
  if (sectionOutput.length > 0) return sectionOutput;

  const genericOutput: NormalizedDeckCard[] = [];
  for (const [key, value] of Object.entries(merged)) {
    if (!value) continue;
    if (typeof value === "string" || Array.isArray(value) || typeof value === "object") {
      genericOutput.push(...normalizeDeckCardsSource(value, key));
    }
  }
  return genericOutput;
}

function extractDeckCardsFromRow(row: AnyRecord) {
  const candidates = [
    row.decklist,
    row.deckList,
    row.list,
    row.cardList,
    row.cards,
    row.deck?.decklist,
    row.deck?.deckList,
    row.deck?.list,
    row.deck?.cards,
    row.deck?.cardList,
    row.deckText,
    row.decklistText,
    row.deck?.text,
    row.deck?.raw,
  ];

  for (const source of candidates) {
    const parsed = normalizeDeckCardsSource(source);
    if (parsed.length > 0) return parsed;
  }

  const grouped = {
    pokemon: row.pokemon ?? row.deck?.pokemon,
    trainer: row.trainer ?? row.trainers ?? row.deck?.trainer ?? row.deck?.trainers,
    energy: row.energy ?? row.energies ?? row.deck?.energy ?? row.deck?.energies,
  };

  const groupedParsed = normalizeDeckCardsSource(grouped);
  return groupedParsed.length > 0 ? groupedParsed : [];
}

const filteredInclusionTournaments = computed(() => {
  return tournaments.value.filter((tournament) => {
    const minPlayers = Number(filters.minPlayers ?? 0);
    if (Number.isFinite(minPlayers) && minPlayers > 0 && Number(tournament.players ?? 0) < minPlayers) {
      return false;
    }

    if (!inTimeRange(tournament)) return false;
    if (filters.set && tournament.versionCode !== filters.set) return false;
    return true;
  });
});

const filteredTournamentIds = computed(() => filteredInclusionTournaments.value.map((item) => item.id));
const filteredTournamentIdsKey = computed(() => filteredTournamentIds.value.join("|"));

watch(
  filteredTournamentIdsKey,
  () => {
    if (viewMode.value !== "inclusion") return;
    void ensureStandingsForIds(filteredTournamentIds.value);
  },
  { immediate: true },
);

watch(
  () => viewMode.value,
  (mode) => {
    if (mode === "inclusion") {
      void ensureStandingsForIds(filteredTournamentIds.value);
    } else if (!selectedCatalogSet.value) {
      selectedCatalogSet.value =
        catalogSets.value.find((item) => !item.code.startsWith("P-"))?.code ?? catalogSets.value[0]?.code ?? "";
    }
  },
  { immediate: true },
);

const loadedInclusionTournamentCount = computed(() => {
  standingsTick.value;
  return filteredTournamentIds.value.filter((id) => standingsCache.has(id)).length;
});

const isInclusionLoading = computed(() => {
  return viewMode.value === "inclusion" && (isTournamentListLoading.value || isStandingsLoading.value);
});

const inclusionAnalytics = computed<InclusionAnalytics>(() => {
  standingsTick.value;

  const cardMap = new Map<string, InclusionCard>();
  let totalDeckRows = 0;

  for (const tournament of filteredInclusionTournaments.value) {
    const standings = standingsCache.get(tournament.id);
    if (!standings) continue;

    for (const row of standings) {
      const place = getPlace(row);
      if (!qualifiesByTopCut(place, filters.topCut)) continue;

      const cards = extractDeckCardsFromRow(row);
      if (cards.length === 0) continue;

      totalDeckRows += 1;

      const mergedDeckCards = new Map<string, NormalizedDeckCard>();
      for (const card of cards) {
        const key = card.key || card.code || slugify(card.name);
        const count = Math.max(0, Number(card.count) || 0);
        if (!key || count <= 0) continue;

        const existing = mergedDeckCards.get(key);
        if (existing) {
          existing.count += count;
          if (!existing.code && card.code) existing.code = card.code;
          if (!existing.set && card.set) existing.set = card.set;
          if (!existing.number && card.number) existing.number = card.number;
          if (!existing.image && card.image) existing.image = card.image;
          if (!existing.category && card.category) existing.category = card.category;
          continue;
        }

        mergedDeckCards.set(key, { ...card, key, count });
      }

      for (const card of mergedDeckCards.values()) {
        const key = card.key || card.code || slugify(card.name);
        const catalogCard = resolveCatalogCard(card);
        const aggregate = cardMap.get(key) ?? {
          key,
          code: normalizeCardCode(card.code) || catalogCard?.code || "",
          codeLabel:
            catalogCard?.codeLabel ??
            `${normalizeSetCode(card.set)} #${normalizeCardNumberLabel(card.number)}`,
          setCode: normalizeSetCode(card.set) || catalogCard?.setCode || "",
          numberLabel: normalizeCardNumberLabel(card.number) || catalogCard?.numberLabel || "?",
          name: cleanText(card.name) || catalogCard?.name || key,
          imageUrl:
            normalizeMaybeAbsoluteUrl(card.image) || catalogCard?.imageUrl || "",
          category: card.category || catalogCard?.category || "Other",
          totalCopies: 0,
          deckCount: 0,
          oneCopyDeckCount: 0,
          twoCopyDeckCount: 0,
          inclusionPct: 0,
          oneCopyPct: 0,
          twoCopyPct: 0,
        };

        aggregate.totalCopies += card.count;
        aggregate.deckCount += 1;
        if (card.count >= 2) aggregate.twoCopyDeckCount += 1;
        else aggregate.oneCopyDeckCount += 1;

        if (!aggregate.imageUrl && catalogCard?.imageUrl) aggregate.imageUrl = catalogCard.imageUrl;
        if (!aggregate.name && catalogCard?.name) aggregate.name = catalogCard.name;
        if (aggregate.category === "Other" && catalogCard?.category) aggregate.category = catalogCard.category;
        if (!aggregate.code && catalogCard?.code) aggregate.code = catalogCard.code;
        if (!aggregate.codeLabel && catalogCard?.codeLabel) aggregate.codeLabel = catalogCard.codeLabel;
        if (!aggregate.setCode && catalogCard?.setCode) aggregate.setCode = catalogCard.setCode;
        if (!aggregate.numberLabel && catalogCard?.numberLabel) aggregate.numberLabel = catalogCard.numberLabel;

        cardMap.set(key, aggregate);
      }
    }
  }

  const cards = [...cardMap.values()]
    .map((item) => ({
      ...item,
      inclusionPct: totalDeckRows > 0 ? (item.deckCount / totalDeckRows) * 100 : 0,
      oneCopyPct: totalDeckRows > 0 ? (item.oneCopyDeckCount / totalDeckRows) * 100 : 0,
      twoCopyPct: totalDeckRows > 0 ? (item.twoCopyDeckCount / totalDeckRows) * 100 : 0,
    }))
    .sort((a, b) => {
      return (
        b.inclusionPct - a.inclusionPct ||
        b.twoCopyPct - a.twoCopyPct ||
        b.oneCopyPct - a.oneCopyPct ||
        a.name.localeCompare(b.name)
      );
    });

  return {
    totalDeckRows,
    cards,
  };
});

function matchesCategory(category: CardCategory) {
  if (categoryFilter.value === "all") return true;
  return category === categoryFilter.value;
}

const normalizedSearch = computed(() => normalizeSearchableText(cardSearch.value).toLowerCase());

const inclusionDisplayCards = computed(() => {
  const search = normalizedSearch.value;

  return inclusionAnalytics.value.cards.filter((card) => {
    if (!matchesCategory(card.category)) return false;
    if (search && !normalizeSearchableText(`${card.name} ${card.codeLabel}`).toLowerCase().includes(search)) {
      return false;
    }
    return true;
  });
});

const catalogDisplayCards = computed(() => {
  const search = normalizedSearch.value;

  return catalogCards.value
    .filter((card) => {
      if (selectedCatalogSet.value && card.setCode !== selectedCatalogSet.value) return false;
      if (!matchesCategory(card.category)) return false;
      if (search && !card.searchText.includes(search)) return false;
      return true;
    })
    .sort((a, b) => {
      return a.numberSort - b.numberSort || a.name.localeCompare(b.name);
    });
});

const activeCardCount = computed(() => {
  return viewMode.value === "inclusion" ? inclusionDisplayCards.value.length : catalogDisplayCards.value.length;
});

const pageCount = computed(() => Math.max(1, Math.ceil(activeCardCount.value / CARDS_PER_PAGE)));

const pagedInclusionCards = computed(() => {
  const start = (currentPage.value - 1) * CARDS_PER_PAGE;
  return inclusionDisplayCards.value.slice(start, start + CARDS_PER_PAGE);
});

const pagedCatalogCards = computed(() => {
  const start = (currentPage.value - 1) * CARDS_PER_PAGE;
  return catalogDisplayCards.value.slice(start, start + CARDS_PER_PAGE);
});

watch(
  () =>
    [
      viewMode.value,
      filters.minPlayers ?? "",
      filters.time,
      filters.set,
      filters.topCut,
      selectedCatalogSet.value,
      categoryFilter.value,
      cardSearch.value,
    ].join("|"),
  () => {
    currentPage.value = 1;
  },
);

watch(
  pageCount,
  (count) => {
    if (currentPage.value > count) currentPage.value = count;
  },
  { immediate: true },
);

const searchPlaceholder = computed(() => {
  return viewMode.value === "inclusion"
    ? ui.value.searchPlaceholderInclusion
    : ui.value.searchPlaceholderCatalog;
});

const inclusionScopeText = computed(() => {
  const setLabel =
    inclusionSetOptions.value.find((item) => item.value === filters.set)?.label ?? ui.value.allData;
  const timeLabel =
    [...timeOptionGroups.value.base, ...timeOptionGroups.value.months].find(
      (item) => item.value === filters.time,
    )?.label ?? ui.value.allDates;
  const topCutLabel =
    topCutOptions.value.find((item) => item.value === filters.topCut)?.label ?? ui.value.all;

  return `${timeLabel} / ${setLabel} / ${topCutLabel}`;
});

const inclusionStatsText = computed(() => {
  return [
    `${filteredInclusionTournaments.value.length.toLocaleString()} ${ui.value.tournamentsUnit}`,
    `${loadedInclusionTournamentCount.value.toLocaleString()}/${filteredInclusionTournaments.value.length.toLocaleString()} ${ui.value.loadedUnit}`,
    `${inclusionAnalytics.value.totalDeckRows.toLocaleString()} ${ui.value.decklistsUnit}`,
    `${inclusionDisplayCards.value.length.toLocaleString()} ${ui.value.cardsUnit}`,
  ].join(" \u00b7 ");
});

function categoryLabel(category: CardCategory) {
  switch (category) {
    case "Pokemon":
      return ui.value.categoryPokemon;
    case "Trainer":
      return ui.value.categoryTrainer;
    case "Energy":
      return ui.value.categoryEnergy;
    default:
      return ui.value.categoryAll;
  }
}

function formatPercentValue(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "0%";
  if (value >= 100) return `${value.toFixed(0)}%`;
  if (value >= 10) return `${value.toFixed(1)}%`;
  return `${value.toFixed(1)}%`;
}

onMounted(async () => {
  await Promise.all([loadCatalogData(), loadTournaments()]);
});
</script>

<style scoped>
.topCardsPage {
  min-height: calc(100vh - 84px);
  padding: 16px 0 48px;
}

.topCardsShell {
  width: min(1440px, calc(100vw - 48px));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.topCardsHero,
.topCardsPanel {
  position: relative;
  border-radius: 24px;
  border: 1px solid rgba(89, 164, 230, 0.22);
  background:
    linear-gradient(135deg, rgba(16, 60, 91, 0.54), rgba(17, 25, 49, 0.32)),
    rgba(9, 22, 39, 0.94);
  box-shadow:
    0 22px 60px rgba(0, 0, 0, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 0 1px rgba(87, 175, 255, 0.05);
}

.topCardsHero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px 30px;
}

.topCardsHero__copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 760px;
}

.topCardsHero__eyebrow {
  color: rgba(126, 200, 255, 0.92);
  font-size: 0.78rem;
  letter-spacing: 0.2em;
}

.topCardsHero__title {
  margin: 0;
  font-size: clamp(2rem, 3vw, 3.1rem);
  line-height: 1.05;
  color: #f6fbff;
}

.topCardsHero__subtitle {
  margin: 0;
  max-width: 720px;
  color: rgba(225, 240, 255, 0.8);
  font-size: 1rem;
  line-height: 1.65;
}

.topCardsModeToggle {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-self: flex-start;
  min-width: 300px;
  padding: 6px;
  border-radius: 18px;
  border: 1px solid rgba(115, 192, 255, 0.16);
  background: rgba(8, 18, 31, 0.76);
}

.topCardsModeToggle__button,
.topCardsCategoryBar__button,
.topCardsPager__button {
  appearance: none;
  border: 0;
  cursor: pointer;
  font: inherit;
}

.topCardsModeToggle__button {
  min-height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  color: rgba(225, 240, 255, 0.7);
  background: transparent;
  font-weight: 800;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.topCardsModeToggle__button--active {
  color: #f5fbff;
  background: linear-gradient(135deg, rgba(53, 122, 219, 0.92), rgba(20, 74, 151, 0.98));
  box-shadow: 0 10px 24px rgba(18, 68, 133, 0.28);
}

.topCardsPanel {
  padding: 22px 24px;
}

.topCardsFilters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.topCardsField {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.topCardsField--wide {
  grid-column: span 2;
}

.topCardsField--search {
  grid-column: span 2;
}

.topCardsField > span {
  color: #f0f6ff;
  font-weight: 800;
  font-size: 0.92rem;
}

.topCardsField input,
.topCardsField select {
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding: 0 14px;
  border-radius: 14px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background: rgba(8, 18, 31, 0.72);
  color: #f6fbff;
  font: inherit;
  outline: none;
}

.topCardsCategoryBar {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.topCardsCategoryBar__button {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(115, 192, 255, 0.16);
  background: rgba(10, 22, 38, 0.86);
  color: rgba(228, 241, 255, 0.74);
  font-weight: 800;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.topCardsCategoryBar__button--active {
  color: #f4fbff;
  border-color: rgba(126, 200, 255, 0.32);
  background: linear-gradient(135deg, rgba(31, 85, 164, 0.78), rgba(17, 53, 117, 0.9));
}

.topCardsSummary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.topCardsSummary__block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(115, 192, 255, 0.14);
  background: rgba(8, 18, 31, 0.48);
}

.topCardsSummary__block--note {
  background: linear-gradient(135deg, rgba(31, 53, 93, 0.6), rgba(18, 27, 49, 0.5));
}

.topCardsSummary__label {
  color: rgba(126, 200, 255, 0.82);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
}

.topCardsSummary__block strong {
  color: #f5fbff;
  line-height: 1.55;
}

.topCardsLoading {
  margin: 14px 2px 0;
  color: rgba(170, 214, 255, 0.76);
}

.topCardsEmpty {
  display: grid;
  place-items: center;
  min-height: 280px;
  border-radius: 18px;
  border: 1px dashed rgba(115, 192, 255, 0.14);
  background: rgba(8, 18, 31, 0.42);
  color: rgba(225, 240, 255, 0.72);
  text-align: center;
}

.topCardsGrid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.topCardTile {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.topCardTile__imageWrap {
  position: relative;
  display: block;
  aspect-ratio: 5 / 7;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.topCardTile__imageWrap--link {
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.topCardTile__imageWrap--link:hover {
  transform: translateY(-2px);
  border-color: rgba(126, 200, 255, 0.32);
  box-shadow:
    0 16px 34px rgba(0, 0, 0, 0.22),
    inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.topCardTile__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.topCardTile__fallback {
  height: 100%;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(18, 46, 79, 0.86), rgba(9, 20, 35, 0.96));
  color: #f5fbff;
}

.topCardTile__stats {
  --one-rate: 0%;
  --two-rate: 0%;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  height: 50%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 7px;
  padding: 8px 9px;
  border-radius: 0 0 14px 14px;
  border-top: 1px solid rgba(126, 200, 255, 0.22);
  background:
    linear-gradient(180deg, rgba(4, 14, 26, 0.1) 0%, rgba(4, 14, 26, 0.88) 24%, rgba(3, 10, 19, 0.98) 100%),
    rgba(7, 18, 32, 0.94);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 -12px 24px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(4px);
}

.topCardTile__rateDial {
  width: 100%;
  height: 100%;
  display: grid;
  align-content: start;
  justify-items: center;
  gap: 5px;
  padding-top: 5px;
}

.topCardTile__rateDialLabel {
  color: rgba(236, 247, 255, 0.92);
  font-size: 0.86rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.45);
}

.topCardTile__rateDialValue {
  width: min(122px, calc(100% - 4px));
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  font-size: 1.06rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  background:
    radial-gradient(circle, rgba(5, 16, 29, 0.98) 0 52%, transparent 53%),
    conic-gradient(
      from 0deg,
      rgba(64, 148, 255, 0.98) 0 var(--one-rate),
      rgba(255, 122, 82, 0.98) var(--one-rate) calc(var(--one-rate) + var(--two-rate)),
      rgba(255, 255, 255, 0.18) calc(var(--two-rate) + var(--one-rate)) 100%
    );
  box-shadow:
    0 7px 15px rgba(0, 0, 0, 0.28),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.48);
}

.topCardTile__copyBreakdown {
  display: grid;
  grid-template-rows: repeat(2, clamp(40px, 28%, 52px));
  align-content: center;
  gap: 7px;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.topCardTile__copyStat {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 0;
  padding: 4px 7px 4px 23px;
  border-radius: 8px;
  border: 1px solid rgba(115, 192, 255, 0.12);
  overflow: hidden;
  color: #eef7ff;
  line-height: 1;
}

.topCardTile__copyStat--two {
  border-color: rgba(255, 158, 90, 0.38);
  background:
    linear-gradient(90deg, rgba(111, 58, 31, 0.9), rgba(55, 25, 15, 0.94)),
    rgba(55, 25, 15, 0.9);
}

.topCardTile__copyStat--one {
  border-color: rgba(96, 177, 255, 0.34);
  background:
    linear-gradient(90deg, rgba(22, 86, 154, 0.86), rgba(8, 34, 64, 0.94)),
    rgba(8, 34, 64, 0.9);
}

.topCardTile__copyIcon {
  position: absolute;
  left: 13px;
  top: 50%;
  z-index: 0;
  display: block;
  width: 40px;
  height: 24px;
  object-fit: contain;
  transform: translateY(-50%) scale(1.7);
  transform-origin: center;
  pointer-events: none;
  opacity: 0.92;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.42));
}

.topCardTile__copyStat--one .topCardTile__copyIcon {
  transform: translateY(-50%) scale(1.45);
}

.topCardTile__copyValue {
  position: relative;
  z-index: 1;
  min-width: 0;
  color: #fff;
  font-size: 0.98rem;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  text-align: right;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
}

.topCardTile__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(115, 192, 255, 0.14);
  background:
    linear-gradient(180deg, rgba(18, 46, 79, 0.92), rgba(10, 22, 39, 0.94)),
    rgba(9, 20, 35, 0.92);
}

.topCardTile__head {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.topCardTile__name {
  margin: 0;
  color: #f5fbff;
  font-size: 1rem;
  line-height: 1.25;
}

.topCardTile__meta {
  margin: 0;
  color: rgba(193, 221, 247, 0.7);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
}

.topCardTile__total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.topCardTile__totalLabel {
  color: rgba(214, 235, 255, 0.68);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.topCardTile__totalValue {
  color: #f6fbff;
  font-size: 1.04rem;
  font-weight: 900;
  line-height: 1;
}

.topCardTile__mixBar {
  display: flex;
  overflow: hidden;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(115, 192, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
}

.topCardTile__mixBarSegment {
  height: 100%;
}

.topCardTile__mixBarSegment--two {
  background: linear-gradient(90deg, rgba(255, 180, 82, 0.92), rgba(255, 129, 92, 0.98));
}

.topCardTile__mixBarSegment--one {
  background: linear-gradient(90deg, rgba(92, 176, 255, 0.88), rgba(55, 129, 255, 0.96));
}

.topCardTile__split,
.topCardTile__catalogMeta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.topCardTile__chip,
.topCardTile__catalogChip {
  min-width: 0;
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 12px;
  border: 1px solid rgba(115, 192, 255, 0.12);
  background: rgba(10, 22, 38, 0.92);
  color: #eef7ff;
  font-size: 0.82rem;
  line-height: 1;
}

.topCardTile__chip--two {
  border-color: rgba(255, 167, 79, 0.26);
  background: rgba(68, 37, 24, 0.68);
}

.topCardTile__chip--one {
  border-color: rgba(91, 176, 255, 0.2);
  background: rgba(16, 42, 77, 0.72);
}

.topCardTile__catalogChip {
  justify-content: center;
  text-align: center;
}

.topCardTile__catalogChip--alt {
  border-color: rgba(140, 179, 255, 0.18);
  background: rgba(22, 34, 66, 0.74);
}

.topCardsPager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.topCardsPager__button {
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(126, 200, 255, 0.2);
  background: rgba(18, 83, 143, 0.18);
  color: #eef7ff;
  font-weight: 900;
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    opacity 0.2s ease;
}

.topCardsPager__button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(18, 83, 143, 0.3);
}

.topCardsPager__button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.topCardsPager__status {
  color: rgba(218, 236, 255, 0.78);
}

@media (max-width: 1320px) {
  .topCardsGrid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .topCardsFilters {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .topCardsField--search {
    grid-column: span 4;
  }
}

@media (max-width: 1080px) {
  .topCardsHero {
    flex-direction: column;
  }

  .topCardsModeToggle {
    min-width: 0;
    width: 100%;
  }

  .topCardsSummary {
    grid-template-columns: 1fr;
  }

  .topCardsGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .topCardsFilters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .topCardsField--wide,
  .topCardsField--search {
    grid-column: span 2;
  }
}

@media (max-width: 720px) {
  .topCardsShell {
    width: min(100vw - 20px, 100%);
    gap: 14px;
  }

  .topCardsHero,
  .topCardsPanel {
    padding: 18px 16px;
    border-radius: 18px;
  }

  .topCardsGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .topCardsFilters {
    grid-template-columns: 1fr;
  }

  .topCardsField--wide,
  .topCardsField--search {
    grid-column: auto;
  }

  .topCardTile__body {
    gap: 8px;
    padding: 10px 10px 12px;
  }

  .topCardTile__name {
    font-size: 0.94rem;
  }

  .topCardTile__totalValue {
    font-size: 0.94rem;
  }

  .topCardTile__mixBar {
    height: 8px;
  }

  .topCardTile__stats {
    gap: 6px;
    padding: 7px;
  }

  .topCardTile__rateDial {
    gap: 4px;
    padding-top: 4px;
  }

  .topCardTile__rateDialLabel {
    font-size: 0.76rem;
  }

  .topCardTile__rateDialValue {
    width: min(96px, calc(100% - 4px));
    font-size: 0.9rem;
  }

  .topCardTile__copyBreakdown {
    grid-template-rows: repeat(2, clamp(36px, 28%, 46px));
    gap: 6px;
  }

  .topCardTile__copyStat {
    padding: 3px 6px 3px 21px;
  }

  .topCardTile__copyIcon {
    left: 12px;
    width: 36px;
    height: 22px;
  }

  .topCardTile__copyValue {
    font-size: 0.86rem;
  }

  .topCardTile__chip,
  .topCardTile__catalogChip {
    min-height: 30px;
    padding: 6px 8px;
    font-size: 0.74rem;
  }
}

@media (max-width: 520px) {
  .topCardsHero__subtitle {
    font-size: 0.92rem;
  }

  .topCardsModeToggle {
    grid-template-columns: 1fr;
  }

  .topCardTile__split,
  .topCardTile__catalogMeta {
    gap: 6px;
  }

  .topCardTile__stats {
    gap: 5px;
    padding: 6px;
  }

  .topCardTile__rateDialValue {
    width: min(84px, calc(100% - 4px));
    font-size: 0.84rem;
  }

  .topCardTile__copyBreakdown {
    grid-template-rows: repeat(2, clamp(34px, 28%, 42px));
    gap: 4px;
  }

  .topCardTile__copyStat {
    padding: 3px 5px 3px 20px;
  }

  .topCardTile__copyIcon {
    left: 11px;
    width: 34px;
    height: 20px;
  }

  .topCardTile__copyValue {
    font-size: 0.8rem;
  }

  .topCardTile__chip,
  .topCardTile__catalogChip {
    padding: 6px 7px;
  }
}
</style>
