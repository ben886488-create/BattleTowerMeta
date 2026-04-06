<template>
  <section class="player-profile">
    <div v-if="loading" class="state">{{ ui.loading }}</div>
    <div v-else-if="loadError" class="state">{{ ui.loadError }}</div>
    <div v-else-if="!playerEntries.length" class="state">{{ ui.notFound }}</div>
    <template v-else>
      <div class="filterBar">
        <div class="filterField">
          <label>{{ ui.set }}</label>
          <select v-model="selectedSet">
            <option value="">{{ ui.all }}</option>
            <option v-for="version in setOptions" :key="version.code" :value="version.code">
              {{ versionLabel(version.code) }}
            </option>
          </select>
        </div>
      </div>

      <div class="hero">
        <div class="heroHead">
          <div>
            <p class="kicker mono">PLAYER SPOTLIGHT</p>
            <h1 class="playerName">
              {{ playerName }}
              <span
                v-if="primaryCountry"
                class="flag-icon"
                :class="`fi fi-${primaryCountry.toLowerCase()}`"
                aria-hidden="true"
              ></span>
            </h1>
            <p class="playerMeta">
              {{ countryLabel(primaryCountry) }}
              <span class="divider">•</span>
              {{ ui.filteredVersion(summaryVersionLabel) }}
            </p>
          </div>

          <RouterLink class="backLink" :to="{ name: `${lang}-player-ranking` }">
            {{ ui.back }}
          </RouterLink>
        </div>

        <div class="heroGrid">
          <section class="summaryPanel">
            <div class="summaryCards">
              <article class="summaryCard">
                <span class="summaryLabel">{{ ui.totalPoints }}</span>
                <strong class="summaryValue mono">{{ formatPoints(totalPoints) }}</strong>
              </article>
              <article class="summaryCard">
                <span class="summaryLabel">{{ ui.events }}</span>
                <strong class="summaryValue mono">{{ filteredEntries.length }}</strong>
              </article>
              <article class="summaryCard">
                <span class="summaryLabel">{{ ui.first }}</span>
                <strong class="summaryValue mono">{{ podiumCounts.first }}</strong>
              </article>
              <article class="summaryCard">
                <span class="summaryLabel">{{ ui.second }}</span>
                <strong class="summaryValue mono">{{ podiumCounts.second }}</strong>
              </article>
              <article class="summaryCard">
                <span class="summaryLabel">{{ ui.third }}</span>
                <strong class="summaryValue mono">{{ podiumCounts.third }}</strong>
              </article>
              <article class="summaryCard">
                <span class="summaryLabel">{{ ui.fourth }}</span>
                <strong class="summaryValue mono">{{ podiumCounts.fourth }}</strong>
              </article>
            </div>
          </section>

          <section class="deckPanel">
            <div class="panelHead">
              <h2>{{ ui.topDecks }}</h2>
              <span class="muted">{{ ui.deckRule }}</span>
            </div>
            <div v-if="topDecks.length === 0" class="panelEmpty">{{ ui.noDeckData }}</div>
            <div v-else class="topDeckList">
              <article v-for="deck in topDecks" :key="deck.key" class="deckCard">
                <div class="deckCard__head">
                  <div class="deckIcons">
                    <img
                      v-for="(icon, index) in deck.iconUrls"
                      :key="`${deck.key}-${icon}-${index}`"
                      :src="icon"
                      :alt="deck.name"
                      class="deckIcon"
                      draggable="false"
                    />
                    <span v-if="deck.iconUrls.length === 0" class="deckFallback mono">
                      {{ deck.name.slice(0, 2).toUpperCase() }}
                    </span>
                  </div>
                  <div>
                    <div class="deckName">{{ deck.name }}</div>
                    <div class="deckMeta">{{ ui.bestFinish(deck.bestFinishLabel) }}</div>
                  </div>
                </div>
                <div class="deckStats">
                  <span class="mono">{{ ui.deckEvents(deck.events) }}</span>
                  <span class="mono">{{ ui.deckPoints(deck.points) }}</span>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>

      <section class="tableCard">
        <div class="panelHead">
          <h2>{{ ui.bestFinishes }}</h2>
          <span class="muted">{{ ui.bestFinishesSub }}</span>
        </div>

        <div class="tableWrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>{{ ui.deck }}</th>
                <th>{{ ui.tournament }}</th>
                <th>{{ ui.date }}</th>
                <th>{{ ui.place }}</th>
                <th>{{ ui.list }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="bestFinishes.length === 0">
                <td colspan="5" class="empty">{{ ui.noFinishes }}</td>
              </tr>
              <tr v-for="item in bestFinishes" :key="item.key">
                <td>
                  <div class="deckCell">
                    <div class="deckIcons deckIcons--small">
                      <img
                        v-for="(icon, index) in item.iconUrls"
                        :key="`${item.key}-${icon}-${index}`"
                        :src="icon"
                        :alt="item.deckName"
                        class="deckIcon deckIcon--small"
                        draggable="false"
                      />
                      <span v-if="item.iconUrls.length === 0" class="deckFallback deckFallback--small mono">
                        {{ item.deckName.slice(0, 2).toUpperCase() }}
                      </span>
                    </div>
                    <span>{{ item.deckName }}</span>
                  </div>
                </td>
                <td>{{ item.tournamentName }}</td>
                <td class="mono">{{ item.dateLabel }}</td>
                <td class="mono">{{ item.placeLabel }}</td>
                <td>
                  <a
                    v-if="item.listUrl"
                    class="listLink"
                    :href="item.listUrl"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ ui.matches }}
                  </a>
                  <span v-else class="muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import "flag-icons/css/flag-icons.min.css";
