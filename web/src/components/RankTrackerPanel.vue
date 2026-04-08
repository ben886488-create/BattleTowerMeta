<template>
  <section :class="['tracker', `tracker--${viewMode}`]">
    <section class="card hero">
      <div class="hero__head">
        <div>
          <p class="mono kicker">RANK RECORDER</p>
          <h1>{{ playerName }}</h1>
          <p class="sub">{{ profileLine }}</p>
        </div>
        <div class="mode-switch" role="tablist" :aria-label="ui.modeSwitchAria">
          <button type="button" :class="['mode-switch__button', { 'mode-switch__button--active': viewMode === 'web' }]" @click="viewMode = 'web'">{{ ui.webMode }}</button>
          <button type="button" :class="['mode-switch__button', { 'mode-switch__button--active': viewMode === 'stream' }]" @click="viewMode = 'stream'">{{ ui.streamMode }}</button>
        </div>
      </div>

      <div class="hero__stats">
        <article class="stat stat--points">
          <div class="stat__head">
            <span>{{ ui.currentPoints }}</span>
            <span class="mono">{{ currentVersionCode }}</span>
          </div>
          <div class="rankline rankline--points">
            <img :src="ballIcon" :alt="rankTierLabel(summary.currentTier)" class="ball" draggable="false" />
            <div class="rankline__copy">
              <strong class="mono">{{ summary.currentPoints }}</strong>
              <p>{{ rankTierLabel(summary.currentTier) }}</p>
            </div>
          </div>
          <small class="mono">{{ summary.nextTier ? ui.nextTierGap(Math.max(0, summary.nextTier.floor - summary.currentPoints)) : ui.maxTier }}</small>
        </article>

        <article class="stat stat--streak">
          <div class="stat__head">
            <span>{{ ui.currentStreak }}</span>
            <span class="mono">NEXT</span>
          </div>
          <div v-if="viewMode === 'stream'" class="recordline recordline--stacked recordline--streak">
            <strong class="mono">{{ summary.currentStreak }}</strong>
            <p class="mono recordline__solo">NEXT +{{ summary.nextWinGain }}</p>
          </div>
          <div v-else class="split split--compact">
            <div>
              <strong class="mono">{{ summary.currentStreak }}</strong>
              <p>{{ ui.streakWins }}</p>
            </div>
            <div>
              <strong class="mono">+{{ summary.nextWinGain }}</strong>
              <p>{{ ui.nextWinGain }}</p>
            </div>
          </div>
        </article>

        <article class="stat stat--record">
          <div class="stat__head">
            <span>{{ ui.record }}</span>
          </div>
          <div v-if="viewMode === 'stream'" class="recordline recordline--stacked">
            <strong class="mono">{{ pct(summary.winRate) }}</strong>
            <p class="mono recordline__solo">{{ record(summary.totalWins, summary.totalLosses, summary.totalDraws) }}</p>
          </div>
          <div v-else class="recordline">
            <strong class="mono">{{ pct(summary.winRate) }}</strong>
            <div class="recordline__copy">
              <span v-if="viewMode === 'web'" class="mono">W / L / D</span>
              <p class="mono">{{ record(summary.totalWins, summary.totalLosses, summary.totalDraws) }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <div :class="['summary-grid', { 'summary-grid--stream': viewMode === 'stream' }]">
      <section v-if="viewMode === 'web'" class="card">
        <div class="section-head">
          <div>
            <p class="mono kicker">YOUR DECKS</p>
            <h2>{{ ui.yourDecks }}</h2>
          </div>
          <span class="mono count">{{ playerDeckRows.length }}</span>
        </div>
        <div v-if="playerDeckRows.length === 0" class="empty">{{ ui.noPlayerDecks }}</div>
        <div v-else class="deck-list">
          <article v-for="deck in playerDeckRows" :key="`self-${deck.key}`" class="deck-card">
            <div class="deck-card__main">
              <div class="sprites sprites--large">
                <template v-if="deck.spriteUrls.length">
                  <img v-for="(sprite, index) in deck.spriteUrls" :key="`${deck.key}-${index}`" :src="sprite" :alt="deck.displayName" class="sprite sprite--large" draggable="false" />
                </template>
                <div v-else class="fallback mono">{{ initials(deck.displayName) }}</div>
              </div>
              <div class="deck-card__copy">
                <strong>{{ deck.displayName }}</strong>
                <p>{{ ui.deckUseCount(deck.count) }}</p>
              </div>
            </div>
            <div class="deck-card__stats">
              <div class="mini-stat">
                <span class="mini-stat__label">{{ ui.winRate }}</span>
                <strong class="mono">{{ pct(deck.winRate) }}</strong>
              </div>
              <div class="mini-stat mini-stat--record">
                <span class="mini-stat__label">{{ ui.record }}</span>
                <strong class="mono">{{ record(deck.wins, deck.losses, deck.draws) }}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="card">
        <div class="section-head">
          <div>
            <p class="mono kicker">OPPONENTS</p>
            <h2>{{ ui.opponents }}</h2>
          </div>
          <span class="mono count">{{ opponentDeckRows.length }}</span>
        </div>
        <div v-if="opponentDeckRows.length === 0" class="empty">{{ ui.noOpponentDecks }}</div>
        <div v-else class="opponent-bars">
          <article v-for="deck in opponentDeckRows" :key="`opp-${deck.key}`" class="opponent-bar" :class="{ 'opponent-bar--stream': viewMode === 'stream' }">
            <template v-if="viewMode === 'stream'">
              <div class="opponent-bar__streamline">
                <div class="sprites">
                  <template v-if="deck.spriteUrls.length">
                    <img v-for="(sprite, index) in deck.spriteUrls" :key="`${deck.key}-${index}`" :src="sprite" :alt="deck.displayName" class="sprite" draggable="false" />
                  </template>
                  <div v-else class="fallback mono">{{ initials(deck.displayName) }}</div>
                </div>
                <div class="opponent-bar__track">
                  <div class="opponent-bar__fill" :style="{ width: opponentBarWidth(deck.count) }"></div>
                </div>
                <span class="mono opponent-bar__count">{{ opponentShare(deck.count) }}</span>
              </div>
            </template>
            <template v-else>
              <div class="opponent-bar__head">
                <div class="deck-row__main">
                  <div class="sprites">
                    <template v-if="deck.spriteUrls.length">
                      <img v-for="(sprite, index) in deck.spriteUrls" :key="`${deck.key}-${index}`" :src="sprite" :alt="deck.displayName" class="sprite" draggable="false" />
                    </template>
                    <div v-else class="fallback mono">{{ initials(deck.displayName) }}</div>
                  </div>
                  <div class="deck-row__copy">
                    <strong>{{ deck.displayName }}</strong>
                    <p>{{ ui.deckSeenCount(deck.count) }}</p>
                  </div>
                </div>
                <span class="mono opponent-bar__count">{{ opponentShare(deck.count) }}</span>
              </div>
              <div class="opponent-bar__track">
                <div class="opponent-bar__fill" :style="{ width: opponentBarWidth(deck.count) }"></div>
              </div>
            </template>
          </article>
        </div>
      </section>
    </div>

    <section v-if="viewMode === 'stream'" class="card stream-player-card">
      <div class="section-head">
        <div>
          <p class="mono kicker">YOUR DECKS</p>
          <h2>{{ ui.yourDecks }}</h2>
        </div>
        <span class="mono count">{{ playerDeckRows.length }}</span>
      </div>
      <div v-if="playerDeckRows.length === 0" class="empty">{{ ui.noPlayerDecks }}</div>
      <div v-else class="deck-list">
        <article v-for="deck in playerDeckRows" :key="`stream-self-${deck.key}`" class="deck-card">
          <div class="deck-card__main">
            <div class="sprites sprites--large">
              <template v-if="deck.spriteUrls.length">
                <img v-for="(sprite, index) in deck.spriteUrls" :key="`${deck.key}-stream-${index}`" :src="sprite" :alt="deck.displayName" class="sprite sprite--large" draggable="false" />
              </template>
              <div v-else class="fallback mono">{{ initials(deck.displayName) }}</div>
            </div>
            <div class="deck-card__copy">
              <strong>{{ deck.displayName }}</strong>
              <p>{{ ui.deckUseCount(deck.count) }}</p>
            </div>
          </div>
          <div class="deck-card__stats">
            <div class="mini-stat">
              <span class="mini-stat__label">{{ ui.winRate }}</span>
              <strong class="mono">{{ pct(deck.winRate) }}</strong>
            </div>
            <div class="mini-stat mini-stat--record">
              <span class="mini-stat__label">{{ ui.record }}</span>
              <strong class="mono">{{ record(deck.wins, deck.losses, deck.draws) }}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="card">
      <div class="tabs" role="tablist" :aria-label="ui.panelAria">
        <button type="button" :class="['tab', { 'tab--active': panel === 'operations' }]" @click="panel = 'operations'">{{ ui.operations }}</button>
        <button type="button" :class="['tab', { 'tab--active': panel === 'records' }]" @click="panel = 'records'">{{ ui.records }}</button>
        <button type="button" :class="['tab', { 'tab--active': panel === 'logs' }]" @click="panel = 'logs'">{{ ui.logs }}</button>
      </div>

      <div v-if="panel === 'operations'" class="ops-grid">
        <section class="subcard">
          <div class="section-head">
            <div>
              <p class="mono kicker">STARTING STATE</p>
              <h3>{{ ui.startingState }}</h3>
            </div>
            <span class="meta">{{ ui.trackerOnly }}</span>
          </div>
          <div class="fields">
            <label>{{ ui.startPoints }}<input v-model.number="state.startPoints" type="number" min="0" step="1" /></label>
            <label>{{ ui.startWins }}<input v-model.number="state.startWins" type="number" min="0" step="1" /></label>
            <label>{{ ui.startLosses }}<input v-model.number="state.startLosses" type="number" min="0" step="1" /></label>
            <label>{{ ui.startStreak }}<input v-model.number="state.startStreak" type="number" min="0" step="1" /></label>
          </div>
        </section>

        <section class="subcard">
          <div class="section-head">
            <div>
              <p class="mono kicker">MATCH ENTRY</p>
              <h3>{{ ui.matchEntry }}</h3>
            </div>
            <span class="meta">{{ ui.deckPoolHint(deckPool.length) }}</span>
          </div>

          <div class="selector-grid selector-grid--slots">
            <div class="selector-card">
              <div class="selector-card__top">
                <label class="selector-card__label">{{ ui.yourDeckLabel }}</label>
                <span class="selector-card__meta mono">{{ ui.versionLabel(currentVersionCode) }}</span>
              </div>
              <div ref="playerPickerRef" class="deck-picker">
                <div class="deck-picker__selected" :class="{ 'deck-picker__selected--empty': !state.currentPlayerDeck }">
                  <template v-if="state.currentPlayerDeck">
                    <div class="sprites">
                      <template v-if="selectedPlayerDeckVisual.spriteUrls.length">
                        <img v-for="(sprite, index) in selectedPlayerDeckVisual.spriteUrls" :key="`${selectedPlayerDeckVisual.key}-${index}`" :src="sprite" :alt="selectedPlayerDeckVisual.displayName" class="sprite" draggable="false" />
                      </template>
                      <div v-else class="fallback mono">{{ initials(selectedPlayerDeckVisual.displayName) }}</div>
                    </div>
                    <div class="deck-picker__selected-copy">
                      <strong>{{ selectedPlayerDeckVisual.displayName }}</strong>
                      <span class="mono">{{ ui.selected }}</span>
                    </div>
                  </template>
                  <span v-else class="mono">{{ ui.chooseYourDeck }}</span>
                  <button type="button" class="deck-picker__clear" :disabled="!state.currentPlayerDeck" @click="clearDeckSelection('player')">{{ ui.clear }}</button>
                </div>

                <label class="deck-search__field" @click="playerMenuOpen = true" @focusin="playerMenuOpen = true">
                  <input v-model.trim="playerDeckQuery" type="text" :placeholder="ui.playerSearchPlaceholder" />
                  <button v-if="playerDeckQuery" type="button" class="deck-search__clear" @click="playerDeckQuery = ''">{{ ui.clear }}</button>
                </label>

                <div v-if="playerMenuOpen" class="deck-search__menu">
                  <div v-if="deckPoolLoading" class="deck-search__empty">{{ ui.loadingDeckPool }}</div>
                  <div v-else-if="deckPoolError" class="deck-search__empty">{{ deckPoolError }}</div>
                  <button v-for="option in playerDeckResults" :key="`player-${option.key}`" type="button" class="deck-search__option" :class="{ 'deck-search__option--active': state.currentPlayerDeck === option.key }" @click="pickDeck('player', option)">
                    <div class="sprites">
                      <img v-for="(sprite, index) in option.spriteUrls" :key="`${option.key}-${index}`" :src="sprite" :alt="option.displayName" class="sprite" draggable="false" />
                    </div>
                    <div class="deck-search__option-copy">
                      <strong>{{ option.displayName }}</strong>
                      <span class="mono">{{ ui.deckAppearanceCount(option.count) }}</span>
                    </div>
                  </button>
                  <div v-if="!deckPoolLoading && !deckPoolError && playerDeckResults.length === 0" class="deck-search__empty">{{ ui.noSearchResults }}</div>
                </div>
              </div>
            </div>

            <div class="selector-card">
              <div class="selector-card__top">
                <label class="selector-card__label">{{ ui.opponentDeckLabel }}</label>
                <span class="selector-card__meta mono">{{ ui.versionLabel(currentVersionCode) }}</span>
              </div>
              <div ref="opponentPickerRef" class="deck-picker">
                <div class="deck-picker__selected" :class="{ 'deck-picker__selected--empty': !state.lastOpponentDeck }">
                  <template v-if="state.lastOpponentDeck">
                    <div class="sprites">
                      <template v-if="selectedOpponentDeckVisual.spriteUrls.length">
                        <img v-for="(sprite, index) in selectedOpponentDeckVisual.spriteUrls" :key="`${selectedOpponentDeckVisual.key}-${index}`" :src="sprite" :alt="selectedOpponentDeckVisual.displayName" class="sprite" draggable="false" />
                      </template>
                      <div v-else class="fallback mono">{{ initials(selectedOpponentDeckVisual.displayName) }}</div>
                    </div>
                    <div class="deck-picker__selected-copy">
                      <strong>{{ selectedOpponentDeckVisual.displayName }}</strong>
                      <span class="mono">{{ ui.selected }}</span>
                    </div>
                  </template>
                  <span v-else class="mono">{{ ui.chooseOpponentDeck }}</span>
                  <button type="button" class="deck-picker__clear" :disabled="!state.lastOpponentDeck" @click="clearDeckSelection('opponent')">{{ ui.clear }}</button>
                </div>

                <label class="deck-search__field" @click="opponentMenuOpen = true" @focusin="opponentMenuOpen = true">
                  <input v-model.trim="opponentDeckQuery" type="text" :placeholder="ui.opponentSearchPlaceholder" />
                  <button v-if="opponentDeckQuery" type="button" class="deck-search__clear" @click="opponentDeckQuery = ''">{{ ui.clear }}</button>
                </label>

                <div v-if="opponentMenuOpen" class="deck-search__menu">
                  <div v-if="deckPoolLoading" class="deck-search__empty">{{ ui.loadingDeckPool }}</div>
                  <div v-else-if="deckPoolError" class="deck-search__empty">{{ deckPoolError }}</div>
                  <button v-for="option in opponentDeckResults" :key="`opponent-${option.key}`" type="button" class="deck-search__option" :class="{ 'deck-search__option--active': state.lastOpponentDeck === option.key }" @click="pickDeck('opponent', option)">
                    <div class="sprites">
                      <img v-for="(sprite, index) in option.spriteUrls" :key="`${option.key}-${index}`" :src="sprite" :alt="option.displayName" class="sprite" draggable="false" />
                    </div>
                    <div class="deck-search__option-copy">
                      <strong>{{ option.displayName }}</strong>
                      <span class="mono">{{ ui.deckAppearanceCount(option.count) }}</span>
                    </div>
                  </button>
                  <div v-if="!deckPoolLoading && !deckPoolError && opponentDeckResults.length === 0" class="deck-search__empty">{{ ui.noSearchResults }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button type="button" class="action action--win" @click="addMatch('win')">{{ ui.recordWin }}</button>
            <button type="button" class="action action--loss" @click="addMatch('loss')">{{ ui.recordLoss }}</button>
            <button type="button" class="action action--draw" @click="addMatch('draw')">{{ ui.recordDraw }}</button>
          </div>

          <div v-if="status.error" class="notice notice--error">{{ status.error }}</div>
          <div v-else-if="status.message" class="notice notice--ok">{{ status.message }}</div>

          <div class="actions actions--secondary">
            <button type="button" class="ghost" :disabled="summary.matches.length === 0" @click="undoLast">{{ confirmUndo ? ui.undoConfirm : ui.undo }}</button>
            <button type="button" class="ghost ghost--danger" @click="resetAll">{{ confirmReset ? ui.resetConfirm : ui.reset }}</button>
          </div>
        </section>
      </div>

      <div v-else-if="panel === 'records'" class="records">
        <div v-if="groupedMatchups.length === 0" class="empty">{{ ui.noRecords }}</div>
        <section v-for="group in groupedMatchups" :key="group.key" class="subcard">
          <div class="section-head">
            <div class="deck-row__main">
              <div class="sprites">
                <template v-if="group.spriteUrls.length">
                  <img v-for="(sprite, index) in group.spriteUrls" :key="`${group.key}-${index}`" :src="sprite" :alt="group.displayName" class="sprite" draggable="false" />
                </template>
                <div v-else class="fallback mono">{{ initials(group.displayName) }}</div>
              </div>
              <div class="deck-row__copy">
                <strong>{{ group.displayName }}</strong>
                <p>{{ ui.groupSummary(group.games, pct(group.winRate), record(group.wins, group.losses, group.draws)) }}</p>
              </div>
            </div>
          </div>
          <div class="deck-list">
            <article v-for="item in group.rows" :key="item.key" class="record-row">
              <div class="deck-row__main">
                <div class="sprites">
                  <template v-if="item.spriteUrls.length">
                    <img v-for="(sprite, index) in item.spriteUrls" :key="`${item.key}-${index}`" :src="sprite" :alt="item.displayName" class="sprite sprite--small" draggable="false" />
                  </template>
                  <div v-else class="fallback fallback--small mono">{{ initials(item.displayName) }}</div>
                </div>
                <div class="deck-row__copy">
                  <strong>{{ item.displayName }}</strong>
                  <p>{{ ui.gameCount(item.games) }}</p>
                </div>
              </div>
              <div class="deck-row__meta">
                <span class="pill mono">{{ pct(item.winRate) }}</span>
                <span class="pill mono">{{ record(item.wins, item.losses, item.draws) }}</span>
              </div>
            </article>
          </div>
        </section>
      </div>

      <div v-else class="logs">
        <div v-if="logRows.length === 0" class="empty">{{ ui.noLogs }}</div>
        <article v-for="item in logRows" :key="item.id" class="record-row log">
          <div class="deck-row__main log__main">
            <span :class="['result mono', `result--${item.result}`]">{{ resultLabel(item.result) }}</span>
            <div class="log__matchup">
              <div class="log__deck">
                <div class="sprites">
                  <template v-if="item.playerDeckVisual.spriteUrls.length">
                    <img v-for="(sprite, index) in item.playerDeckVisual.spriteUrls" :key="`${item.id}-player-${index}`" :src="sprite" :alt="item.playerDeckVisual.displayName" class="sprite sprite--small" draggable="false" />
                  </template>
                  <div v-else class="fallback fallback--small mono">{{ initials(item.playerDeckVisual.displayName) }}</div>
                </div>
                <div class="deck-row__copy">
                  <strong>{{ item.playerDeckVisual.displayName }}</strong>
                  <p>{{ ui.selfUsed }}</p>
                </div>
              </div>
              <span class="mono log__vs">vs</span>
              <div class="log__deck">
                <div class="sprites">
                  <template v-if="item.opponentDeckVisual.spriteUrls.length">
                    <img v-for="(sprite, index) in item.opponentDeckVisual.spriteUrls" :key="`${item.id}-opponent-${index}`" :src="sprite" :alt="item.opponentDeckVisual.displayName" class="sprite sprite--small" draggable="false" />
                  </template>
                  <div v-else class="fallback fallback--small mono">{{ initials(item.opponentDeckVisual.displayName) }}</div>
                </div>
                <div class="deck-row__copy">
                  <strong>{{ item.opponentDeckVisual.displayName }}</strong>
                  <p>{{ ui.opponentUsed }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="deck-row__meta">
            <span class="pill mono">{{ item.delta >= 0 ? `+${item.delta}` : item.delta }}</span>
            <span class="pill mono">{{ ui.pointsAfter(item.pointsAfter) }}</span>
            <span class="pill mono">{{ fmtDate(item.createdAt) }}</span>
          </div>
          <button type="button" class="ghost ghost--danger" @click="deleteMatch(item.id)">{{ deleteTarget === item.id ? ui.deleteLogConfirm : ui.deleteLog }}</button>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import newbieBallIcon from "../assets/balls/newbie_icon.webp";
import pokeBallIcon from "../assets/balls/pokeball_icon.webp";
import greatBallIcon from "../assets/balls/greatball_icon.webp";
import ultraBallIcon from "../assets/balls/ultraball_icon.webp";
import masterBallIcon from "../assets/balls/masterball_icon.webp";
import manifest from "../assets/deck-icons/manifest.json";
import { getLocalizedDeckName } from "../assets/pokemonNames";
import { inferVersionByStartMs, loadPlayerEntries, type DecoratedPlayerEntry } from "../lib/playerEntries";
import { createRankLog, deleteRankLog, deleteRankLogs } from "../lib/interactive";
import { authProfile, hasSupabaseConfig } from "../lib/supabase";
import {
  analyzeRankTrackerState,
  createDefaultRankTrackerState,
  sanitizeRankTrackerState,
  type RankMatchResult,
  type RankTierDefinition,
  type RankTrackerState,
} from "../lib/rankTracker";

type ManifestEntry = { slug: string; src: string };
type DeckPoolRow = { key: string; displayName: string; rawName: string; iconKeys: string[]; spriteUrls: string[]; searchText: string; searchCompact: string; count: number };

const deckIconModules = import.meta.glob("../assets/deck-icons/*.{png,webp,jpg,jpeg,svg}", { eager: true, import: "default" }) as Record<string, string>;
const ballIcons = { newbie: newbieBallIcon, pokeball: pokeBallIcon, greatball: greatBallIcon, ultraball: ultraBallIcon, masterball: masterBallIcon } as const;
const route = useRoute();
const profile = authProfile;
const panel = ref<"operations" | "records" | "logs">("operations");
const viewMode = ref<"web" | "stream">("web");
const confirmUndo = ref(false);
const confirmReset = ref(false);
const deleteTarget = ref<string | null>(null);
const ready = ref(false);
const syncingRemoteMatches = ref(false);
const playerMenuOpen = ref(false);
const opponentMenuOpen = ref(false);
const playerPickerRef = ref<HTMLElement | null>(null);
const opponentPickerRef = ref<HTMLElement | null>(null);
const deckPool = ref<DeckPoolRow[]>([]);
const deckPoolLoading = ref(false);
const deckPoolError = ref("");
const playerDeckQuery = ref("");
const opponentDeckQuery = ref("");
const status = reactive({ message: "", error: "" });
const state = reactive<RankTrackerState>(createDefaultRankTrackerState());
const locale = computed<"zh" | "en">(() => (String(route.path).split("/")[1] === "en" ? "en" : "zh"));
const numberLocale = computed(() => (locale.value === "en" ? "en-US" : "zh-HK"));
const ui = computed(() =>
  locale.value === "en"
    ? {
        modeSwitchAria: "Rank recorder display mode",
        webMode: "Web mode",
        streamMode: "Stream mode",
        currentPoints: "Current points",
        nextTierGap: (gap: number) => `To next tier ${gap}`,
        maxTier: "Top tier reached",
        currentStreak: "Current streak",
        streakWins: "Win streak",
        nextWinGain: "Next win",
        record: "Record",
        yourDecks: "Your decks",
        opponents: "Opponent decks",
        noPlayerDecks: "No deck records yet. Log a few matches below to get started.",
        noOpponentDecks: "No opponent deck records yet.",
        panelAria: "Rank recorder panels",
        operations: "Control panel",
        records: "Records",
        logs: "Logs",
        startingState: "Starting state",
        trackerOnly: "Applies only to this tracker",
        startPoints: "Starting points",
        startWins: "Starting wins",
        startLosses: "Starting losses",
        startStreak: "Starting streak",
        matchEntry: "Match entry",
        deckPoolHint: (count: number) => `${count.toLocaleString(numberLocale.value)} decks in the current format. Search by Pokemon name.`,
        yourDeckLabel: "Your deck",
        opponentDeckLabel: "Opponent deck",
        versionLabel: (code: string) => `${code} format`,
        selected: "Selected",
        chooseYourDeck: "Select your deck first",
        chooseOpponentDeck: "Select the opponent deck first",
        clear: "Clear",
        playerSearchPlaceholder: "Search by Pokemon name, e.g. Suicune, Greninja, Scizor",
        opponentSearchPlaceholder: "Search by Pokemon name, e.g. Hydreigon, Altaria, Charizard",
        loadingDeckPool: "Loading current format deck pool...",
        noSearchResults: "No decks match that search. Try another Pokemon name.",
        deckUseCount: (count: number) => `${count.toLocaleString(numberLocale.value)} uses`,
        deckSeenCount: (count: number) => `${count.toLocaleString(numberLocale.value)} encounters`,
        deckAppearanceCount: (count: number) => `${count.toLocaleString(numberLocale.value)} appearances`,
        recordWin: "+ Record win",
        recordLoss: "+ Record loss",
        recordDraw: "+ Record draw",
        undo: "Undo last match",
        undoConfirm: "Confirm undo last match",
        reset: "Reset all records",
        resetConfirm: "Confirm reset all records",
        noRecords: "No match records yet. Add a few matches from the control panel.",
        gameCount: (games: number) => `${games} games`,
        groupSummary: (games: number, winRate: string, scoreLine: string) => `${games} games · ${winRate} · ${scoreLine}`,
        noLogs: "No match logs yet.",
        selfUsed: "Your deck",
        opponentUsed: "Opponent deck",
        pointsAfter: (points: number) => `${points} pts`,
        deleteLog: "Delete log",
        deleteLogConfirm: "Confirm delete this log",
        guestTrainer: "Guest Trainer",
        signInHint: "Sign in to save your rank record",
        unknownDeck: "Unknown deck",
        selectYourDeckError: "Select your deck first.",
        selectOpponentDeckError: "Select the opponent deck first.",
        recorded: (result: RankMatchResult) => {
          if (result === "win") return "Recorded a win.";
          if (result === "loss") return "Recorded a loss.";
          return "Recorded a draw.";
        },
        undoSuccess: "Undid the last match.",
        resetSuccess: "Reset all records.",
        deleteSuccess: "Deleted this log.",
        syncRecordWarning: "Recorded locally, but cloud sync failed.",
        syncUndoWarning: "Undid locally, but cloud sync failed.",
        syncResetWarning: "Reset locally, but cloud sync failed.",
        syncDeleteWarning: "Deleted locally, but cloud sync failed.",
        emptyDeckPool: "The current format deck pool is empty. Check whether player_entries.json is up to date.",
        deckPoolReadError: "Failed to read the current format deck pool.",
        resultLabels: { win: "W", loss: "L", draw: "D" } as Record<RankMatchResult, string>,
      }
    : {
        modeSwitchAria: "\u6392\u4f4d\u8a18\u9304\u986f\u793a\u6a21\u5f0f",
        webMode: "Web \u6a21\u5f0f",
        streamMode: "\u76f4\u64ad\u6a21\u5f0f",
        currentPoints: "\u76ee\u524d\u7a4d\u5206",
        nextTierGap: (gap: number) => `\u8ddd\u96e2\u4e0b\u4e00\u7d1a ${gap}`,
        maxTier: "\u5df2\u662f\u6700\u9ad8\u7d1a\u5225",
        currentStreak: "\u76ee\u524d\u9023\u52dd",
        streakWins: "\u9023\u52dd\u5834\u6578",
        nextWinGain: "\u4e0b\u4e00\u5834\u53ef\u5f97",
        record: "\u6230\u7e3e",
        yourDecks: "\u81ea\u5df1\u4f7f\u7528\u7684\u724c\u7d44",
        opponents: "\u9047\u5230\u7684\u724c\u7d44",
        noPlayerDecks: "\u76ee\u524d\u9084\u6c92\u6709\u81ea\u5df1\u7684\u724c\u7d44\u8a18\u9304\uff0c\u5148\u5728\u4e0b\u65b9\u64cd\u4f5c\u9762\u677f\u767b\u8a18\u5c0d\u6230\u3002",
        noOpponentDecks: "\u76ee\u524d\u9084\u6c92\u6709\u5c0d\u624b\u724c\u7d44\u8a18\u9304\u3002",
        panelAria: "\u6392\u4f4d\u8a18\u9304\u9762\u677f",
        operations: "\u64cd\u4f5c\u9762\u677f",
        records: "\u8a18\u9304\u9762\u677f",
        logs: "\u65e5\u8a8c\u9762\u677f",
        startingState: "\u8d77\u59cb\u8a2d\u5b9a",
        trackerOnly: "\u53ea\u6703\u5f71\u97ff\u9019\u500b\u8a18\u9304\u5668",
        startPoints: "\u8d77\u59cb\u7a4d\u5206",
        startWins: "\u8d77\u59cb\u52dd\u5834",
        startLosses: "\u8d77\u59cb\u6557\u5834",
        startStreak: "\u8d77\u59cb\u9023\u52dd",
        matchEntry: "\u5c0d\u6230\u767b\u9304",
        deckPoolHint: (count: number) => `\u76ee\u524d\u7248\u672c\u5171 ${count.toLocaleString(numberLocale.value)} \u526f\u724c\u7d44\uff0c\u53ef\u8f38\u5165\u5bf6\u53ef\u5922\u540d\u5b57\u6a21\u7cca\u641c\u5c0b`,
        yourDeckLabel: "\u81ea\u5df1\u4f7f\u7528\u7684\u724c\u7d44",
        opponentDeckLabel: "\u5c0d\u9762\u4f7f\u7528\u7684\u724c\u7d44",
        versionLabel: (code: string) => `${code} \u7248\u672c`,
        selected: "\u5df2\u9078\u64c7",
        chooseYourDeck: "\u8acb\u5148\u9078\u64c7\u81ea\u5df1\u4f7f\u7528\u7684\u724c\u7d44",
        chooseOpponentDeck: "\u8acb\u5148\u9078\u64c7\u5c0d\u624b\u4f7f\u7528\u7684\u724c\u7d44",
        clear: "\u6e05\u7a7a",
        playerSearchPlaceholder: "\u8f38\u5165\u5bf6\u53ef\u5922\u540d\u5b57\u641c\u5c0b\uff0c\u4f8b\u5982 Suicune\u3001Greninja\u3001Scizor",
        opponentSearchPlaceholder: "\u8f38\u5165\u5bf6\u53ef\u5922\u540d\u5b57\u641c\u5c0b\uff0c\u4f8b\u5982 Hydreigon\u3001Altaria\u3001Charizard",
        loadingDeckPool: "\u8f09\u5165\u76ee\u524d\u7248\u672c\u724c\u6c60\u4e2d...",
        noSearchResults: "\u627e\u4e0d\u5230\u7b26\u5408\u95dc\u9375\u5b57\u7684\u724c\u7d44\uff0c\u8a66\u8a66\u8f38\u5165\u5176\u4ed6\u5bf6\u53ef\u5922\u540d\u5b57\u3002",
        deckUseCount: (count: number) => `${count.toLocaleString(numberLocale.value)} \u6b21\u4f7f\u7528`,
        deckSeenCount: (count: number) => `${count.toLocaleString(numberLocale.value)} \u6b21\u9047\u5230`,
        deckAppearanceCount: (count: number) => `${count.toLocaleString(numberLocale.value)} \u6b21\u51fa\u73fe`,
        recordWin: "+ \u8a18\u9304\u52dd\u5834",
        recordLoss: "+ \u8a18\u9304\u6557\u5834",
        recordDraw: "+ \u8a18\u9304\u5e73\u5c40",
        undo: "\u64a4\u92b7\u4e0a\u4e00\u5834",
        undoConfirm: "\u518d\u6b21\u78ba\u8a8d\u64a4\u92b7\u4e0a\u4e00\u5834",
        reset: "\u91cd\u7f6e\u6240\u6709\u8a18\u9304",
        resetConfirm: "\u518d\u6b21\u78ba\u8a8d\u91cd\u7f6e\u6240\u6709\u8a18\u9304",
        noRecords: "\u76ee\u524d\u9084\u6c92\u6709\u5c0d\u6230\u8a18\u9304\uff0c\u5148\u5728\u64cd\u4f5c\u9762\u677f\u767b\u8a18\u5e7e\u5834\u3002",
        gameCount: (games: number) => `${games} \u5834`,
        groupSummary: (games: number, winRate: string, scoreLine: string) => `${games} \u5834\u30fb${winRate}\u30fb${scoreLine}`,
        noLogs: "\u76ee\u524d\u9084\u6c92\u6709\u65e5\u8a8c\u8a18\u9304\u3002",
        selfUsed: "\u81ea\u5df1\u4f7f\u7528",
        opponentUsed: "\u5c0d\u624b\u4f7f\u7528",
        pointsAfter: (points: number) => `${points} \u5206`,
        deleteLog: "\u522a\u9664\u9019\u7b46\u65e5\u8a8c",
        deleteLogConfirm: "\u518d\u6b21\u78ba\u8a8d\u522a\u9664\u9019\u7b46\u65e5\u8a8c",
        guestTrainer: "\u8a2a\u5ba2\u8a13\u7df4\u5bb6",
        signInHint: "\u767b\u5165\u5f8c\u5373\u53ef\u4fdd\u5b58\u4f60\u7684\u6392\u4f4d\u8a18\u9304",
        unknownDeck: "\u672a\u77e5\u724c\u7d44",
        selectYourDeckError: "\u8acb\u5148\u9078\u64c7\u81ea\u5df1\u4f7f\u7528\u7684\u724c\u7d44\u3002",
        selectOpponentDeckError: "\u8acb\u5148\u9078\u64c7\u5c0d\u624b\u4f7f\u7528\u7684\u724c\u7d44\u3002",
        recorded: (result: RankMatchResult) => {
          if (result === "win") return "\u5df2\u8a18\u9304\u4e00\u5834\u52dd\u5834\u3002";
          if (result === "loss") return "\u5df2\u8a18\u9304\u4e00\u5834\u6557\u5834\u3002";
          return "\u5df2\u8a18\u9304\u4e00\u5834\u5e73\u5c40\u3002";
        },
        undoSuccess: "\u5df2\u64a4\u92b7\u4e0a\u4e00\u5834\u8a18\u9304\u3002",
        resetSuccess: "\u5df2\u91cd\u7f6e\u6240\u6709\u8a18\u9304\u3002",
        deleteSuccess: "\u5df2\u522a\u9664\u6b64\u7b46\u65e5\u8a8c\u3002",
        syncRecordWarning: "\u5df2\u8a18\u9304\u5230\u672c\u6a5f\uff0c\u4f46\u96f2\u7aef\u540c\u6b65\u5931\u6557\u3002",
        syncUndoWarning: "\u5df2\u5728\u672c\u6a5f\u64a4\u92b7\uff0c\u4f46\u96f2\u7aef\u540c\u6b65\u5931\u6557\u3002",
        syncResetWarning: "\u5df2\u5728\u672c\u6a5f\u91cd\u7f6e\uff0c\u4f46\u96f2\u7aef\u540c\u6b65\u5931\u6557\u3002",
        syncDeleteWarning: "\u5df2\u5728\u672c\u6a5f\u522a\u9664\uff0c\u4f46\u96f2\u7aef\u540c\u6b65\u5931\u6557\u3002",
        emptyDeckPool: "\u76ee\u524d\u7248\u672c\u724c\u6c60\u70ba\u7a7a\uff0c\u8acb\u78ba\u8a8d player_entries.json \u5df2\u5b8c\u6210\u66f4\u65b0\u3002",
        deckPoolReadError: "\u8b80\u53d6\u76ee\u524d\u7248\u672c\u724c\u6c60\u6642\u767c\u751f\u932f\u8aa4\u3002",
        resultLabels: { win: "\u52dd", loss: "\u8ca0", draw: "\u5e73" } as Record<RankMatchResult, string>,
      },
);
const storageKey = computed(() => `battle-tower-rank-tracker:${profile.value?.id ?? "guest"}`);
const summary = computed(() => analyzeRankTrackerState(state));
const playerName = computed(() => profile.value?.display_name || profile.value?.handle || ui.value.guestTrainer);
const profileLine = computed(() => (profile.value?.handle ? `@${profile.value.handle}` : ui.value.signInHint));
const currentVersion = computed(() => inferVersionByStartMs(Date.now()));
const currentVersionCode = computed(() => currentVersion.value?.code ?? (locale.value === "en" ? "Current" : "\u76ee\u524d"));
const ballIcon = computed(() => ballIcons[summary.value.currentTier.ball]);
const iconIndex = Object.fromEntries(Object.entries(deckIconModules).map(([file, src]) => [normalize(getBase(file)), src]));
const manifestIndex = (manifest as ManifestEntry[]).map((item) => ({ ...item, norm: normalize(item.slug), compact: compact(item.slug) }));
const deckPoolMap = computed(() => {
  const map = new Map<string, DeckPoolRow>();
  for (const item of deckPool.value) {
    addDeckAlias(map, item.key, item);
    addDeckAlias(map, item.rawName, item);
    addDeckAlias(map, item.displayName, item);
  }
  return map;
});
const selectedPlayerDeckVisual = computed(() => resolveDeckVisual(state.currentPlayerDeck));
const selectedOpponentDeckVisual = computed(() => resolveDeckVisual(state.lastOpponentDeck));
const playerDeckRows = computed(() => summary.value.playerDecks.map((deck) => ({ ...resolveDeckVisual(deck.name), ...deck })));
const opponentDeckRows = computed(() => summary.value.opponentDecks.map((deck) => ({ ...resolveDeckVisual(deck.name), ...deck })));
const playerDeckResults = computed(() => filterDeckPool(playerDeckQuery.value));
const opponentDeckResults = computed(() => filterDeckPool(opponentDeckQuery.value));
const maxOpponentCount = computed(() => Math.max(1, ...opponentDeckRows.value.map((item) => item.count)));
const logRows = computed(() => summary.value.matches.map((item) => ({ ...item, playerDeckVisual: resolveDeckVisual(item.playerDeck), opponentDeckVisual: resolveDeckVisual(item.opponentDeck) })));
const groupedMatchups = computed(() => {
  const sortLocale = locale.value === "en" ? "en" : "zh-Hant";
  const map = new Map<string, { key: string; displayName: string; wins: number; losses: number; draws: number; games: number; winRate: number | null; spriteUrls: string[]; rows: Array<{ key: string; displayName: string; wins: number; losses: number; draws: number; games: number; winRate: number | null; spriteUrls: string[] }> }>();
  for (const item of summary.value.matchups) {
    const playerVisual = resolveDeckVisual(item.playerDeck);
    const opponentVisual = resolveDeckVisual(item.opponentDeck);
    const key = item.playerDeck.trim().toLowerCase();
    const group = map.get(key) ?? { key, displayName: playerVisual.displayName, wins: 0, losses: 0, draws: 0, games: 0, winRate: null, spriteUrls: playerVisual.spriteUrls, rows: [] };
    group.wins += item.wins;
    group.losses += item.losses;
    group.draws += item.draws;
    group.games += item.games;
    group.winRate = group.wins + group.losses > 0 ? group.wins / (group.wins + group.losses) : null;
    group.rows.push({ key: item.key, displayName: opponentVisual.displayName, wins: item.wins, losses: item.losses, draws: item.draws, games: item.games, winRate: item.winRate, spriteUrls: opponentVisual.spriteUrls });
    map.set(key, group);
  }
  return [...map.values()].map((group) => ({ ...group, rows: group.rows.sort((a, b) => b.games - a.games || a.displayName.localeCompare(b.displayName, sortLocale, { sensitivity: "base" })) })).sort((a, b) => b.games - a.games || a.displayName.localeCompare(b.displayName, sortLocale, { sensitivity: "base" }));
});

watch(() => storageKey.value, (next, prev) => loadState(next, prev ?? null), { immediate: true });
watch(state, () => {
  if (ready.value && typeof window !== "undefined") {
    window.localStorage.setItem(storageKey.value, JSON.stringify(state));
  }
}, { deep: true });
watch(locale, () => {
  if (deckPool.value.length) {
    deckPool.value = deckPool.value.map((row) => localizeDeckRow(row));
  }
});
onMounted(async () => {
  ready.value = true;
  if (typeof document !== "undefined") {
    document.addEventListener("pointerdown", handlePointerDown);
  }
  await loadDeckPool();
});
onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.removeEventListener("pointerdown", handlePointerDown);
  }
});

