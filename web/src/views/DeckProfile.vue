<template>
  <section class="deck-profile">
    <div class="profileFilters">
      <section class="profileFilterGroup">
        <div class="profileFilterGroup__head">
          <h3 class="profileFilterGroup__title">
            {{ isZhUi ? "左側面板篩選" : "Left panel filters" }}
          </h3>
          <p class="profileFilterGroup__sub">
            {{
              isZhUi
                ? "影響 Top 4、勝負、場域佔比、Win %、優劣勢對局"
                : "Affects Top 4, record, meta share, Win %, and matchups"
            }}
          </p>
        </div>

        <div class="profileFilterGrid profileFilterGrid--left">
          <div class="profileFilterField">
            <label>
              {{ isZhUi ? "時間" : "Time" }}
              <span class="hint">{{ isZhUi ? "以 UTC 日期計算" : "Based on UTC date" }}</span>
            </label>
            <select v-model="leftPanelFilters.time">
              <option value="prev7">Previous 7 days</option>
              <option value="all">{{ isZhUi ? "全部" : "All" }}</option>
              <option value="past7">{{ isZhUi ? "過去一週" : "Past 7 days" }}</option>
              <option value="past4w">{{ isZhUi ? "過去一月" : "Past 4 weeks" }}</option>
              <optgroup :label="isZhUi ? '月份' : 'Month'">
                <option
                  v-for="m in monthOptions"
                  :key="`left-time-${m.value}`"
                  :value="m.value"
                >
                  {{ m.label }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="profileFilterField">
            <label>Top Cut</label>
            <select v-model="leftPanelFilters.topCut">
              <option
                v-for="cut in TOP_CUT_OPTIONS"
                :key="`left-topcut-${cut}`"
                :value="cut"
              >
                {{ topCutLabel(cut) }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <section class="profileFilterGroup">
        <div class="profileFilterGroup__head">
          <h3 class="profileFilterGroup__title">
            {{ isZhUi ? "右側卡牌投入率篩選" : "Card inclusion filters" }}
          </h3>
          <p class="profileFilterGroup__sub">
            {{
              isZhUi
                ? "只影響右側卡牌投入率與平均張數"
                : "Affects only card inclusion % and average copies"
            }}
          </p>
        </div>

        <div class="profileFilterGrid profileFilterGrid--right">
          <div class="profileFilterField">
            <label>
              {{ isZhUi ? "時間" : "Time" }}
              <span class="hint">{{ isZhUi ? "以 UTC 日期計算" : "Based on UTC date" }}</span>
            </label>
            <select v-model="rightCardFilters.time">
              <option value="prev7">Previous 7 days</option>
              <option value="all">{{ isZhUi ? "全部" : "All" }}</option>
              <option value="past7">{{ isZhUi ? "過去一週" : "Past 7 days" }}</option>
              <option value="past4w">{{ isZhUi ? "過去一月" : "Past 4 weeks" }}</option>
              <optgroup :label="isZhUi ? '月份' : 'Month'">
                <option
                  v-for="m in monthOptions"
                  :key="`right-time-${m.value}`"
                  :value="m.value"
                >
                  {{ m.label }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="profileFilterField">
            <label>Top Cut</label>
            <select v-model="rightCardFilters.topCut">
              <option
                v-for="cut in TOP_CUT_OPTIONS"
                :key="`right-topcut-${cut}`"
                :value="cut"
              >
                {{ topCutLabel(cut) }}
              </option>
            </select>
          </div>

          <div class="profileFilterField profileFilterField--toggle">
            <label>View</label>
            <div
              class="view-toggle"
              role="tablist"
              aria-label="Right deck panel view"
            >
              <button
                type="button"
                class="view-toggle__option"
                :class="{ 'view-toggle__option--active': rightDeckMode === 'cards' }"
                @click="rightDeckMode = 'cards'"
              >
                Card rates
              </button>
              <button
                type="button"
                class="view-toggle__option"
                :class="{ 'view-toggle__option--active': rightDeckMode === 'sample' }"
                @click="rightDeckMode = 'sample'"
              >
                Sample deck
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
    <div ref="heroCaptureRef" class="hero-grid">
      <aside class="hero-sidebar">
      <section class="hero-panel hero-panel--title">
        <span class="panel-kicker mono">DECK SPOTLIGHT</span>

        <div class="deck-title-block deck-title-block--classic">
          <div class="deck-title-text deck-title-text--classic">
            <p class="deck-display-name deck-display-name--classic">
              {{ displayDeckName }}
            </p>

            <p
              v-if="displayDeckNameEn && displayDeckNameEn !== displayDeckName"
              class="deck-english-name deck-english-name--classic mono"
            >
              {{ displayDeckNameEn }}
            </p>

            <p class="deck-context-line mono">
              {{ leftPanelSummaryText }}
            </p>
          </div>

          <div class="deck-title-right deck-title-right--classic">
            <div class="sprite-stack sprite-stack--title" :title="displayDeckName">
              <template v-if="titleSpriteUrls.length > 0">
                <img
                  v-for="(sprite, index) in titleSpriteUrls"
                  :key="`${sprite}-${index}`"
                  class="sprite-chip sprite-chip--title"
                  :src="sprite"
                  :alt="displayDeckName"
                  draggable="false"
                />
              </template>

              <div v-else class="sprite-fallback mono">
                {{ cardInitials(displayDeckName) }}
              </div>
            </div>

            <div
              v-if="deckTierInfo"
              class="tier-badge"
              :class="tierClassName(deckTierInfo.tier)"
              :title="`Tier ${deckTierInfo.tier}`"
            >
              <span class="tier-badge__label mono">TIER</span>
              <strong class="tier-badge__value mono">{{ deckTierInfo.tier }}</strong>
            </div>
          </div>
        </div>
      </section>  

        <section class="hero-panel hero-panel--stats">
          <div class="stats-head">
            <h3 class="panel-title">本週 Top 4</h3>
          </div>

          <div class="placement-grid">
            <article class="placement-card placement-card--gold">
              <span class="placement-rank mono">1ST</span>
              <strong class="placement-value mono">× {{ leftAnalytics.top4Counts[1] }}</strong>
            </article>

            <article class="placement-card placement-card--silver">
              <span class="placement-rank mono">2ND</span>
              <strong class="placement-value mono">× {{ leftAnalytics.top4Counts[2] }}</strong>
            </article>

            <article class="placement-card placement-card--bronze">
              <span class="placement-rank mono">3RD</span>
              <strong class="placement-value mono">× {{ leftAnalytics.top4Counts[3] }}</strong>
            </article>

            <article class="placement-card placement-card--blue">
              <span class="placement-rank mono">4TH</span>
              <strong class="placement-value mono">× {{ leftAnalytics.top4Counts[4] }}</strong>
            </article>
          </div>

          <div class="metric-row">
            <div class="metric-card">
              <div class="semi-gauge">
                <svg viewBox="0 0 120 68" class="semi-gauge__svg" aria-hidden="true">
                  <path
                    d="M 10 58 A 50 50 0 0 1 110 58"
                    fill="none"
                    stroke="#ffffff"
                    stroke-opacity="0.14"
                    stroke-width="14"
                    stroke-linecap="butt"
                  />
                  <path
                    d="M 10 58 A 50 50 0 0 1 110 58"
                    fill="none"
                    stroke="#ff7f50"
                    stroke-width="14"
                    stroke-linecap="butt"
                    :stroke-dasharray="gaugeDasharray(leftAnalytics.metaShare)"
                    stroke-dashoffset="0"
                  />
                </svg>

                <div class="semi-gauge__label">
                  <strong class="mono">{{ formatPct(leftAnalytics.metaShare) }}</strong>
                </div>
                <div class="semi-gauge__caption">Top Cut %</div>
              </div>
            </div>

            <div class="metric-card">
              <div class="semi-gauge">
                <svg viewBox="0 0 120 68" class="semi-gauge__svg" aria-hidden="true">
                  <path
                    d="M 10 58 A 50 50 0 0 1 110 58"
                    fill="none"
                    stroke="#ffffff"
                    stroke-opacity="0.14"
                    stroke-width="14"
                    stroke-linecap="butt"
                  />
                  <path
                    d="M 10 58 A 50 50 0 0 1 110 58"
                    fill="none"
                    stroke="#ff7f50"
                    stroke-width="14"
                    stroke-linecap="butt"
                    :stroke-dasharray="gaugeDasharray(leftAnalytics.winRate)"
                    stroke-dashoffset="0"
                  />
                </svg>

                <div class="semi-gauge__label">
                  <strong class="mono">
                    {{ leftAnalytics.winRate == null ? "—" : formatPct(leftAnalytics.winRate) }}
                  </strong>
                </div>
                <div class="semi-gauge__caption">Win %</div>
              </div>
            </div>
          </div>

          <div class="record-line">
            <span class="record-bubble record-bubble--win mono">{{ leftAnalytics.wins }}勝</span>
            <span class="record-bubble record-bubble--loss mono">{{ leftAnalytics.losses }}負</span>
            <span class="record-bubble record-bubble--draw mono">{{ leftAnalytics.draws }}平</span>
          </div>
        </section>

        <section class="hero-panel hero-panel--matchups">
          <div class="matchup-group">
            <div class="matchup-group__title matchup-group__title--good">優勢對局</div>

            <div v-if="leftAnalytics.featuredGoodMatchups.length > 0" class="matchup-row">
              <article
                v-for="item in leftAnalytics.featuredGoodMatchups"
                :key="`good-${item.key}`"
                class="matchup-tile matchup-tile--good"
                :title="item.displayName"
              >
                <div class="sprite-stack sprite-stack--small">
                  <template v-if="item.spriteUrls.length > 0">
                    <img
                      v-for="(sprite, index) in item.spriteUrls"
                      :key="`${item.key}-good-${sprite}-${index}`"
                      class="sprite-chip sprite-chip--small"
                      :src="sprite"
                      :alt="item.displayName"
                      draggable="false"
                    />
                  </template>

                  <div v-else class="sprite-fallback sprite-fallback--small mono">
                    {{ cardInitials(item.displayName) }}
                  </div>
                </div>

                <div class="matchup-rate mono">{{ formatPct(item.winRate) }}</div>
                <div class="matchup-record mono">
                  {{ formatRecord(item.wins, item.losses, item.draws) }}
                </div>
              </article>
            </div>

            <div v-else class="matchup-empty">—</div>
          </div>

          <div class="matchup-group">
            <div class="matchup-group__title matchup-group__title--bad">劣勢對局</div>

            <div v-if="leftAnalytics.featuredBadMatchups.length > 0" class="matchup-row">
              <article
                v-for="item in leftAnalytics.featuredBadMatchups"
                :key="`bad-${item.key}`"
                class="matchup-tile matchup-tile--bad"
                :title="item.displayName"
              >
                <div class="sprite-stack sprite-stack--small">
                  <template v-if="item.spriteUrls.length > 0">
                    <img
                      v-for="(sprite, index) in item.spriteUrls"
                      :key="`${item.key}-bad-${sprite}-${index}`"
                      class="sprite-chip sprite-chip--small"
                      :src="sprite"
                      :alt="item.displayName"
                      draggable="false"
                    />
                  </template>

                  <div v-else class="sprite-fallback sprite-fallback--small mono">
                    {{ cardInitials(item.displayName) }}
                  </div>
                </div>

                <div class="matchup-rate mono">{{ formatPct(item.winRate) }}</div>
                <div class="matchup-record mono">
                  {{ formatRecord(item.wins, item.losses, item.draws) }}
                </div>
              </article>
            </div>

            <div v-else class="matchup-empty">—</div>
          </div>
        </section>
      </aside>

      <section class="hero-panel hero-panel--decklist">
        <div ref="deckPanelRef" class="decklist-shell">
          <div class="decklist-head">
            <div class="decklist-head__copy">
              <h3 class="panel-title">
                {{ rightDeckMode === "cards" ? "Card inclusion" : "Best sample deck" }}
              </h3>
              <p class="decklist-head__sub">{{ rightDeckPanelSubtitle }}</p>
            </div>

            <a
              v-if="rightDeckMode === 'sample' && rightAnalytics.sampleDeck?.listUrl"
              class="list-btn"
              :href="rightAnalytics.sampleDeck.listUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Decklist
            </a>
          </div>

          <div
            v-if="rightDeckMode === 'sample' && rightAnalytics.sampleDeck"
            class="sample-deck-meta"
          >
            <span class="sample-deck-meta__item mono">
              {{ rightAnalytics.sampleDeck.player }}
            </span>
            <span class="sample-deck-meta__item mono">
              {{ rightAnalytics.sampleDeck.placeLabel }}
            </span>
            <span class="sample-deck-meta__item">
              {{ rightAnalytics.sampleDeck.tournamentName }}
            </span>
          </div>
          <div v-if="profileLoading" class="cards-empty">
            正在整理牌組資料…
          </div>

          <div
            v-else-if="
              normalizedTournaments.length > 0 &&
              rightAnalytics.totalSeenDeckRows === 0 &&
              loadedTournamentCount >= normalizedTournaments.length
            "
            class="cards-empty"
          >
            目前篩選條件下沒有這副牌組
          </div>

          <div v-else-if="rightDeckPanelCards.length === 0" class="cards-empty">
            <span class="cards-empty__copy">{{ rightDeckPanelEmptyText }}</span>
            目前沒有投入率達 10% 以上的卡片
          </div>

          <div
            v-else
            ref="deckCardsViewportRef"
            class="decklist-viewport"
            :class="{ 'decklist-viewport--scrollable': rightDeckPanelCards.length > 20 }"
            :style="decklistViewportStyle"
          >
            <div ref="deckCardsGridRef" class="cardsGrid cardsGrid--profile">
              <article
                v-for="card in rightDeckPanelCards"
                :key="card.key"
                class="profileCard"
                :title="`${card.name} • 投入率 ${formatPercentValue(card.slotRatePct)} • 出現 ${formatPercentValue(card.inclusionPct)}`"
              >
                <div class="profileCard__imageWrap">
                  <img
                    v-if="card.image && !failedCardImages[card.key]"
                    class="profileCard__image"
                    :src="card.image"
                    :alt="card.name"
                    crossorigin="anonymous"
                    draggable="false"
                    @error="onCardImageError(card.key)"
                  />

                  <div v-else class="profileCard__fallback">
                    <div class="profileCard__fallbackName">{{ card.name }}</div>
                    <div class="profileCard__fallbackCode mono">
                      {{ card.set || "?" }} {{ card.number || card.code || "?" }}
                    </div>
                  </div>

                  <span
                    class="profileCard__rate mono"
                    :class="{ 'profileCard__rate--count': rightDeckMode === 'sample' }"
                    :data-rate-label="card.badgeText"
                  >
                    {{ rightDeckMode === "sample" ? "" : formatPercentValue(card.slotRatePct) }}
                  </span>

                  
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="deck-actions">
      <button
        type="button"
        class="download-btn mono"
        :disabled="downloadingDeckPanel || rightDeckPanelCards.length === 0"
        @click="downloadTransparentDeckPanel"
      >
        {{ downloadingDeckPanel ? "下載中..." : "下載透明面板" }}
      </button>
    </div>

    <div class="deck-actions">
      <button
        type="button"
        class="download-btn mono"
        :disabled="downloadingPanel || rightDeckPanelCards.length === 0"
        @click="downloadDeckPanelPng"
      >
        {{ downloadingPanel ? "下載中..." : "下載 PNG" }}
      </button>
    </div>

    <section class="table-card">
      <div class="section-head">
        <h2 class="section-title">Best Finishes</h2>
      </div>

      <div class="table-scroll">
        <table class="results-table">
          <thead>
            <tr>
              <th>
                <button type="button" class="sort-btn" @click="toggleFinishSort('player')">
                  Player <span class="sort-mark">{{ finishSortMark("player") }}</span>
                </button>
              </th>
              <th>
                <button type="button" class="sort-btn" @click="toggleFinishSort('tournamentName')">
                  Tournament <span class="sort-mark">{{ finishSortMark("tournamentName") }}</span>
                </button>
              </th>
              <th>
                <button type="button" class="sort-btn" @click="toggleFinishSort('dateMs')">
                  Date <span class="sort-mark">{{ finishSortMark("dateMs") }}</span>
                </button>
              </th>
              <th>
                <button type="button" class="sort-btn" @click="toggleFinishSort('place')">
                  Place <span class="sort-mark">{{ finishSortMark("place") }}</span>
                </button>
              </th>
              <th>List</th>
            </tr>
          </thead>

          <tbody v-if="sortedBestFinishes.length > 0">
            <tr v-for="item in sortedBestFinishes" :key="item.key">
              <td class="player-col">{{ item.player }}</td>
              <td class="tournament-col">{{ item.tournamentName }}</td>
              <td class="mono">{{ item.dateLabel }}</td>
              <td class="mono">{{ item.placeLabel }}</td>
              <td>
                <a
                  v-if="item.listUrl"
                  class="list-btn"
                  :href="item.listUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Deck
                </a>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td colspan="5" class="empty-table">目前沒有成績資料</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { getLocalizedDeckNameFromIconKeys } from "../assets/pokemonNames";

type AnyRecord = Record<string, any>;

const BASE_URL = import.meta.env.BASE_URL || "/";
const DAY_MS = 24 * 60 * 60 * 1000;
const PRESET_CURRENT_7 = "__current_7__";
const PRESET_CURRENT_14 = "__current_14__";
const MIN_SLOT_RATE_PCT = 10;

type LocaleCode = "zh" | "en";
type TopCutValue = "all" | "64" | "32" | "16" | "8" | "4" | "2" | "1";
type SetFilterValue = "" | typeof PRESET_CURRENT_7 | typeof PRESET_CURRENT_14 | string;

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

interface IndexedTournament extends TournamentListItem {
  startMs: number;
  versionCode: string;
  versionName: string;
  versionLabel: string;
}

interface DeckIdentity {
  key: string;
  candidateKeys: string[];
  displayName: string;
  displayNameEn: string;
  spriteUrls: string[];
  iconKeys: string[];
}

interface NormalizedTournament {
  id: string;
  name: string;
  startMs: number;
  players: number | null;
  standings: AnyRecord[];
  pairings: AnyRecord[];
}

interface TierRow {
  deck: string;
  tier: string;
  score: number;
  usage: number;
  total_samples: number;
  baselineTop32Samples?: number;
  weightedPoints?: number;
  top32SharePct?: number;
}

interface NormalizedDeckCard {
  key: string;
  code: string;
  set: string;
  number: string;
  name: string;
  count: number;
  image: string;
  category: string;
}

interface CardAggregate {
  key: string;
  code: string;
  set: string;
  number: string;
  name: string;
  image: string;
  category: string;
  totalCopies: number;
  deckCount: number;
  slotRatePct: number;
  inclusionPct: number;
  avgCopies: number;
}

interface MatchupAggregate {
  key: string;
  displayName: string;
  spriteUrls: string[];
  wins: number;
  losses: number;
  draws: number;
  games: number;
  winRate: number;
}

interface CardGroup {
  key: string;
  label: string;
  cards: CardAggregate[];
}

interface DeckProfileAnalytics {
  totalStandingRows: number;
  targetStandingRows: number;
  totalSeenDeckRows: number;
  top4Counts: Record<1 | 2 | 3 | 4, number>;
  metaShare: number;
  winRate: number | null;
  wins: number;
  losses: number;
  draws: number;
  matchCount: number;
  cardsFlat: CardAggregate[];
  cardGroups: CardGroup[];
  featuredGoodMatchups: MatchupAggregate[];
  featuredBadMatchups: MatchupAggregate[];
  bestFinishes: FinishRow[];
  sampleDeck: SampleDeckEntry | null;
  targetSpriteUrls: string[];
  resolvedDeckDisplayName: string;
  resolvedDeckDisplayNameEn: string;
}

interface FinishRow {
  key: string;
  player: string;
  tournamentName: string;
  dateMs: number;
  dateLabel: string;
  place: number;
  players: number | null;
  placeLabel: string;
  listUrl: string;
}

interface SampleDeckEntry {
  tournamentId: string;
  tournamentName: string;
  player: string;
  dateMs: number;
  dateLabel: string;
  place: number;
  players: number | null;
  placeLabel: string;
  listUrl: string;
  cards: NormalizedDeckCard[];
}

interface RightDeckPanelCard {
  key: string;
  code: string;
  set: string;
  number: string;
  name: string;
  image: string;
  slotRatePct: number;
  badgeText: string;
  title: string;
}

type FinishSortKey = "player" | "tournamentName" | "dateMs" | "place";
type RightDeckMode = "cards" | "sample";

interface Props {
  deck?: AnyRecord | null;
  deckKey?: string;
  tournaments?: AnyRecord[];
  filteredTournaments?: AnyRecord[];
  loadedFilteredTournamentCount?: number;
  standingsByTournament?: Record<string, AnyRecord[]>;
  pairingsByTournament?: Record<string, AnyRecord[]>;
  filters?: AnyRecord;
  locale?: string;
}

const props = withDefaults(defineProps<Props>(), {
  deck: null,
  deckKey: "",
  tournaments: () => [],
  filteredTournaments: () => [],
  loadedFilteredTournamentCount: 0,
  standingsByTournament: () => ({}),
  pairingsByTournament: () => ({}),
  filters: () => ({}),
  locale: "zh-Hant",
});

const route = useRoute();

const failedCardImages = ref<Record<string, boolean>>({});
const deckPanelRef = ref<HTMLElement | null>(null);
const downloadingDeckPanel = ref(false);
const rightDeckMode = ref<RightDeckMode>("cards");

const heroCaptureRef = ref<HTMLElement | null>(null);
const deckCardsViewportRef = ref<HTMLElement | null>(null);
const deckCardsGridRef = ref<HTMLElement | null>(null);
const downloadingPanel = ref(false);
const deckViewportHeight = ref<number | null>(null);

let deckGridResizeObserver: ResizeObserver | null = null;

function getDeckGridColumns(viewportWidth: number) {
  if (viewportWidth <= 520) return 2;
  if (viewportWidth <= 720) return 3;
  if (viewportWidth <= 900) return 4;
  if (viewportWidth <= 1080) return 5;
  if (viewportWidth <= 1380) return 4;
  return 5;
}

function bindDeckGridObserver() {
  deckGridResizeObserver?.disconnect();
  deckGridResizeObserver = null;

  if (!deckCardsGridRef.value) return;

  deckGridResizeObserver = new ResizeObserver(() => {
    updateDeckViewportHeight();
  });

  deckGridResizeObserver.observe(deckCardsGridRef.value);
}

function handleDeckProfileResize() {
  updateDeckViewportHeight();
}

function updateDeckViewportHeight() {
  const grid = deckCardsGridRef.value;
  const total = rightDeckPanelCards.value.length;

  if (!grid || total <= 0) {
    deckViewportHeight.value = null;
    return;
  }

  const width = grid.clientWidth;
  if (!width) return;

  const cols = getDeckGridColumns(window.innerWidth);
  const visibleCards = Math.min(total, 20);
  const rows = Math.ceil(visibleCards / cols);
  const gap = 12;
  const cardWidth = (width - gap * (cols - 1)) / cols;
  const cardHeight = cardWidth * (7 / 5);

  deckViewportHeight.value = Math.ceil(cardHeight * rows + gap * Math.max(0, rows - 1));
}

const decklistViewportStyle = computed<Record<string, string | undefined>>(() => {
  if (!deckViewportHeight.value || rightDeckPanelCards.value.length <= 20) {
    return { maxHeight: undefined };
  }

  return {
    maxHeight: `${deckViewportHeight.value}px`,
  };
});

async function downloadDeckPanelPng() {
  if (downloadingPanel.value || !heroCaptureRef.value) return;

  downloadingPanel.value = true;

  const viewport = deckCardsViewportRef.value;
  const prevMaxHeight = viewport?.style.maxHeight ?? "";
  const prevOverflowY = viewport?.style.overflowY ?? "";

  try {
    if (viewport) {
      viewport.style.maxHeight = "none";
      viewport.style.overflowY = "visible";
    }

    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const { toPng } = await import("html-to-image");

    const dataUrl = await toPng(heroCaptureRef.value, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "rgba(0,0,0,0)",
    });

    const link = document.createElement("a");
    const fileName =
      slugify(displayDeckNameEn.value || displayDeckName.value || resolvedDeckKey.value) ||
      "deck-profile";

    link.href = dataUrl;
    link.download = `${fileName}.png`;
    link.click();
  } catch (error) {
    console.error("[DeckProfile] downloadDeckPanelPng failed:", error);
  } finally {
    if (viewport) {
      viewport.style.maxHeight = prevMaxHeight;
      viewport.style.overflowY = prevOverflowY;
    }

    downloadingPanel.value = false;
  }
}

const finishSort = reactive<{
  key: FinishSortKey;
  dir: "asc" | "desc";
}>({
  key: "place",
  dir: "asc",
});

/* -----------------------------
   route / external / fallback data
------------------------------ */

const internalTournaments = ref<IndexedTournament[]>([]);
const loadingTournaments = ref(false);

const internalStandingsCache = reactive<Record<string, AnyRecord[]>>({});
const internalPairingsCache = reactive<Record<string, AnyRecord[]>>({});

const internalStandingsLoading = reactive<Record<string, boolean>>({});
const internalPairingsLoading = reactive<Record<string, boolean>>({});



const hasExternalData = computed(() => {
  return (
    props.tournaments.length > 0 ||
    props.filteredTournaments.length > 0 ||
    Object.keys(props.standingsByTournament).length > 0 ||
    Object.keys(props.pairingsByTournament).length > 0
  );
});

const routeLang = computed<LocaleCode>(() => {
  return String(route.path).split("/")[1] === "en" ? "en" : "zh";
});

const activeLocale = computed(() => {
  return props.locale || (routeLang.value === "en" ? "en" : "zh-Hant");
});

function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function sanitizeTopCut(value: unknown): TopCutValue {
  const text = cleanDeckText(value).toLowerCase();
  if (["all", "64", "32", "16", "8", "4", "2", "1"].includes(text)) {
    return text as TopCutValue;
  }
  return "all";
}

/** Match TopDecks default: no `set` in URL → 近 7 天（僅目前版本）. Explicit `?set=` keeps「全部資料」. */
function parseRouteSetFilter(raw: unknown): SetFilterValue {
  if (raw === undefined || raw === null) {
    return PRESET_CURRENT_7;
  }
  return (cleanDeckText(raw) || "") as SetFilterValue;
}

const routeDeckKey = computed(() => cleanDeckText(firstQueryValue(route.params.deckKey)));
const resolvedDeckKey = computed(() => cleanDeckText(props.deckKey || routeDeckKey.value));

const routeFilters = computed(() => {
  return {
    set: parseRouteSetFilter(firstQueryValue(route.query.set)),
    topCut: sanitizeTopCut(firstQueryValue(route.query.topCut)),
  };
});

const activeFilters = computed(() => {
  if (hasExternalData.value && Object.keys(props.filters).length > 0) {
    return {
      set: cleanDeckText(props.filters?.set) as SetFilterValue,
      topCut: sanitizeTopCut(props.filters?.topCut),
    };
  }

  return routeFilters.value;
});

type ProfileTimeFilterValue = "all" | "past7" | "prev7" | "past4w" | string;

interface ProfileScopeFilters {
  time: ProfileTimeFilterValue;
  topCut: TopCutValue;
}

const isZhUi = computed(() => routeLang.value === "zh");

const TOP_CUT_OPTIONS: TopCutValue[] = ["all", "64", "32", "16", "8", "4", "2", "1"];

function topCutLabel(value: TopCutValue) {
  if (value === "all") return isZhUi.value ? "全部" : "All";
  return isZhUi.value ? `前 ${value}` : `Top ${value}`;
}

function tierClassName(tier: unknown) {
  const token = cleanDeckText(tier)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return token ? `tier-badge--${token}` : "";
}

function profileTimeSummaryLabel(value: ProfileTimeFilterValue) {
  if (value === "all") return isZhUi.value ? "全部時間" : "All time";
  if (value === "past7") return isZhUi.value ? "近 7 天" : "Past 7 days";
  if (value === "past4w") return isZhUi.value ? "近 4 週" : "Past 4 weeks";

  if (value === "prev7") return "Previous 7 days";

  if (String(value).startsWith("month:")) {
    const ym = String(value).slice("month:".length);
    const [yS, mS] = ym.split("-");
    const y = Number(yS);
    const m = Number(mS);

    if (y && m) {
      return isZhUi.value ? `${y}年${m}月` : ym;
    }
  }

  return isZhUi.value ? "自訂時間" : "Custom time";
}

function profileTopCutSummaryLabel(value: TopCutValue) {
  if (value === "all") return isZhUi.value ? "Top Cut：全部" : "Top Cut: All";
  return isZhUi.value ? `Top Cut：前 ${value}` : `Top Cut: Top ${value}`;
}

const leftPanelSummaryText = computed(() => {
  return [
    profileTimeSummaryLabel(leftPanelFilters.time),
    profileTopCutSummaryLabel(leftPanelFilters.topCut),
  ]
    .filter(Boolean)
    .join(" · ");
});

const leftPanelFilters = reactive<ProfileScopeFilters>({
  time: "past7",
  topCut: "all",
});

const rightCardFilters = reactive<ProfileScopeFilters>({
  time: "past7",
  topCut: "all",
});

watch(
  () => activeFilters.value.topCut,
  (value) => {
    leftPanelFilters.topCut = value || "all";
    rightCardFilters.topCut = value || "all";
  },
  { immediate: true },
);

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

function startOfUtcDayMs(ms: number) {
  const date = new Date(ms);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);
}

const currentVersionWindow = computed(() => inferVersionByStartMs(Date.now()));

function normalizeTournamentIndex(raw: TournamentListItem): IndexedTournament | null {
  if (!raw?.id) return null;

  const source = raw as AnyRecord;
  const startMs = parseMs(source.date ?? source.startAt ?? source.start_at ?? source.createdAt);
  if (!Number.isFinite(startMs)) return null;

  const version = inferVersionByStartMs(startMs);

  return {
    ...raw,
    startMs,
    versionCode: version?.code ?? "",
    versionName: version?.name ?? "Unknown",
    versionLabel: version?.label ?? "Unknown",
  };
}

async function loadTournaments() {
  loadingTournaments.value = true;

  try {
    const rows = await fetchJson<TournamentListItem[]>(tournamentsUrl());
    const dedup = new Map<string, IndexedTournament>();

    for (const row of rows ?? []) {
      const normalized = normalizeTournamentIndex(row);
      if (!normalized) continue;
      if (!dedup.has(normalized.id)) {
        dedup.set(normalized.id, normalized);
      }
    }

    internalTournaments.value = Array.from(dedup.values()).sort((a, b) => b.startMs - a.startMs);
  } catch (error) {
    internalTournaments.value = [];
    console.error("[DeckProfile] loadTournaments failed:", error);
  } finally {
    loadingTournaments.value = false;
  }
}

function hasStandings(id: string) {
  return Object.prototype.hasOwnProperty.call(internalStandingsCache, id);
}

function hasPairings(id: string) {
  return Object.prototype.hasOwnProperty.call(internalPairingsCache, id);
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
      ((!hasStandings(id) && !internalStandingsLoading[id]) ||
        (!hasPairings(id) && !internalPairingsLoading[id])),
  );

  if (missing.length === 0) return;

  await runWithConcurrency(missing, 4, async (id) => {
    if (!hasStandings(id) && !internalStandingsLoading[id]) {
      internalStandingsLoading[id] = true;
      try {
        const rows = await fetchJson<AnyRecord[]>(standingsUrl(id));
        internalStandingsCache[id] = Array.isArray(rows) ? rows : [];
      } catch {
        internalStandingsCache[id] = [];
      } finally {
        internalStandingsLoading[id] = false;
      }
    }

    if (!hasPairings(id) && !internalPairingsLoading[id]) {
      internalPairingsLoading[id] = true;
      try {
        const rows = await fetchJson<AnyRecord[]>(pairingsUrl(id));
        internalPairingsCache[id] = Array.isArray(rows) ? rows : [];
      } catch {
        internalPairingsCache[id] = [];
      } finally {
        internalPairingsLoading[id] = false;
      }
    }
  });
}