import countries from "i18n-iso-countries";
import enLang from "i18n-iso-countries/langs/en.json";
import zhCnLang from "i18n-iso-countries/langs/zh.json";
import {
  GAME_VERSIONS,
  VERSION_BY_CODE,
  compareText,
  loadPlayerEntries,
  type DecoratedPlayerEntry,
} from "../lib/playerEntries";

countries.registerLocale(enLang);
countries.registerLocale(zhCnLang);

const deckIconModules = import.meta.glob("../assets/deck-icons/*.{png,webp,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

type TopDeckSummary = {
  key: string;
  name: string;
  events: number;
  points: number;
  bestFinish: number | null;
  bestFinishLabel: string;
  iconUrls: string[];
};

type FinishRow = {
  key: string;
  deckName: string;
  iconUrls: string[];
  tournamentName: string;
  dateLabel: string;
  dateMs: number;
  place: number;
  placeLabel: string;
  listUrl: string;
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
      loading: "正在載入玩家資料…",
      loadError: "玩家資料載入失敗",
      notFound: "找不到這位玩家",
      set: "版本",
      all: "全部",
      back: "返回玩家排名",
      filteredVersion: (label: string) => `目前篩選：${label}`,
      totalPoints: "總積分",
      events: "參賽次數",
      first: "冠軍",
      second: "亞軍",
      third: "第三",
      fourth: "第四",
      topDecks: "最擅長的三副牌組",
      deckRule: "依積分優先，其次參賽次數",
      noDeckData: "目前篩選條件下沒有牌組資料",
      bestFinish: (value: string) => `最佳名次：${value}`,
      deckEvents: (value: number) => `參賽 ${value} 次`,
      deckPoints: (value: number) => `${formatPointsStatic(value)} 分`,
      bestFinishes: "Best Finishes",
      bestFinishesSub: "依名次、賽事規模、日期排序",
      deck: "使用牌組",
      tournament: "賽事",
      date: "日期",
      place: "名次",
      list: "List",
      noFinishes: "目前沒有可顯示的最佳成績",
      matches: "Matches",
      unknown: "未知地區",
    };
  }

  return {
    loading: "Loading player data…",
    loadError: "Failed to load player data",
    notFound: "Player not found",
    set: "Set",
    all: "All",
    back: "Back to player ranking",
    filteredVersion: (label: string) => `Current filter: ${label}`,
    totalPoints: "Total Points",
    events: "Events",
    first: "1st",
    second: "2nd",
    third: "3rd",
    fourth: "4th",
    topDecks: "Top 3 Decks",
    deckRule: "Sorted by points, then appearances",
    noDeckData: "No deck data for the current filter",
    bestFinish: (value: string) => `Best finish: ${value}`,
    deckEvents: (value: number) => `${value} events`,
    deckPoints: (value: number) => `${formatPointsStatic(value)} pts`,
    bestFinishes: "Best Finishes",
    bestFinishesSub: "Sorted by placing, field size, then date",
    deck: "Deck",
    tournament: "Tournament",
    date: "Date",
    place: "Place",
    list: "List",
    noFinishes: "No finishes available",
    matches: "Matches",
    unknown: "Unknown Region",
  };
});

const allEntries = ref<DecoratedPlayerEntry[]>([]);
const loading = ref(true);
const loadError = ref(false);
const selectedSet = ref("");

