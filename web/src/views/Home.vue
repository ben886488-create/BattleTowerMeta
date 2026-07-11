<template>
  <section class="homePage">
    <header class="homeHero">
      <div class="homeHero__eyebrow mono">{{ heroCopy.eyebrow }}</div>
      <div class="homeHero__layout">
        <div class="homeHero__copy">
          <h1 class="pageTitle">
            <span>{{ heroCopy.title }}</span>
            <em>{{ heroCopy.titleAccent }}</em>
          </h1>
          <p class="homeHero__lead">{{ heroCopy.lead }}</p>
        </div>

        <div class="creatorPackBlock">
          <span class="creatorPackBlock__label mono">// {{ heroCopy.creatorLabel }}</span>
          <div class="creatorPackActions">
            <button class="creatorPackButton creatorPackButton--primary mono" type="button" :disabled="creatorPackActive" @click="startCreatorPack('decklists')">
              {{ creatorPackLabel('decklists') }}
            </button>
            <button class="creatorPackButton mono" type="button" :disabled="creatorPackActive" @click="startCreatorPack('all')">
              {{ creatorPackLabel('all') }}
            </button>
          </div>
        </div>
      </div>

      <div class="homeTerminal mono">
        <span><b>$</b> battletowermeta --watch --format pocket</span>
        <span class="homeTerminal__status"><i></i>{{ heroCopy.live }}</span>
      </div>
    </header>

    <section class="homeDirectory">
      <div class="homeDirectory__header">
        <span class="mono">// {{ heroCopy.directory }}</span>
        <span class="mono">{{ cards.length }} CHANNELS</span>
      </div>

      <div class="grid">
        <RouterLink v-for="(c, index) in cards" :key="c.to" :to="c.to" class="card">
          <div class="card__meta mono">
            <span>EV/0{{ index + 1 }}</span>
            <span>{{ c.kicker }}</span>
          </div>
          <div class="title">{{ c.title }}</div>
          <div class="desc">{{ c.desc }}</div>
          <div class="card__action mono">{{ lang === 'en' ? 'OPEN SIGNAL' : '讀取資料' }} →</div>
        </RouterLink>
      </div>
    </section>

    <DeckProfile
      v-if="creatorPackActive"
      class="homeCreatorMount"
      auto-download-creator-pack
      :creator-pack-asset-mode="creatorPackMode"
      @creator-pack-finished="creatorPackActive = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { useRoute } from 'vue-router'

const DeckProfile = defineAsyncComponent(() => import('./DeckProfile.vue'))

const route = useRoute()
const lang = computed(() => (String(route.path).split('/')[1] === 'en' ? 'en' : 'zh'))
const base = computed(() => `/${lang.value}`)
const creatorPackActive = ref(false)
const creatorPackMode = ref<'all' | 'decklists'>('decklists')
const heroCopy = computed(() => (
  lang.value === 'en'
    ? {
        eyebrow: 'BTM/01 — COMPETITION INTELLIGENCE',
        title: 'The Pocket meta.',
        titleAccent: 'Decoded.',
        lead: 'Tournament results, deck performance, matchups and card usage — rebuilt into one live competitive ledger.',
        creatorLabel: 'CREATOR ASSETS',
        live: 'WIRE ACTIVE · DAILY DATA',
        directory: 'INTELLIGENCE CHANNELS',
      }
    : {
        eyebrow: 'BTM/01 — 競技情報終端',
        title: '牌組環境，',
        titleAccent: '已解碼。',
        lead: '把賽事、牌組表現、對局與卡片投入率，整理成一套每日更新的 PTCG Pocket 競技情報。',
        creatorLabel: '創作者素材',
        live: '資料在線 · 每日更新',
        directory: '情報頻道',
      }
))

function startCreatorPack(mode: 'all' | 'decklists') {
  if (creatorPackActive.value) return
  creatorPackMode.value = mode
  creatorPackActive.value = true
}

function creatorPackLabel(mode: 'all' | 'decklists') {
  const isActiveMode = creatorPackActive.value && creatorPackMode.value === mode
  if (mode === 'decklists') {
    if (isActiveMode) return lang.value === 'en' ? 'Building decklists ZIP...' : '製作牌組 ZIP 中...'
    return lang.value === 'en' ? 'Download decklists ZIP' : '下載牌組 ZIP'
  }

  if (isActiveMode) return lang.value === 'en' ? 'Building creator ZIP...' : '製作素材 ZIP 中...'
  return lang.value === 'en' ? 'Download full creator ZIP' : '下載完整素材 ZIP'
}

const cards = computed(() => {
  if (lang.value === 'en') {
    return [
      { to: `${base.value}/tier-list`, kicker: 'Meta', title: 'Tier List', desc: 'Deck ranking overview' },
      { to: `${base.value}/tournaments`, kicker: 'Events', title: 'Tournaments', desc: 'Tournament decklists & results' },
      { to: `${base.value}/top-decks`, kicker: 'Meta', title: 'Top Decks', desc: 'Best performing decklists' },
      { to: `${base.value}/top-cards`, kicker: 'Meta', title: 'Top Cards', desc: 'Most played / strongest cards' },
      { to: `${base.value}/player-ranking`, kicker: 'Ranking', title: 'Player Ranking', desc: 'Top players' },
      { to: `${base.value}/country-ranking`, kicker: 'Ranking', title: 'Country Ranking', desc: 'Top countries' },
    ]
  }
  return [
    { to: `${base.value}/tier-list`, kicker: 'Meta', title: 'Meta／牌組環境', desc: '主流牌組強度分級' },
    { to: `${base.value}/tournaments`, kicker: 'Events', title: 'Tournaments／比賽牌組', desc: '比賽結果與牌組' },
    { to: `${base.value}/top-decks`, kicker: 'Meta', title: 'Top Decks／最強牌組', desc: '勝率／表現最好的牌表' },
    { to: `${base.value}/top-cards`, kicker: 'Meta', title: 'Top Cards／最強卡片', desc: '最常用／最強勢的卡片統計' },
    { to: `${base.value}/player-ranking`, kicker: 'Ranking', title: 'Player Ranking／玩家排名', desc: '玩家積分排行' },
    { to: `${base.value}/country-ranking`, kicker: 'Ranking', title: 'Country Ranking／國家排名', desc: '國家積分排行' },
  ]
})
</script>