const internalFilteredTournaments = computed(() => {
  const list = internalTournaments.value;
  const setValue = routeFilters.value.set;

  if (!setValue) {
    return list;
  }

  if (setValue === PRESET_CURRENT_7 || setValue === PRESET_CURRENT_14) {
    const current = currentVersionWindow.value;
    if (!current) return [];

    const days = setValue === PRESET_CURRENT_7 ? 7 : 14;
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

  return list.filter((t) => t.versionCode === setValue);
});

const internalFilteredTournamentIds = computed(() =>
  internalFilteredTournaments.value.map((t) => t.id),
);

watch(
  () => internalFilteredTournamentIds.value.join("|"),
  () => {
    if (hasExternalData.value) return;
    if (internalFilteredTournamentIds.value.length === 0) return;
    void ensureTournamentDataForIds(internalFilteredTournamentIds.value);
  },
  { immediate: true },
);

onMounted(async () => {
  if (!hasExternalData.value) {
    void loadTournaments();
  }

  window.addEventListener("resize", handleDeckProfileResize);

  await nextTick();
  bindDeckGridObserver();
  updateDeckViewportHeight();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleDeckProfileResize);
  deckGridResizeObserver?.disconnect();
});

/* -----------------------------
   基礎 utilities
------------------------------ */

