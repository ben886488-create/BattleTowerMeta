<template>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="pageTitle">{{ ui.title }}</h1>
        <p class="sub">{{ ui.subtitle(rows.length) }}</p>
      </div>
    </div>

    <div class="filters">
      <div class="f">
        <label>{{ ui.player }}</label>
        <input v-model="filters.player" type="text" :placeholder="ui.playerPlaceholder" />
      </div>

      <div class="f">
        <label>{{ ui.time }}</label>
        <select v-model="filters.time">
          <option
            v-for="option in timeOptionGroups.base"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
          <optgroup v-if="timeOptionGroups.months.length" :label="ui.month">
            <option
              v-for="option in timeOptionGroups.months"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </optgroup>
        </select>
      </div>

      <div class="f">
        <label>{{ ui.set }}</label>
        <select v-model="filters.set">
          <option value="">{{ ui.all }}</option>
          <option v-for="version in setOptions" :key="version.code" :value="version.code">
            {{ versionLabel(version.code) }}
          </option>
        </select>
      </div>

      <div class="f">
        <label>Top Cut</label>
        <select v-model="filters.topCut">
          <option value="">{{ ui.all }}</option>
          <option value="winner">{{ ui.topCutWinner }}</option>
          <option value="top2">Top 2</option>
          <option value="top4">Top 4</option>
          <option value="top8">Top 8</option>
          <option value="top16">Top 16</option>
          <option value="top32">Top 32</option>
        </select>
      </div>
    </div>

    <div class="meta">
      <span>{{ ui.rule }}</span>
    </div>

    <div class="tableWrap desktopTable">
      <table class="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ ui.player }}</th>
            <th>{{ ui.region }}</th>
            <th>{{ ui.mostUsedDeck }}</th>
            <th class="num">{{ ui.points }}</th>
            <th class="num">{{ ui.events }}</th>
            <th class="num">{{ ui.first }}</th>
            <th class="num">{{ ui.second }}</th>
            <th class="num">{{ ui.top4 }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="9" class="empty">{{ ui.loading }}</td>
          </tr>
          <tr v-else-if="loadError">
            <td colspan="9" class="empty">{{ ui.loadError }}</td>
          </tr>
          <tr v-else-if="pagedRows.length === 0">
            <td colspan="9" class="empty">{{ ui.noData }}</td>
          </tr>
          <tr v-for="(row, index) in pagedRows" :key="row.player">
            <td class="muted">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>
              <RouterLink
                class="playerLink"
                :to="{ name: `${lang}-player-profile`, params: { playerSlug: row.playerSlug } }"
              >
                {{ row.player }}
              </RouterLink>
            </td>
            <td class="regionCell">
              <span
                v-if="row.country"
                class="flag-icon"
                :class="`fi fi-${row.country.toLowerCase()}`"
                aria-hidden="true"
              ></span>
              <span v-else class="flag-icon flag-icon--empty"></span>
              <span>{{ countryName(row.country) }}</span>
            </td>
            <td>
              <div class="deckIcons deckIcons--small" :title="row.mostUsedDeckName || ui.unknown">
                <img
                  v-for="(icon, iconIndex) in row.mostUsedDeckIconUrls"
                  :key="`${row.player}-${icon}-${iconIndex}`"
                  :src="icon"
                  :alt="row.mostUsedDeckName || ui.unknown"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
                <span v-if="row.mostUsedDeckIconUrls.length === 0" class="deckFallback mono">--</span>
              </div>
            </td>
            <td class="num mono">{{ formatPoints(row.points) }}</td>
            <td class="num mono">{{ row.games }}</td>
            <td class="num mono">{{ row.firstCount }}</td>
            <td class="num mono">{{ row.secondCount }}</td>
            <td class="num mono">{{ row.top4Count }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mobileList">
      <div v-if="loading" class="mobileEmpty">{{ ui.loading }}</div>
      <div v-else-if="loadError" class="mobileEmpty">{{ ui.loadError }}</div>
      <div v-else-if="pagedRows.length === 0" class="mobileEmpty">{{ ui.noData }}</div>
      <article v-for="(row, index) in pagedRows" v-else :key="`${row.player}-mobile`" class="mobileCard">
        <div class="mobileCard__top">
          <span class="mobileRank mono">#{{ (currentPage - 1) * pageSize + index + 1 }}</span>
          <RouterLink
            class="playerLink mobilePlayer"
            :to="{ name: `${lang}-player-profile`, params: { playerSlug: row.playerSlug } }"
          >
            {{ row.player }}
          </RouterLink>
        </div>

        <div class="mobileRegion">
          <span
            v-if="row.country"
            class="flag-icon"
            :class="`fi fi-${row.country.toLowerCase()}`"
            aria-hidden="true"
          ></span>
          <span v-else class="flag-icon flag-icon--empty"></span>
          <span>{{ countryName(row.country) }}</span>
        </div>

        <div class="mobileDeckRow">
          <span class="mobileLabel">{{ ui.mostUsedDeck }}</span>
          <div class="deckIcons deckIcons--small" :title="row.mostUsedDeckName || ui.unknown">
            <img
              v-for="(icon, iconIndex) in row.mostUsedDeckIconUrls"
              :key="`${row.player}-mobile-${icon}-${iconIndex}`"
              :src="icon"
              :alt="row.mostUsedDeckName || ui.unknown"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
            <span v-if="row.mostUsedDeckIconUrls.length === 0" class="deckFallback mono">--</span>
          </div>
        </div>

        <div class="mobileStats">
          <div class="mobileStat">
            <span class="mobileLabel">{{ ui.points }}</span>
            <strong class="mono">{{ formatPoints(row.points) }}</strong>
          </div>
          <div class="mobileStat">
            <span class="mobileLabel">{{ ui.events }}</span>
            <strong class="mono">{{ row.games }}</strong>
          </div>
          <div class="mobileStat">
            <span class="mobileLabel">{{ ui.first }}</span>
            <strong class="mono">{{ row.firstCount }}</strong>
          </div>
          <div class="mobileStat">
            <span class="mobileLabel">{{ ui.second }}</span>
            <strong class="mono">{{ row.secondCount }}</strong>
          </div>
          <div class="mobileStat">
            <span class="mobileLabel">{{ ui.top4 }}</span>
            <strong class="mono">{{ row.top4Count }}</strong>
          </div>
        </div>
      </article>
    </div>

    <div class="pagination" v-if="pageCount > 1">
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage -= 1">
        {{ ui.prev }}
      </button>
      <span class="page-info">{{ ui.page(currentPage, pageCount) }}</span>
      <button class="page-btn" :disabled="currentPage === pageCount" @click="currentPage += 1">
        {{ ui.next }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef, watch } from "vue";
import { useRoute } from "vue-router";
import "flag-icons/css/flag-icons.min.css";
import {
  GAME_VERSIONS,
  VERSION_BY_CODE,
  compareText,
  filterPlayerEntries,
  loadPlayerEntries,
  type DecoratedPlayerEntry,
  type TimeFilterValue,
  type TopCutFilter,
} from "../lib/playerEntries";
import { getCountryDisplayName } from "../lib/countryNames";

const deckIconModules = import.meta.glob("../assets/deck-icons/*.{png,webp,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const deckIconIndex: Record<string, string> = (() => {
  const index: Record<string, string> = {};
  for (const [path, url] of Object.entries(deckIconModules)) {
    const key = path.split("/").pop()?.replace(/\.[^.]+$/, "").toLowerCase() ?? "";
    if (key && !index[key]) {
      index[key] = url;
    }
  }
  return index;
})();

type PlayerSummary = {
  player: string;
  playerSlug: string;
  country: string;
  points: number;
  games: number;
  firstCount: number;
  secondCount: number;
  top4Count: number;
  mostUsedDeckName: string;
  mostUsedDeckIconUrls: string[];
};

type DeckBucket = {
  key: string;
  name: string;
  events: number;
  points: number;
  bestFinish: number | null;
  iconUrls: string[];
};

type PlayerAccumulator = PlayerSummary & {
  deckBuckets: Map<string, DeckBucket>;
};

const route = useRoute();

const lang = computed<"zh" | "en">(() => {
  const seg = String(route.path).split("/")[1];
  return seg === "en" ? "en" : "zh";
});

const isZh = computed(() => lang.value === "zh");

const ui = computed(() => {
  if (isZh.value) {
    return {
      title: "玩家排名",
      subtitle: (count: number) => `符合篩選條件的玩家: ${count} 名`,
      player: "玩家",
      playerPlaceholder: "輸入玩家名稱",
      time: "時間",
      month: "月份",
      set: "版本",
      region: "國家 / 地區",
      mostUsedDeck: "最常用牌組",
      points: "積分",
      events: "參賽次數",
      first: "冠軍",
      second: "亞軍",
      top4: "四強",
      topCutWinner: "冠軍",
      all: "全部",
      past7: "近 7 天",
      prev7: "前 7 天",
      past4w: "近 4 週",
      rule: "積分按你的名次規則累計: 第1名=10, 第2名=8, 第3-4名=6, 第5-8名=4, 第9-16名=2, 第17-32名=1。",
      loading: "正在載入玩家資料...",
      loadError: "玩家資料載入失敗",
      noData: "沒有符合目前篩選條件的玩家",
      prev: "上一頁",
      next: "下一頁",
      page: (current: number, total: number) => `第 ${current} / ${total} 頁`,
      unknown: "未知",
    };
  }

  return {
    title: "Player Ranking",
    subtitle: (count: number) => `${count} players match the current filters`,
    player: "Player",
    playerPlaceholder: "Enter player name",
    time: "Time",
    month: "Month",
    set: "Set",
    region: "Country / Region",
    mostUsedDeck: "Most Used Deck",
    points: "Points",
    events: "Events",
    first: "1st",
    second: "2nd",
    top4: "Top 4",
    topCutWinner: "Winner",
    all: "All",
    past7: "Past 7 days",
    prev7: "Previous 7 days",
    past4w: "Past 4 weeks",
    rule: "Points follow your placing weights: 1st=10, 2nd=8, 3rd-4th=6, 5th-8th=4, 9th-16th=2, 17th-32nd=1.",
    loading: "Loading player data...",
    loadError: "Failed to load player data",
    noData: "No players match the current filters",
    prev: "Previous",
    next: "Next",
    page: (current: number, total: number) => `Page ${current} / ${total}`,
    unknown: "Unknown",
  };
});

const entries = shallowRef<DecoratedPlayerEntry[]>([]);
const loading = ref(true);
const loadError = ref(false);

const currentVersionCode =
  [...GAME_VERSIONS].filter((version) => version.releaseMs <= Date.now()).at(-1)?.code ?? "";

const filters = reactive<{
  player: string;
  time: TimeFilterValue;
  set: string;
  topCut: TopCutFilter;
}>({
  player: "",
  time: "all",
  set: currentVersionCode,
  topCut: "",
});

const setOptions = computed(() => [...GAME_VERSIONS].reverse());

const monthOptions = computed<Array<{ value: TimeFilterValue; label: string }>>(() => {
  const seen = new Set<string>();
  const items: Array<{ value: TimeFilterValue; label: string }> = [];

  for (const entry of entries.value) {
    if (!entry.startMs) continue;
    const date = new Date(entry.startMs);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      value: `month:${key}`,
      label: isZh.value
        ? `${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月`
        : key,
    });
  }

  return items.sort((a, b) => (a.value < b.value ? 1 : -1));
});

