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
    </div>

    <div class="tableWrap desktopTable">
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
              <div class="leadersCell">
                <div class="leaders">
                  <RouterLink
                    v-for="leader in row.topPlayers"
                    :key="`${row.countryCode}-${leader.player}`"
                    class="leaderLink"
                    :to="{ name: `${lang}-player-profile`, params: { playerSlug: leader.playerSlug } }"
                  >
                    <span class="leaderName">{{ leader.player }}</span>
                    <span class="leaderPoints mono">{{ formatPoints(leader.points) }}</span>
                  </RouterLink>

                  <span v-if="row.allPlayers.length === 0" class="muted">--</span>
                </div>

                <button
                  v-if="row.moreCount > 0"
                  type="button"
                  class="moreBtn moreBtn--edge"
                  @click="openCountryModal(row.countryCode)"
                >
                  {{ ui.more(row.moreCount) }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mobileList">
      <div v-if="loading" class="mobileEmpty">{{ ui.loading }}</div>
      <div v-else-if="loadError" class="mobileEmpty">{{ ui.loadError }}</div>
      <div v-else-if="pagedRows.length === 0" class="mobileEmpty">{{ ui.noData }}</div>

      <article
        v-for="(row, index) in pagedRows"
        v-else
        :key="`${row.countryCode}-mobile`"
        class="mobileCard"
      >
        <div class="mobileCard__top">
          <span class="mobileRank mono">#{{ (currentPage - 1) * pageSize + index + 1 }}</span>
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
        </div>

        <div class="mobileStats">
          <div class="mobileStat">
            <span class="mobileLabel">{{ ui.totalPoints }}</span>
            <strong class="mono">{{ formatPoints(row.totalPoints) }}</strong>
          </div>
          <div class="mobileStat">
            <span class="mobileLabel">{{ ui.totalPlayers }}</span>
            <strong class="mono">{{ row.totalPlayers }}</strong>
          </div>
        </div>

        <div class="mobileLeaders">
          <span class="mobileLabel">{{ ui.topPlayers }}</span>
          <div class="leaders">
            <RouterLink
              v-for="leader in row.topPlayers"
              :key="`${row.countryCode}-${leader.player}-mobile`"
              class="leaderLink"
              :to="{ name: `${lang}-player-profile`, params: { playerSlug: leader.playerSlug } }"
            >
              <span class="leaderName">{{ leader.player }}</span>
              <span class="leaderPoints mono">{{ formatPoints(leader.points) }}</span>
            </RouterLink>

            <button
              v-if="row.moreCount > 0"
              type="button"
              class="moreBtn"
              @click="openCountryModal(row.countryCode)"
            >
              {{ ui.more(row.moreCount) }}
            </button>

            <span v-if="row.allPlayers.length === 0" class="muted">--</span>
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

    <Teleport to="body">
      <div
        v-if="activeCountryRow"
        class="countryModalBackdrop"
        @click.self="closeCountryModal"
      >
        <div class="countryModal">
          <div class="countryModal__header">
            <div class="countryModal__titleBlock">
              <div class="countryCell countryCell--large">
                <span
                  v-if="activeCountryRow.countryCode !== 'UNKNOWN'"
                  class="flag-icon"
                  :class="`fi fi-${activeCountryRow.countryCode.toLowerCase()}`"
                  aria-hidden="true"
                ></span>
                <span v-else class="flag-icon flag-icon--empty"></span>
                <h2 class="countryModal__title">
                  {{ activeCountryRow.countryName }} {{ ui.fullRanking }}
                </h2>
              </div>
              <p class="countryModal__summary">
                {{ ui.totalPoints }} {{ formatPoints(activeCountryRow.totalPoints) }}
                <span class="countryModal__divider">•</span>
                {{ ui.totalPlayers }} {{ activeCountryRow.totalPlayers }}
              </p>
            </div>

            <button type="button" class="closeBtn" @click="closeCountryModal">
              {{ ui.close }}
            </button>
          </div>

          <div class="countryModal__list">
            <div class="countryModal__row countryModal__row--head">
              <span>#</span>
              <span>{{ ui.player }}</span>
              <span class="mono">{{ ui.totalPoints }}</span>
              <span class="mono">{{ ui.events }}</span>
            </div>

            <div
              v-for="(leader, index) in pagedCountryPlayers"
              :key="`${activeCountryRow.countryCode}-${leader.player}-${modalPage}`"
              class="countryModal__row"
            >
              <span class="mono">
                {{ (modalPage - 1) * modalPageSize + index + 1 }}
              </span>
              <RouterLink
                class="playerLink"
                :to="{ name: `${lang}-player-profile`, params: { playerSlug: leader.playerSlug } }"
                @click="closeCountryModal"
              >
                {{ leader.player }}
              </RouterLink>
              <span class="mono">{{ formatPoints(leader.points) }}</span>
              <span class="mono">{{ leader.games }}</span>
            </div>
          </div>

          <div class="countryModal__footer" v-if="countryPageCount > 1">
            <button class="page-btn" :disabled="modalPage === 1" @click="modalPage -= 1">
              {{ ui.prev }}
            </button>
            <span class="page-info">{{ ui.page(modalPage, countryPageCount) }}</span>
            <button
              class="page-btn"
              :disabled="modalPage === countryPageCount"
              @click="modalPage += 1"
            >
              {{ ui.next }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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
  allPlayers: CountryLeader[];
  moreCount: number;
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
      subtitle: (count: number) => `符合篩選條件的國家 / 地區: ${count} 個`,
      time: "時間",
      timeHint: "以 UTC 日期計算",
      month: "月份",
      set: "版本",
      all: "全部",
      past7: "近 7 天",
      prev7: "前 7 天",
      past4w: "近 4 週",
      country: "國家 / 地區",
      totalPoints: "總積分",
      totalPlayers: "玩家數",
      topPlayers: "最佳玩家",
      fullRanking: "完整排名",
      more: (count: number) => `更多 +${count}`,
      player: "玩家",
      events: "參賽次數",
      close: "關閉",
      loading: "載入地區排名資料中...",
      loadError: "地區排名資料載入失敗",
      noData: "沒有符合目前篩選條件的國家 / 地區",
      prev: "上一頁",
      next: "下一頁",
      page: (current: number, total: number) => `第 ${current} / ${total} 頁`,
      unknown: "未知地區",
      currentSuffix: "（目前版本）",
    };
  }

  return {
    title: "Country / Region Ranking",
    subtitle: (count: number) => `${count} countries / regions match the current filters`,
    time: "Time",
    timeHint: "Based on UTC date",
    month: "Month",
    set: "Set",
    all: "All",
    past7: "Past 7 days",
    prev7: "Previous 7 days",
    past4w: "Past 4 weeks",
    country: "Country / Region",
    totalPoints: "Total Points",
    totalPlayers: "Players",
    topPlayers: "Top Players",
    fullRanking: "Full Ranking",
    more: (count: number) => `More +${count}`,
    player: "Player",
    events: "Events",
    close: "Close",
    loading: "Loading country ranking data...",
    loadError: "Failed to load country ranking data",
    noData: "No countries / regions match the current filters",
    prev: "Previous",
    next: "Next",
    page: (current: number, total: number) => `Page ${current} / ${total}`,
    unknown: "Unknown Region",
    currentSuffix: "(Current)",
  };
});

