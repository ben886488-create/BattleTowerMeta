<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type TierRow = { deck: string; score: number; usage: number; topcut_rate: number; weighted: number; samples: number }
type PlayerRow = { player: string; points: number }

const props = defineProps<{ lang: 'zh' | 'en' }>()

const t = computed(() => {
  const zh = {
    title: 'PTCG Pocket 數據',
    tier: 'Tier List',
    players: '玩家排名',
    loading: '載入中…',
    error: '讀取資料失敗。請稍後再試。',
    deck: '牌型',
    score: '分數',
    usage: '使用率',
    topcut: 'Top Cut率',
    samples: '樣本數',
    rank: '#',
    player: '玩家',
    points: '分數',
  }
  const en = {
    title: 'PTCG Pocket Meta',
    tier: 'Tier List',
    players: 'Players Ranking',
    loading: 'Loading…',
    error: 'Failed to load data. Please try again.',
    deck: 'Deck',
    score: 'Score',
    usage: 'Usage',
    topcut: 'Top cut',
    samples: 'Samples',
    rank: '#',
    player: 'Player',
    points: 'Points',
  }
  return props.lang === 'zh' ? zh : en
})

const tier = ref<TierRow[]>([])
const players = ref<PlayerRow[]>([])
const loading = ref(true)
const error = ref(false)

function pct(x: number) {
  return `${(x * 100).toFixed(1)}%`
}

async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

onMounted(async () => {
  try {
    // 注意：這裡用的是 /data/*.json（你的 Python 產物）
    tier.value = await loadJson<TierRow[]>('/data/tier.json')
    players.value = await loadJson<PlayerRow[]>('/data/players.json')
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="pageTitle">{{ t.title }}</h1>

    <div v-if="loading" class="card">{{ t.loading }}</div>
    <div v-else-if="error" class="card error">{{ t.error }}</div>

    <template v-else>
      <section class="card">
        <h2 class="cardTitle">{{ t.tier }}</h2>
        <div class="tableWrap">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t.deck }}</th>
                <th>{{ t.score }}</th>
                <th>{{ t.usage }}</th>
                <th>{{ t.topcut }}</th>
                <th>{{ t.samples }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tier.slice(0, 50)" :key="row.deck">
                <td class="mono">{{ row.deck }}</td>
                <td>{{ row.score.toFixed(4) }}</td>
                <td>{{ pct(row.usage) }}</td>
                <td>{{ pct(row.topcut_rate) }}</td>
                <td>{{ row.samples }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h2 class="cardTitle">{{ t.players }}</h2>
        <div class="tableWrap">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t.rank }}</th>
                <th>{{ t.player }}</th>
                <th>{{ t.points }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in players.slice(0, 100)" :key="row.player">
                <td>{{ idx + 1 }}</td>
                <td class="mono">{{ row.player }}</td>
                <td>{{ row.points.toFixed(4) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.pageTitle{ margin: 6px 0 14px; font-size: 20px; }
.cardTitle{ margin: 0 0 12px; font-size: 14px; color: var(--muted); }
.error{ border-color: rgba(255, 80, 80, .35); }

.tableWrap{ overflow:auto; border: 1px solid var(--border); border-radius: 12px; }
.table{ width:100%; border-collapse: collapse; font-size: 13px; }
th, td{ padding: 10px 12px; border-bottom: 1px solid var(--border); text-align:left; }
thead th{ position: sticky; top: 0; background: rgba(7,21,33,.96); }
tbody tr:hover{ background: rgba(0,175,239,.06); }
.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
</style>