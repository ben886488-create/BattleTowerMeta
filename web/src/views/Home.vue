<template>
  <div>
    <div class="homeHero">
      <div>
        <div class="homeHero__kicker">{{ lang === 'en' ? 'Creator kit' : '創作者素材' }}</div>
        <h1 class="pageTitle">{{ lang === 'en' ? 'PTCG Pocket Stats' : 'PTCG Pocket 數據' }}</h1>
      </div>
      <div class="creatorPackActions">
        <button class="creatorPackButton creatorPackButton--primary mono" type="button" :disabled="creatorPackActive" @click="startCreatorPack('decklists')">
          {{ creatorPackLabel('decklists') }}
        </button>
        <button class="creatorPackButton mono" type="button" :disabled="creatorPackActive" @click="startCreatorPack('all')">
          {{ creatorPackLabel('all') }}
        </button>
      </div>
    </div>

    <div class="grid">
      <RouterLink v-for="c in cards" :key="c.to" :to="c.to" class="card">
        <div class="kicker">{{ c.kicker }}</div>
        <div class="title">{{ c.title }}</div>
        <div class="desc">{{ c.desc }}</div>
      </RouterLink>
    </div>

    <DeckProfile
      v-if="creatorPackActive"
      class="homeCreatorMount"
      auto-download-creator-pack
      :creator-pack-asset-mode="creatorPackMode"
      @creator-pack-finished="creatorPackActive = false"
    />
  </div>
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
    { to: `${base.value}/tier-list`, kicker: 'Meta', title: 'Tier List／牌組排名', desc: '主流牌組強度分級' },
    { to: `${base.value}/tournaments`, kicker: 'Events', title: 'Tournaments／比賽牌組', desc: '比賽結果與牌組' },
    { to: `${base.value}/top-decks`, kicker: 'Meta', title: 'Top Decks／最強牌組', desc: '勝率／表現最好的牌表' },
    { to: `${base.value}/top-cards`, kicker: 'Meta', title: 'Top Cards／最強卡片', desc: '最常用／最強勢的卡片統計' },
    { to: `${base.value}/player-ranking`, kicker: 'Ranking', title: 'Player Ranking／玩家排名', desc: '玩家積分排行' },
    { to: `${base.value}/country-ranking`, kicker: 'Ranking', title: 'Country Ranking／國家排名', desc: '國家積分排行' },
  ]
})
</script>

<style scoped>
.homeHero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  margin: 0 0 16px;
}

.homeHero__kicker {
  margin-bottom: 6px;
  color: rgba(125, 211, 252, 0.86);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.pageTitle {
  margin: 0;
  color: rgba(255,255,255,0.92);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0;
}

.creatorPackActions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.creatorPackButton {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(96, 165, 250, 0.55);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.52);
  color: rgba(239, 246, 255, 0.96);
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 10px 26px rgba(14, 116, 144, 0.18);
}

.creatorPackButton--primary {
  border-color: rgba(34, 211, 238, 0.72);
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.42), rgba(14, 116, 144, 0.28));
}

.creatorPackButton:hover:not(:disabled) {
  border-color: rgba(125, 211, 252, 0.8);
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.48), rgba(14, 116, 144, 0.28));
}

.creatorPackButton:disabled {
  cursor: wait;
  opacity: 0.72;
}

.grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 14px;
}

@media (min-width: 900px) {
  .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.card {
  display: block;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(15,23,42,0.35);
  text-decoration: none;
}

.card:hover { background: rgba(15,23,42,0.55); }

.kicker { font-size: 12px; color: rgba(226,232,240,.7); }
.title { margin-top: 8px; font-size: 18px; font-weight: 800; color: #fff; }
.desc { margin-top: 6px; font-size: 13px; color: rgba(226,232,240,.75); }

.homeCreatorMount {
  position: fixed;
  top: 0;
  left: -10000px;
  width: 1440px;
  min-height: 100vh;
  pointer-events: none;
}

@media (max-width: 640px) {
  .homeHero {
    align-items: stretch;
    flex-direction: column;
  }

  .creatorPackButton {
    width: 100%;
  }

  .creatorPackActions {
    width: 100%;
  }
}
</style>