const timeOptionGroups = computed(() => ({
  base: [
    { value: "all" as TimeFilterValue, label: ui.value.all },
    { value: "past7" as TimeFilterValue, label: ui.value.past7 },
    { value: "prev7" as TimeFilterValue, label: ui.value.prev7 },
    { value: "past4w" as TimeFilterValue, label: ui.value.past4w },
  ],
  months: monthOptions.value,
}));

function versionLabel(code?: string) {
  if (!code) return ui.value.unknown;
  const version = VERSION_BY_CODE[code];
  if (!version) return code;
  return isZh.value ? `${version.code} - ${version.nameZh}` : `${version.code} - ${version.nameEn}`;
}

function countryName(code?: string) {
  return getCountryDisplayName(code, isZh.value ? "zh" : "en", ui.value.unknown);
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function resolveDeckIconUrl(key: string) {
  const target = key.trim().toLowerCase();
  if (!target) return "";
  return deckIconIndex[target] ?? "";
}

const filteredEntries = computed(() =>
  filterPlayerEntries(entries.value, {
    playerKeyword: filters.player,
    time: filters.time,
    set: filters.set,
    topCut: filters.topCut,
  }),
);

const rows = computed<PlayerSummary[]>(() => {
  const map = new Map<string, PlayerAccumulator>();

  for (const entry of filteredEntries.value) {
    const existing = map.get(entry.player) ?? {
      player: entry.player,
      playerSlug: entry.playerSlug || entry.player,
      country: entry.country || "",
      points: 0,
      games: 0,
      firstCount: 0,
      secondCount: 0,
      top4Count: 0,
      mostUsedDeckName: "",
      mostUsedDeckIconUrls: [],
      deckBuckets: new Map<string, DeckBucket>(),
    };

    existing.points += Number(entry.points || 0);
    existing.games += 1;
    if (!existing.country && entry.country) existing.country = entry.country;

    if (entry.placing === 1) existing.firstCount += 1;
    else if (entry.placing === 2) existing.secondCount += 1;
    else if (entry.placing === 3 || entry.placing === 4) existing.top4Count += 1;

    const deckKey = String(entry.deckId || entry.deckName || "").trim();
    if (deckKey) {
      const bucket = existing.deckBuckets.get(deckKey) ?? {
        key: deckKey,
        name: String(entry.deckName || deckKey),
        events: 0,
        points: 0,
        bestFinish: null,
        iconUrls: [],
      };

      bucket.events += 1;
      bucket.points += Number(entry.points || 0);
      if (entry.placing != null && Number.isFinite(entry.placing)) {
        bucket.bestFinish =
          bucket.bestFinish == null ? entry.placing : Math.min(bucket.bestFinish, entry.placing);
      }
      if (bucket.iconUrls.length === 0 && entry.deckIcons?.length) {
        bucket.iconUrls = entry.deckIcons.map(resolveDeckIconUrl).filter(Boolean);
      }

      existing.deckBuckets.set(deckKey, bucket);
    }

    map.set(entry.player, existing);
  }

  return Array.from(map.values())
    .map((player) => {
      const topDeck = Array.from(player.deckBuckets.values()).sort((a, b) => {
        return (
          b.events - a.events ||
          b.points - a.points ||
          (a.bestFinish ?? Number.MAX_SAFE_INTEGER) - (b.bestFinish ?? Number.MAX_SAFE_INTEGER) ||
          compareText(a.name, b.name)
        );
      })[0];

      return {
        player: player.player,
        playerSlug: player.playerSlug,
        country: player.country,
        points: player.points,
        games: player.games,
        firstCount: player.firstCount,
        secondCount: player.secondCount,
        top4Count: player.top4Count,
        mostUsedDeckName: topDeck?.name || "",
        mostUsedDeckIconUrls: topDeck?.iconUrls || [],
      };
    })
    .sort((a, b) => {
      return (
        b.points - a.points ||
        b.games - a.games ||
        b.firstCount - a.firstCount ||
        b.secondCount - a.secondCount ||
        b.top4Count - a.top4Count ||
        compareText(a.player, b.player)
      );
    });
});

const pageSize = 20;
const currentPage = ref(1);

const pageCount = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize)));

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return rows.value.slice(start, start + pageSize);
});

