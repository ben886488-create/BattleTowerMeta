<template>
  <div>
    <h1 class="pageTitle">{{ lang === 'en' ? 'PTCG Pocket Stats' : 'PTCG Pocket 數據' }}</h1>

    <div class="grid">
      <RouterLink v-for="c in cards" :key="c.to" :to="c.to" class="card">
        <div class="kicker">{{ c.kicker }}</div>
        <div class="title">{{ c.title }}</div>
        <div class="desc">{{ c.desc }}</div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const lang = computed(() => (String(route.path).split('/')[1] === 'en' ? 'en' : 'zh'))
const base = computed(() => `/${lang.value}`)

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
.pageTitle {
  margin: 0 0 14px;
  color: rgba(255,255,255,0.92);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: .2px;
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
</style>