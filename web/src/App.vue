<template>
  <div class="app">
    <BackgroundEffects />

    <header class="topbar">
      <div class="topbar__left">
        <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <RouterLink :to="metaHomeRoute" class="brand">
          <div>
            <div class="logo">
              <span>Battle Tower</span>
              <em>Meta</em>
            </div>
            <div class="sub">Competition intelligence</div>
          </div>
        </RouterLink>
      </div>

      <nav class="topbar__nav">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="navlink"
          active-class="is-active"
        >
          {{ label(item.key) }}
        </RouterLink>
      </nav>

      <div class="topbar__right">
        <TopbarAccountMenu />
        <RouterLink :to="switchLangTo('zh')" class="lang" active-class="is-active">中文</RouterLink>
        <RouterLink :to="switchLangTo('en')" class="lang" active-class="is-active">EN</RouterLink>
      </div>
    </header>

    <div class="signal-strip" aria-label="Upcoming tournament feed">
      <div class="signal-strip__track">
        <div class="upcoming-ticker" aria-label="Upcoming tournaments in the next 24 hours">
          <span class="upcoming-ticker__label">UPCOMING / 24H</span>

          <div class="upcoming-ticker__viewport">
            <div v-if="upcomingTickerMessage" class="upcoming-ticker__status mono">
              {{ upcomingTickerMessage }}
            </div>

            <div
              v-else
              class="upcoming-ticker__marquee"
              :style="{ '--ticker-duration': upcomingTickerDuration }"
            >
              <template v-for="copy in upcomingTickerCopies" :key="`ticker-copy-${copy}`">
                <template
                  v-for="tournament in upcomingTournaments"
                  :key="`${copy}-${tournament.id}`"
                >
                  <a
                    class="upcoming-ticker__item"
                    :href="tournament.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    :title="tickerTitle(tournament)"
                    :aria-hidden="copy > 0 ? 'true' : undefined"
                    :tabindex="copy > 0 ? -1 : undefined"
                  >
                    <span class="upcoming-ticker__time">{{ formatUpcomingTime(tournament.startTimeMs) }}</span>
                    <span class="upcoming-ticker__sep" aria-hidden="true">·</span>
                    <span class="upcoming-ticker__name">{{ tournament.name }}</span>
                    <span class="upcoming-ticker__sep" aria-hidden="true">·</span>
                    <span
                      class="upcoming-ticker__item-status"
                      :class="`upcoming-ticker__item-status--${tournament.status}`"
                    >
                      <span class="upcoming-ticker__dot" aria-hidden="true"></span>
                      {{ tournament.statusLabel }}
                    </span>
                  </a>
                  <span class="upcoming-ticker__divider" aria-hidden="true">//</span>
                </template>
              </template>
            </div>
          </div>

          <div class="upcoming-ticker__mobile-summary mono">
            {{ upcomingMobileSummary }}
          </div>
        </div>

        <span class="signal-strip__edition">BTM / 06</span>
      </div>
    </div>

    <div class="sidebar" :class="{ 'sidebar--open': menuOpen }">
      <div class="sidebar__content">
        <div class="sidebar__header">
          <RouterLink :to="metaHomeRoute" class="sidebar__brand" @click="toggleMenu">
            <div class="logo"><span>Battle Tower</span><em>Meta</em></div>
          </RouterLink>
          <button class="sidebar__close" @click="toggleMenu" aria-label="Close menu">
            &times;
          </button>
        </div>

        <nav class="sidebar__nav">
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="sidebar__link"
            active-class="is-active"
            @click="toggleMenu"
          >
            {{ label(item.key) }}
          </RouterLink>
        </nav>

        <div class="sidebar__footer">
          <div v-if="authProfileState" class="sidebar__account">
            {{ authProfileState.display_name || authProfileState.handle }}
          </div>

          <div class="sidebar__lang">
            <RouterLink :to="switchLangTo('zh')" class="lang" active-class="is-active" @click="toggleMenu">中文</RouterLink>
            <RouterLink :to="switchLangTo('en')" class="lang" active-class="is-active" @click="toggleMenu">EN</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div class="overlay" v-if="menuOpen" @click="toggleMenu"></div>

    <main class="container">
      <RouterView v-slot="{ Component, route }">
        <AnimatedPage>
          <component :is="Component" :key="route.path" />
        </AnimatedPage>
      </RouterView>
    </main>

    <footer class="footer">
      <div class="footer__socials" aria-label="Battle Tower Meta social links">
        <a
          class="footer__icon-link"
          href="https://youtube.com/channel/UC7gG7HAAyjqixZe0-GyqFrw/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8Z" />
            <path class="footer__icon-link-cutout" d="m10 15.4 5.2-3.4L10 8.6v6.8Z" />
          </svg>
        </a>

        <a
          class="footer__icon-link"
          href="https://discord.gg/PafxkzT4GV"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Discord"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M8.3 7.9a9.4 9.4 0 0 1 2.1-.7l.3.6a8.6 8.6 0 0 1 2.6 0l.3-.6a9.4 9.4 0 0 1 2.1.7c1.3 1.9 1.9 3.7 1.7 5.6a8.5 8.5 0 0 1-2.6 1.3l-.6-.9a6.2 6.2 0 0 0 1-.5l-.3-.2a6.7 6.7 0 0 1-5.8 0l-.3.2a6.2 6.2 0 0 0 1 .5l-.6.9a8.5 8.5 0 0 1-2.6-1.3c-.2-1.9.4-3.7 1.7-5.6Z" />
            <path d="M9.8 12.2c.5 0 .9-.5.9-1s-.4-1-.9-1-.9.5-.9 1 .4 1 .9 1Zm4.4 0c.5 0 .9-.5.9-1s-.4-1-.9-1-.9.5-.9 1 .4 1 .9 1Z" />
            <path d="M4.5 5.6A17 17 0 0 1 9 4l.5.9a15 15 0 0 1 5 0L15 4a17 17 0 0 1 4.5 1.6c2.2 3.3 3 6.6 2.7 9.9a17.3 17.3 0 0 1-5.5 2.8l-1.2-1.8a10.5 10.5 0 0 0 1.9-.9 11.8 11.8 0 0 1-10.8 0 10.5 10.5 0 0 0 1.9.9l-1.2 1.8a17.3 17.3 0 0 1-5.5-2.8c-.3-3.3.5-6.6 2.7-9.9Z" />
          </svg>
        </a>
      </div>

      <div class="footer__status mono" aria-label="Version and refresh status">
        <span class="footer__status-dot" aria-hidden="true"></span>
        <span>{{ footerStatusText }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import TopbarAccountMenu from "./components/TopbarAccountMenu.vue";
import AnimatedPage from "./components/ui/AnimatedPage.vue";
import BackgroundEffects from "./components/ui/BackgroundEffects.vue";
import { useMotionReveal } from "./lib/motionReveal";
import { authProfile, initSupabaseAuth } from "./lib/supabase";
import {
  getUpcomingPocketTournaments,
  type UpcomingTournamentItem,
} from "./lib/upcomingTournaments";

const BASE_URL = (import.meta as any).env?.BASE_URL ?? "/";

const route = useRoute();
const menuOpen = ref(false);
void initSupabaseAuth();
useMotionReveal(() => route.fullPath);
const authProfileState = authProfile;

const lang = computed<"zh" | "en">(() => (String(route.path).split("/")[1] === "en" ? "en" : "zh"));
const metaHomeRoute = computed(() => `/${lang.value}/tier-list`);

const nav = computed(() => {
  const base = `/${lang.value}`;
  return [
    { key: "tierList", to: `${base}/tier-list` },
    { key: "tournaments", to: `${base}/tournaments` },
    { key: "topDecks", to: `${base}/top-decks` },
    { key: "topCards", to: `${base}/top-cards` },
    { key: "battleHub", to: `${base}/battle-hub` },
    { key: "playerRanking", to: `${base}/player-ranking` },
    { key: "countryRanking", to: `${base}/country-ranking` },
  ] as const;
});

const upcomingState = ref<"loading" | "ready" | "error">("loading");
const upcomingTournaments = ref<UpcomingTournamentItem[]>([]);
const footerVersion = ref("—");
const footerRefreshTime = ref("—");

const footerStatusText = computed(() => {
  return `VERSION / ${footerVersion.value} · DAILY REFRESH ${footerRefreshTime.value}`;
});

const upcomingTickerCopies = computed(() => (upcomingTournaments.value.length > 1 ? [0, 1] : [0]));

const upcomingTickerDuration = computed(() => {
  const count = Math.max(upcomingTournaments.value.length, 1);
  return `${Math.min(60, Math.max(30, count * 7))}s`;
});

const upcomingTickerMessage = computed(() => {
  if (upcomingState.value === "loading") return "syncing...";
  if (upcomingState.value === "error") return "Limitless unavailable";
  if (upcomingTournaments.value.length > 0) return "";
  return lang.value === "zh"
    ? "未來 24 小時暫無 PTCG Pocket 比賽"
    : "No PTCG Pocket tournaments in next 24h";
});

const upcomingMobileSummary = computed(() => {
  if (upcomingState.value === "loading") return "UPCOMING / 24H · SYNCING";
  if (upcomingState.value === "error") return "UPCOMING / 24H · UNAVAILABLE";

  const count = upcomingTournaments.value.length;
  return `UPCOMING / 24H · ${count} ${count === 1 ? "EVENT" : "EVENTS"}`;
});

onMounted(() => {
  void loadUpcomingTicker();
  void loadFooterStatus();
});

async function loadUpcomingTicker() {
  upcomingState.value = "loading";
  try {
    upcomingTournaments.value = await getUpcomingPocketTournaments({
      withinHours: 24,
      limit: 10,
    });
    upcomingState.value = "ready";
  } catch (error) {
    console.error("[App] upcoming tournament ticker failed:", error);
    upcomingTournaments.value = [];
    upcomingState.value = "error";
  }
}

const labels = {
  zh: {
    tierList: "牌組環境",
    tournaments: "線上比賽",
    topDecks: "最強牌組",
    topCards: "泛用卡片",
    battleHub: "排位記錄",
    playerRanking: "玩家排名",
    countryRanking: "地區排名",
  },
  en: {
    tierList: "Meta Environment",
    tournaments: "Tournaments",
    topDecks: "Top Decks",
    topCards: "Cards Usage",
    battleHub: "Rank Recorder",
    playerRanking: "Player Ranking",
    countryRanking: "Country Ranking",
  },
} as const;

type FooterMeta = {
  generated_at?: string;
};

type FooterTournament = {
  date?: string;
};

const FOOTER_VERSION_MARKERS = [
  { code: "A1", startMs: Date.UTC(2024, 9, 30) },
  { code: "A1a", startMs: Date.UTC(2024, 11, 17) },
  { code: "A2", startMs: Date.UTC(2025, 0, 29) },
  { code: "A2a", startMs: Date.UTC(2025, 1, 28) },
  { code: "A2b", startMs: Date.UTC(2025, 2, 27) },
  { code: "A3", startMs: Date.UTC(2025, 3, 30) },
  { code: "A3a", startMs: Date.UTC(2025, 4, 29) },
  { code: "A3b", startMs: Date.UTC(2025, 5, 26) },
  { code: "A4", startMs: Date.UTC(2025, 6, 30) },
  { code: "A4a", startMs: Date.UTC(2025, 7, 28) },
  { code: "A4b", startMs: Date.UTC(2025, 8, 30) },
  { code: "B1", startMs: Date.UTC(2025, 9, 30) },
  { code: "B1a", startMs: Date.UTC(2025, 11, 17) },
  { code: "B2", startMs: Date.UTC(2026, 0, 29) },
  { code: "B2a", startMs: Date.UTC(2026, 1, 26) },
  { code: "B2b", startMs: Date.UTC(2026, 2, 25) },
  { code: "B3", startMs: Date.UTC(2026, 3, 28) },
  { code: "B3a", startMs: Date.UTC(2026, 4, 28) },
  { code: "B3b", startMs: Date.UTC(2026, 5, 30) },
] as const;

function dataUrl(fileName: string) {
  const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  return `${base}data/${fileName}`;
}

async function fetchDataJson<T>(fileName: string): Promise<T> {
  const response = await fetch(dataUrl(fileName), { cache: "force-cache" });
  if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);
  return (await response.json()) as T;
}