watch(
  () => ({ ...filters }),
  () => {
    currentPage.value = 1;
  },
  { deep: true },
);

watch(pageCount, (value) => {
  if (currentPage.value > value) currentPage.value = value;
});

onMounted(async () => {
  try {
    entries.value = await loadPlayerEntries();
    loadError.value = false;
  } catch (error) {
    console.error("[PlayerRanking] load failed:", error);
    loadError.value = true;
    entries.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 12px;
}

.pageTitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 18px;
  font-weight: 800;
}

.sub {
  margin: 4px 0 0;
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
}

.meta {
  margin-bottom: 12px;
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
}

.filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.f {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.35);
  padding: 10px;
}

.f label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 6px;
}

.f input,
.f select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(2, 6, 23, 0.45);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
  outline: none;
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  color: rgba(226, 232, 240, 0.58);
}

.tableWrap {
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.35);
}

.mobileList {
  display: none;
}

.tbl {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

th,
td {
  padding: 11px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
}

th {
  font-size: 12px;
  color: rgba(226, 232, 240, 0.72);
  font-weight: 700;
  white-space: nowrap;
}

td {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
}

.num {
  text-align: right;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.muted {
  color: rgba(226, 232, 240, 0.55);
}

.regionCell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flag-icon {
  width: 18px;
  height: 14px;
  display: inline-block;
  background-size: cover;
  border-radius: 3px;
  flex: 0 0 auto;
}

.flag-icon--empty {
  background: rgba(148, 163, 184, 0.22);
}

.deckIcons {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
}

.deckIcons img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex: 0 0 auto;
}

.deckIcons--small {
  min-width: 44px;
}

.deckFallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(226, 232, 240, 0.72);
  font-size: 11px;
}