function loadState(nextKey: string, prevKey: string | null) {
  if (prevKey && prevKey !== nextKey && typeof window !== "undefined") {
    window.localStorage.setItem(prevKey, JSON.stringify(state));
  }
  clearPending();
  status.message = "";
  status.error = "";
  Object.assign(state, createDefaultRankTrackerState(), readState(nextKey));
  void syncUnsyncedMatches();
}

function readState(key: string) {
  if (typeof window === "undefined") return createDefaultRankTrackerState();
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? sanitizeRankTrackerState(JSON.parse(raw)) : createDefaultRankTrackerState();
  } catch {
    return createDefaultRankTrackerState();
  }
}

function clearPending() {
  confirmUndo.value = false;
  confirmReset.value = false;
  deleteTarget.value = null;
}

function handlePointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (!target) return;
  if (playerPickerRef.value && !playerPickerRef.value.contains(target)) {
    playerMenuOpen.value = false;
  }
  if (opponentPickerRef.value && !opponentPickerRef.value.contains(target)) {
    opponentMenuOpen.value = false;
  }
}

async function loadDeckPool() {
  deckPoolLoading.value = true;
  deckPoolError.value = "";
  try {
    const versionCode = currentVersion.value?.code ?? "";
    const entries = await loadPlayerEntries();
    const pool = new Map<string, DeckPoolRow>();

    for (const entry of entries) {
      if (!entry.deckName && !entry.deckId && !entry.deckIcons?.length) continue;
      if (versionCode && entry.versionCode !== versionCode) continue;
      const identity = buildDeckIdentity(entry);
      if (!identity) continue;

      const existing = pool.get(identity.key) ?? {
        key: identity.key,
        displayName: "",
        rawName: identity.rawName,
        iconKeys: identity.iconKeys,
        spriteUrls: resolveSpriteUrls(identity.iconKeys, identity.key, identity.rawName),
        searchText: "",
        searchCompact: "",
        count: 0,
      };

      existing.count += 1;
      if (!existing.iconKeys.length && identity.iconKeys.length) {
        existing.iconKeys = identity.iconKeys;
        existing.spriteUrls = resolveSpriteUrls(identity.iconKeys, identity.key, identity.rawName);
      }
      if (!existing.rawName && identity.rawName) {
        existing.rawName = identity.rawName;
      }

      pool.set(identity.key, existing);
    }

    deckPool.value = [...pool.values()]
      .map((row) => localizeDeckRow(row))
      .sort((a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName, locale.value === "en" ? "en" : "zh-Hant", { sensitivity: "base" }));

    if (!deckPool.value.length) {
      deckPoolError.value = ui.value.emptyDeckPool;
    }
  } catch (error) {
    deckPoolError.value = error instanceof Error ? error.message : ui.value.deckPoolReadError;
  } finally {
    deckPoolLoading.value = false;
  }
}