function inferFooterVersion(ms: number) {
  let version = "";
  for (const marker of FOOTER_VERSION_MARKERS) {
    if (ms >= marker.startMs) version = marker.code;
    else break;
  }
  return version || "—";
}

function formatFooterRefreshTime(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function loadFooterStatus() {
  try {
    const [meta, tournaments] = await Promise.all([
      fetchDataJson<FooterMeta>("meta.json").catch(() => null),
      fetchDataJson<FooterTournament[]>("tournaments.json").catch(() => []),
    ]);

    footerRefreshTime.value = formatFooterRefreshTime(meta?.generated_at);

    const latestTournamentMs = tournaments.reduce((latest, tournament) => {
      const ms = new Date(tournament.date ?? "").getTime();
      return Number.isFinite(ms) && ms > latest ? ms : latest;
    }, 0);

    footerVersion.value = latestTournamentMs > 0 ? inferFooterVersion(latestTournamentMs).toUpperCase() : "—";
  } catch (error) {
    console.error("[App] footer status failed:", error);
    footerVersion.value = "—";
    footerRefreshTime.value = "—";
  }
}

function switchLangTo(next: "zh" | "en") {
  const parts = String(route.path).split("/");
  parts[1] = next;
  const nextPath = parts.join("/") || `/${next}`;
  return nextPath === "/" ? `/${next}` : nextPath;
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function label(key: keyof (typeof labels)["zh"]) {
  return labels[lang.value][key] || key;
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isTomorrowLocal(target: Date, now: Date) {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return isSameLocalDay(target, tomorrow);
}

function formatUpcomingTime(startTimeMs: number) {
  const date = new Date(startTimeMs);
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  if (isSameLocalDay(date, now)) return time;
  if (isTomorrowLocal(date, now)) return `TMR ${time}`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function tickerTitle(tournament: UpcomingTournamentItem) {
  const players = tournament.players == null ? "" : ` · ${tournament.players} players`;
  const organizer = tournament.organizer ? ` · ${tournament.organizer}` : "";
  return `${formatUpcomingTime(tournament.startTimeMs)} · ${tournament.name} · ${tournament.statusLabel}${players}${organizer}`;
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  isolation: isolate;
  overflow-x: hidden;
  overflow-x: clip;
  overflow-y: visible;
}

.container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
  margin: 0;
  padding:
    clamp(32px, 2.8vw, 48px)
    var(--page-gutter-right)
    clamp(56px, 5vw, 84px)
    var(--page-gutter-left);
  flex: 1;
  box-sizing: border-box;
  display: block;
  overflow-x: hidden;
  overflow-x: clip;
  overflow-y: visible;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto minmax(220px, 1fr);
  align-items: center;
  gap: 24px;
  min-height: 68px;
  padding: 0 48px;
  background: rgba(2, 4, 10, 0.97);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

.topbar__left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

.topbar__nav {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
}

.topbar__right {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 20px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.menu-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: #fff;
  border-radius: 2px;
}

.logo {
  display: flex;
  align-items: baseline;
  gap: 2px;
  color: var(--text);
  font-family: var(--font-display);
  font-size: 24px;
  font-style: italic;
  font-weight: 700;
  line-height: 0.9;
  white-space: nowrap;
}

.logo em {
  color: var(--accent);
  font: inherit;
}

.sub {
  margin-top: 5px;
  color: var(--muted);
  font-family: var(--font-num);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.navlink {
  position: relative;
  padding: 26px 0 23px;
  color: var(--muted);
  font-family: var(--font-num);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-decoration: none;
  white-space: nowrap;
  text-transform: uppercase;
  transition: color 180ms ease;
}

.navlink::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 14px;
  height: 1px;
  opacity: 0;
  transform: scaleX(0);
  transform-origin: left center;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  transition:
    opacity 180ms ease,
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.navlink:hover {
  color: var(--text);
}

.navlink:hover::before {
  opacity: 0.9;
  transform: scaleX(1);
}

.navlink.is-active {
  color: var(--accent);
}

.navlink.is-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 14px;
  height: 1px;
  background: var(--accent);
  box-shadow: 0 0 12px rgba(77, 163, 255, 0.58);
}

.lang {
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 0;
  color: var(--muted);
  font-family: var(--font-num);
  text-decoration: none;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.lang.is-active {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text);
}

.signal-strip {
  position: sticky;
  top: 68px;
  z-index: 990;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
  background: rgba(2, 4, 10, 0.96);
  backdrop-filter: blur(8px);
}

.signal-strip__track {
  min-height: 36px;
  padding: 0 clamp(24px, 2.5vw, 48px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(18px, 2vw, 36px);
  overflow: hidden;
}

.signal-strip__edition {
  color: var(--accent-blue);
  font-family: var(--font-num);
  font-size: 10px;
  letter-spacing: 0.24em;
}

.upcoming-ticker {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(14px, 1.4vw, 24px);
  overflow: hidden;
}

.upcoming-ticker__label {
  color: var(--accent);
  font-family: var(--font-num);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.14em;
  white-space: nowrap;
}

.upcoming-ticker__viewport {
  min-width: 0;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%);
}

.upcoming-ticker__marquee {
  --ticker-duration: 42s;
  width: max-content;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: btm-ticker-marquee var(--ticker-duration) linear infinite;
  will-change: transform;
}

.upcoming-ticker__viewport:hover .upcoming-ticker__marquee {
  animation-play-state: paused;
}

.upcoming-ticker__status,
.upcoming-ticker__item {
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: var(--text-soft);
  font-family: var(--font-num);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.035em;
  text-decoration: none;
  white-space: nowrap;
}

.upcoming-ticker__status {
  padding: 0;
}

.upcoming-ticker__item {
  max-width: 520px;
  padding: 0 2px;
  border-bottom: 1px solid transparent;
  transition:
    border-color var(--dur-fast, 160ms) ease,
    background-color var(--dur-fast, 160ms) ease,
    box-shadow var(--dur-fast, 160ms) ease,
    color var(--dur-fast, 160ms) ease;
}

.upcoming-ticker__item:hover,
.upcoming-ticker__item:focus-visible {
  border-bottom-color: rgba(77, 163, 255, 0.62);
  background: linear-gradient(90deg, rgba(77, 163, 255, 0.08), transparent 82%);
  box-shadow: 0 8px 18px -16px rgba(77, 163, 255, 0.48);
  outline: none;
}

.upcoming-ticker__time {
  flex: 0 0 auto;
  color: var(--accent);
  font-weight: 950;
  font-variant-numeric: tabular-nums;
}

.upcoming-ticker__name {
  min-width: 0;
  max-width: clamp(280px, 24vw, 420px);
  overflow: hidden;
  color: var(--text);
  text-overflow: ellipsis;
}

.upcoming-ticker__sep {
  flex: 0 0 auto;
  color: rgba(168, 179, 199, 0.56);
}

.upcoming-ticker__divider {
  flex: 0 0 auto;
  color: rgba(77, 163, 255, 0.38);
  font-family: var(--font-num);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.upcoming-ticker__item:hover .upcoming-ticker__name,
.upcoming-ticker__item:focus-visible .upcoming-ticker__name {
  color: #ffffff;
}

.upcoming-ticker__item-status {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-soft);
}

.upcoming-ticker__dot {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 999px;
  background: #64748b;
  box-shadow: 0 0 8px rgba(100, 116, 139, 0.28);
}

.upcoming-ticker__item-status--open .upcoming-ticker__dot {
  background: #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.58);
  animation: btm-status-blink 2.8s ease-in-out infinite;
}

.upcoming-ticker__item-status--check-in .upcoming-ticker__dot {
  background: #ffd166;
  box-shadow: 0 0 10px rgba(255, 209, 102, 0.48);
}

.upcoming-ticker__mobile-summary {
  display: none;
  color: var(--text-soft);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

@keyframes btm-ticker-marquee {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    transform: translate3d(-50%, 0, 0);
  }
}

.sidebar {
  position: fixed;
  top: 0;
  left: -300px;
  width: 280px;
  height: 100vh;
  background: rgba(3, 5, 11, 0.98);
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--border-accent);
  z-index: 1001;
  transition: left 0.3s ease;
  overflow-y: auto;
}

.sidebar--open {
  left: 0;
}

.sidebar__content {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.sidebar__close {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar__link {
  color: var(--muted);
  font-family: var(--font-num);
  font-size: 13px;
  letter-spacing: 0.14em;
  text-decoration: none;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  text-transform: uppercase;
}

.sidebar__link:hover {
  color: #fff;
}

.sidebar__link.is-active {
  color: var(--accent);
  font-weight: 700;
}

.sidebar__footer {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.sidebar__account {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}

.sidebar__lang {
  display: flex;
  gap: 8px;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
}

.footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--muted);
  font-family: var(--font-num);
  font-size: 10px;
  letter-spacing: 0.12em;
  padding: 18px 28px 18px 84px;
  border-top: 1px solid var(--border);
  background: rgba(3, 5, 10, 0.7);
}

.footer__socials {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.footer__icon-link {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.08), transparent 62%),
    rgba(3, 8, 18, 0.78);
  color: var(--text-soft);
  text-decoration: none;
  transition:
    border-color var(--dur-fast, 160ms) ease,
    box-shadow var(--dur-fast, 160ms) ease,
    color var(--dur-fast, 160ms) ease,
    background-color var(--dur-fast, 160ms) ease;
}

.footer__icon-link svg {
  width: 17px;
  height: 17px;
  display: block;
  fill: currentColor;
}

.footer__icon-link-cutout {
  fill: #02040a;
}

.footer__icon-link:hover,
.footer__icon-link:focus-visible {
  border-color: rgba(77, 163, 255, 0.72);
  background: rgba(77, 163, 255, 0.12);
  box-shadow: 0 0 16px rgba(77, 163, 255, 0.22);
  color: var(--text);
  outline: none;
}

.footer__status {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  color: var(--text-soft);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.footer__status-dot {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: var(--accent-success);
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.56);
}

@media (max-width: 1280px) {
  .topbar {
    grid-template-columns: minmax(180px, 1fr) auto minmax(160px, 1fr);
    padding: 0 24px;
  }

  .topbar__nav {
    gap: 18px;
  }

  .navlink {
    font-size: 10px;
    letter-spacing: 0.08em;
  }

  .signal-strip__track {
    padding: 0 24px;
    gap: 22px;
  }

  .upcoming-ticker {
    min-width: 0;
  }

  .upcoming-ticker__name {
    max-width: clamp(220px, 22vw, 320px);
  }
}

@media (max-width: 900px) {
  .menu-toggle {
    display: flex;
  }

  .topbar__nav {
    display: none;
  }

  .topbar {
    grid-template-columns: 1fr auto;
    min-height: 62px;
    padding: 0 16px;
  }

  .topbar__left {
    min-width: 0;
  }

  .topbar__right {
    margin-left: 0;
  }

  .signal-strip {
    top: 62px;
  }

  .signal-strip__track {
    min-height: 34px;
    padding: 0 16px;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .upcoming-ticker {
    min-width: 0;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 12px;
  }

  .upcoming-ticker__name {
    max-width: clamp(180px, 32vw, 260px);
  }

  .signal-strip__edition {
    display: none;
  }

  .container {
    padding: 28px 18px 52px;
  }

  .footer {
    padding: 16px 18px;
  }
}

@media (max-width: 700px) {
  .upcoming-ticker {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }

  .upcoming-ticker__label,
  .upcoming-ticker__viewport {
    display: none;
  }

  .upcoming-ticker__mobile-summary {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 560px) {
  .menu-toggle {
    flex: 0 0 22px;
    width: 22px;
    margin-right: 10px;
  }

  .logo {
    font-size: 18px;
  }

  .logo span {
    font-size: 0;
  }

  .logo span::after {
    content: "BTM";
    font-size: 18px;
  }

  .topbar__right {
    gap: 3px;
  }

  .topbar__right .lang {
    display: none;
  }

  .topbar__right .lang.is-active {
    display: inline-flex;
  }

  .sub {
    display: none;
  }

  .footer {
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .footer__socials {
    justify-content: flex-start;
  }

  .footer__status {
    justify-content: flex-start;
    white-space: normal;
    line-height: 1.35;
  }

  :deep(.account-menu__trigger) {
    min-width: 0;
    padding-inline: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .navlink,
  .navlink::before,
  .upcoming-ticker__dot,
  .upcoming-ticker__marquee {
    animation: none;
    transition: none;
  }

  .upcoming-ticker__viewport {
    overflow-x: auto;
    mask-image: none;
    scrollbar-width: none;
  }

  .upcoming-ticker__viewport::-webkit-scrollbar {
    display: none;
  }
}
</style>