function onCardImageError(key: string) {
  failedCardImages.value = {
    ...failedCardImages.value,
    [key]: true,
  };
}

watch(
  () => resolvedDeckKey.value,
  () => {
    failedCardImages.value = {};
  },
);

function cleanDeckText(value: unknown) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: unknown) {
  return cleanDeckText(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normalizeEntityKey(value: unknown) {
  return cleanDeckText(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[\s_/]+/g, "-")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDeckKey(value: unknown) {
  return normalizeEntityKey(value);
}

function uniqStrings(values: unknown[]) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    const text = cleanDeckText(value);
    if (!text) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    output.push(text);
  }

  return output;
}

function firstText(values: unknown[]) {
  for (const value of values) {
    const text = cleanDeckText(value);
    if (text) return text;
  }
  return "";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const text = cleanDeckText(value).replace(/,/g, "");
    if (!text) return null;
    const num = Number(text);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

function unwrapCollection<T = AnyRecord>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const source = value as AnyRecord;
    for (const key of [
      "rows",
      "items",
      "data",
      "results",
      "list",
      "standings",
      "pairings",
      "matches",
    ]) {
      if (Array.isArray(source[key])) return source[key] as T[];
    }
  }

  return [];
}

function parseDateMs(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 1_000_000_000_000) return value;
    if (value > 1_000_000_000) return value * 1000;
  }

  const text = cleanDeckText(value);
  if (!text) return 0;

  if (/^\d+$/.test(text)) {
    const num = Number(text);
    if (num > 1_000_000_000_000) return num;
    if (num > 1_000_000_000) return num * 1000;
  }

  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const date = new Date(ms);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

function formatPercentValue(value: number | null | undefined) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return "0%";

  if (Math.abs(safe - Math.round(safe)) < 0.05) {
    return `${Math.round(safe)}%`;
  }

  return `${safe.toFixed(1).replace(/\.0$/, "")}%`;
}

function formatPct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return formatPercentValue(value * 100);
}

function formatCopies(value: number | null | undefined) {
  const safe = Number(value ?? 0);
  if (!Number.isFinite(safe)) return "0";
  if (Math.abs(safe - Math.round(safe)) < 0.05) return String(Math.round(safe));
  return safe.toFixed(1).replace(/\.0$/, "");
}

const SEMI_GAUGE_ARC_LENGTH = Math.PI * 50;

function gaugeDasharray(value: number | null | undefined) {
  const fraction = Math.max(0, Math.min(1, Number(value ?? 0)));
  const filled = SEMI_GAUGE_ARC_LENGTH * fraction;
  return `${filled} ${SEMI_GAUGE_ARC_LENGTH}`;
}

function cardInitials(value: unknown) {
  const text = cleanDeckText(value);
  if (!text) return "??";

  const parts = text.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return `${first}${second}`.toUpperCase();
  }

  return text.slice(0, 2).toUpperCase();
}

function qualifiesByTopCut(place: number | null, topCutRaw: unknown) {
  const topCut = toNumber(topCutRaw);
  if (topCut == null || topCut <= 0) return true;
  if (place == null) return false;
  return place <= topCut;
}

function mapNumberRecord(input: Record<string, number>, fn: (value: number) => number) {
  const out: Record<string, number> = {};

  for (const [key, value] of Object.entries(input)) {
    out[key] = fn(value);
  }

  return out;
}

function minmaxScale(input: Record<string, number>) {
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

function compareText(a: unknown, b: unknown) {
  const left = String(a ?? "");
  const right = String(b ?? "");

  return left.localeCompare(
    right,
    activeLocale.value === "en" ? "en" : "zh-Hant",
    {
      sensitivity: "base",
    },
  );
}

/* -----------------------------
   圖片 / sprite / icon
------------------------------ */

function normalizeImageCandidate(value: unknown) {
  const raw = cleanDeckText(value);
  if (!raw) return "";

  if (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:") ||
    raw.startsWith("/") ||
    raw.startsWith("./") ||
    raw.startsWith("../") ||
    /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(raw)
  ) {
    return raw;
  }

  return "";
}

function pushImageValue(value: unknown, output: string[]) {
  if (!value) return;

  if (Array.isArray(value)) {
    for (const item of value) pushImageValue(item, output);
    return;
  }

  if (typeof value === "string") {
    const normalized = normalizeImageCandidate(value);
    if (normalized) output.push(normalized);
    return;
  }

  if (value && typeof value === "object") {
    const record = value as AnyRecord;

    for (const key of [
      "url",
      "src",
      "image",
      "img",
      "thumb",
      "icon",
      "sprite",
      "small",
      "large",
      "art",
    ]) {
      if (record[key]) pushImageValue(record[key], output);
    }
  }
}

function extractSpriteUrls(source: AnyRecord | null | undefined) {
  if (!source || typeof source !== "object") return [];

  const output: string[] = [];

  for (const candidate of [
    source.sprites,
    source.icons,
    source.images,
    source.image,
    source.img,
    source.sprite,
    source.deckImage,
    source.deckImages,
    source.deckSprite,
    source.pokemonImages,
    source.pokemonSprites,
    source.deck?.sprites,
    source.deck?.icons,
    source.deck?.images,
    source.deck?.image,
    source.deck?.img,
    source.deck?.sprite,
    source.deck?.pokemonImages,
    source.deck?.pokemonSprites,
  ]) {
    pushImageValue(candidate, output);
  }

  return uniqStrings(output).slice(0, 3);
}

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
          (item as AnyRecord).src ??
          (item as AnyRecord).url ??
          (item as AnyRecord).path ??
          (item as AnyRecord).name ??
          "";
        return String(hit).trim();
      }

      return String(item).trim();
    })
    .filter(Boolean);

  return [...new Set(mapped)];
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

const deckIconModules = import.meta.glob("../assets/deck-icons/*.{png,webp,jpg,jpeg,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const deckIconUrlMap = new Map<string, string>();

for (const [filePath, url] of Object.entries(deckIconModules)) {
  const fileName = filePath.split("/").pop() ?? "";
  for (const key of rawIconVariants(fileName)) {
    if (!deckIconUrlMap.has(key)) {
      deckIconUrlMap.set(key, url);
    }
  }
}

function resolveDeckSpriteUrlsFromIconKeys(iconKeys: string[]) {
  const urls: string[] = [];

  for (const icon of iconKeys) {
    const direct = normalizeImageCandidate(icon);
    if (direct) {
      urls.push(direct);
      continue;
    }

    for (const key of rawIconVariants(icon)) {
      const hit = deckIconUrlMap.get(key);
      if (hit) urls.push(hit);
    }
  }

  return uniqStrings(urls).slice(0, 3);
}

function extractDeckIconKeys(source: AnyRecord | null | undefined) {
  if (!source || typeof source !== "object") return [];
  const deck = source.deck ?? {};

  const direct = normalizeStringArray(
    deck?.icons ??
      deck?.icon ??
      deck?.pokemon ??
      deck?.pokemons ??
      deck?.iconKeys ??
      source?.deckIconKeys,
  );

  if (direct.length > 0) {
    return direct.slice(0, 2);
  }

  const main =
    deck?.primaryIconKey ??
    deck?.mainIconKey ??
    source?.deckIconKeyMain ??
    source?.primaryIconKey ??
    source?.mainIconKey ??
    deck?.mainPokemon ??
    deck?.main;

  const sub =
    deck?.secondaryIconKey ??
    deck?.subIconKey ??
    source?.deckIconKeySub ??
    source?.secondaryIconKey ??
    source?.subIconKey ??
    deck?.subPokemon ??
    deck?.sub;

  const paired = normalizeStringArray([main, sub]);
  if (paired.length > 0) {
    return paired.slice(0, 2);
  }

  const fromId = parseTwoFromDeckId(
    firstText([
      deck?.id,
      deck?.deckKey,
      deck?.deck_key,
      deck?.archetypeKey,
      deck?.archetype_key,
      source?.deckKey,
      source?.deck_key,
      source?.archetypeKey,
      source?.archetype_key,
    ]),
  );
  if (fromId.length > 0) {
    return fromId.slice(0, 2);
  }

  const fromName = parseTwoFromDeckName(
    firstText([
      deck?.name,
      deck?.archetype,
      deck?.deckName,
      deck?.deck_name,
      source?.archetype,
      source?.archetypeName,
      source?.archetype_name,
      source?.deckName,
      source?.deck_name,
      source?.displayName,
      source?.display_name,
    ]),
  );

  return fromName.slice(0, 2);
}

function buildDerivedDeckKey(source: AnyRecord | null | undefined) {
  if (!source || typeof source !== "object") return "";

  const deck = source.deck ?? {};
  const rawId = firstText([
    deck?.id,
    deck?.key,
    deck?.slug,
    deck?.deckKey,
    deck?.deck_key,
    deck?.archetypeKey,
    deck?.archetype_key,
    source?.deckKey,
    source?.deck_key,
    source?.archetypeKey,
    source?.archetype_key,
  ]);

  const rawName = firstText([
    deck?.name,
    deck?.archetype,
    deck?.deckName,
    deck?.deck_name,
    deck?.displayName,
    deck?.display_name,
    source?.archetype,
    source?.archetypeName,
    source?.archetype_name,
    source?.deckName,
    source?.deck_name,
    source?.deckDisplayName,
    source?.deck_display_name,
    source?.displayName,
    source?.display_name,
  ]);

  const iconKeys = extractDeckIconKeys(source);

  return rawId || slugify(rawName) || slugify(iconKeys.join("-"));
}

function stripDeckSetTokens(value: unknown) {
  const normalized = normalizeDeckKey(value);
  if (!normalized) return "";

  const stripped = normalized
    .split("-")
    .filter(Boolean)
    .filter((token) => !/^[ab]\d+[a-z]?$/.test(token))
    .join("-");

  return stripped || normalized;
}

function defaultDeckLabelFromKey(value: unknown) {
  const normalized = normalizeDeckKey(value);
  if (!normalized) return "";
  return humanizeDeckId(stripDeckSetTokens(normalized) || normalized);
}

function expandDeckCandidateKeys(values: unknown[]) {
  const out = new Set<string>();

  for (const value of values) {
    const normalized = normalizeDeckKey(value);
    if (normalized) out.add(normalized);

    const stripped = stripDeckSetTokens(value);
    if (stripped) out.add(stripped);
  }

  return [...out];
}

/* -----------------------------
   本機卡圖索引
------------------------------ */

const CARD_CODE_RE = /\b((?:[A-Z]\d+[a-z]?|P-[A-Z])-\d+[a-z]?)\b/i;

function normalizeSetCode(value: unknown) {
  const raw = String(value ?? "").trim().replace(/_/g, "-");
  if (!raw) return "";

  const promoMatch = raw.match(/^P-([A-Z])$/i);
  const promoSuffix = promoMatch?.[1];
  if (promoSuffix) {
    return `P-${promoSuffix.toUpperCase()}`;
  }

  const mainMatch = raw.match(/^([A-Z])(\d+)([A-Z]?)$/i);
  const prefix = mainMatch?.[1];
  const number = mainMatch?.[2];
  const suffix = mainMatch?.[3] ?? "";

  if (prefix && number) {
    return `${prefix.toUpperCase()}${number}${suffix.toLowerCase()}`;
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
  const setCode = match?.[1];
  const cardNo = match?.[2];

  if (!setCode || !cardNo) return "";

  return `${normalizeSetCode(setCode)}-${cardNo.toLowerCase()}`;
}

function extractCardCodeFromText(value: unknown) {
  const text = String(value ?? "");
  const match = text.match(CARD_CODE_RE);
  const code = match?.[1];
  return code ? normalizeCardCode(code) : "";
}

function stripCardCodeFromName(value: unknown) {
  return cleanDeckText(
    String(value ?? "").replace(
      /\s*(?:\(((?:[A-Z]\d+[a-z]?|P-[A-Z])-\d+[a-z]?)\)|((?:[A-Z]\d+[a-z]?|P-[A-Z])-\d+[a-z]?))\s*$/i,
      "",
    ),
  );
}

function normalizeCardImageSet(value: unknown) {
  return String(value ?? "").trim().replace(/_/g, "-").toUpperCase();
}

function normalizeCardImageNumber(value: unknown) {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw) return "";
  return /^\d+$/.test(raw) ? raw.padStart(3, "0") : raw;
}

function splitCardCodeParts(value: unknown) {
  const normalized = normalizeCardCode(value);
  const match = normalized.match(/^((?:[A-Z]\d+[a-z]?|P-[A-Z]))-(\d+[a-z]?)$/i);

  return {
    set: normalizeCardImageSet(match?.[1] ?? ""),
    number: normalizeCardImageNumber(match?.[2] ?? ""),
  };
}

function buildTournamentReportCardBase(set: unknown, number: unknown) {
  const setKey = normalizeCardImageSet(set);
  const numberKey = normalizeCardImageNumber(number);

  if (!setKey || !numberKey) {
    return { setKey: "", base: "" };
  }

  return {
    setKey,
    base: `${setKey}_${numberKey}_EN_SM`,
  };
}

const rawCardImageModules = import.meta.glob(
  "../assets/limitless_dump/images/**/*.{png,jpg,jpeg,webp,avif}",
  {
    eager: true,
    import: "default",
  },
) as Record<string, string>;

const tournamentReportCardImageMap = new Map<string, string>();
const localCardImageByCode = new Map<string, string>();
const localCardImageByName = new Map<string, string>();

for (const [filePath, url] of Object.entries(rawCardImageModules)) {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const parts = normalizedPath.split("/");
  const folderForBase = normalizeCardImageSet(parts[parts.length - 2] ?? "");
  const setFolderForCode = normalizeSetCode(parts[parts.length - 2] ?? "");
  const fileName = parts[parts.length - 1] ?? "";
  const stem = fileName.replace(/\.[^.]+$/, "");
  const upperStem = stem.toUpperCase();

  if (upperStem) {
    tournamentReportCardImageMap.set(upperStem, url);

    if (folderForBase) {
      tournamentReportCardImageMap.set(`${folderForBase}/${upperStem}`, url);
    }
  }

  const directCode = normalizeCardCode(stem);
  if (directCode && !localCardImageByCode.has(directCode)) {
    localCardImageByCode.set(directCode, url);
  }

  if (setFolderForCode) {
    const match = upperStem.match(new RegExp(`^${folderForBase}_(\\d+[A-Z]?)_EN_SM$`));
    const numberPart = match?.[1];

    if (numberPart) {
      const codeFromFile = normalizeCardCode(`${setFolderForCode}-${numberPart.toLowerCase()}`);
      if (codeFromFile && !localCardImageByCode.has(codeFromFile)) {
        localCardImageByCode.set(codeFromFile, url);
      }
    }
  }

  const nameKey = slugify(stem);
  if (nameKey && !localCardImageByName.has(nameKey)) {
    localCardImageByName.set(nameKey, url);
  }
}

function resolveTournamentReportStyleCardImage(set: unknown, number: unknown) {
  const { setKey, base } = buildTournamentReportCardBase(set, number);
  if (!setKey || !base) return "";

  return (
    tournamentReportCardImageMap.get(`${setKey}/${base}`) ??
    tournamentReportCardImageMap.get(base) ??
    ""
  );
}

function normalizeMaybeAbsoluteUrl(value: unknown) {
  const raw = cleanDeckText(String(value ?? ""));
  if (!raw) return "";

  if (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:") ||
    raw.startsWith("/")
  ) {
    return raw;
  }

  return "";
}

function pickCardCode(merged: Record<string, any>, rawName: string) {
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
    const direct = normalizeCardCode(candidate);
    if (direct) return direct;

    const embedded = extractCardCodeFromText(candidate);
    if (embedded) return embedded;
  }

  return "";
}

