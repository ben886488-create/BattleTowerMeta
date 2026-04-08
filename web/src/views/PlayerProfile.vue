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
            <div class="rankChips">
              <span class="rankChip">{{ countryRankLabel }}</span>
              <span class="rankChip">{{ worldRankLabel }}</span>
            </div>
          </div>

          <RouterLink class="backLink" :to="{ name: `${lang}-player-ranking` }">
            {{ ui.back }}
          </RouterLink>
        </div>

        <div class="heroGrid">
          <section class="summaryPanel">
            <div class="summaryRows">
              <div class="summaryRow summaryRow--two">
                <article class="statCard statCard--primary">
                  <span class="statLabel">{{ ui.totalPoints }}</span>
                  <strong class="statValue mono">{{ formatPoints(totalPoints) }}</strong>
                </article>
                <article class="statCard statCard--primary">
                  <span class="statLabel">{{ ui.events }}</span>
                  <strong class="statValue mono">{{ filteredEntries.length }}</strong>
                </article>
              </div>

              <article class="recordCard">
                <div>
                  <span class="statLabel">{{ ui.winRate }}</span>
                  <strong class="recordValue mono">{{ winRateLabel }}</strong>
                  <p class="recordHint">{{ ui.winRateHint }}</p>
                </div>
                <div class="recordSplit"></div>
                <div class="recordRight">
                  <span class="statLabel">{{ ui.record }}</span>
                  <strong class="recordText mono">{{ recordLabel }}</strong>
                </div>
              </article>

              <div class="summaryRow summaryRow--three">
                <article class="finishCard finishCard--gold">
                  <div class="finishCard__labelGroup">
                    <span class="finishBadge">1ST</span>
                    <span class="statLabel">{{ ui.first }}</span>
                  </div>
                  <strong class="finishValue mono">{{ finishCounts.first }}</strong>
                </article>
                <article class="finishCard finishCard--silver">
                  <div class="finishCard__labelGroup">
                    <span class="finishBadge">2ND</span>
                    <span class="statLabel">{{ ui.second }}</span>
                  </div>
                  <strong class="finishValue mono">{{ finishCounts.second }}</strong>
                </article>
                <article class="finishCard finishCard--bronze">
                  <div class="finishCard__labelGroup">
                    <span class="finishBadge">3RD-4TH</span>
                    <span class="statLabel">{{ ui.top4 }}</span>
                  </div>
                  <strong class="finishValue mono">{{ finishCounts.top4 }}</strong>
                </article>
              </div>

              <div class="summaryRow summaryRow--three">
                <article class="finishCard finishCard--blue">
                  <div class="finishCard__labelGroup">
                    <span class="finishBadge">5TH-8TH</span>
                    <span class="statLabel">{{ ui.top8 }}</span>
                  </div>
                  <strong class="finishValue mono">{{ finishCounts.top8 }}</strong>
                </article>
                <article class="finishCard finishCard--indigo">
                  <div class="finishCard__labelGroup">
                    <span class="finishBadge">9TH-16TH</span>
                    <span class="statLabel">{{ ui.top16 }}</span>
                  </div>
                  <strong class="finishValue mono">{{ finishCounts.top16 }}</strong>
                </article>
                <article class="finishCard finishCard--slate">
                  <div class="finishCard__labelGroup">
                    <span class="finishBadge">17TH-32ND</span>
                    <span class="statLabel">{{ ui.top32 }}</span>
                  </div>
                  <strong class="finishValue mono">{{ finishCounts.top32 }}</strong>
                </article>
              </div>
            </div>
          </section>

          <section class="deckPanel">
            <div class="panelHead">
              <div>
                <h2>{{ ui.topDecks }}</h2>
                <p class="muted">{{ ui.deckRule }}</p>
              </div>
            </div>

            <div v-if="topDecks.length === 0" class="panelEmpty">{{ ui.noDeckData }}</div>
            <div v-else class="topDeckList">
              <RouterLink
                v-for="deck in topDecks"
                :key="deck.key"
                class="deckCard"
                :to="deckProfileTo(deck.key)"
              >
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
                  <div class="deckCard__copy">
                    <div class="deckName">{{ deck.name }}</div>
                    <div class="deckMeta">
                      <span class="deckMetaLabel">{{ ui.bestFinishLabel }}</span>
                      <span class="deckMetaValue">{{ deck.bestFinishLabel }}</span>
                    </div>
                  </div>
                </div>

                <div class="deckFinishGrid">
                  <span class="deckFinishPill deckFinishPill--gold"><span>{{ ui.firstShort }}</span><strong>{{ deck.finishCounts.first }}</strong></span>
                  <span class="deckFinishPill deckFinishPill--silver"><span>{{ ui.secondShort }}</span><strong>{{ deck.finishCounts.second }}</strong></span>
                  <span class="deckFinishPill deckFinishPill--bronze"><span>{{ ui.top4Short }}</span><strong>{{ deck.finishCounts.top4 }}</strong></span>
                  <span class="deckFinishPill deckFinishPill--blue"><span>{{ ui.top8Short }}</span><strong>{{ deck.finishCounts.top8 }}</strong></span>
                  <span class="deckFinishPill deckFinishPill--indigo"><span>{{ ui.top16Short }}</span><strong>{{ deck.finishCounts.top16 }}</strong></span>
                  <span class="deckFinishPill deckFinishPill--slate"><span>{{ ui.top32Short }}</span><strong>{{ deck.finishCounts.top32 }}</strong></span>
                </div>

                <div class="deckStats">
                  <span class="mono">{{ ui.deckEvents(deck.events) }}</span>
                  <span class="mono">{{ ui.deckPoints(deck.points) }}</span>
                </div>
              </RouterLink>
            </div>
          </section>
        </div>
      </div>

      <section class="tableCard">
        <div class="tableHead">
          <div>
            <h2>{{ ui.bestFinishes }}</h2>
            <p class="muted">{{ ui.bestFinishesSub }}</p>
          </div>

          <div class="sortField">
            <label>{{ ui.sortBy }}</label>
            <select v-model="finishSort">
              <option value="placing">{{ ui.sortPlacing }}</option>
              <option value="latest">{{ ui.sortLatest }}</option>
              <option value="field">{{ ui.sortField }}</option>
              <option value="points">{{ ui.sortPoints }}</option>
            </select>
          </div>
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
                  <RouterLink class="deckCell deckCell--link" :to="deckProfileTo(item.deckKey)">
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
                  </RouterLink>
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
                  <span v-else class="muted">--</span>
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
import { computed, onMounted, ref, shallowRef } from "vue";
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
import { getLocalizedDeckName } from "../assets/pokemonNames";