const entries = ref<DecoratedPlayerEntry[]>([]);
const loading = ref(true);
const loadError = ref(false);

const currentVersionCode =
  [...GAME_VERSIONS].filter((version) => version.releaseMs <= Date.now()).at(-1)?.code ?? "";

const filters = reactive<{
  time: TimeFilterValue;
  set: string;
}>({
  time: "all",
  set: currentVersionCode,
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
  const label = isZh.value
    ? `${version.code} - ${version.nameZh}`
    : `${version.code} - ${version.nameEn}`;
  return code === currentVersionCode ? `${label} ${ui.value.currentSuffix}` : label;
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
      const allPlayers = Array.from(bucket.players.values()).sort(
        (a, b) => b.points - a.points || b.games - a.games || compareText(a.player, b.player),
      );

      return {
        countryCode,
        countryName: countryName(countryCode),
        totalPoints: bucket.totalPoints,
        totalPlayers: bucket.players.size,
        topPlayers: allPlayers.slice(0, 5),
        allPlayers,
        moreCount: Math.max(0, allPlayers.length - 5),
      };
    })
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.totalPlayers - a.totalPlayers ||
        compareText(a.countryName, b.countryName),
    );
});

const pageSize = 20;
const currentPage = ref(1);

const pageCount = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize)));

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return rows.value.slice(start, start + pageSize);
});

const activeCountryCode = ref("");
const modalPage = ref(1);
const modalPageSize = 10;

const activeCountryRow = computed(() =>
  rows.value.find((row) => row.countryCode === activeCountryCode.value) ?? null,
);

const countryPageCount = computed(() => {
  const total = activeCountryRow.value?.allPlayers.length ?? 0;
  return Math.max(1, Math.ceil(total / modalPageSize));
});