function resolveCardImageUrl(input: {
  set?: unknown;
  number?: unknown;
  code?: unknown;
  name?: unknown;
  fallbackImage?: unknown;
}) {
  const absolute = normalizeMaybeAbsoluteUrl(input.fallbackImage);
  if (absolute) return absolute;

  const bySetNumber = resolveTournamentReportStyleCardImage(input.set, input.number);
  if (bySetNumber) return bySetNumber;

  const normalizedCode = normalizeCardCode(input.code);
  if (normalizedCode) {
    const codeParts = splitCardCodeParts(normalizedCode);
    const byCodeParts = resolveTournamentReportStyleCardImage(codeParts.set, codeParts.number);
    if (byCodeParts) return byCodeParts;

    const byCode = localCardImageByCode.get(normalizedCode);
    if (byCode) return byCode;
  }

  const byName = localCardImageByName.get(slugify(input.name));
  if (byName) return byName;

  return "";
}

/* -----------------------------
   牌組 / 玩家 / 對局解析
------------------------------ */

function extractDeckCandidateTexts(source: AnyRecord | null | undefined) {
  if (!source || typeof source !== "object") return [];

  const deck = source.deck ?? {};
  const metaDeck = source.meta?.deck ?? {};
  const derivedKey = buildDerivedDeckKey(source);

  return uniqStrings([
    derivedKey,

    source.deckKey,
    source.deck_key,
    source.archetypeKey,
    source.archetype_key,
    source.archetype,
    source.archetypeName,
    source.archetype_name,
    source.deckName,
    source.deck_name,
    source.deckDisplayName,
    source.deck_display_name,
    source.displayName,
    source.display_name,
    source.deckTitle,
    source.deck_title,
    source.variant,
    source.nameEn,
    source.name_en,
    source.displayNameEn,
    source.display_name_en,
    source.englishName,
    source.english_name,
    source.enName,
    source.en_name,

    source.meta?.deckName,
    source.meta?.deck_name,
    source.meta?.archetype,
    source.meta?.archetypeName,
    source.meta?.archetype_name,
    source.meta?.displayName,
    source.meta?.display_name,
    source.meta?.name,
    source.meta?.nameEn,
    source.meta?.name_en,

    deck.key,
    deck.slug,
    deck.id,
    deck.deckKey,
    deck.deck_key,
    deck.archetypeKey,
    deck.archetype_key,
    deck.archetype,
    deck.archetypeName,
    deck.archetype_name,
    deck.deckName,
    deck.deck_name,
    deck.deckDisplayName,
    deck.deck_display_name,
    deck.displayName,
    deck.display_name,
    deck.deckTitle,
    deck.deck_title,
    deck.title,
    deck.name,
    deck.nameEn,
    deck.name_en,
    deck.displayNameEn,
    deck.display_name_en,
    deck.englishName,
    deck.english_name,
    deck.enName,
    deck.en_name,

    metaDeck.key,
    metaDeck.slug,
    metaDeck.id,
    metaDeck.deckKey,
    metaDeck.deck_key,
    metaDeck.archetype,
    metaDeck.archetypeName,
    metaDeck.archetype_name,
    metaDeck.deckName,
    metaDeck.deck_name,
    metaDeck.displayName,
    metaDeck.display_name,
    metaDeck.title,
    metaDeck.name,
    metaDeck.nameEn,
    metaDeck.name_en,
    metaDeck.displayNameEn,
    metaDeck.display_name_en,
    metaDeck.englishName,
    metaDeck.english_name,
    metaDeck.enName,
    metaDeck.en_name,

    ...(Array.isArray(source.aliases) ? source.aliases : []),
    ...(Array.isArray(source.deck_aliases) ? source.deck_aliases : []),
    ...(Array.isArray(deck.aliases) ? deck.aliases : []),
    ...(Array.isArray(metaDeck.aliases) ? metaDeck.aliases : []),
  ]);
}

const targetDeckKeySet = computed(() => {
  const deckSource =
    props.deck && typeof props.deck === "object" ? (props.deck as AnyRecord) : null;

  const candidates = uniqStrings([
    resolvedDeckKey.value,
    buildDerivedDeckKey(deckSource),
    ...extractDeckCandidateTexts(deckSource),
  ]);

  return new Set(expandDeckCandidateKeys(candidates).filter(Boolean));
});

function extractDeckIdentityFromRow(row: AnyRecord): DeckIdentity {
  const candidateTexts = extractDeckCandidateTexts(row);
  const candidateKeys = expandDeckCandidateKeys(candidateTexts);
  const iconKeys = extractDeckIconKeys(row);
  const rawDisplayName = firstText([
    row.deckDisplayName,
    row.deck_display_name,
    row.displayName,
    row.display_name,
    row.deckName,
    row.deck_name,
    row.archetypeName,
    row.archetype_name,
    row.archetype,
    row.variant,

    row.deck?.deckDisplayName,
    row.deck?.deck_display_name,
    row.deck?.displayName,
    row.deck?.display_name,
    row.deck?.name,
    row.deck?.deckName,
    row.deck?.deck_name,
    row.deck?.archetypeName,
    row.deck?.archetype_name,
    row.deck?.archetype,
    row.deck?.title,

    row.meta?.deck?.displayName,
    row.meta?.deck?.display_name,
    row.meta?.deck?.name,
    row.meta?.deck?.deckName,
    row.meta?.deck?.deck_name,
    row.meta?.deck?.archetypeName,
    row.meta?.deck?.archetype_name,
    row.meta?.deck?.archetype,
  ]);

  const rawDisplayNameEn = firstText([
    row.displayNameEn,
    row.display_name_en,
    row.englishName,
    row.english_name,
    row.nameEn,
    row.name_en,
    row.enName,
    row.en_name,

    row.deck?.displayNameEn,
    row.deck?.display_name_en,
    row.deck?.englishName,
    row.deck?.english_name,
    row.deck?.nameEn,
    row.deck?.name_en,
    row.deck?.enName,
    row.deck?.en_name,

    row.meta?.deck?.displayNameEn,
    row.meta?.deck?.display_name_en,
    row.meta?.deck?.englishName,
    row.meta?.deck?.english_name,
    row.meta?.deck?.nameEn,
    row.meta?.deck?.name_en,
    row.meta?.deck?.enName,
    row.meta?.deck?.en_name,
  ]);

  const zhNameFromIcons = getLocalizedDeckNameFromIconKeys(iconKeys, "zh");
  const enNameFromIcons = getLocalizedDeckNameFromIconKeys(iconKeys, "en");
  const fallbackName = defaultDeckLabelFromKey(buildDerivedDeckKey(row) || candidateKeys[0] || "");

  return {
    key: candidateKeys[0] ?? normalizeDeckKey(buildDerivedDeckKey(row)),
    candidateKeys,
    displayName:
      routeLang.value === "zh"
        ? firstText([zhNameFromIcons, rawDisplayName, fallbackName]) || "Unknown Deck"
        : firstText([rawDisplayNameEn, rawDisplayName, enNameFromIcons, fallbackName]) || "Unknown Deck",
    displayNameEn: firstText([rawDisplayNameEn, enNameFromIcons, rawDisplayName, fallbackName]),
    spriteUrls: uniqStrings([
      ...extractSpriteUrls(row),
      ...resolveDeckSpriteUrlsFromIconKeys(iconKeys),
    ]).slice(0, 3),
    iconKeys,
  };
}

function isTargetDeckIdentity(identity: DeckIdentity) {
  if (!identity.candidateKeys.length || !targetDeckKeySet.value.size) return false;
  return identity.candidateKeys.some((key) => targetDeckKeySet.value.has(key));
}

function extractPlayerName(row: AnyRecord) {
  return firstText([
    typeof row.player === "string" ? row.player : "",
    row.player?.name,
    row.player?.displayName,
    row.player?.username,
    row.name,
    row.playerName,
    row.player_name,
    row.displayName,
    row.user?.name,
    row.user?.displayName,
    row.user?.username,
    row.account?.username,
    row.username,
  ]);
}

function normalizePotentialPlayerSlug(value: unknown) {
  return cleanDeckText(value)
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "");
}

function extractPlayerSlug(row: AnyRecord) {
  const explicit = firstText([
    row.playerSlug,
    row.player_slug,
    row.username,
    row.userName,
    row.player?.username,
    row.user?.username,
    row.account?.username,
    row.profile?.username,
    row.limitless?.username,
  ]);

  if (explicit) return explicit.toLowerCase();
  return normalizePotentialPlayerSlug(extractPlayerName(row));
}

function makePlayerKey(value: unknown) {
  return normalizeEntityKey(value);
}