.playerLink {
  color: #ffffff;
  text-decoration: none;
  font-weight: 700;
}

.playerLink:hover {
  color: #7dd3fc;
}

.empty {
  text-align: center;
  color: rgba(226, 232, 240, 0.72);
  padding: 22px 12px;
}

.mobileEmpty {
  text-align: center;
  color: rgba(226, 232, 240, 0.72);
  padding: 22px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.35);
}

.mobileCard {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.35);
}

.mobileCard__top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobileRank {
  color: rgba(125, 211, 252, 0.9);
  font-size: 13px;
}

.mobilePlayer {
  font-size: 18px;
}

.mobileRegion,
.mobileDeckRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mobileRegion {
  color: rgba(255, 255, 255, 0.88);
}

.mobileLabel {
  color: rgba(226, 232, 240, 0.62);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.mobileStats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mobileStat {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(125, 211, 252, 0.12);
  background: rgba(2, 6, 23, 0.28);
}

.mobileStat strong {
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.page-btn {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(125, 211, 252, 0.28);
  background: rgba(10, 24, 42, 0.76);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-info {
  color: rgba(226, 232, 240, 0.75);
  font-size: 12px;
}

@media (max-width: 980px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page {
    max-width: 100%;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .desktopTable {
    display: none;
  }

  .mobileList {
    display: grid;
    gap: 12px;
  }

  .meta {
    margin-bottom: 14px;
  }
}
</style>