const pagedCountryPlayers = computed(() => {
  const row = activeCountryRow.value;
  if (!row) return [];
  const start = (modalPage.value - 1) * modalPageSize;
  return row.allPlayers.slice(start, start + modalPageSize);
});

function openCountryModal(countryCode: string) {
  activeCountryCode.value = countryCode;
  modalPage.value = 1;
}

function closeCountryModal() {
  activeCountryCode.value = "";
}

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

watch(activeCountryCode, () => {
  modalPage.value = 1;
});

watch(countryPageCount, (value) => {
  if (modalPage.value > value) modalPage.value = value;
});

watch(rows, () => {
  if (activeCountryCode.value && !activeCountryRow.value) {
    closeCountryModal();
  }
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

.filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.f {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.35);
  padding: 12px;
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
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.35);
}

.mobileList {
  display: none;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
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
  vertical-align: middle;
}

.num {
  text-align: right;
}

.mono {
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

.muted {
  color: rgba(226, 232, 240, 0.55);
}

.countryCell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.countryCell--large {
  gap: 10px;
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

.leadersCell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.leaders {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
}

.leaderLink,
.moreBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(125, 211, 252, 0.16);
  background: rgba(8, 20, 35, 0.72);
  color: rgba(255, 255, 255, 0.92);
  text-decoration: none;
  font-size: 12px;
}

.leaderLink:hover,
.moreBtn:hover {
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

.moreBtn {
  cursor: pointer;
}

.moreBtn--edge {
  margin-left: auto;
  flex: 0 0 auto;
}

.empty,
.mobileEmpty {
  text-align: center;
  color: rgba(226, 232, 240, 0.62);
  padding: 24px 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.page-btn {
  min-width: 96px;
  border: 1px solid rgba(125, 211, 252, 0.22);
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(8, 20, 35, 0.76);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-info {
  color: rgba(226, 232, 240, 0.74);
  font-size: 12px;
}

.mobileCard {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.35);
  padding: 14px;
}

.mobileCard__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.mobileRank {
  color: rgba(226, 232, 240, 0.66);
  font-size: 12px;
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
  background: rgba(6, 12, 24, 0.42);
}

.mobileLabel {
  color: rgba(226, 232, 240, 0.6);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.mobileLeaders {
  display: grid;
  gap: 8px;
}

.countryModalBackdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(8px);
}

.countryModal {
  width: min(760px, calc(100vw - 32px));
  max-height: min(82vh, 760px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 14px;
  padding: 18px;
  border: 1px solid rgba(125, 211, 252, 0.16);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(16, 34, 60, 0.98), rgba(8, 18, 31, 0.99)),
    rgba(8, 18, 31, 0.99);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.42);
}

.countryModal__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.countryModal__title {
  margin: 0;
  font-size: 1.35rem;
  color: rgba(255, 255, 255, 0.95);
}

.countryModal__summary {
  margin: 8px 0 0;
  color: rgba(226, 232, 240, 0.74);
  font-size: 13px;
}

.countryModal__divider {
  display: inline-block;
  margin: 0 8px;
}

.closeBtn {
  border: 1px solid rgba(125, 211, 252, 0.18);
  border-radius: 999px;
  background: rgba(8, 20, 35, 0.82);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 14px;
  cursor: pointer;
}

.countryModal__list {
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 8px;
}

.countryModal__row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) 120px 110px;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(125, 211, 252, 0.1);
  background: rgba(8, 20, 35, 0.78);
  color: rgba(255, 255, 255, 0.92);
}

.countryModal__row--head {
  position: sticky;
  top: 0;
  z-index: 1;
  border-color: rgba(125, 211, 252, 0.16);
  background: rgba(15, 30, 52, 0.96);
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
  font-weight: 700;
}

.playerLink {
  color: rgba(255, 255, 255, 0.94);
  font-weight: 700;
  text-decoration: none;
}

.playerLink:hover {
  color: #7dd3fc;
}

.countryModal__footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

@media (max-width: 720px) {
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

  .countryModal {
    width: min(100vw - 20px, 720px);
    max-height: 88vh;
    padding: 14px;
  }

  .countryModal__header {
    flex-direction: column;
  }

  .closeBtn {
    align-self: flex-end;
  }

  .countryModal__row {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 10px;
  }

  .countryModal__row > :nth-child(3),
  .countryModal__row > :nth-child(4) {
    justify-self: start;
  }
}

@media (max-width: 520px) {
  .mobileStats {
    grid-template-columns: 1fr;
  }

  .countryModal__title {
    font-size: 1.1rem;
  }

  .countryModal__summary {
    font-size: 12px;
  }
}
</style>