countries.registerLocale(enLang);
countries.registerLocale(zhCnLang);

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

type FinishSortKey = "placing" | "latest" | "field" | "points";

type FinishCounts = {
  first: number;
  second: number;
  top4: number;
  top8: number;
  top16: number;
  top32: number;
};

type RankedPlayer = {
  player: string;
  playerSlug: string;
  country: string;
  points: number;
  events: number;
  firstCount: number;
  secondCount: number;
  top4Count: number;
};

type TopDeckSummary = {
  key: string;
  name: string;
  events: number;
  points: number;
  bestFinish: number | null;
  bestFinishLabel: string;
  iconUrls: string[];
  finishCounts: FinishCounts;
};

type FinishRow = {
  key: string;
  deckKey: string;
  deckName: string;
  iconUrls: string[];
  tournamentName: string;
  dateLabel: string;
  dateMs: number;
  place: number;
  placeLabel: string;
  points: number;
  tournamentPlayers: number;
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
      loading: "正在載入玩家資料...",
      loadError: "玩家資料載入失敗",
      notFound: "找不到這位玩家",
      set: "版本",
      all: "全部",
      back: "返回玩家排名",
      totalPoints: "總積分",
      events: "參賽次數",
      winRate: "Win %",
      winRateHint: "平局不計入勝率",
      record: "勝 - 負 - 平",
      first: "冠軍",
      second: "亞軍",
      top4: "四強",
      top8: "八強",
      top16: "十六強",
      top32: "三十二強",
      firstShort: "1ST",
      secondShort: "2ND",
      top4Short: "3RD-4TH",
      top8Short: "5TH-8TH",
      top16Short: "9TH-16TH",
      top32Short: "17TH-32ND",
      topDecks: "最擅長的三副牌組",
      deckRule: "依積分優先，其次參賽次數",
      noDeckData: "目前篩選下沒有牌組資料",
      bestFinishLabel: "最佳名次",
      deckEvents: (value: number) => `參賽 ${value} 次`,
      deckPoints: (value: number) => `${formatPointsStatic(value)} 分`,
      bestFinishes: "Best Finishes",
      bestFinishesSub: "可依名次、日期、比賽規模或積分排序",
      sortBy: "排序",
      sortPlacing: "最佳名次",
      sortLatest: "最新比賽",
      sortField: "最大賽場",
      sortPoints: "最高積分",
      deck: "使用牌組",
      tournament: "賽事",
      date: "日期",
      place: "名次",
      list: "List",
      noFinishes: "沒有可顯示的名次資料",
      matches: "Matches",
      unknown: "未知地區",
      countryRank: (country: string, rank: number | null) =>
        rank ? `${country}排名第${rank}` : `${country}排名未定`,
      worldRank: (rank: number | null) => (rank ? `世界排名第${rank}` : "世界排名未定"),
    };
  }

  return {
    loading: "Loading player data...",
    loadError: "Failed to load player data",
    notFound: "Player not found",
    set: "Set",
    all: "All",
    back: "Back to player ranking",
    totalPoints: "Total Points",
    events: "Events",
    winRate: "Win %",
    winRateHint: "Ties are excluded from the percentage",
    record: "W - L - T",
    first: "1st",
    second: "2nd",
    top4: "Top 4",
    top8: "Top 8",
    top16: "Top 16",
    top32: "Top 32",
    firstShort: "1ST",
    secondShort: "2ND",
    top4Short: "3RD-4TH",
    top8Short: "5TH-8TH",
    top16Short: "9TH-16TH",
    top32Short: "17TH-32ND",
    topDecks: "Top 3 Decks",
    deckRule: "Sorted by points, then appearances",
    noDeckData: "No deck data for the current filter",
    bestFinishLabel: "Best Finish",
    deckEvents: (value: number) => `${value} events`,
    deckPoints: (value: number) => `${formatPointsStatic(value)} pts`,
    bestFinishes: "Best Finishes",
    bestFinishesSub: "Sort by placing, date, field size, or points",
    sortBy: "Sort by",
    sortPlacing: "Best placing",
    sortLatest: "Latest event",
    sortField: "Largest field",
    sortPoints: "Highest points",
    deck: "Deck",
    tournament: "Tournament",
    date: "Date",
    place: "Place",
    list: "List",
    noFinishes: "No finishes available",
    matches: "Matches",
    unknown: "Unknown Region",
    countryRank: (country: string, rank: number | null) =>
      rank ? `${country} Rank #${rank} (region)` : `${country} rank unavailable`,
    worldRank: (rank: number | null) => (rank ? `World Rank #${rank}` : "World rank unavailable"),
  };
});