function resolveDeckIconUrl(key: string) {
  const target = key.trim().toLowerCase();
  const hit = Object.entries(deckIconModules).find(([path]) =>
    path.toLowerCase().endsWith(`/${target}.png`) ||
    path.toLowerCase().endsWith(`/${target}.webp`) ||
    path.toLowerCase().endsWith(`/${target}.svg`),
  );
  return hit?.[1] ?? "";
}

function formatPointsStatic(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatPoints(value: number) {
  return formatPointsStatic(value);
}

function formatDate(ms: number) {
  if (!ms) return "—";
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function versionLabel(code?: string) {
  if (!code) return ui.value.all;
  const version = VERSION_BY_CODE[code];
  if (!version) return code;
  return isZh.value ? `${version.code} - ${version.nameZh}` : `${version.code} - ${version.nameEn}`;
}

function countryLabel(code?: string) {
  if (!code) return ui.value.unknown;
  return countries.getName(code, isZh.value ? "zh" : "en", { select: "official" }) || code;
}

const playerSlug = computed(() => String(route.params.playerSlug ?? ""));

const playerEntries = computed(() =>
  allEntries.value.filter((entry) => entry.playerSlug === playerSlug.value),
);

const playerName = computed(() => playerEntries.value[0]?.player ?? "");
const primaryCountry = computed(() => playerEntries.value.find((entry) => entry.country)?.country || "");

const setOptions = computed(() => {
  const seen = new Set<string>();
  return [...GAME_VERSIONS]
    .reverse()
    .filter((version) => {
      if (seen.has(version.code)) return false;
      if (!playerEntries.value.some((entry) => entry.versionCode === version.code)) return false;
      seen.add(version.code);
      return true;
    });
});

const filteredEntries = computed(() => {
  if (!selectedSet.value) return playerEntries.value;
  return playerEntries.value.filter((entry) => entry.versionCode === selectedSet.value);
});

const summaryVersionLabel = computed(() => {
  if (!selectedSet.value) return ui.value.all;
  return versionLabel(selectedSet.value);
});

const totalPoints = computed(() =>
  filteredEntries.value.reduce((sum, entry) => sum + Number(entry.points || 0), 0),
);

const podiumCounts = computed(() => {
  const counts = { first: 0, second: 0, third: 0, fourth: 0 };
  for (const entry of filteredEntries.value) {
    if (entry.placing === 1) counts.first += 1;
    else if (entry.placing === 2) counts.second += 1;
    else if (entry.placing === 3) counts.third += 1;
    else if (entry.placing === 4) counts.fourth += 1;
  }
  return counts;
});

const topDecks = computed<TopDeckSummary[]>(() => {
  const deckMap = new Map<string, TopDeckSummary>();

  for (const entry of filteredEntries.value) {
    const key = entry.deckId || entry.deckName || "unknown";
    const existing = deckMap.get(key) ?? {
      key,
      name: entry.deckName || "Unknown Deck",
      events: 0,
      points: 0,
      bestFinish: null,
      bestFinishLabel: "—",
      iconUrls: (entry.deckIcons || []).map(resolveDeckIconUrl).filter(Boolean),
    };

    existing.events += 1;
    existing.points += Number(entry.points || 0);
    if ((existing.iconUrls.length === 0) && entry.deckIcons?.length) {
      existing.iconUrls = entry.deckIcons.map(resolveDeckIconUrl).filter(Boolean);
    }

    if (entry.placing != null && Number.isFinite(entry.placing)) {
      if (existing.bestFinish == null || entry.placing < existing.bestFinish) {
        existing.bestFinish = entry.placing;
        existing.bestFinishLabel = String(entry.placing);
      }
    }

    deckMap.set(key, existing);
  }

  return Array.from(deckMap.values())
    .filter((deck) => deck.key !== "unknown")
    .sort((a, b) => {
      return (
        b.points - a.points ||
        b.events - a.events ||
        (a.bestFinish ?? Number.MAX_SAFE_INTEGER) - (b.bestFinish ?? Number.MAX_SAFE_INTEGER) ||
        compareText(a.name, b.name)
      );
    })
    .slice(0, 3);
});

const bestFinishes = computed<FinishRow[]>(() => {
  return filteredEntries.value
    .filter((entry) => entry.placing != null && Number.isFinite(entry.placing))
    .sort((a, b) => {
      return (
        (a.placing ?? Number.MAX_SAFE_INTEGER) - (b.placing ?? Number.MAX_SAFE_INTEGER) ||
        (Number(b.tournamentPlayers || 0) - Number(a.tournamentPlayers || 0)) ||
        b.startMs - a.startMs ||
        compareText(a.tournamentName, b.tournamentName)
      );
    })
    .slice(0, 50)
    .map((entry) => ({
      key: `${entry.tournamentId}::${entry.player}::${entry.deckId || entry.deckName}`,
      deckName: entry.deckName || "Unknown Deck",
      iconUrls: (entry.deckIcons || []).map(resolveDeckIconUrl).filter(Boolean),
      tournamentName: entry.tournamentName,
      dateLabel: formatDate(entry.startMs),
      dateMs: entry.startMs,
      place: entry.placing || 0,
      placeLabel: entry.tournamentPlayers ? `${entry.placing} / ${entry.tournamentPlayers}` : String(entry.placing),
      listUrl: entry.matchesUrl || "",
    }));
});

onMounted(async () => {
  try {
    allEntries.value = await loadPlayerEntries();
    loadError.value = false;
  } catch (error) {
    console.error("[PlayerProfile] load failed:", error);
    loadError.value = true;
    allEntries.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.player-profile {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.state {
  min-height: 280px;
  display: grid;
  place-items: center;
  color: rgba(226, 232, 240, 0.78);
}

.filterBar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.filterField {
  width: min(320px, 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.35);
  padding: 10px;
}

.filterField label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

.filterField select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(2, 6, 23, 0.45);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
}

.hero {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(125, 211, 252, 0.15);
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 38%),
    linear-gradient(180deg, rgba(8, 18, 32, 0.98), rgba(7, 20, 36, 0.96));
  padding: 22px;
}

.heroHead {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.kicker {
  margin: 0 0 8px;
  color: rgba(125, 211, 252, 0.78);
  font-size: 12px;
  letter-spacing: 0.18em;
}

.playerName {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.05;
}

.playerMeta {
  margin: 10px 0 0;
  color: rgba(226, 232, 240, 0.75);
}

.divider {
  margin: 0 8px;
}

.backLink {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(125, 211, 252, 0.24);
  color: #fff;
  text-decoration: none;
  white-space: nowrap;
}

.heroGrid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 18px;
}

.summaryPanel,
.deckPanel,
.tableCard {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background: rgba(8, 18, 32, 0.66);
}

.summaryPanel,
.deckPanel {
  padding: 18px;
}

.summaryCards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summaryCard {
  border-radius: 18px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.74);
  border: 1px solid rgba(125, 211, 252, 0.12);
}

.summaryLabel {
  display: block;
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
  margin-bottom: 8px;
}

.summaryValue {
  color: #fff;
  font-size: clamp(22px, 3vw, 30px);
}

.panelHead {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
  margin-bottom: 14px;
}

.panelHead h2 {
  margin: 0;
  color: #fff;
  font-size: 24px;
}

.muted {
  color: rgba(226, 232, 240, 0.65);
  font-size: 12px;
}

.panelEmpty,
.empty {
  color: rgba(226, 232, 240, 0.72);
  text-align: center;
  padding: 24px 12px;
}

.topDeckList {
  display: grid;
  gap: 12px;
}

.deckCard {
  border-radius: 18px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.74);
  border: 1px solid rgba(125, 211, 252, 0.12);
}

.deckCard__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.deckIcons {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 52px;
}

.deckIcons--small {
  min-width: 44px;
}

.deckIcon {
  width: 34px;
  height: 34px;
  object-fit: contain;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.28));
}

.deckIcon--small {
  width: 24px;
  height: 24px;
}

.deckFallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.16);
  color: #fff;
}

.deckFallback--small {
  width: 26px;
  height: 26px;
  font-size: 10px;
}

.deckName {
  color: #fff;
  font-weight: 800;
}

.deckMeta,
.deckStats {
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
}

.deckStats {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.tableCard {
  margin-top: 18px;
  padding: 18px;
}

.tableWrap {
  overflow: auto;
  border-radius: 16px;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
}

th {
  color: rgba(226, 232, 240, 0.7);
  font-size: 12px;
  font-weight: 700;
}

td {
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
}

.deckCell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.listLink {
  color: #7dd3fc;
  text-decoration: none;
  font-weight: 700;
}

.flag-icon {
  width: 22px;
  height: 16px;
  display: inline-block;
  background-size: cover;
  border-radius: 3px;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

@media (max-width: 900px) {
  .heroGrid {
    grid-template-columns: 1fr;
  }

  .summaryCards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 16px;
  }

  .heroHead {
    flex-direction: column;
    align-items: flex-start;
  }

  .summaryCards {
    grid-template-columns: 1fr 1fr;
  }

  .tbl {
    min-width: 620px;
  }
}
</style>