<style scoped>
.homePage {
  width: 100%;
  max-width: none;
  margin: 0;
}

.homeHero {
  position: relative;
  padding: 24px 0 54px;
  border-bottom: 1px solid var(--border);
}

.homeHero::before {
  content: "";
  position: absolute;
  top: 12px;
  right: 0;
  width: 36%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-accent));
}

.homeHero__eyebrow,
.creatorPackBlock__label,
.homeDirectory__header {
  color: var(--accent);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.homeHero__layout {
  margin-top: 30px;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.55fr);
  gap: clamp(32px, 4vw, 72px);
  align-items: end;
}

.pageTitle {
  margin: 0;
  display: flex;
  flex-direction: column;
  color: var(--text);
  font-family: var(--font-display);
  font-size: clamp(4.4rem, 8vw, 8.8rem);
  font-style: italic;
  font-weight: 500;
  letter-spacing: -0.055em;
  line-height: 0.76;
}

.pageTitle em {
  color: var(--accent);
  font: inherit;
  margin-left: 0.48em;
}

.homeHero__lead {
  max-width: 720px;
  margin: 54px 0 0;
  color: var(--text-soft);
  font-size: clamp(15px, 1.25vw, 18px);
  line-height: 1.75;
}

.creatorPackBlock {
  padding-bottom: 10px;
}

.creatorPackBlock__label {
  display: block;
  margin-bottom: 12px;
}

.creatorPackActions {
  display: grid;
  gap: 8px;
}

.creatorPackButton {
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: rgba(6, 9, 17, 0.76);
  color: var(--text);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-align: left;
  cursor: pointer;
}

.creatorPackButton--primary {
  border-color: var(--border-accent);
  background: var(--accent);
  color: #090b11;
}

.creatorPackButton:hover:not(:disabled) {
  border-color: var(--accent);
  color: #fff;
  background: rgba(77, 163, 255, 0.18);
}

.creatorPackButton:disabled {
  cursor: wait;
  opacity: 0.72;
}

.homeTerminal {
  min-height: 48px;
  margin-top: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px dashed var(--border-strong);
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.homeTerminal b {
  color: var(--accent);
}

.homeTerminal__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--positive);
}

.homeTerminal__status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--positive);
  box-shadow: 0 0 10px rgba(22, 230, 161, 0.7);
}

.homeDirectory {
  padding: 34px 0 24px;
}

.homeDirectory__header {
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
}

.homeDirectory__header span:last-child {
  color: var(--muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--border);
  border-left: 1px solid var(--border);
}

.card {
  position: relative;
  display: block;
  min-height: 218px;
  padding: 24px;
  border: 0;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  border-radius: 0;
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.026), transparent 48%),
    rgba(6, 9, 18, 0.58);
  text-decoration: none;
  transition: background 180ms ease, color 180ms ease;
}

.card::before,
.card::after {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  pointer-events: none;
}

.card::before {
  top: -1px;
  left: -1px;
  border-top: 1px solid var(--accent);
  border-left: 1px solid var(--accent);
}

.card::after {
  right: -1px;
  bottom: -1px;
  border-right: 1px solid var(--accent);
  border-bottom: 1px solid var(--accent);
}

.card:hover {
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.11), transparent 62%),
    linear-gradient(315deg, rgba(255, 209, 102, 0.045), transparent 58%),
    rgba(5, 10, 20, 0.9);
}

.card__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--accent);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.card__meta span:last-child {
  color: var(--muted);
}

.title {
  margin-top: 34px;
  color: var(--text);
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 2.4vw, 2.4rem);
  font-style: italic;
  font-weight: 600;
  line-height: 1.05;
}

.desc {
  max-width: 34ch;
  margin-top: 12px;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.6;
}

.card__action {
  position: absolute;
  right: 22px;
  bottom: 20px;
  color: var(--accent);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.homeCreatorMount {
  position: fixed;
  top: 0;
  left: -10000px;
  width: 1440px;
  min-height: 100vh;
  pointer-events: none;
}

@media (max-width: 980px) {
  .homeHero__layout {
    grid-template-columns: 1fr;
    gap: 42px;
  }

  .creatorPackActions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .homeHero {
    padding-top: 8px;
  }

  .pageTitle {
    font-size: clamp(3.35rem, 15vw, 4.5rem);
    line-height: 0.86;
  }

  .pageTitle em {
    margin-left: 0.1em;
  }

  .homeHero__lead {
    margin-top: 38px;
  }

  .creatorPackActions,
  .grid {
    grid-template-columns: 1fr;
  }

  .homeTerminal {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px;
  }

  .homeDirectory__header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
