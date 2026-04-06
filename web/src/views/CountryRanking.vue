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
    </div>

    <div class="tableWrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ ui.country }}</th>
            <th class="num">{{ ui.totalPoints }}</th>
            <th class="num">{{ ui.totalPlayers }}</th>
            <th>{{ ui.topPlayers }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="empty">{{ ui.loading }}</td>
          </tr>
          <tr v-else-if="loadError">
            <td colspan="5" class="empty">{{ ui.loadError }}</td>
          </tr>
          <tr v-else-if="pagedRows.length === 0">
            <td colspan="5" class="empty">{{ ui.noData }}</td>
          </tr>
          <tr v-for="(row, index) in pagedRows" :key="row.countryCode">
            <td class="muted">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>
              <div class="countryCell">
                <span
                  v-if="row.countryCode !== 'UNKNOWN'"
                  class="flag-icon"
                  :class="`fi fi-${row.countryCode.toLowerCase()}`"
                  aria-hidden="true"
                ></span>
                <span v-else class="flag-icon flag-icon--empty"></span>
                <span>{{ row.countryName }}</span>
              </div>
            </td>
            <td class="num mono">{{ formatPoints(row.totalPoints) }}</td>
            <td class="num mono">{{ row.totalPlayers }}</td>
            <td>
              <div class="leaders">
                <RouterLink
                  v-for="leader in row.topPlayers"
                  :key="leader.player"
                  class="leaderLink"
                  :to="{ name: `${lang}-player-profile`, params: { playerSlug: leader.playerSlug } }"
                >
                  <span class="leaderName">{{ leader.player }}</span>
                  <span class="leaderPoints mono">{{ formatPoints(leader.points) }}</span>
                </RouterLink>
                <span v-if="row.topPlayers.length === 0" class="muted">—</span>
              </div>
            </td>
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
} from "../lib/playerEntries";

countries.registerLocale(enLang);
countries.registerLocale(zhCnLang);

type CountryLeader = {
  player: string;
  playerSlug: string;
  points: number;
  games: number;
};

type CountryRow = {
  countryCode: string;
  countryName: string;
  totalPoints: number;
  totalPlayers: number;
  topPlayers: CountryLeader[];
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
      title: "國家 / 地區玩家排名",
      subtitle: (count: number) => `符合篩選條件的國家 / 地區：${count} 個`,
      time: "日期",
      timeHint: "以 UTC 日期計算",
      set: "版本",
      all: "全部",
      past7: "過去一週",
      past4w: "過去一月",
      country: "國家 / 地區",
      totalPoints: "總積分",
      totalPlayers: "玩家數",
      topPlayers: "最佳玩家",
      loading: "正在載入國家排名資料…",
      loadError: "國家排名資料載入失敗",
      noData: "目前沒有符合條件的國家 / 地區",
      prev: "上一頁",
      next: "下一頁",
      page: (current: number, total: number) => `第 ${current} / ${total} 頁`,
      unknown: "未知地區",
    };
  }

  return {
    title: "Country / Region Ranking",
    subtitle: (count: number) => `${count} countries / regions match the current filters`,
    time: "Time",
    timeHint: "Based on UTC date",
    set: "Set",
    all: "All",
    past7: "Past 7 days",
    past4w: "Past 4 weeks",
    country: "Country / Region",
    totalPoints: "Total Points",
    totalPlayers: "Players",
    topPlayers: "Top Players",
    loading: "Loading country ranking data…",
    loadError: "Failed to load country ranking data",
    noData: "No countries / regions match the current filters",
    prev: "Previous",
    next: "Next",
    page: (current: number, total: number) => `Page ${current} / ${total}`,
    unknown: "Unknown Region",
  };
});

const entries = ref<DecoratedPlayerEntry[]>([]);
const loading = ref(true);
const loadError = ref(false);

const filters = reactive<{
  time: TimeFilterValue;
  set: string;
}>({
  time: "all",
  set: "",
});

const setOptions = computed(() => [...GAME_VERSIONS].reverse());

function versionLabel(code?: string) {
  if (!code) return ui.value.unknown;
  const version = VERSION_BY_CODE[code];
  if (!version) return code;
  return isZh.value ? `${version.code} - ${version.nameZh}` : `${version.code} - ${version.nameEn}`;
}

function countryName(code: string) {
  if (!code || code === "UNKNOWN") return ui.value.unknown;
  return countries.getName(code, isZh.value ? "zh" : "en", { select: "official" }) || code;
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

const filteredEntries = computed(() =>
  filterPlayerEntries(entries.value, {
    time: filters.time,
    set: filters.set,
  }),
);

const rows = computed<CountryRow[]>(() => {
  const countryMap = new Map<
    string,
    {
      totalPoints: number;
      players: Map<string, CountryLeader>;
    }
  >();

  for (const entry of filteredEntries.value) {
    const countryCode = String(entry.country || "UNKNOWN").trim().toUpperCase() || "UNKNOWN";
    const bucket = countryMap.get(countryCode) ?? {
      totalPoints: 0,
      players: new Map<string, CountryLeader>(),
    };

    bucket.totalPoints += Number(entry.points || 0);

    const player = bucket.players.get(entry.player) ?? {
      player: entry.player,
      playerSlug: entry.playerSlug || entry.player,
      points: 0,
      games: 0,
    };
    player.points += Number(entry.points || 0);
    player.games += 1;
    bucket.players.set(entry.player, player);
    countryMap.set(countryCode, bucket);
  }

  return Array.from(countryMap.entries())
    .map(([countryCode, bucket]) => {
      const topPlayers = Array.from(bucket.players.values())
        .sort((a, b) => b.points - a.points || b.games - a.games || compareText(a.player, b.player))
        .slice(0, 3);

      return {
        countryCode,
        countryName: countryName(countryCode),
        totalPoints: bucket.totalPoints,
        totalPlayers: bucket.players.size,
        topPlayers,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || b.totalPlayers - a.totalPlayers || compareText(a.countryName, b.countryName));
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
    console.error("[CountryRanking] load failed:", error);
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

.filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  min-width: 820px;
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
  vertical-align: top;
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

.countryCell {
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

.leaders {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.leaderLink {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(8, 20, 35, 0.72);
  border: 1px solid rgba(125, 211, 252, 0.16);
  color: #fff;
  text-decoration: none;
}

.leaderLink:hover {
  border-color: rgba(125, 211, 252, 0.36);
  color: #7dd3fc;
}

.leaderName {
  font-weight: 700;
}

.leaderPoints {
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
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

@media (max-width: 720px) {
  .filters {
    grid-template-columns: 1fr;
  }

  .tbl {
    min-width: 720px;
  }
}
</style>