const allEntries = shallowRef<DecoratedPlayerEntry[]>([]);
const loading = ref(true);
const loadError = ref(false);
const selectedSet = ref("");
const finishSort = ref<FinishSortKey>("placing");

function emptyFinishCounts(): FinishCounts {
  return {
    first: 0,
    second: 0,
    top4: 0,
    top8: 0,
    top16: 0,
    top32: 0,
  };
}

function applyFinishBucket(target: FinishCounts, placing: number | null | undefined) {
  if (placing == null || !Number.isFinite(placing)) return;
  if (placing === 1) target.first += 1;
  else if (placing === 2) target.second += 1;
  else if (placing >= 3 && placing <= 4) target.top4 += 1;
  else if (placing >= 5 && placing <= 8) target.top8 += 1;
  else if (placing >= 9 && placing <= 16) target.top16 += 1;
  else if (placing >= 17 && placing <= 32) target.top32 += 1;
}

function resolveDeckIconUrl(key: string) {
  const target = key.trim().toLowerCase();
  if (!target) return "";
  return deckIconIndex[target] ?? "";
}

function localizedDeckName(deckName: string | undefined, deckIcons: string[] | undefined) {
  const fallback = deckName || (lang.value === "en" ? "Unknown Deck" : "未知牌組");
  if (lang.value !== "zh") return fallback;

  const localized = getLocalizedDeckName(deckName, deckIcons ?? [], "zh");
  return localized || fallback;
}

