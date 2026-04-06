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
        <label>
          {{ ui.time }}
          <span class="hint">{{ ui.timeHint }}</span>
        </label>
        <select v-model="filters.time">
          <option value="all">{{ ui.all }}</option>
          <option value="past7">{{ ui.past7 }}</option>
          <option value="past4w">{{ ui.past4w }}</option>
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

    <div class="tableWrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ ui.player }}</th>
            <th>{{ ui.region }}</th>
            <th class="num">{{ ui.points }}</th>
            <th class="num">{{ ui.events }}</th>
            <th class="num">{{ ui.bestFinish }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="empty">{{ ui.loading }}</td>
          </tr>
          <tr v-else-if="loadError">
            <td colspan="6" class="empty">{{ ui.loadError }}</td>
          </tr>
          <tr v-else-if="pagedRows.length === 0">
            <td colspan="6" class="empty">{{ ui.noData }}</td>
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
            <td class="num mono">{{ formatPoints(row.points) }}</td>
            <td class="num mono">{{ row.games }}</td>
            <td class="num mono">{{ row.bestFinishLabel }}</td>
          </tr>
        </tbody>
      </table>
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
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import "flag-icons/css/flag-icons.min.css";
import countries from "i18n-iso-countries";
import enLang from "i18n-iso-countries/langs/en.json";
import zhCnLang from "i18n-iso-countries/langs/zh.json";
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

countries.registerLocale(enLang);
countries.registerLocale(zhCnLang);

type PlayerSummary = {
  player: string;
  playerSlug: string;
  country: string;
  points: number;
  games: number;
  bestFinish: number | null;
  bestFinishLabel: string;
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
      subtitle: (count: number) => `符合篩選條件的玩家：${count} 名`,
      player: "玩家",
      playerPlaceholder: "輸入玩家名稱",
      time: "日期",
      timeHint: "以 UTC 日期計算",
      set: "版本",
      region: "國家 / 地區",
      points: "積分",
      events: "參賽次數",
      bestFinish: "最佳名次",
      topCutWinner: "冠軍",
      all: "全部",
      past7: "過去一週",
      past4w: "過去一月",
      rule: "積分按你的名次規則累計：1=10，2=8，3-4=6，5-8=4，9-16=2，17-32=1。",
      loading: "正在載入玩家資料…",
      loadError: "玩家資料載入失敗",
      noData: "目前沒有符合條件的玩家",
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
    timeHint: "Based on UTC date",
    set: "Set",
    region: "Country / Region",
    points: "Points",
    events: "Events",
    bestFinish: "Best Finish",
    topCutWinner: "Winner",
    all: "All",
    past7: "Past 7 days",
    past4w: "Past 4 weeks",
    rule: "Points follow your placing weights: 1=10, 2=8, 3-4=6, 5-8=4, 9-16=2, 17-32=1.",
    loading: "Loading player data…",
    loadError: "Failed to load player data",
    noData: "No players match the current filters",
    prev: "Previous",
    next: "Next",
    page: (current: number, total: number) => `Page ${current} / ${total}`,
    unknown: "Unknown",
  };
});

const entries = ref<DecoratedPlayerEntry[]>([]);
const loading = ref(true);
const loadError = ref(false);

const filters = reactive<{
  player: string;
  time: TimeFilterValue;
  set: string;
  topCut: TopCutFilter;
}>({
  player: "",
  time: "all",
  set: "",
  topCut: "",
});

const setOptions = computed(() => [...GAME_VERSIONS].reverse());

function versionLabel(code?: string) {
  if (!code) return ui.value.unknown;
  const version = VERSION_BY_CODE[code];
  if (!version) return code;
  return isZh.value ? `${version.code} - ${version.nameZh}` : `${version.code} - ${version.nameEn}`;
}

function countryName(code?: string) {
  if (!code) return ui.value.unknown;
  return countries.getName(code, isZh.value ? "zh" : "en", { select: "official" }) || code;
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
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
  const map = new Map<string, PlayerSummary>();

  for (const entry of filteredEntries.value) {
    const existing = map.get(entry.player) ?? {
      player: entry.player,
      playerSlug: entry.playerSlug || entry.player,
      country: entry.country || "",
      points: 0,
      games: 0,
      bestFinish: null,
      bestFinishLabel: "—",
    };

    existing.points += Number(entry.points || 0);
    existing.games += 1;
    if (!existing.country && entry.country) existing.country = entry.country;

    const placing = entry.placing;
    if (placing != null && Number.isFinite(placing)) {
      if (existing.bestFinish == null || placing < existing.bestFinish) {
        existing.bestFinish = placing;
        existing.bestFinishLabel = String(placing);
      }
    }

    map.set(entry.player, existing);
  }

  return Array.from(map.values()).sort((a, b) => {
    return (
      b.points - a.points ||
      b.games - a.games ||
      (a.bestFinish ?? Number.MAX_SAFE_INTEGER) - (b.bestFinish ?? Number.MAX_SAFE_INTEGER) ||
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
  max-width: 1100px;
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

.tbl {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
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

  .tbl {
    min-width: 620px;
  }
}
</style>