function getPlace(row: AnyRecord) {
  return (
    toNumber(row.placing) ??
    toNumber(row.place) ??
    toNumber(row.rank) ??
    toNumber(row.position) ??
    toNumber(row.standing) ??
    null
  );
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

const resolvedStandingsByTournament = computed<Record<string, AnyRecord[]>>(() => ({
  ...internalStandingsCache,
  ...props.standingsByTournament,
}));

const resolvedPairingsByTournament = computed<Record<string, AnyRecord[]>>(() => ({
  ...internalPairingsCache,
  ...props.pairingsByTournament,
}));

function normalizeTournament(raw: AnyRecord): NormalizedTournament {
  const id =
    firstText([
      raw.id,
      raw.tournamentId,
      raw.tournament_id,
      raw.slug,
      raw.uid,
      raw.key,
      raw.name,
    ]) || crypto.randomUUID();

  const standingsFromResolved = unwrapCollection<AnyRecord>(resolvedStandingsByTournament.value[id]);
  const pairingsFromResolved = unwrapCollection<AnyRecord>(resolvedPairingsByTournament.value[id]);

  const resolvedStandings =
    standingsFromResolved.length > 0
      ? standingsFromResolved
      : unwrapCollection<AnyRecord>(
          raw.standings ??
            raw.standingRows ??
            raw.standingsRows ??
            raw.results ??
            raw.meta?.standings,
        );

  const resolvedPairings =
    pairingsFromResolved.length > 0
      ? pairingsFromResolved
      : unwrapCollection<AnyRecord>(
          raw.pairings ??
            raw.matches ??
            raw.rounds ??
            raw.games ??
            raw.meta?.pairings ??
            raw.meta?.matches,
        );

  const playerCount =
    toNumber(raw.players) ??
    toNumber(raw.playerCount) ??
    toNumber(raw.player_count) ??
    toNumber(raw.meta?.players) ??
    (Array.isArray(raw.players) ? raw.players.length : null);

  return {
    id,
    name: firstText([raw.name, raw.title, raw.tournamentName, raw.slug, id]) || id,
    startMs: parseDateMs(
      raw.startMs ??
        raw.startAt ??
        raw.start_at ??
        raw.date ??
        raw.dateMs ??
        raw.timestamp ??
        raw.createdAt,
    ),
    players: playerCount,
    standings: resolvedStandings,
    pairings: resolvedPairings,
  };
}

const sourceTournaments = computed(() => {
  if (hasExternalData.value) {
    if (props.filteredTournaments.length > 0 || Object.keys(props.filters).length > 0) {
      return props.filteredTournaments;
    }
    return props.tournaments;
  }

  return internalFilteredTournaments.value;
});

const normalizedTournaments = computed(() => {
  return sourceTournaments.value.map((item) => normalizeTournament(item as AnyRecord));
});

const tierRows = computed<TierRow[]>(() => {
  const deckMap = new Map<
    string,
    {
      key: string;
      rawName: string;
      iconKeys: string[];
      allSamples: number;
      baselineTop32Samples: number;
      weightedPoints: number;
    }
  >();

  let totalAllSamples = 0;
  let totalBaselineTop32Samples = 0;

  for (const tournament of normalizedTournaments.value) {
    for (const row of tournament.standings) {
      const identity = extractDeckIdentityFromRow(row);
      const deckKey = identity.key || identity.candidateKeys[0] || buildDerivedDeckKey(row);

      if (!deckKey) continue;

      const place = getPlace(row);
      let hit = deckMap.get(deckKey);

      if (!hit) {
        hit = {
          key: deckKey,
          rawName:
            identity.displayNameEn ||
            identity.displayName ||
            defaultDeckLabelFromKey(deckKey),
          iconKeys: [...identity.iconKeys],
          allSamples: 0,
          baselineTop32Samples: 0,
          weightedPoints: 0,
        };
        deckMap.set(deckKey, hit);
      } else {
        const betterName =
          identity.displayNameEn ||
          identity.displayName ||
          defaultDeckLabelFromKey(deckKey);

        if (betterName && (!hit.rawName || betterName.length > hit.rawName.length)) {
          hit.rawName = betterName;
        }

        if (identity.iconKeys.length > hit.iconKeys.length) {
          hit.iconKeys = [...identity.iconKeys];
        }
      }

      hit.allSamples += 1;
      totalAllSamples += 1;

      if (place != null && place <= 32) {
        hit.baselineTop32Samples += 1;
        totalBaselineTop32Samples += 1;
        hit.weightedPoints += pointsForPlace(place);
      }
    }
  }

  if (!deckMap.size) {
    return [];
  }

  const data1: Record<string, number> = {};
  const data2: Record<string, number> = {};
  const data3: Record<string, number> = {};

  for (const item of deckMap.values()) {
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

  return Array.from(deckMap.values())
    .map((item) => {
      const top32SharePct = data3[item.key] ?? 0;
      const score =
        0.4 * (std1[item.key] ?? 0) +
        0.5 * (std2[item.key] ?? 0) +
        0.1 * (std3[item.key] ?? 0);

      return {
        deck: item.key,
        tier: "F",
        score,
        usage: totalAllSamples > 0 ? item.allSamples / totalAllSamples : 0,
        total_samples: item.allSamples,
        baselineTop32Samples: item.baselineTop32Samples,
        weightedPoints: item.weightedPoints,
        top32SharePct,
      } satisfies TierRow;
    })
    .sort((a, b) => {
      return (
        b.score - a.score ||
        (b.weightedPoints ?? 0) - (a.weightedPoints ?? 0) ||
        (b.baselineTop32Samples ?? 0) - (a.baselineTop32Samples ?? 0) ||
        b.total_samples - a.total_samples ||
        a.deck.localeCompare(b.deck)
      );
    })
    .map((row, index, arr) => {
      const hasAnotherDeckScoreAtLeast09 = arr.some(
        (other, otherIndex) => otherIndex !== index && other.score >= 0.9,
      );

      return {
        ...row,
        tier: tierLabel(
          row.score,
          row.top32SharePct ?? 0,
          hasAnotherDeckScoreAtLeast09,
        ),
      };
    });
});

const monthOptions = computed(() => {
  const seen = new Set<string>();
  const options: Array<{ value: string; label: string }> = [];

  for (const t of normalizedTournaments.value) {
    if (!t.startMs || !Number.isFinite(t.startMs)) continue;

    const d = new Date(t.startMs);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const key = `${y}-${String(m).padStart(2, "0")}`;

    if (seen.has(key)) continue;
    seen.add(key);

    options.push({
      value: `month:${key}`,
      label: isZhUi.value ? `${y}年${m}月` : key,
    });
  }

  options.sort((a, b) => (a.value < b.value ? 1 : -1));
  return options;
});

function inProfileTimeRange(t: NormalizedTournament, timeValue: string) {
  if (timeValue === "all") return true;
  if (!t.startMs || !Number.isFinite(t.startMs)) return false;

  const todayUtcStart = startOfUtcDayMs(Date.now());

  if (timeValue === "past7") {
    return t.startMs >= todayUtcStart - 6 * DAY_MS;
  }

  if (timeValue === "prev7") {
    return t.startMs >= todayUtcStart - 13 * DAY_MS && t.startMs < todayUtcStart - 6 * DAY_MS;
  }

  if (timeValue === "past4w") {
    return t.startMs >= todayUtcStart - 27 * DAY_MS;
  }

  if (timeValue.startsWith("month:")) {
    const ym = timeValue.slice("month:".length);
    const [yS, mS] = ym.split("-");
    const y = Number(yS);
    const m = Number(mS);

    if (!y || !m) return true;

    const start = Date.UTC(y, m - 1, 1, 0, 0, 0, 0);
    const end = Date.UTC(y, m, 1, 0, 0, 0, 0);

    return t.startMs >= start && t.startMs < end;
  }

  return true;
}

function filterTournamentsByTime(list: NormalizedTournament[], timeValue: string) {
  return list.filter((t) => inProfileTimeRange(t, timeValue));
}

const leftPanelTournaments = computed(() =>
  filterTournamentsByTime(normalizedTournaments.value, leftPanelFilters.time),
);

const rightCardTournaments = computed(() =>
  filterTournamentsByTime(normalizedTournaments.value, rightCardFilters.time),
);

const loadedTournamentCount = computed(() => {
  if (hasExternalData.value) {
    if (props.loadedFilteredTournamentCount > 0) return props.loadedFilteredTournamentCount;
    return sourceTournaments.value.length;
  }

  return internalFilteredTournaments.value.filter(
    (t) => hasStandings(t.id) && hasPairings(t.id),
  ).length;
});

const profileLoading = computed(() => {
  if (hasExternalData.value) return false;
  if (loadingTournaments.value) return true;

  const ids = internalFilteredTournamentIds.value;
  if (ids.length === 0) return false;

  if (
    leftAnalytics.value.targetStandingRows > 0 ||
    rightAnalytics.value.cardsFlat.length > 0 ||
    rightAnalytics.value.totalSeenDeckRows > 0
  ) {
    return false;
  }

  return loadedTournamentCount.value < ids.length;
});

watch(
  () => deckCardsGridRef.value,
  async () => {
    await nextTick();
    bindDeckGridObserver();
    updateDeckViewportHeight();
  },
);

/* -----------------------------
   對局 result 解析
------------------------------ */

function extractPairingSideSource(row: AnyRecord, side: 1 | 2): any {
  const index = side === 1 ? 0 : 1;

  return (
    row.players?.[index] ??
    row.pairing?.players?.[index] ??
    row[side === 1 ? "p1" : "p2"] ??
    row[side === 1 ? "player1" : "player2"] ??
    row[side === 1 ? "left" : "right"] ??
    row[side === 1 ? "home" : "away"] ??
    null
  );
}

function extractNameFromParticipant(value: any) {
  if (typeof value === "string") return cleanDeckText(value);
  if (!value || typeof value !== "object") return "";

  return firstText([
    value.name,
    value.player,
    value.displayName,
    value.username,
    value.user?.name,
    value.user?.username,
  ]);
}

function extractSlugFromParticipant(value: any) {
  if (!value || typeof value !== "object") return "";

  return firstText([value.slug, value.username, value.user?.username, value.id]).toLowerCase();
}

function registerStandingKeys(
  map: Map<string, { row: AnyRecord; player: string; place: number | null; identity: DeckIdentity }>,
  row: AnyRecord,
  identity: DeckIdentity,
  place: number | null,
) {
  const player = extractPlayerName(row);
  const entry = { row, player, place, identity };

  const keys = uniqStrings([
    player,
    extractPlayerSlug(row),
    row.id,
    row.playerId,
    row.player_id,
    row.user?.id,
    row.player?.id,
  ])
    .map((item) => makePlayerKey(item))
    .filter(Boolean);

  for (const key of keys) {
    map.set(key, entry);
  }
}

function lookupStandingForSide(
  map: Map<string, { row: AnyRecord; player: string; place: number | null; identity: DeckIdentity }>,
  row: AnyRecord,
  side: 1 | 2,
) {
  const source = extractPairingSideSource(row, side);

  const keys = uniqStrings([
    extractNameFromParticipant(source),
    extractSlugFromParticipant(source),
    source?.id,
    row[side === 1 ? "player1Id" : "player2Id"],
    row[side === 1 ? "player_1_id" : "player_2_id"],
    row[side === 1 ? "p1Id" : "p2Id"],
  ])
    .map((item) => makePlayerKey(item))
    .filter(Boolean);

  for (const key of keys) {
    const hit = map.get(key);
    if (hit) return hit;
  }

  return null;
}

function compareNumericResult(a: number, b: number) {
  if (a === b) return { p1: 0.5, p2: 0.5 };
  return a > b ? { p1: 1, p2: 0 } : { p1: 0, p2: 1 };
}

function parseOutcomeToken(value: unknown) {
  const text = cleanDeckText(value).toLowerCase();
  if (!text) return null;
  if (["w", "win", "won"].includes(text)) return 1;
  if (["l", "loss", "lose", "lost"].includes(text)) return 0;
  if (["d", "draw", "tie"].includes(text)) return 0.5;
  return null;
}

function parsePairingResult(row: AnyRecord, p1Name = "", p2Name = "") {
  const drawFlag = [
    row.draw,
    row.isDraw,
    row.tie,
    row.result?.draw,
    row.result?.tie,
  ].some((value) => value === true || cleanDeckText(value).toLowerCase() === "draw");

  if (drawFlag) return { p1: 0.5, p2: 0.5 };

  const winnerRaw = row.winner;
  if (winnerRaw === -1 || winnerRaw === "-1") {
    return null;
  }
  if (winnerRaw === 0 || winnerRaw === "0") {
    return { p1: 0.5, p2: 0.5 };
  }

  const numericPairs: Array<[unknown, unknown]> = [
    [row.p1Points, row.p2Points],
    [row.player1Points, row.player2Points],
    [row.leftPoints, row.rightPoints],
    [row.homeScore, row.awayScore],
    [row.result?.p1, row.result?.p2],
    [row.result?.left, row.result?.right],
    [row.score?.p1, row.score?.p2],
    [row.score?.left, row.score?.right],
    [row.wins1, row.wins2],
    [row.player1Wins, row.player2Wins],
  ];

  for (const [aRaw, bRaw] of numericPairs) {
    const a = toNumber(aRaw);
    const b = toNumber(bRaw);
    if (a != null && b != null) {
      return compareNumericResult(a, b);
    }
  }

  const tokenPairs: Array<[unknown, unknown]> = [
    [row.p1Result, row.p2Result],
    [row.player1Result, row.player2Result],
    [row.leftResult, row.rightResult],
  ];

  for (const [aRaw, bRaw] of tokenPairs) {
    const a = parseOutcomeToken(aRaw);
    const b = parseOutcomeToken(bRaw);

    if (a != null && b != null) {
      return { p1: a, p2: b };
    }
  }

  const winnerCandidates = [
    row.winner,
    row.winnerName,
    row.result?.winner,
    row.result?.winnerName,
    row.winnerPlayer,
  ];

  for (const candidate of winnerCandidates) {
    const text = cleanDeckText(candidate);
    if (!text) continue;

    if (/draw|tie/i.test(text)) return { p1: 0.5, p2: 0.5 };
    if (/^(1|p1|player1|left|home)$/i.test(text)) return { p1: 1, p2: 0 };
    if (/^(2|p2|player2|right|away)$/i.test(text)) return { p1: 0, p2: 1 };

    const key = makePlayerKey(text);
    if (p1Name && key === makePlayerKey(p1Name)) return { p1: 1, p2: 0 };
    if (p2Name && key === makePlayerKey(p2Name)) return { p1: 0, p2: 1 };
  }

  const textCandidates = [
    row.score,
    row.result,
    row.record,
    row.outcome,
    row.matchResult,
    row.tableResult,
  ];

  for (const raw of textCandidates) {
    if (typeof raw !== "string") continue;
    const text = cleanDeckText(raw);
    if (!text) continue;

    if (/draw|tie/i.test(text)) return { p1: 0.5, p2: 0.5 };

    const outcome = parseOutcomeToken(text);
    if (outcome != null) {
      if (outcome === 1) return { p1: 1, p2: 0 };
      if (outcome === 0) return { p1: 0, p2: 1 };
      return { p1: 0.5, p2: 0.5 };
    }

    const match = text.match(/(\d+)\s*[-:]\s*(\d+)(?:\s*[-:]\s*(\d+))?/);
    if (match) {
      return compareNumericResult(Number(match[1]), Number(match[2]));
    }

    if (/player\s*1/i.test(text) && /win/i.test(text)) return { p1: 1, p2: 0 };
    if (/player\s*2/i.test(text) && /win/i.test(text)) return { p1: 0, p2: 1 };
  }

  return null;
}

/* -----------------------------
   Decklist 解析
------------------------------ */

function normalizeCardCategory(value: unknown) {
  const text = cleanDeckText(value).toLowerCase();

  if (text.includes("pokemon")) return "Pokemon";
  if (text.includes("trainer")) return "Trainer";
  if (text.includes("energy")) return "Energy";
  if (text.includes("supporter")) return "Trainer";
  if (text.includes("item")) return "Trainer";
  if (text.includes("stadium")) return "Trainer";

  return "Other";
}

function looksLikeCardEntry(value: AnyRecord) {
  const hasName = Boolean(
    cleanDeckText(value.name ?? value.cardName ?? value.title ?? value.label ?? ""),
  );

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

      const countText = match?.[1];
      const rawText = match?.[2];

      if (!countText || !rawText) return null;

      const count = Number(countText);
      const code = extractCardCodeFromText(rawText);
      const codeParts = splitCardCodeParts(code);
      const name = stripCardCodeFromName(rawText) || cleanDeckText(rawText);

      if (!name || !Number.isFinite(count) || count <= 0) return null;

      return {
        key:
          code ||
          (codeParts.set && codeParts.number
            ? `${codeParts.set}-${codeParts.number}`
            : slugify(name)),
        code,
        set: codeParts.set,
        number: codeParts.number,
        name,
        count,
        image: resolveCardImageUrl({
          set: codeParts.set,
          number: codeParts.number,
          code,
          name,
          fallbackImage: "",
        }),
        category: normalizeCardCategory(categoryHint),
      };
    })
    .filter((item): item is NormalizedDeckCard => item !== null);
}