async function addMatch(result: RankMatchResult) {
  clearPending();
  status.error = "";
  status.message = "";

  if (!state.currentPlayerDeck) {
    status.error = ui.value.selectYourDeckError;
    return;
  }
  if (!state.lastOpponentDeck) {
    status.error = ui.value.selectOpponentDeckError;
    return;
  }

  const match = {
    id: `match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerDeck: state.currentPlayerDeck,
    opponentDeck: state.lastOpponentDeck,
    result,
    createdAt: new Date().toISOString(),
    remoteLogId: null,
  };

  state.matches.push(match);

  status.message = ui.value.recorded(result);

  if (!profile.value?.id || !hasSupabaseConfig) return;

  try {
    const remote = await createRankLog({
      playerDeck: match.playerDeck,
      opponentDeck: match.opponentDeck,
      result: match.result,
      queueType: "Ranked",
      firstPlayer: null,
      notes: "",
      rankTier: summary.value.currentTier.id,
      versionCode: currentVersion.value?.code ?? "",
    });
    match.remoteLogId = remote?.id ?? null;
  } catch (error) {
    console.error("[RankTrackerPanel] sync record failed:", error);
    status.message = ui.value.syncRecordWarning;
  }
}

async function syncUnsyncedMatches() {
  if (syncingRemoteMatches.value || !profile.value?.id || !hasSupabaseConfig) return;

  const pendingMatches = state.matches.filter((item) => !item.remoteLogId && item.playerDeck && item.opponentDeck);
  if (!pendingMatches.length) return;

  syncingRemoteMatches.value = true;

  try {
    for (const match of pendingMatches) {
      if (match.remoteLogId) continue;
      const remote = await createRankLog({
        playerDeck: match.playerDeck,
        opponentDeck: match.opponentDeck,
        result: match.result,
        queueType: "Ranked",
        firstPlayer: null,
        notes: "",
        rankTier: "",
        versionCode: inferVersionByStartMs(Date.parse(match.createdAt))?.code ?? currentVersion.value?.code ?? "",
      });
      match.remoteLogId = remote?.id ?? null;
    }
  } catch (error) {
    console.error("[RankTrackerPanel] initial sync failed:", error);
  } finally {
    syncingRemoteMatches.value = false;
  }
}

async function undoLast() {
  status.error = "";
  status.message = "";
  if (!summary.value.matches.length) return;
  if (!confirmUndo.value) {
    confirmUndo.value = true;
    confirmReset.value = false;
    deleteTarget.value = null;
    return;
  }
  const removed = state.matches.pop() ?? null;
  clearPending();
  status.message = ui.value.undoSuccess;

  if (!removed?.remoteLogId || !profile.value?.id || !hasSupabaseConfig) return;

  try {
    await deleteRankLog(removed.remoteLogId);
  } catch (error) {
    console.error("[RankTrackerPanel] sync undo failed:", error);
    status.message = ui.value.syncUndoWarning;
  }
}

async function resetAll() {
  status.error = "";
  status.message = "";
  if (!confirmReset.value) {
    confirmReset.value = true;
    confirmUndo.value = false;
    deleteTarget.value = null;
    return;
  }
  const remoteLogIds = state.matches
    .map((item) => item.remoteLogId)
    .filter((value): value is string => Boolean(value));
  Object.assign(state, createDefaultRankTrackerState(), {
    startPoints: state.startPoints,
    startWins: state.startWins,
    startLosses: state.startLosses,
    startStreak: state.startStreak,
  });
  clearPending();
  status.message = ui.value.resetSuccess;

  if (!remoteLogIds.length || !profile.value?.id || !hasSupabaseConfig) return;

  try {
    await deleteRankLogs(remoteLogIds);
  } catch (error) {
    console.error("[RankTrackerPanel] sync reset failed:", error);
    status.message = ui.value.syncResetWarning;
  }
}

async function deleteMatch(id: string) {
  status.error = "";
  status.message = "";
  if (deleteTarget.value !== id) {
    deleteTarget.value = id;
    confirmUndo.value = false;
    confirmReset.value = false;
    return;
  }
  const removed = state.matches.find((item) => item.id === id) ?? null;
  state.matches = state.matches.filter((item) => item.id !== id);
  deleteTarget.value = null;
  status.message = ui.value.deleteSuccess;

  if (!removed?.remoteLogId || !profile.value?.id || !hasSupabaseConfig) return;

  try {
    await deleteRankLog(removed.remoteLogId);
  } catch (error) {
    console.error("[RankTrackerPanel] sync delete failed:", error);
    status.message = ui.value.syncDeleteWarning;
  }
}

function resultLabel(result: RankMatchResult) {
  return ui.value.resultLabels[result];
}

function pct(value: number | null) {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function record(wins: number, losses: number, draws: number) {
  return `${wins}-${losses}-${draws}`;
}

function fmtDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(locale.value === "en" ? "en-US" : "zh-HK", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function opponentBarWidth(count: number) {
  return `${Math.max(8, (count / maxOpponentCount.value) * 100)}%`;
}

function opponentShare(count: number) {
  const total = opponentDeckRows.value.reduce((sum, item) => sum + item.count, 0);
  if (!total) return "0.0%";
  return `${((count / total) * 100).toFixed(1)}%`;
}

function rankTierLabel(tier: RankTierDefinition) {
  return locale.value === "en" ? tier.labelEn : tier.labelZh;
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function compact(value: unknown) {
  return normalize(value).replace(/[^a-z0-9]+/g, "");
}

function getBase(path: string) {
  return path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "";
}

function normalizeStringArray(value: unknown) {
  const input = Array.isArray(value) ? value : value == null ? [] : [value];
  return [...new Set(input.map((item) => String(item ?? "").trim()).filter(Boolean))];
}

function isInvalidDeckToken(value: string) {
  const s = normalize(value);
  return !s || ["unknown", "undefined", "null", "none", "nan"].includes(s);
}

function cleanDeckText(value: string) {
  return isInvalidDeckToken(value) ? "" : String(value).trim();
}

function slugify(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function humanizeDeckId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => (/^[ab]\d+[a-z]?$/i.test(part) ? part.toUpperCase() : part === "ex" ? "ex" : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

function parseTwoFromDeckId(deckId?: string) {
  if (!deckId) return [];
  const tokens = normalize(deckId).split("-").filter(Boolean);
  const mons: string[] = [];
  let current: string[] = [];
  for (const token of tokens) {
    if (/^[ab]\d+[a-z]?$/.test(token)) {
      if (current.length) mons.push(current.join("-"));
      current = [];
      continue;
    }
    current.push(token);
  }
  if (current.length) mons.push(current.join("-"));
  return mons.slice(0, 2);
}

function parseTwoFromDeckName(deckName?: string) {
  const text = cleanDeckText(String(deckName ?? ""));
  if (!text) return [];
  return text
    .split(/\s+\/\s+|\s+\+\s+|,/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map(slugify);
}

function buildDeckIdentity(entry: DecoratedPlayerEntry) {
  const rawName = cleanDeckText(entry.deckName ?? "");
  const rawId = cleanDeckText(entry.deckId ?? "");
  const iconKeys = normalizeStringArray(entry.deckIcons).slice(0, 2).map(slugify);
  const key = rawId || slugify(rawName) || slugify(iconKeys.join("-"));
  if (!key || isInvalidDeckToken(key)) return null;
  return { key, rawName: rawName || humanizeDeckId(key), iconKeys };
}

function resolveSpriteUrls(iconKeys: string[], ...fallbacks: string[]) {
  const urls: string[] = [];
  for (const iconKey of [...iconKeys, ...fallbacks.map(slugify)]) {
    const normalizedKey = normalize(iconKey);
    if (!normalizedKey) continue;
    const direct = iconIndex[normalizedKey];
    if (direct && !urls.includes(direct)) {
      urls.push(direct);
      continue;
    }
    const fallback = manifestIndex.find((item) => item.norm === normalizedKey || item.compact === compact(iconKey) || item.norm.includes(normalizedKey));
    if (fallback && !urls.includes(fallback.src)) {
      urls.push(fallback.src);
    }
  }
  return urls.slice(0, 2);
}

function localizeDeckName(rawName: string, iconKeys: string[], fallbackKey = "") {
  const localized = getLocalizedDeckName(rawName, iconKeys, locale.value);
  if (localized) return localized;
  const fallbackSource = cleanDeckText(rawName) || cleanDeckText(fallbackKey);
  if (!fallbackSource) return ui.value.unknownDeck;
  return fallbackSource.includes("-") ? humanizeDeckId(fallbackSource) : fallbackSource;
}

function buildDeckSearchText(row: Pick<DeckPoolRow, "key" | "rawName" | "iconKeys" | "displayName">) {
  const zhName = getLocalizedDeckName(row.rawName, row.iconKeys, "zh");
  const enName = getLocalizedDeckName(row.rawName, row.iconKeys, "en");
  return [
    row.displayName,
    row.rawName,
    zhName,
    enName,
    row.key,
    ...row.iconKeys,
    ...parseTwoFromDeckId(row.key),
    ...parseTwoFromDeckName(row.rawName),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function localizeDeckRow(row: DeckPoolRow): DeckPoolRow {
  const displayName = localizeDeckName(row.rawName, row.iconKeys, row.key);
  const searchText = buildDeckSearchText({ ...row, displayName });
  return { ...row, displayName, searchText, searchCompact: compact(searchText) };
}

function addDeckAlias(map: Map<string, DeckPoolRow>, alias: string, row: DeckPoolRow) {
  const cleaned = cleanDeckText(alias);
  if (!cleaned) return;
  map.set(cleaned, row);
  map.set(normalize(cleaned), row);
  map.set(slugify(cleaned), row);
}

function resolveDeckVisual(raw: string) {
  const text = cleanDeckText(raw);
  if (!text) {
    return { key: "unknown", displayName: ui.value.unknownDeck, rawName: "", iconKeys: [], spriteUrls: [], searchText: "", searchCompact: "", count: 0 };
  }
  const exact = deckPoolMap.value.get(text) || deckPoolMap.value.get(normalize(text)) || deckPoolMap.value.get(slugify(text));
  if (exact) return exact;
  const iconKeys = parseTwoFromDeckId(text).length ? parseTwoFromDeckId(text) : parseTwoFromDeckName(text);
  return {
    key: slugify(text) || text,
    displayName: localizeDeckName(text, iconKeys, text),
    rawName: text,
    iconKeys,
    spriteUrls: resolveSpriteUrls(iconKeys, text),
    searchText: "",
    searchCompact: "",
    count: 0,
  };
}

function matchesDeckQuery(row: DeckPoolRow, query: string) {
  if (!query) return true;
  const lower = normalize(query);
  const dense = compact(query);
  return row.searchText.includes(lower) || row.searchCompact.includes(dense);
}

function filterDeckPool(query: string) {
  return deckPool.value.filter((row) => matchesDeckQuery(row, query));
}

function pickDeck(side: "player" | "opponent", option: DeckPoolRow) {
  clearPending();
  status.error = "";
  status.message = "";
  if (side === "player") {
    state.currentPlayerDeck = option.key;
    playerDeckQuery.value = "";
    playerMenuOpen.value = false;
  } else {
    state.lastOpponentDeck = option.key;
    opponentDeckQuery.value = "";
    opponentMenuOpen.value = false;
  }
}

function clearDeckSelection(side: "player" | "opponent") {
  clearPending();
  if (side === "player") {
    state.currentPlayerDeck = "";
  } else {
    state.lastOpponentDeck = "";
  }
}
</script>

<style scoped>
 .tracker { display: grid; gap: 1.5rem; }
 .card, .subcard { background: rgba(10, 24, 44, 0.92); border: 1px solid rgba(111, 189, 255, 0.16); border-radius: 28px; padding: 1.4rem; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
 .hero { display: grid; gap: 1.15rem; }
 .hero__stats, .summary-grid, .ops-grid, .selector-grid--slots, .fields, .deck-card__stats { display: grid; gap: 1rem; }
 .hero__stats { grid-template-columns: minmax(0, 1.24fr) repeat(2, minmax(0, 1fr)); align-items: stretch; }
 .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
 .ops-grid { grid-template-columns: 0.95fr 1.35fr; }
 .selector-grid--slots, .fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
 .hero__head, .section-head, .stat__head, .opponent-bar__head, .selector-card__top, .deck-card__main, .deck-row__main, .log__matchup, .deck-row__meta, .actions { display: flex; align-items: center; justify-content: space-between; gap: 0.9rem; }
 .hero__controls { display: grid; justify-items: end; gap: 0.5rem; }
 .mode-switch { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem; border-radius: 999px; border: 1px solid rgba(111, 189, 255, 0.18); background: rgba(9, 20, 36, 0.82); }
 .mode-switch__button { border: 0; border-radius: 999px; padding: 0.6rem 1rem; background: transparent; color: #9db8db; cursor: pointer; font-weight: 800; }
 .mode-switch__button--active { background: linear-gradient(180deg, rgba(56, 129, 220, 0.92), rgba(34, 94, 170, 0.92)); color: #f5fbff; }
 .kicker { letter-spacing: 0.24em; color: #76c9ff; margin: 0 0 0.45rem; font-size: 0.76rem; }
 .sub, .meta, .mini-stat__label { color: #8aa7ca; }
 .count { color: #9fcbff; }
 .stat { display: grid; gap: 0.95rem; padding: 1.15rem 1.2rem; border-radius: 24px; border: 1px solid rgba(111, 189, 255, 0.16); background: rgba(16, 34, 60, 0.82); min-height: 100%; }
 .stat__head { align-items: flex-start; }
 .stat__head span:last-child { color: #9fcbff; }
 .stat strong, .rankline__copy strong { font-size: clamp(2rem, 4vw, 3.1rem); line-height: 1; }
 .stat p, .rankline__copy p, .deck-card__copy p, .deck-row__copy p { margin: 0.25rem 0 0; color: #c4d7f2; }
 .rankline { display: flex; align-items: center; gap: 0.9rem; }
 .rankline--points { width: 100%; justify-content: space-between; }
 .rankline__copy { margin-left: auto; text-align: right; display: grid; gap: 0.2rem; justify-items: end; }
 .ball { width: 4rem; height: 4rem; object-fit: contain; }
 .split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
 .split--compact div { padding: 0.9rem 1rem; border-radius: 18px; background: rgba(26, 54, 91, 0.74); min-height: 100%; display: grid; align-content: center; }
  .stream-splitline { display: grid; grid-template-columns: 1fr; gap: 0.55rem; }
  .stream-splitline__item { border-radius: 16px; background: rgba(26, 54, 91, 0.74); padding: 0.7rem 0.75rem; display: grid; gap: 0.16rem; align-content: center; min-height: 100%; }
  .stream-splitline__item strong { font-size: clamp(2.2rem, 5.5vw, 2.8rem); line-height: 1; }
 .stream-splitline__item p { margin: 0; font-size: 0.95rem; line-height: 1.05; }
 .recordline { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
 .recordline--stacked { align-items: flex-start; flex-direction: column; gap: 0.25rem; }
  .recordline__solo { margin: 0; font-size: 1.45rem; line-height: 1.05; }
 .recordline__copy { display: inline-flex; align-items: baseline; justify-content: flex-end; gap: 0.75rem; flex-wrap: wrap; }
 .recordline__copy p { margin: 0; }
 .section-head h2, .section-head h3, .hero__head h1 { margin: 0; }
.deck-list, .opponent-bars, .records, .logs { display: grid; gap: 1rem; }
.deck-card, .opponent-bar, .record-row, .deck-picker__selected { border: 1px solid rgba(111, 189, 255, 0.16); border-radius: 22px; background: rgba(13, 29, 52, 0.82); padding: 1rem; }
.deck-card__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 1rem; }
.mini-stat { border-radius: 18px; background: rgba(29, 58, 94, 0.75); padding: 0.9rem 1rem; display: grid; gap: 0.35rem; }
.mini-stat strong { font-size: 1.55rem; }
.opponent-bar__track { margin-top: 0.9rem; height: 0.75rem; border-radius: 999px; background: rgba(44, 73, 116, 0.72); overflow: hidden; }
.opponent-bar__fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #6bc8ff, #dca35d); }
.opponent-bar__streamline { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 0.75rem; }
.tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.85rem; margin-bottom: 1rem; }
.tab, .action, .ghost, .deck-search__option { border: 1px solid rgba(111, 189, 255, 0.2); background: rgba(14, 32, 57, 0.9); color: #eef6ff; cursor: pointer; }
.tab { border-radius: 18px; padding: 0.95rem 1rem; font-weight: 700; }
.tab--active { background: linear-gradient(180deg, rgba(56, 129, 220, 0.92), rgba(34, 94, 170, 0.92)); }
.fields label { display: grid; gap: 0.45rem; color: #d9e9ff; font-weight: 700; }
.fields input, .deck-search__field input { width: 100%; border: 1px solid rgba(111, 189, 255, 0.22); border-radius: 14px; background: #081223; color: #f4f9ff; padding: 0.85rem 0.95rem; }
 .deck-picker { position: relative; display: grid; gap: 0.85rem; }
 .deck-picker__selected { display: flex; align-items: center; justify-content: space-between; gap: 0.85rem; }
 .deck-picker__selected--empty { color: #9db8db; }
 .deck-picker__selected-copy { flex: 1; min-width: 0; display: grid; gap: 0.25rem; }
 .deck-picker__clear, .deck-search__clear { border: 0; background: transparent; color: #76c9ff; cursor: pointer; font-weight: 700; }
 .deck-search__field { display: flex; align-items: center; gap: 0.6rem; border: 1px solid rgba(111, 189, 255, 0.18); border-radius: 16px; padding: 0 0.75rem; background: rgba(9, 20, 36, 0.92); }
 .deck-search__field input { border: 0; background: transparent; padding-left: 0; padding-right: 0; }
 .deck-search__menu { position: absolute; top: calc(100% + 0.55rem); left: 0; right: 0; z-index: 30; max-height: 27rem; overflow: auto; display: grid; gap: 0.75rem; padding: 0.8rem; border-radius: 22px; border: 1px solid rgba(111, 189, 255, 0.18); background: rgba(10, 24, 44, 0.98); box-shadow: 0 26px 42px rgba(0, 0, 0, 0.34); }
 .deck-search__option { display: flex; align-items: center; gap: 0.85rem; text-align: left; border-radius: 18px; padding: 0.8rem 0.9rem; }
.deck-search__option--active { background: rgba(37, 89, 160, 0.92); }
.deck-search__option-copy { display: grid; gap: 0.2rem; min-width: 0; }
.deck-search__empty, .empty { color: #9db8db; border: 1px dashed rgba(111, 189, 255, 0.18); border-radius: 18px; padding: 1rem; }
.sprites { display: flex; align-items: center; gap: 0.35rem; min-width: fit-content; }
.sprite { width: 2.5rem; height: 2.5rem; object-fit: contain; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.28)); }
.sprite--large { width: 3rem; height: 3rem; }
.sprite--small { width: 2rem; height: 2rem; }
.fallback { width: 2.65rem; height: 2.65rem; border-radius: 999px; display: grid; place-items: center; background: rgba(34, 89, 150, 0.9); }
.fallback--small { width: 2rem; height: 2rem; font-size: 0.75rem; }
.actions { flex-wrap: wrap; margin-top: 1rem; }
.action, .ghost { border-radius: 16px; padding: 0.9rem 1.1rem; font-weight: 800; }
.action--win { background: rgba(16, 121, 74, 0.92); }
.action--loss { background: rgba(150, 42, 55, 0.92); }
.action--draw { background: rgba(174, 129, 33, 0.92); }
.ghost--danger { border-color: rgba(255, 120, 120, 0.36); color: #ffd0d0; }
.notice { margin-top: 1rem; padding: 0.9rem 1rem; border-radius: 16px; }
.notice--ok { background: rgba(22, 96, 62, 0.32); color: #bff3d8; }
.notice--error { background: rgba(121, 37, 49, 0.32); color: #ffd4dc; }
.record-row, .log__main, .log__deck { display: flex; align-items: center; gap: 0.85rem; }
.record-row { justify-content: space-between; flex-wrap: wrap; }
.deck-row__copy { min-width: 0; }
.pill { border-radius: 999px; padding: 0.45rem 0.75rem; background: rgba(27, 59, 96, 0.82); }
.result { width: 2.25rem; height: 2.25rem; border-radius: 999px; display: grid; place-items: center; }
.result--win { background: rgba(32, 126, 82, 0.88); }
.result--loss { background: rgba(148, 44, 61, 0.88); }
.result--draw { background: rgba(174, 129, 33, 0.88); }
 .log__vs { color: #8aa7ca; }
  .tracker--stream { width: min(100%, 38.75rem); justify-self: start; gap: 0.75rem; align-content: start; }
  .summary-grid--stream { grid-template-columns: 1fr; width: 100%; justify-self: stretch; gap: 0.5rem; }
  .stream-player-card { max-width: none; }
  .tracker--stream .hero { width: 100%; justify-self: start; gap: 0.65rem; padding: 0.85rem; }
  .tracker--stream .stream-player-card { order: 4; }
  .tracker--stream .hero__head { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 0.45rem; }
  .tracker--stream .hero__head h1 { font-size: clamp(1.55rem, 4vw, 2.05rem); line-height: 1; word-break: keep-all; overflow-wrap: anywhere; }
  .tracker--stream .sub { font-size: 0.76rem; }
  .tracker--stream .kicker { margin-bottom: 0.25rem; font-size: 0.68rem; }
  .tracker--stream .hero__controls { gap: 0.35rem; }
  .tracker--stream .mode-switch { padding: 0.28rem; gap: 0.25rem; }
  .tracker--stream .mode-switch__button { padding: 0.4rem 0.68rem; font-size: 0.82rem; }
  .tracker--stream .hero__stats { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; }
  .tracker--stream .stat--points { grid-column: auto; }
  .tracker--stream .stat { padding: 0.78rem 0.82rem; gap: 0.55rem; border-radius: 22px; }
  .tracker--stream .stat__head { font-size: 0.76rem; gap: 0.4rem; }
  .tracker--stream .rankline--points { gap: 0.62rem; align-items: center; }
  .tracker--stream .rankline__copy strong { font-size: clamp(1.95rem, 4.9vw, 2.45rem); }
  .tracker--stream .rankline__copy p { font-size: 1rem; }
  .tracker--stream .ball { width: 2.8rem; height: 2.8rem; }
  .tracker--stream .stream-splitline { gap: 0.4rem; }
  .tracker--stream .stream-splitline__item { padding: 0.52rem 0.6rem; border-radius: 15px; }
  .tracker--stream .stream-splitline__item strong { font-size: clamp(1.85rem, 4.8vw, 2.2rem); }
  .tracker--stream .stream-splitline__item p { font-size: 0.8rem; line-height: 1.05; }
  .tracker--stream .recordline > strong { font-size: clamp(1.85rem, 4.9vw, 2.3rem); }
  .tracker--stream .recordline__solo { font-size: 0.98rem; line-height: 1.05; }
  .tracker--stream .stat--record .recordline,
  .tracker--stream .stat--streak .stream-splitline { min-height: 100%; justify-content: center; }
  .tracker--stream .summary-grid--stream > .card { padding: 0.8rem; display: grid; gap: 0.65rem; }
  .tracker--stream .section-head h2 { font-size: 1.42rem; }
  .tracker--stream .count { font-size: 0.9rem; }
  .tracker--stream .opponent-bars { gap: 0.28rem; max-height: none; height: auto; overflow: visible; padding-right: 0; align-content: start; }
  .tracker--stream .opponent-bar { padding: 0.42rem 0.46rem; border-radius: 16px; }
  .tracker--stream .opponent-bar__track { margin-top: 0; }
  .tracker--stream .opponent-bar__count { min-width: fit-content; font-size: 0.84rem; }
  .tracker--stream .opponent-bar__streamline { gap: 0.28rem; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; }
  .tracker--stream .sprites { gap: 0.18rem; }
  .tracker--stream .sprite { width: 1.58rem; height: 1.58rem; }
  .tracker--stream .opponent-bar__fill { min-width: 0.75rem; }
  .tracker--stream .tabs,
  .tracker--stream .ops-grid,
  .tracker--stream .selector-grid--slots,
 .tracker--stream .fields { grid-template-columns: 1fr; }
 @media (max-width: 1080px) { .hero__stats, .summary-grid, .ops-grid, .selector-grid--slots, .fields { grid-template-columns: 1fr; } .summary-grid--stream, .tracker--stream .hero { max-width: none; } }
 @media (max-width: 720px) { .hero__head, .section-head { align-items: flex-start; flex-direction: column; } .mode-switch { width: 100%; justify-content: stretch; } .mode-switch__button { flex: 1; } .tabs { grid-template-columns: 1fr; } .deck-card__stats { grid-template-columns: 1fr; } .stat strong, .rankline__copy strong { font-size: 2.2rem; } .recordline { align-items: flex-start; flex-direction: column; } .recordline__copy { justify-items: start; } .record-row { align-items: flex-start; } }
</style>