function formatPointsStatic(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatPoints(value: number) {
  return formatPointsStatic(value);
}

function formatDate(ms: number) {
  if (!ms) return "--";
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function formatPercent(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "--";
  return `${value.toFixed(1)}%`;
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

function deckProfileTo(deckKey: string) {
  return {
    path: `/${lang.value}/top-decks/${encodeURIComponent(deckKey)}`,
    query: {
      set: selectedSet.value || undefined,
    },
  };
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

const rankingEntries = computed(() => {
  if (!selectedSet.value) return allEntries.value;
  return allEntries.value.filter((entry) => entry.versionCode === selectedSet.value);
});

const totalPoints = computed(() =>
  filteredEntries.value.reduce((sum, entry) => sum + Number(entry.points || 0), 0),
);

const recordTotals = computed(() => {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const entry of filteredEntries.value) {
    wins += Number(entry.wins || 0);
    losses += Number(entry.losses || 0);
    ties += Number(entry.ties || 0);
  }
  return { wins, losses, ties };
});

const winRateValue = computed(() => {
  const denominator = recordTotals.value.wins + recordTotals.value.losses;
  if (!denominator) return null;
  return (recordTotals.value.wins / denominator) * 100;
});

const winRateLabel = computed(() => formatPercent(winRateValue.value));
const recordLabel = computed(() => `${recordTotals.value.wins}-${recordTotals.value.losses}-${recordTotals.value.ties}`);

const finishCounts = computed(() => {
  const counts = emptyFinishCounts();
  for (const entry of filteredEntries.value) {
    applyFinishBucket(counts, entry.placing);
  }
  return counts;
});

const rankedPlayers = computed<RankedPlayer[]>(() => {
  const map = new Map<string, RankedPlayer>();

  for (const entry of rankingEntries.value) {
    const key = entry.playerSlug || entry.player;
    const existing = map.get(key) ?? {
      player: entry.player,
      playerSlug: key,
      country: entry.country || "",
      points: 0,
      events: 0,
      firstCount: 0,
      secondCount: 0,
      top4Count: 0,
    };

    existing.points += Number(entry.points || 0);
    existing.events += 1;
    if (!existing.country && entry.country) existing.country = entry.country;

    if (entry.placing === 1) existing.firstCount += 1;
    else if (entry.placing === 2) existing.secondCount += 1;
    else if (entry.placing === 3 || entry.placing === 4) existing.top4Count += 1;

    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => {
    return (
      b.points - a.points ||
      b.events - a.events ||
      b.firstCount - a.firstCount ||
      b.secondCount - a.secondCount ||
      b.top4Count - a.top4Count ||
      compareText(a.player, b.player)
    );
  });
});

const worldRank = computed(() => {
  const index = rankedPlayers.value.findIndex((entry) => entry.playerSlug === playerSlug.value);
  return index >= 0 ? index + 1 : null;
});

const countryRank = computed(() => {
  if (!primaryCountry.value) return null;
  const countryPlayers = rankedPlayers.value.filter((entry) => entry.country === primaryCountry.value);
  const index = countryPlayers.findIndex((entry) => entry.playerSlug === playerSlug.value);
  return index >= 0 ? index + 1 : null;
});

const countryRankLabel = computed(() =>
  ui.value.countryRank(countryLabel(primaryCountry.value), countryRank.value),
);

const worldRankLabel = computed(() => ui.value.worldRank(worldRank.value));

const topDecks = computed<TopDeckSummary[]>(() => {
  const deckMap = new Map<string, TopDeckSummary>();

  for (const entry of filteredEntries.value) {
    const key = String(entry.deckId || entry.deckName || "").trim();
    if (!key) continue;

    const existing = deckMap.get(key) ?? {
      key,
      name: localizedDeckName(entry.deckName || key, entry.deckIcons),
      events: 0,
      points: 0,
      bestFinish: null,
      bestFinishLabel: "--",
      iconUrls: (entry.deckIcons || []).map(resolveDeckIconUrl).filter(Boolean),
      finishCounts: emptyFinishCounts(),
    };

    existing.events += 1;
    existing.points += Number(entry.points || 0);
    applyFinishBucket(existing.finishCounts, entry.placing);

    if (!existing.iconUrls.length && entry.deckIcons?.length) {
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
  const rows = filteredEntries.value
    .filter((entry) => entry.placing != null && Number.isFinite(entry.placing))
    .map((entry) => ({
      key: `${entry.tournamentId}::${entry.player}::${entry.deckId || entry.deckName}`,
      deckKey: String(entry.deckId || entry.deckName || ""),
      deckName: localizedDeckName(entry.deckName, entry.deckIcons),
      iconUrls: (entry.deckIcons || []).map(resolveDeckIconUrl).filter(Boolean),
      tournamentName: entry.tournamentName,
      dateLabel: formatDate(entry.startMs),
      dateMs: entry.startMs,
      place: entry.placing || 0,
      placeLabel: entry.tournamentPlayers ? `${entry.placing} / ${entry.tournamentPlayers}` : String(entry.placing),
      points: Number(entry.points || 0),
      tournamentPlayers: Number(entry.tournamentPlayers || 0),
      listUrl: entry.matchesUrl || "",
    }));

  rows.sort((a, b) => {
    if (finishSort.value === "latest") {
      return (
        b.dateMs - a.dateMs ||
        a.place - b.place ||
        b.tournamentPlayers - a.tournamentPlayers ||
        compareText(a.tournamentName, b.tournamentName)
      );
    }

    if (finishSort.value === "field") {
      return (
        b.tournamentPlayers - a.tournamentPlayers ||
        a.place - b.place ||
        b.dateMs - a.dateMs ||
        compareText(a.tournamentName, b.tournamentName)
      );
    }

    if (finishSort.value === "points") {
      return (
        b.points - a.points ||
        a.place - b.place ||
        b.dateMs - a.dateMs ||
        compareText(a.tournamentName, b.tournamentName)
      );
    }

    return (
      a.place - b.place ||
      b.tournamentPlayers - a.tournamentPlayers ||
      b.dateMs - a.dateMs ||
      compareText(a.tournamentName, b.tournamentName)
    );
  });

  return rows.slice(0, 50);
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
  max-width: 1320px;
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

.rankChips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.rankChip {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(125, 211, 252, 0.16);
  background: rgba(15, 23, 42, 0.68);
  color: rgba(226, 232, 240, 0.82);
  font-size: 12px;
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
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
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

.summaryRows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summaryRow {
  display: grid;
  gap: 12px;
}

.summaryRow--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summaryRow--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.statCard,
.recordCard,
.finishCard {
  border-radius: 18px;
  border: 1px solid rgba(125, 211, 252, 0.12);
  background: rgba(15, 23, 42, 0.74);
}

.statCard {
  padding: 14px;
}

.statCard--primary {
  min-height: 110px;
}

.statLabel {
  display: block;
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
  margin-bottom: 8px;
}

.statValue {
  color: #fff;
  font-size: clamp(22px, 3vw, 30px);
}

.recordCard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1px minmax(180px, 0.9fr);
  align-items: center;
  gap: 18px;
  padding: 16px;
}

.recordValue,
.recordText {
  color: #fff;
  font-size: clamp(24px, 3vw, 32px);
}

.recordHint {
  margin: 8px 0 0;
  color: rgba(226, 232, 240, 0.62);
  font-size: 12px;
}

.recordSplit {
  width: 1px;
  min-height: 64px;
  background: rgba(255, 255, 255, 0.08);
}

.recordRight {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.finishCard {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 112px;
  padding: 18px 18px 16px;
  overflow: hidden;
}

.finishCard__labelGroup {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
}

.finishBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 78px;
  min-height: 28px;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.finishCard .statLabel {
  margin-bottom: 0;
}

.finishValue {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 48px;
  flex: 0 0 auto;
  color: #fff;
  font-size: clamp(34px, 4vw, 46px);
  line-height: 1;
  text-align: right;
}

.finishCard--gold {
  border-color: rgba(250, 204, 21, 0.26);
  background: linear-gradient(180deg, rgba(94, 63, 10, 0.22), rgba(15, 23, 42, 0.82));
}

.finishCard--silver {
  border-color: rgba(226, 232, 240, 0.24);
  background: linear-gradient(180deg, rgba(71, 85, 105, 0.2), rgba(15, 23, 42, 0.82));
}

.finishCard--bronze {
  border-color: rgba(251, 146, 60, 0.26);
  background: linear-gradient(180deg, rgba(124, 58, 16, 0.22), rgba(15, 23, 42, 0.82));
}

.finishCard--blue {
  border-color: rgba(96, 165, 250, 0.24);
  background: linear-gradient(180deg, rgba(30, 58, 138, 0.18), rgba(15, 23, 42, 0.82));
}

.finishCard--indigo {
  border-color: rgba(129, 140, 248, 0.24);
  background: linear-gradient(180deg, rgba(49, 46, 129, 0.18), rgba(15, 23, 42, 0.82));
}

.finishCard--slate {
  border-color: rgba(148, 163, 184, 0.22);
  background: linear-gradient(180deg, rgba(51, 65, 85, 0.2), rgba(15, 23, 42, 0.82));
}

.panelHead {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.panelHead h2,
.tableHead h2 {
  margin: 0;
  color: #fff;
  font-size: 24px;
}

.muted {
  margin: 6px 0 0;
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
  text-decoration: none;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background 140ms ease;
}

.deckCard:hover {
  transform: translateY(-1px);
  border-color: rgba(125, 211, 252, 0.28);
  background: rgba(18, 30, 54, 0.9);
}

.deckCard__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.deckCard__copy {
  min-width: 0;
  flex: 1 1 auto;
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
  font-size: 18px;
  line-height: 1.25;
}

.deckMeta,
.deckStats {
  color: rgba(226, 232, 240, 0.72);
  font-size: 12px;
}

.deckMeta {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.deckMetaLabel {
  color: rgba(226, 232, 240, 0.72);
}

.deckMetaValue {
  color: #fff;
  font-weight: 800;
  font-size: 18px;
}

.deckFinishGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.deckFinishPill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 34px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.deckFinishPill strong {
  font-size: 13px;
  font-weight: 800;
}

.deckFinishPill--gold {
  background: rgba(250, 204, 21, 0.16);
}

.deckFinishPill--silver {
  background: rgba(226, 232, 240, 0.16);
}

.deckFinishPill--bronze {
  background: rgba(251, 146, 60, 0.16);
}

.deckFinishPill--blue {
  background: rgba(96, 165, 250, 0.16);
}

.deckFinishPill--indigo {
  background: rgba(129, 140, 248, 0.16);
}

.deckFinishPill--slate {
  background: rgba(148, 163, 184, 0.14);
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

.tableHead {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 14px;
}

.sortField {
  width: min(240px, 100%);
}

.sortField label {
  display: block;
  margin-bottom: 6px;
  color: rgba(226, 232, 240, 0.8);
  font-size: 12px;
  font-weight: 700;
}

.sortField select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(2, 6, 23, 0.45);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
}

.tableWrap {
  overflow: auto;
  border-radius: 16px;
}

.tbl {
  width: 100%;
  border-collapse: collapse;
  min-width: 780px;
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

.deckCell--link {
  color: #fff;
  text-decoration: none;
  font-weight: 700;
}

.deckCell--link:hover {
  color: #7dd3fc;
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

@media (max-width: 980px) {
  .heroGrid {
    grid-template-columns: 1fr;
  }

  .summaryRow--three,
  .deckFinishGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tableHead {
    flex-direction: column;
    align-items: stretch;
  }

  .sortField {
    width: 100%;
  }
}

@media (max-width: 680px) {
  .hero {
    padding: 16px;
  }

  .heroHead {
    flex-direction: column;
    align-items: flex-start;
  }

  .summaryRow--two,
  .summaryRow--three {
    grid-template-columns: 1fr;
  }

  .finishCard {
    align-items: flex-end;
  }

  .recordCard {
    grid-template-columns: 1fr;
  }

  .recordSplit {
    display: none;
  }

  .recordRight {
    align-items: flex-start;
  }

  .deckFinishGrid {
    grid-template-columns: 1fr 1fr;
  }

  .tbl {
    min-width: 720px;
  }
}
</style>