function normalizeDeckCardsSource(source: unknown, categoryHint = "Other"): NormalizedDeckCard[] {
  if (!source) return [];

  if (typeof source === "string") {
    return parseDecklistText(source, categoryHint);
  }

  if (Array.isArray(source)) {
    return source.flatMap((item) => normalizeDeckCardsSource(item, categoryHint));
  }

  if (typeof source !== "object") return [];

  const merged = source as AnyRecord;

  if (looksLikeCardEntry(merged)) {
    const rawName = cleanDeckText(
      String(merged.name ?? merged.cardName ?? merged.title ?? merged.label ?? ""),
    );
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

    const code = pickCardCode(merged, rawName);
    const codeParts = splitCardCodeParts(code);

    const set = normalizeCardImageSet(
      merged.set ??
        merged.setCode ??
        merged.set_code ??
        merged.cardSet ??
        merged.card_set ??
        codeParts.set,
    );

    const number = normalizeCardImageNumber(
      merged.number ??
        merged.no ??
        merged.cardNumber ??
        merged.card_number ??
        merged.cardNo ??
        merged.card_no ??
        codeParts.number,
    );

    const image = resolveCardImageUrl({
      set,
      number,
      code,
      name,
      fallbackImage:
        merged.image ??
        merged.imageUrl ??
        merged.img ??
        merged.art ??
        merged.thumb ??
        merged.sprite ??
        merged.cardImage ??
        merged.images?.small ??
        merged.images?.large ??
        "",
    });

    if (!name || !Number.isFinite(count) || count <= 0) return [];

    return [
      {
        key:
          code ||
          (set && number
            ? `${set}-${number}`
            : slugify(`${name}-${merged.id ?? merged.cardId ?? name}`)),
        code,
        set,
        number,
        name,
        count,
        image,
        category: normalizeCardCategory(
          String(
            merged.category ??
              merged.section ??
              merged.supertype ??
              merged.type ??
              categoryHint,
          ),
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
  if (groupedParsed.length > 0) return groupedParsed;

  return [];
}

/* -----------------------------
   Limitless decklist URL
------------------------------ */

function normalizeLimitlessDeckUrl(value: string) {
  const raw = cleanDeckText(value);
  if (!raw) return "";

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `https://play.limitlesstcg.com${raw}`;

  return "";
}

function extractListUrl(row: AnyRecord) {
  const candidates = [
    row?.deck?.url,
    row?.deck?.listUrl,
    row?.listUrl,
    row?.list?.url,
    row?.decklistUrl,
    row?.decklist?.url,
  ];

  for (const candidate of candidates) {
    const hit = normalizeLimitlessDeckUrl(String(candidate ?? ""));
    if (hit) return hit;
  }

  return "";
}

function buildLimitlessDecklistUrl(tournamentId: string, row: AnyRecord) {
  const explicit = extractListUrl(row);
  if (explicit) return explicit;

  const playerSlug = extractPlayerSlug(row);
  if (!tournamentId || !playerSlug) return "";

  return `https://play.limitlesstcg.com/tournament/${encodeURIComponent(
    tournamentId,
  )}/player/${encodeURIComponent(playerSlug)}/decklist`;
}

function buildFinishRow(tournament: NormalizedTournament, row: AnyRecord): FinishRow | null {
  const player = extractPlayerName(row);
  const place = getPlace(row);
  if (!player || place == null) return null;

  const players =
    tournament.players != null && Number.isFinite(tournament.players) && tournament.players > 0
      ? tournament.players
      : null;

  return {
    key: `${tournament.id}::${player}`,
    player,
    tournamentName: cleanDeckText(String(tournament.name ?? tournament.id)) || tournament.id,
    dateMs: tournament.startMs,
    dateLabel: formatDate(tournament.startMs),
    place,
    players,
    placeLabel: players ? `${place} / ${players}` : String(place),
    listUrl: buildLimitlessDecklistUrl(tournament.id, row),
  };
}

function buildSampleDeckEntry(
  tournament: NormalizedTournament,
  row: AnyRecord,
  cards: NormalizedDeckCard[],
): SampleDeckEntry | null {
  const player = extractPlayerName(row);
  const place = getPlace(row);
  if (!player || place == null || cards.length === 0) return null;

  const players =
    tournament.players != null && Number.isFinite(tournament.players) && tournament.players > 0
      ? tournament.players
      : null;

  return {
    tournamentId: tournament.id,
    tournamentName: cleanDeckText(String(tournament.name ?? tournament.id)) || tournament.id,
    player,
    dateMs: tournament.startMs,
    dateLabel: formatDate(tournament.startMs),
    place,
    players,
    placeLabel: players ? `${place} / ${players}` : String(place),
    listUrl: buildLimitlessDecklistUrl(tournament.id, row),
    cards,
  };
}

function compareSampleDeckEntries(a: SampleDeckEntry, b: SampleDeckEntry) {
  return (
    a.place - b.place ||
    (b.players ?? 0) - (a.players ?? 0) ||
    b.dateMs - a.dateMs ||
    compareText(a.player, b.player)
  );
}

function formatRecord(wins: number, losses: number, draws: number) {
  return `${wins}-${losses}-${draws}`;
}

/* -----------------------------
   核心 analytics
------------------------------ */

function buildDeckProfileAnalytics(
  tournaments: NormalizedTournament[],
  topCut: TopCutValue,
): DeckProfileAnalytics {
  const cardMap = new Map<string, CardAggregate>();
  const matchupMap = new Map<string, MatchupAggregate>();
  const finishMap = new Map<string, FinishRow>();
  const visualsByDeckKey = new Map<
    string,
    { displayName: string; displayNameEn: string; spriteUrls: string[]; iconKeys: string[] }
  >();
  let sampleDeck: SampleDeckEntry | null = null;

  let totalStandingRows = 0;
  let targetStandingRows = 0;
  let totalSeenDeckRows = 0;

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let targetGames = 0;
  let targetPoints = 0;

  const top4Counts: Record<1 | 2 | 3 | 4, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };

  function rememberDeckVisual(identity: DeckIdentity) {
    const visual = {
      displayName: identity.displayName,
      displayNameEn: identity.displayNameEn,
      spriteUrls: identity.spriteUrls,
      iconKeys: identity.iconKeys,
    };

    for (const key of identity.candidateKeys) {
      if (!key) continue;

      const prev = visualsByDeckKey.get(key);

      if (!prev) {
        visualsByDeckKey.set(key, visual);
        continue;
      }

      visualsByDeckKey.set(key, {
        displayName:
          visual.displayName.length > prev.displayName.length
            ? visual.displayName
            : prev.displayName,
        displayNameEn:
          visual.displayNameEn.length > prev.displayNameEn.length
            ? visual.displayNameEn
            : prev.displayNameEn,
        spriteUrls:
          prev.spriteUrls.length >= visual.spriteUrls.length ? prev.spriteUrls : visual.spriteUrls,
        iconKeys: prev.iconKeys.length >= visual.iconKeys.length ? prev.iconKeys : visual.iconKeys,
      });
    }
  }

  for (const tournament of tournaments) {
    const standings = tournament.standings;
    const pairings = tournament.pairings;

    const standingMap = new Map<
      string,
      { row: AnyRecord; player: string; place: number | null; identity: DeckIdentity }
    >();

    for (const row of standings) {
      const place = getPlace(row);
      const identity = extractDeckIdentityFromRow(row);
      const player = extractPlayerName(row);

      if (player) {
        registerStandingKeys(standingMap, row, identity, place);
      }

      if (identity.candidateKeys.length > 0) {
        rememberDeckVisual(identity);
      }

      if (!qualifiesByTopCut(place, topCut)) continue;

      totalStandingRows += 1;

      if (!isTargetDeckIdentity(identity)) continue;

      targetStandingRows += 1;

      if (place === 1 || place === 2 || place === 3 || place === 4) {
        top4Counts[place] += 1;
      }

      const finish = buildFinishRow(tournament, row);
      if (finish) {
        const prev = finishMap.get(finish.key);
        if (!prev || !prev.listUrl) {
          finishMap.set(finish.key, finish);
        }
      }

      const cards = extractDeckCardsFromRow(row);
      if (cards.length > 0) {
        const sampleCandidate = buildSampleDeckEntry(tournament, row, cards);
        if (
          sampleCandidate &&
          (!sampleDeck || compareSampleDeckEntries(sampleCandidate, sampleDeck) < 0)
        ) {
          sampleDeck = sampleCandidate;
        }

        totalSeenDeckRows += 1;

        const seenInThisDeck = new Set<string>();

        for (const card of cards) {
          const key = card.key || card.code || slugify(card.name);
          const existing: CardAggregate = cardMap.get(key) ?? {
            key,
            code: card.code,
            set: card.set,
            number: card.number,
            name: card.name,
            image: card.image,
            category: card.category,
            totalCopies: 0,
            deckCount: 0,
            slotRatePct: 0,
            inclusionPct: 0,
            avgCopies: 0,
          };

          existing.totalCopies += card.count;

          if (!existing.set && card.set) existing.set = card.set;
          if (!existing.number && card.number) existing.number = card.number;
          if (!existing.image) {
            existing.image = resolveCardImageUrl({
              set: card.set || existing.set,
              number: card.number || existing.number,
              code: card.code || existing.code,
              name: card.name || existing.name,
              fallbackImage: card.image || existing.image,
            });
          }
          if (!existing.code && card.code) existing.code = card.code;
          if (!existing.name && card.name) existing.name = card.name;

          if (!seenInThisDeck.has(key)) {
            existing.deckCount += 1;
            seenInThisDeck.add(key);
          }

          cardMap.set(key, existing);
        }
      }
    }

    for (const row of pairings) {
      const side1 = lookupStandingForSide(standingMap, row, 1);
      const side2 = lookupStandingForSide(standingMap, row, 2);

      if (!side1 || !side2) continue;

      const result = parsePairingResult(row, side1.player, side2.player);
      if (!result) continue;

      const deck1 = side1.identity;
      const deck2 = side2.identity;

      const side1IsTarget = isTargetDeckIdentity(deck1);
      const side2IsTarget = isTargetDeckIdentity(deck2);

      if (side1IsTarget && !side2IsTarget && qualifiesByTopCut(side1.place, topCut)) {
        targetGames += 1;
        targetPoints += result.p1;

        if (result.p1 === 1) wins += 1;
        else if (result.p1 === 0.5) draws += 1;
        else losses += 1;

        const oppKey = deck2.key || deck2.candidateKeys[0];
        if (oppKey) {
          const existing = matchupMap.get(oppKey) ?? {
            key: oppKey,
            displayName: deck2.displayName,
            spriteUrls: deck2.spriteUrls,
            wins: 0,
            losses: 0,
            draws: 0,
            games: 0,
            winRate: 0,
          };

          existing.games += 1;

          if (result.p1 === 1) existing.wins += 1;
          else if (result.p1 === 0.5) existing.draws += 1;
          else existing.losses += 1;

          if (!existing.spriteUrls.length && deck2.spriteUrls.length) {
            existing.spriteUrls = deck2.spriteUrls;
          }

          if (!existing.displayName && deck2.displayName) {
            existing.displayName = deck2.displayName;
          }

          matchupMap.set(oppKey, existing);
        }
      }

      if (side2IsTarget && !side1IsTarget && qualifiesByTopCut(side2.place, topCut)) {
        targetGames += 1;
        targetPoints += result.p2;

        if (result.p2 === 1) wins += 1;
        else if (result.p2 === 0.5) draws += 1;
        else losses += 1;

        const oppKey = deck1.key || deck1.candidateKeys[0];
        if (oppKey) {
          const existing = matchupMap.get(oppKey) ?? {
            key: oppKey,
            displayName: deck1.displayName,
            spriteUrls: deck1.spriteUrls,
            wins: 0,
            losses: 0,
            draws: 0,
            games: 0,
            winRate: 0,
          };

          existing.games += 1;

          if (result.p2 === 1) existing.wins += 1;
          else if (result.p2 === 0.5) existing.draws += 1;
          else existing.losses += 1;

          if (!existing.spriteUrls.length && deck1.spriteUrls.length) {
            existing.spriteUrls = deck1.spriteUrls;
          }

          if (!existing.displayName && deck1.displayName) {
            existing.displayName = deck1.displayName;
          }

          matchupMap.set(oppKey, existing);
        }
      }
    }
  }

  const cardsFlat: CardAggregate[] = [...cardMap.values()]
    .map((item) => {
      const slotRatePct = totalSeenDeckRows > 0 ? (item.totalCopies / totalSeenDeckRows) * 100 : 0;
      const inclusionPct = totalSeenDeckRows > 0 ? (item.deckCount / totalSeenDeckRows) * 100 : 0;
      const avgCopies = item.deckCount > 0 ? item.totalCopies / item.deckCount : 0;

      return {
        ...item,
        image:
          item.image ||
          resolveCardImageUrl({
            set: item.set,
            number: item.number,
            code: item.code,
            name: item.name,
            fallbackImage: item.image,
          }),
        slotRatePct,
        inclusionPct,
        avgCopies,
      };
    })
    .filter((item) => item.slotRatePct >= MIN_SLOT_RATE_PCT)
    .sort((a, b) => {
      return (
        b.slotRatePct - a.slotRatePct ||
        b.inclusionPct - a.inclusionPct ||
        compareText(a.name, b.name)
      );
    });

  const cardGroups: CardGroup[] = [
    {
      key: "pokemon",
      label: "POKÉMON",
      cards: cardsFlat.filter((item) => item.category === "Pokemon"),
    },
    {
      key: "trainer",
      label: "TRAINER",
      cards: cardsFlat.filter((item) => item.category === "Trainer"),
    },
    {
      key: "energy",
      label: "ENERGY",
      cards: cardsFlat.filter((item) => item.category === "Energy"),
    },
    {
      key: "other",
      label: routeLang.value === "zh" ? "其他" : "OTHER",
      cards: cardsFlat.filter(
        (item) => !["Pokemon", "Trainer", "Energy"].includes(item.category),
      ),
    },
  ].filter((group) => group.cards.length > 0);

  const matchupRows: MatchupAggregate[] = [...matchupMap.values()]
    .map((item) => {
      const winRate = item.games > 0 ? (item.wins + item.draws * 0.5) / item.games : 0;

      return {
        ...item,
        displayName: item.displayName || item.key,
        winRate,
      };
    })
    .sort((a, b) => b.games - a.games || compareText(a.displayName, b.displayName));

  const top15MostPlayed = [...matchupRows]
    .sort((a, b) => b.games - a.games || compareText(a.displayName, b.displayName))
    .slice(0, 15);

  const featuredGoodMatchups = [...top15MostPlayed]
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games)
    .slice(0, 3);

  const featuredBadMatchups = [...top15MostPlayed]
    .sort((a, b) => a.winRate - b.winRate || b.games - a.games)
    .slice(0, 3);

  const bestFinishes = [...finishMap.values()]
    .sort((a, b) => {
      return (
        a.place - b.place ||
        (b.players ?? 0) - (a.players ?? 0) ||
        b.dateMs - a.dateMs ||
        compareText(a.player, b.player)
      );
    })
    .slice(0, 50);

  const explicitDeckSprites = extractSpriteUrls(props.deck ?? {});
  let finalTargetSprites = explicitDeckSprites;
  let finalTargetIconKeys = extractDeckIconKeys(
    props.deck && typeof props.deck === "object" ? (props.deck as AnyRecord) : null,
  );

  let resolvedDeckDisplayName = "";
  let resolvedDeckDisplayNameEn = "";

  for (const key of targetDeckKeySet.value) {
    const visual = visualsByDeckKey.get(key);
    if (!visual) continue;

    if (!resolvedDeckDisplayName && visual.displayName) {
      resolvedDeckDisplayName = visual.displayName;
    }

    if (!resolvedDeckDisplayNameEn && visual.displayNameEn) {
      resolvedDeckDisplayNameEn = visual.displayNameEn;
    }

    if (!finalTargetSprites.length && visual.spriteUrls.length) {
      finalTargetSprites = visual.spriteUrls;
    }

    if (!finalTargetIconKeys.length && visual.iconKeys.length) {
      finalTargetIconKeys = visual.iconKeys;
    }
  }

  if (!finalTargetSprites.length && finalTargetIconKeys.length) {
    finalTargetSprites = resolveDeckSpriteUrlsFromIconKeys(finalTargetIconKeys);
  }

  if (!resolvedDeckDisplayName) {
    resolvedDeckDisplayName =
      (routeLang.value === "zh"
        ? getLocalizedDeckNameFromIconKeys(finalTargetIconKeys, "zh")
        : getLocalizedDeckNameFromIconKeys(finalTargetIconKeys, "en")) ||
      defaultDeckLabelFromKey(resolvedDeckKey.value) ||
      "Unknown Deck";
  }

  if (!resolvedDeckDisplayNameEn) {
    resolvedDeckDisplayNameEn =
      getLocalizedDeckNameFromIconKeys(finalTargetIconKeys, "en") || "";
  }

  return {
    totalStandingRows,
    targetStandingRows,
    totalSeenDeckRows,
    top4Counts,
    metaShare: totalStandingRows > 0 ? targetStandingRows / totalStandingRows : 0,
    winRate: targetGames > 0 ? targetPoints / targetGames : null,
    wins,
    losses,
    draws,
    matchCount: wins + losses + draws,
    cardsFlat,
    cardGroups,
    featuredGoodMatchups,
    featuredBadMatchups,
    bestFinishes,
    sampleDeck,
    targetSpriteUrls: finalTargetSprites.slice(0, 3),
    resolvedDeckDisplayName,
    resolvedDeckDisplayNameEn,
  };
}

const leftAnalytics = computed(() =>
  buildDeckProfileAnalytics(leftPanelTournaments.value, leftPanelFilters.topCut),
);

const rightAnalytics = computed(() =>
  buildDeckProfileAnalytics(rightCardTournaments.value, rightCardFilters.topCut),
);

const rightDeckPanelCards = computed<RightDeckPanelCard[]>(() => {
  if (rightDeckMode.value === "sample") {
    const sample = rightAnalytics.value.sampleDeck;
    if (!sample) return [];

    return sample.cards.map((card, index) => ({
      key: `${card.key}-${index}`,
      code: card.code,
      set: card.set,
      number: card.number,
      name: card.name,
      image: card.image,
      slotRatePct: card.count,
      badgeText: `x${card.count}`,
      title: `${card.name} x${card.count}`,
    }));
  }

  return rightAnalytics.value.cardsFlat.map((card) => ({
    key: card.key,
    code: card.code,
    set: card.set,
    number: card.number,
    name: card.name,
    image: card.image,
    slotRatePct: card.slotRatePct,
    badgeText: formatPercentValue(card.slotRatePct),
    title: `${card.name} | Slot ${formatPercentValue(card.slotRatePct)} | Include ${formatPercentValue(card.inclusionPct)}`,
  }));
});

const rightDeckPanelSubtitle = computed(() => {
  if (rightDeckMode.value === "sample") {
    if (!rightAnalytics.value.sampleDeck) {
      return "Best-performing filtered sample deck";
    }

    const sample = rightAnalytics.value.sampleDeck;
    return `${sample.player} | ${sample.placeLabel}`;
  }

  return "Card inclusion rates for the filtered deck pool";
});

const rightDeckPanelEmptyText = computed(() => {
  if (rightDeckMode.value === "sample") {
    return "No sample deck is available for the current filters.";
  }

  return "No cards meet the current display threshold.";
});

watch(
  () => rightDeckPanelCards.value.length,
  async () => {
    await nextTick();
    bindDeckGridObserver();
    updateDeckViewportHeight();
  },
  { immediate: true },
);

watch(
  () => rightDeckMode.value,
  async () => {
    await nextTick();
    updateDeckViewportHeight();
  },
);

const displayDeckName = computed(() => {
  const deck = props.deck && typeof props.deck === "object" ? (props.deck as AnyRecord) : {};
  const nestedDeck = deck.deck ?? {};
  const metaDeck = deck.meta?.deck ?? {};

  return (
    firstText([
      deck.displayName,
      deck.display_name,
      deck.name,
      deck.deckName,
      deck.deck_name,
      deck.title,
      deck.deckTitle,
      deck.deck_title,
      deck.archetypeName,
      deck.archetype_name,
      deck.archetype,

      nestedDeck.displayName,
      nestedDeck.display_name,
      nestedDeck.name,
      nestedDeck.deckName,
      nestedDeck.deck_name,
      nestedDeck.title,
      nestedDeck.deckTitle,
      nestedDeck.deck_title,
      nestedDeck.archetypeName,
      nestedDeck.archetype_name,
      nestedDeck.archetype,

      metaDeck.displayName,
      metaDeck.display_name,
      metaDeck.name,
      metaDeck.deckName,
      metaDeck.deck_name,
      metaDeck.title,
      metaDeck.archetypeName,
      metaDeck.archetype_name,
      metaDeck.archetype,

      leftAnalytics.value.resolvedDeckDisplayName,
      rightAnalytics.value.resolvedDeckDisplayName,
      defaultDeckLabelFromKey(resolvedDeckKey.value),
    ]) || "Unknown Deck"
  );
});

const displayDeckNameEn = computed(() => {
  const deck = props.deck && typeof props.deck === "object" ? (props.deck as AnyRecord) : {};
  const nestedDeck = deck.deck ?? {};
  const metaDeck = deck.meta?.deck ?? {};

  const text = firstText([
    deck.displayNameEn,
    deck.display_name_en,
    deck.englishName,
    deck.english_name,
    deck.nameEn,
    deck.name_en,
    deck.enName,
    deck.en_name,

    nestedDeck.displayNameEn,
    nestedDeck.display_name_en,
    nestedDeck.englishName,
    nestedDeck.english_name,
    nestedDeck.nameEn,
    nestedDeck.name_en,
    nestedDeck.enName,
    nestedDeck.en_name,

    metaDeck.displayNameEn,
    metaDeck.display_name_en,
    metaDeck.englishName,
    metaDeck.english_name,
    metaDeck.nameEn,
    metaDeck.name_en,
    metaDeck.enName,
    metaDeck.en_name,

    leftAnalytics.value.resolvedDeckDisplayNameEn,
    rightAnalytics.value.resolvedDeckDisplayNameEn,
  ]);

  if (!text || text === displayDeckName.value) return "";
  return text;
});

const titleSpriteUrls = computed(() => {
  const fromDeck = extractSpriteUrls(props.deck ?? {});
  if (fromDeck.length > 0) return fromDeck.slice(0, 3);

  return uniqStrings([
    ...leftAnalytics.value.targetSpriteUrls,
    ...rightAnalytics.value.targetSpriteUrls,
  ]).slice(0, 3);
});

const primaryNameLines = computed(() => {
  const base = displayDeckName.value || "";
  if (!base) return [];
  const tokens = base.split(/[／/]/).map((item) => item.trim()).filter(Boolean);
  if (tokens.length >= 2) return [tokens[0], tokens[1]];
  return [base];
});

const activeTierRow = computed<TierRow | null>(() => {
  const rows = tierRows.value;
  if (!rows.length) return null;

  const exactKey = normalizeDeckKey(resolvedDeckKey.value);
  if (exactKey) {
    const exact = rows.find((row) => normalizeDeckKey(row.deck) === exactKey);
    if (exact) return exact;
  }

  const targetKeys = targetDeckKeySet.value;
  if (!targetKeys.size) return null;

  return (
    rows.find((row) => {
      const normalized = normalizeDeckKey(row.deck);
      const stripped = stripDeckSetTokens(row.deck);
      return targetKeys.has(normalized) || targetKeys.has(stripped);
    }) ?? null
  );
});

const deckTierInfo = computed(() => {
  const row = activeTierRow.value;
  if (!row) return null;
  return {
    tier: row.tier,
    score: row.score,
    samples: row.total_samples,
  };
});

async function downloadTransparentDeckPanel() {
  if (downloadingDeckPanel.value) return;
  if (!deckPanelRef.value) return;

  downloadingDeckPanel.value = true;

  const viewport = deckCardsViewportRef.value;
  const prevMaxHeight = viewport?.style.maxHeight ?? "";
  const prevOverflowY = viewport?.style.overflowY ?? "";

  try {
    if (viewport) {
      viewport.style.maxHeight = "none";
      viewport.style.overflowY = "visible";
    }

    await nextTick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const { toPng } = await import("html-to-image");

    const dataUrl = await toPng(deckPanelRef.value, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "rgba(0,0,0,0)",
    });

    const link = document.createElement("a");
    const fileName =
      slugify(displayDeckNameEn.value || displayDeckName.value || resolvedDeckKey.value) ||
      "deck-panel";

    link.href = dataUrl;
    link.download = `${fileName}-transparent.png`;
    link.click();
  } catch (error) {
    console.error("[DeckProfile] downloadTransparentDeckPanel failed:", error);
  } finally {
    if (viewport) {
      viewport.style.maxHeight = prevMaxHeight;
      viewport.style.overflowY = prevOverflowY;
    }

    downloadingDeckPanel.value = false;
  }
}

/* -----------------------------
   sort
------------------------------ */

function toggleFinishSort(key: FinishSortKey) {
  if (finishSort.key === key) {
    finishSort.dir = finishSort.dir === "asc" ? "desc" : "asc";
    return;
  }

  finishSort.key = key;
  finishSort.dir = key === "dateMs" ? "desc" : "asc";
}

function finishSortMark(key: FinishSortKey) {
  if (finishSort.key !== key) return "↕";
  return finishSort.dir === "asc" ? "↑" : "↓";
}

const sortedBestFinishes = computed(() => {
  const rows = [...leftAnalytics.value.bestFinishes];

  rows.sort((a, b) => {
    let result = 0;

    switch (finishSort.key) {
      case "player":
        result = compareText(a.player, b.player);
        break;
      case "tournamentName":
        result = compareText(a.tournamentName, b.tournamentName);
        break;
      case "dateMs":
        result = a.dateMs - b.dateMs;
        break;
      case "place":
        result =
          a.place - b.place ||
          (b.players ?? 0) - (a.players ?? 0) ||
          b.dateMs - a.dateMs ||
          compareText(a.player, b.player);
        break;
    }

    return finishSort.dir === "asc" ? result : -result;
  });

  return rows;
});
</script>

<style scoped>
.deck-profile {
  --bg-main: #07131f;
  --bg-panel: rgba(10, 24, 42, 0.94);
  --bg-panel-2: rgba(14, 25, 43, 0.78);
  --border: rgba(115, 192, 255, 0.18);
  --border-soft: rgba(115, 192, 255, 0.12);
  --text-main: #f5fbff;
  --text-soft: #9bbad6;
  --text-dim: #6f8cab;
  --accent: #ff7f50;
  --accent-soft: rgba(255, 127, 80, 0.18);
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.28);

  position: relative;
  width: 100%;
  min-height: 0;
  display: grid;
  gap: 14px;
  color: var(--text-main);
}

.deck-profile,
.deck-profile * {
  box-sizing: border-box;
}

.deck-profile,
.hero-grid,
.hero-panel--decklist,
.card-grid--flat,
.table-scroll {
  scrollbar-width: none;
}

.deck-profile::-webkit-scrollbar,
.hero-grid::-webkit-scrollbar,
.hero-panel--decklist::-webkit-scrollbar,
.card-grid--flat::-webkit-scrollbar,
.table-scroll::-webkit-scrollbar {
  display: none;
}

.mono {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
}

.hero-grid {
  --tech-frame-cyan: rgba(64, 230, 255, 0.55);
  --tech-frame-cyan-dim: rgba(64, 230, 255, 0.22);
  --tech-frame-amber: rgba(255, 140, 90, 0.55);
  --tech-frame-amber-dim: rgba(255, 140, 90, 0.2);

  position: relative;
  z-index: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 14px;
  isolation: isolate;
  padding: 16px 18px 18px;
  margin: 4px 0 0;
}

.hero-grid::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: 3px;
  border: 1px solid var(--tech-frame-cyan-dim);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.35),
    0 0 28px rgba(0, 200, 255, 0.14),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  clip-path: polygon(
    0 14px,
    14px 0,
    calc(100% - 14px) 0,
    100% 14px,
    100% calc(100% - 14px),
    calc(100% - 14px) 100%,
    14px 100%,
    0 calc(100% - 14px)
  );
}

.hero-grid::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.92;
  background:
    linear-gradient(90deg, var(--tech-frame-cyan), var(--tech-frame-cyan-dim)) 12px 12px / 28px 2px no-repeat,
    linear-gradient(180deg, var(--tech-frame-cyan), var(--tech-frame-cyan-dim)) 12px 12px / 2px 28px no-repeat,
    linear-gradient(270deg, var(--tech-frame-amber), var(--tech-frame-amber-dim)) calc(100% - 12px) 12px / 28px 2px no-repeat,
    linear-gradient(180deg, var(--tech-frame-amber), var(--tech-frame-amber-dim)) calc(100% - 14px) 12px / 2px 28px no-repeat,
    linear-gradient(90deg, var(--tech-frame-cyan-dim), var(--tech-frame-cyan)) 12px calc(100% - 12px) / 28px 2px no-repeat,
    linear-gradient(0deg, var(--tech-frame-cyan), var(--tech-frame-cyan-dim)) 12px calc(100% - 14px) / 2px 28px no-repeat,
    linear-gradient(90deg, var(--tech-frame-amber-dim), var(--tech-frame-amber)) calc(100% - 12px) calc(100% - 12px) / 28px 2px no-repeat,
    linear-gradient(0deg, var(--tech-frame-amber), var(--tech-frame-amber-dim)) calc(100% - 14px) calc(100% - 14px) / 2px 28px no-repeat,
    linear-gradient(90deg, transparent, rgba(0, 220, 255, 0.12), transparent) 18px 0 / calc(100% - 36px) 1px no-repeat;
  clip-path: polygon(
    0 14px,
    14px 0,
    calc(100% - 14px) 0,
    100% 14px,
    100% calc(100% - 14px),
    calc(100% - 14px) 100%,
    14px 100%,
    0 calc(100% - 14px)
  );
}

.hero-sidebar {
  min-width: 0;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 12px;
}

.hero-panel,
.table-card {
  min-width: 0;
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.18), rgba(8, 16, 28, 0.18)),
    var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
}

.hero-panel {
  padding: 14px;
}

.hero-panel--title {
  padding-bottom: 12px;
}

.panel-kicker {
  display: block;
  margin-bottom: 8px;
  color: #8ed2ff;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.deck-title-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.deck-title-text {
  min-width: 0;
  flex: 1 1 auto;
}

.deck-display-line {
  margin: 0;
  font-size: 1.7rem;
  line-height: 1.08;
  font-weight: 900;
  color: #f8fbff;
  word-break: break-word;
}

.deck-display-subline {
  margin: 2px 0 0;
  font-size: 1.4rem;
  line-height: 1.08;
  font-weight: 800;
  color: #f5fbff;
}

.deck-english-name {
  margin: 4px 0 0;
  color: var(--text-soft);
  font-size: 0.92rem;
}

.deck-meta-line {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.deck-meta-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(115, 192, 255, 0.24);
  background: rgba(5, 20, 36, 0.85);
  color: #e6f3ff;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.deck-title-right {
  display: grid;
  align-content: space-between;
  justify-items: center;
  gap: 6px;
}

.sprite-stack--title {
  min-width: 96px;
}

.sprite-chip--title {
  width: 44px;
  height: 44px;
}

.deck-tier-line {
  display: flex;
  justify-content: center;
}

.sprite-stack {
  min-width: 84px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: nowrap;
}

.sprite-stack--small {
  min-width: 0;
  justify-content: center;
}

.sprite-chip {
  width: 36px;
  height: 36px;
  object-fit: contain;
  image-rendering: auto;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.26));
}

.sprite-chip--small {
  width: 28px;
  height: 28px;
}

.sprite-fallback {
  min-width: 44px;
  height: 44px;
  padding: 0 10px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  font-weight: 900;
}

.sprite-fallback--small {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  font-size: 0.82rem;
}

.hero-panel--stats {
  display: grid;
  gap: 10px;
  align-content: start;
}

.stats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.panel-title {
  margin: 0;
  color: var(--text-main);
  font-size: 1.2rem;
  font-weight: 900;
}

.placement-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.placement-card {
  border-radius: 14px;
  padding: 10px 8px;
  border: 1px solid var(--border-soft);
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
}

.placement-card--gold {
  background: rgba(195, 156, 42, 0.18);
}

.placement-card--silver {
  background: rgba(137, 154, 181, 0.18);
}

.placement-card--bronze {
  background: rgba(172, 116, 72, 0.14);
}

.placement-card--blue {
  background: rgba(96, 128, 198, 0.14);
}

.placement-rank {
  display: block;
  font-size: 0.98rem;
  font-weight: 800;
  color: #dceeff;
  letter-spacing: 0.08em;
}

.placement-value {
  display: block;
  margin-top: 6px;
  font-size: 1.08rem;
  color: #ffffff;
}

.metric-row {
  margin-top: 2px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  border-radius: 14px;
  background: rgba(14, 25, 43, 0.6);
  border: 1px solid var(--border-soft);
  padding: 6px 10px 4px;
}

.semi-gauge {
  position: relative;
  height: 86px;
}

.semi-gauge__svg {
  width: 100%;
  height: 70px;
  display: block;
}

.semi-gauge__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 14;
  stroke-linecap: butt;
}

.semi-gauge__value {
  fill: none;
  stroke: var(--accent);
  stroke-width: 14;
  stroke-linecap: butt;
}

.semi-gauge__label {
  position: absolute;
  left: 0;
  right: 0;
  top: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.semi-gauge__label strong {
  font-size: 1.2rem;
  color: #ffffff;
}

.semi-gauge__caption {
  margin-top: 4px;
  text-align: center;
  color: var(--text-soft);
  font-size: 1.2rem;
}

.record-line {
  margin-top: 4px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  text-align: center;
  color: #d7e8ff;
  font-size: 0.92rem;
}

.record-bubble {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background: rgba(18, 32, 56, 0.72);
  color: #dceeff;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.record-bubble--win {
  border-color: rgba(120, 220, 160, 0.55);
  background: rgba(18, 42, 34, 0.55);
}

.record-bubble--loss {
  border-color: rgba(255, 130, 130, 0.5);
  background: rgba(42, 22, 26, 0.5);
}

.record-bubble--draw {
  border-color: rgba(240, 210, 120, 0.55);
  background: rgba(42, 38, 22, 0.5);
}

.hero-panel--matchups {
  display: grid;
  gap: 10px;
  align-content: start;
}

.matchup-group {
  display: grid;
  gap: 8px;
}

.matchup-group__title {
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.matchup-group__title--good {
  color: #d9fff0;
}

.matchup-group__title--bad {
  color: #ffe2e2;
}

.matchup-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.matchup-tile {
  border-radius: 12px;
  border: 1px solid var(--border-soft);
  padding: 8px 6px;
  text-align: center;
}

.matchup-tile--good {
  background: rgba(18, 74, 58, 0.22);
}

.matchup-tile--bad {
  background: rgba(96, 36, 36, 0.22);
}

.matchup-rate {
  margin-top: 4px;
  font-size: 1.2rem;
  font-weight: 800;
  color: #f8fbff;
}

.matchup-empty {
  min-height: 46px;
  display: grid;
  place-items: center;
  color: var(--text-dim);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.hero-panel--decklist {
  min-height: 0;
  overflow: hidden;
  padding: 12px;
}

.cards-empty {
  min-height: 180px;
  display: grid;
  place-items: center;
  color: var(--text-dim);
  text-align: center;
}

.card-grid--flat {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  align-content: start;
  overflow: hidden;
}

.card-tile--flat {
  position: relative;
  border: none;
  background: transparent;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: none;
}

.card-image--flat,
.card-image-fallback--flat {
  width: 100%;
  aspect-ratio: 63 / 88;
  display: block;
  object-fit: contain;
  border-radius: 10px;
  background: transparent;
}

.card-image-fallback--flat {
  display: grid;
  place-items: center;
  background: rgba(20, 30, 48, 0.7);
  color: #eef6ff;
  font-size: 1.2rem;
  font-weight: 900;
}

.card-rate-overlay {
  position: absolute;
  left: 8px;
  bottom: 8px;
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(5, 10, 18, 0.82);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 900;
}

.card-copy-badge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(255, 127, 80, 0.96);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 800;
}

.table-card {
  overflow: hidden;
}

.section-head {
  padding: 16px 18px 8px;
}

.section-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 900;
  color: #f6fbff;
}

.table-scroll {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table thead th {
  position: relative;
  text-align: left;
  padding: 12px 18px;
  color: #d8e8f8;
  font-size: 0.94rem;
  font-weight: 900;
  border-top: 1px solid var(--border-soft);
  border-bottom: 1px solid var(--border-soft);
  white-space: nowrap;
}

.results-table tbody td {
  padding: 14px 18px;
  border-top: 1px solid rgba(115, 192, 255, 0.08);
  color: #edf7ff;
  vertical-align: middle;
}

.results-table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.025);
}

.player-col {
  font-weight: 800;
  color: #ffffff;
}

.tournament-col {
  color: #ffd27a;
  font-weight: 700;
}

.sort-btn {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-weight: 800;
  color: inherit;
}

.sort-mark {
  color: #7ec8ff;
  font-size: 0.8rem;
}

.list-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: #fff5f0;
  text-decoration: none;
  font-weight: 800;
  border: 1px solid rgba(255, 127, 80, 0.4);
}

.list-btn:hover {
  background: rgba(255, 127, 80, 0.3);
}

.muted {
  color: var(--text-dim);
}

.empty-table {
  text-align: center;
  color: var(--text-dim);
  padding: 22px 18px;
}

@media (max-width: 1280px) {
  .hero-grid {
    grid-template-columns: 280px minmax(0, 1fr);
  }

  .card-grid--flat {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-sidebar {
    grid-template-rows: auto auto auto;
  }

  .card-grid--flat {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .deck-display-name {
    font-size: 1.55rem;
  }

  .placement-grid,
  .metric-row,
  .matchup-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card-grid--flat {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .results-table thead th,
  .results-table tbody td {
    padding: 12px 12px;
    font-size: 0.92rem;
  }
}

/* ===== DeckProfile override: restore tech frame + report-like cards ===== */

.deck-profile {
  padding-top: 10px;
}

.deck-profile::before {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  top: 0;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(126, 200, 255, 0),
    rgba(126, 200, 255, 0.92),
    rgba(126, 200, 255, 0)
  );
  opacity: 0.9;
}

.hero-grid {
  grid-template-columns: 320px minmax(0, 1fr);
  align-items: start;
}

@media (min-width: 1081px) {
  .hero-sidebar {
    position: sticky;
    top: 82px;
  }
}

.hero-panel,
.table-card {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.2), rgba(6, 12, 22, 0.2)),
    rgba(9, 22, 39, 0.96);
  border: 1px solid rgba(77, 154, 220, 0.26);
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 0 1px rgba(86, 173, 255, 0.06);
}

.hero-panel::before,
.table-card::before {
  content: "";
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(126, 200, 255, 0.08);
  border-radius: 14px;
  pointer-events: none;
}

.hero-panel::after,
.table-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(90deg, rgba(126, 200, 255, 0.7), transparent 72%) top 16px left 16px / 96px 1px no-repeat,
    linear-gradient(180deg, rgba(126, 200, 255, 0.55), transparent 72%) top 16px left 16px / 1px 72px no-repeat,
    linear-gradient(90deg, transparent, rgba(126, 200, 255, 0.4)) bottom 16px right 16px / 84px 1px no-repeat,
    linear-gradient(180deg, transparent, rgba(126, 200, 255, 0.38)) bottom 16px right 16px / 1px 64px no-repeat;
  opacity: 0.8;
}

.hero-panel--title {
  display: grid;
  gap: 12px;
}

.hero-panel--decklist {
  min-height: 680px;
  max-height: 980px;
  overflow: auto;
  padding: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(126, 200, 255, 0.24) rgba(255, 255, 255, 0.04);
}

.hero-panel--decklist::-webkit-scrollbar {
  display: block;
  width: 10px;
}

.hero-panel--decklist::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04);
}

.hero-panel--decklist::-webkit-scrollbar-thumb {
  background: rgba(126, 200, 255, 0.24);
  border-radius: 999px;
  border: 2px solid rgba(7, 19, 31, 0.92);
}

.decklist-shell {
  position: relative;
  z-index: 1;
  padding: 18px;
  display: grid;
  gap: 20px;
}

.cardsGrid--profile {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.profileCard {
  min-width: 0;
}

.profileCard__imageWrap {
  position: relative;
  aspect-ratio: 5 / 7;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(115, 192, 255, 0.18);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.profileCard__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: rgba(255, 255, 255, 0.03);
}

.profileCard__fallback {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  background: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.85),
    rgba(15, 23, 42, 0.92)
  );
  color: rgba(255, 255, 255, 0.94);
}

.profileCard__fallbackName {
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.3;
}

.profileCard__fallbackCode {
  margin-top: 6px;
  color: rgba(226, 232, 240, 0.72);
  font-size: 0.78rem;
}

.profileCard__rate {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  z-index: 2;
  min-height: 38px;
  min-width: 72px;
  padding: 0 14px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0.03em;
  background: linear-gradient(180deg, rgba(18, 83, 143, 0.96) 0%, rgba(9, 45, 83, 0.96) 100%);
  border: 1px solid rgba(126, 200, 255, 0.34);
  color: #eef7ff;
  font-size: 1.4rem;
  box-shadow:
    0 10px 18px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}


.profileCard__body {
  padding: 10px 4px 0;
}

.cards-empty {
  min-height: 260px;
  border-radius: 16px;
  border: 1px dashed rgba(115, 192, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}

@media (max-width: 1380px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1280px) {
  .hero-grid {
    grid-template-columns: 300px minmax(0, 1fr);
  }
}

@media (max-width: 1080px) {
  .hero-panel--decklist {
    min-height: 0;
    max-height: none;
  }

  .cardsGrid--profile {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .decklist-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .cardsGrid--profile {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .profileCard__name {
    font-size: 0.9rem;
  }

  .profileCard__rate {
    min-height: 34px;
    min-width: 64px;
    padding: 0 12px;
    font-size: 0.86rem;
  }
}

.deck-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}

.download-btn {
  appearance: none;
  border: 1px solid rgba(126, 200, 255, 0.28);
  background: rgba(18, 83, 143, 0.22);
  color: #eef7ff;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.download-btn:hover:not(:disabled) {
  background: rgba(18, 83, 143, 0.34);
  border-color: rgba(126, 200, 255, 0.42);
  transform: translateY(-1px);
}

.download-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.decklist-shell {
  gap: 16px;
}

.decklist-group {
  gap: 0;
}

.profileCard {
  min-width: 0;
}

.profileCard__body {
  display: none;
}

@media (max-width: 720px) {
  .deck-actions {
    justify-content: stretch;
  }

  .download-btn {
    width: 100%;
  }
}

.hero-panel--title {
  display: grid;
  gap: 12px;
}

.hero-panel--decklist {
  min-height: 0;
  max-height: none;
  overflow: hidden;
  padding: 0;
}

.decklist-shell {
  position: relative;
  z-index: 1;
  padding: 18px;
  display: grid;
  gap: 0;
}

.decklist-viewport {
  overflow: hidden;
}

.decklist-viewport--scrollable {
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(126, 200, 255, 0.24) rgba(255, 255, 255, 0.04);
}

.decklist-viewport--scrollable::-webkit-scrollbar {
  display: block;
  width: 8px;
}

.decklist-viewport--scrollable::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04);
}

.decklist-viewport--scrollable::-webkit-scrollbar-thumb {
  background: rgba(126, 200, 255, 0.24);
  border-radius: 999px;
  border: 2px solid rgba(7, 19, 31, 0.92);
}

.cardsGrid--profile {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  align-content: start;
}

.profileCard {
  min-width: 0;
}

.profileCard__imageWrap {
  position: relative;
  aspect-ratio: 5 / 7;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(115, 192, 255, 0.18);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.profileCard__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: rgba(255, 255, 255, 0.03);
}

.profileCard__body {
  display: none;
}

.cards-empty {
  min-height: 220px;
  border-radius: 16px;
  border: 1px dashed rgba(115, 192, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}

.deck-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2px;
}

.download-btn {
  appearance: none;
  border: 1px solid rgba(126, 200, 255, 0.28);
  background: rgba(18, 83, 143, 0.22);
  color: #eef7ff;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    opacity 0.2s ease;
}

.download-btn:hover:not(:disabled) {
  background: rgba(18, 83, 143, 0.34);
  border-color: rgba(126, 200, 255, 0.42);
  transform: translateY(-1px);
}

.download-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 1380px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .hero-panel--decklist {
    min-height: 0;
  }

  .cardsGrid--profile {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .deck-actions {
    justify-content: stretch;
  }

  .download-btn {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .cardsGrid--profile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.profileFilters {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.profileFilterGroup {
  position: relative;
  min-width: 0;
  padding: 12px;
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(18, 43, 76, 0.2), rgba(6, 12, 22, 0.2)),
    rgba(9, 22, 39, 0.96);
  border: 1px solid rgba(77, 154, 220, 0.26);
  box-shadow:
    0 18px 50px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 0 1px rgba(86, 173, 255, 0.06);
}

.profileFilterGroup::before {
  content: "";
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(126, 200, 255, 0.08);
  border-radius: 14px;
  pointer-events: none;
}

.profileFilterGroup__head {
  position: relative;
  z-index: 1;
  margin-bottom: 10px;
}

.profileFilterGroup__title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 900;
  color: #f6fbff;
}

.profileFilterGroup__sub {
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: rgba(226, 232, 240, 0.68);
  line-height: 1.4;
}

.profileFilterGrid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.profileFilterGrid--sidebar {
  grid-template-columns: 1fr;
}

.profileFilterField {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.35);
  padding: 10px;
}

.profileFilterField label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

.profileFilterField select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(2, 6, 23, 0.35);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
  outline: none;
}

.hint {
  margin-left: 6px;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.65);
  font-weight: 600;
}

@media (max-width: 1280px) {
  .profileFilters {
    grid-template-columns: 300px minmax(0, 1fr);
  }
}

@media (max-width: 1080px) {
  .profileFilters {
    grid-template-columns: 1fr;
  }

  .profileFilterGrid {
    grid-template-columns: 1fr;
  }
}

/* ===== title block: back to early version feel ===== */

.deck-title-block--classic {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.deck-title-text--classic {
  min-width: 0;
  flex: 1 1 auto;
  display: grid;
  gap: 6px;
}

.deck-display-name--classic {
  margin: 0;
  font-size: 2rem;
  line-height: 1.04;
  font-weight: 900;
  color: #f8fbff;
  letter-spacing: 0.01em;
  word-break: break-word;
}

.deck-english-name--classic {
  margin: 0;
  color: #9ed6ff;
  font-size: 0.98rem;
}

.deck-context-line {
  margin: 2px 0 0;
  color: rgba(226, 232, 240, 0.78);
  font-size: 0.84rem;
  letter-spacing: 0.04em;
}

.deck-title-right--classic {
  flex: 0 0 auto;
  min-width: 92px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.sprite-stack--title {
  min-width: 0;
  justify-content: flex-end;
}

.sprite-chip--title {
  width: 46px;
  height: 46px;
}

.tier-badge {
  position: relative;
  overflow: hidden;
  min-width: 74px;
  height: 60px;
  padding: 6px 12px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 1px solid rgba(126, 200, 255, 0.3);
  background: linear-gradient(180deg, rgba(78, 86, 99, 0.94) 0%, rgba(41, 46, 55, 0.98) 100%);
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.tier-badge::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 48%);
}

.tier-badge__label {
  position: relative;
  z-index: 1;
  font-size: 0.56rem;
  letter-spacing: 0.18em;
  color: rgba(245, 249, 255, 0.78);
}

.tier-badge__value {
  position: relative;
  z-index: 1;
  font-size: 2.6rem;
  line-height: 1;
  letter-spacing: 0.04em;
  color: #ffffff;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
}

.tier-badge--sss,
.tier-badge--ss,
.tier-badge--s {
  background: linear-gradient(180deg, rgba(178, 97, 56, 0.96) 0%, rgba(103, 49, 22, 0.98) 100%);
  border-color: rgba(226, 164, 98, 0.54);
}

.tier-badge--a {
  background: linear-gradient(180deg, rgba(156, 110, 53, 0.95) 0%, rgba(89, 61, 23, 0.98) 100%);
  border-color: rgba(203, 154, 92, 0.46);
}

.tier-badge--b {
  background: linear-gradient(180deg, rgba(145, 128, 55, 0.95) 0%, rgba(84, 73, 24, 0.98) 100%);
  border-color: rgba(188, 169, 86, 0.42);
}

.tier-badge--c {
  background: linear-gradient(180deg, rgba(97, 146, 82, 0.94) 0%, rgba(55, 92, 46, 0.98) 100%);
  border-color: rgba(132, 181, 118, 0.4);
}

.tier-badge--d {
  background: linear-gradient(180deg, rgba(84, 110, 144, 0.94) 0%, rgba(46, 61, 86, 0.98) 100%);
  border-color: rgba(118, 145, 184, 0.42);
}

.tier-badge--e {
  background: linear-gradient(180deg, rgba(105, 92, 140, 0.94) 0%, rgba(59, 49, 84, 0.98) 100%);
  border-color: rgba(145, 128, 190, 0.36);
}

.tier-badge--f {
  background: linear-gradient(180deg, rgba(78, 86, 99, 0.94) 0%, rgba(41, 46, 55, 0.98) 100%);
  border-color: rgba(122, 132, 146, 0.3);
}

.tier-badge--sss .tier-badge__value,
.tier-badge--ss .tier-badge__value,
.tier-badge--s .tier-badge__value {
  color: #fff4d8;
}

.tier-badge--a .tier-badge__value {
  color: #fff0d3;
}

.tier-badge--b .tier-badge__value {
  color: #fff6cf;
}

.tier-badge--c .tier-badge__value {
  color: #ecffe8;
}

.tier-badge--d .tier-badge__value {
  color: #e9f1ff;
}

/* ===== semi gauge center value ===== */

.metric-card {
  padding: 8px 10px 6px;
}

.semi-gauge {
  position: relative;
  height: 92px;
}

.semi-gauge__svg {
  width: 100%;
  height: 74px;
  display: block;
}

.semi-gauge__label {
  position: absolute;
  left: 50%;
  top: 46px;
  transform: translate(-50%, -50%);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  pointer-events: none;
}

.semi-gauge__label strong {
  font-size: 1.2rem;
  line-height: 1;
  color: #ffffff;
}

.semi-gauge__caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 4px;
  margin-top: 0;
  text-align: center;
  color: var(--text-soft);
  font-size: 1rem;
}

@media (max-width: 720px) {
  .deck-display-name--classic {
    font-size: 1.7rem;
  }

  .deck-english-name--classic {
    font-size: 0.9rem;
  }

  .deck-context-line {
    font-size: 0.78rem;
  }

  .sprite-chip--title {
    width: 40px;
    height: 40px;
  }

  .tier-badge {
      min-width: 66px;
      height: 54px;
      padding: 5px 10px;
    }

    .tier-badge__value {
      font-size: 1.2rem;
    }

    .tier-badge__label {
      font-size: 0.52rem;
    }

  .semi-gauge__label {
    top: 46px;
  }
}

.profileFilters {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.profileFilterGroup {
  padding: 16px 18px;
}

.profileFilterGrid--left {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.profileFilterGrid--right {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.profileFilterField--toggle {
  display: grid;
  gap: 8px;
}

.view-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(2, 6, 23, 0.35);
}

.view-toggle__option {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: rgba(255, 255, 255, 0.72);
  padding: 8px 10px;
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.view-toggle__option--active {
  color: #eef7ff;
  border-color: rgba(126, 200, 255, 0.28);
  background: rgba(18, 83, 143, 0.28);
}

.decklist-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.decklist-head__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.decklist-head__sub {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.88rem;
  line-height: 1.45;
}

.sample-deck-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: -4px 0 16px;
}

.sample-deck-meta__item {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(115, 192, 255, 0.18);
  background: rgba(11, 27, 47, 0.84);
  color: #eef7ff;
  font-size: 0.82rem;
}

.matchup-record {
  font-size: 0.78rem;
  color: var(--text-soft);
  white-space: nowrap;
}

.profileCard__rate--count {
  font-size: 0;
}

.profileCard__rate--count::after {
  content: attr(data-rate-label);
  font-size: 0.96rem;
}

.cards-empty__copy {
  display: block;
  margin-bottom: 8px;
}

@media (max-width: 1280px) {
  .profileFilterGrid--right {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .profileFilterField--toggle {
    grid-column: span 2;
  }
}

@media (max-width: 1080px) {
  .profileFilters {
    grid-template-columns: 1fr;
  }

  .profileFilterGrid--left,
  .profileFilterGrid--right {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .profileFilterGrid--left,
  .profileFilterGrid--right {
    grid-template-columns: 1fr;
  }

  .profileFilterField--toggle {
    grid-column: auto;
  }

  .decklist-head {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .sample-deck-meta {
    margin-bottom: 12px;
  }

  .decklist-shell {
    padding: 14px;
    gap: 14px;
  }

  .hero-panel--decklist,
  .decklist-viewport,
  .decklist-viewport--scrollable {
    overflow: visible;
    max-height: none !important;
  }

  .cardsGrid--profile {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px;
  }

  .profileCard__rate {
    min-height: 32px;
    min-width: 58px;
    padding: 0 10px;
    bottom: 8px;
    font-size: 0.82rem;
  }
}

</style>
