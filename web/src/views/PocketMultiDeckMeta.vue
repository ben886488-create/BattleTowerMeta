<template>
  <section class="dual-meta">
    <header class="dual-meta__hero">
      <p class="type-label dual-meta__eyebrow">POCKET // DUAL-DECK INTELLIGENCE</p>
      <h1 class="page-hero-title" :class="{ 'page-hero-title--cn': zh }">{{ zh ? '雙牌組環境，' : 'Two decks.' }}<em>{{ zh ? '逐局解析。' : 'Every game.' }}</em></h1>
      <p class="type-body">{{ zh ? '比較雙牌組賽事的登錄牌組、搭配與實際小局表現。每一場小局只歸屬到當局使用的牌組。' : 'Compare registered decks, lineups, and game-level results in dual-deck tournaments. Each game belongs only to the decks actually played.' }}</p>
    </header>

    <LoadingState v-if="loading" :label="zh ? '正在讀取雙牌組數據' : 'Loading dual-deck data'" />
    <DataPanel v-else-if="error" :error="zh ? '暫時無法讀取雙牌組數據。請重新載入。' : 'Dual-deck data is temporarily unavailable. Please reload.'">
      <template #footer><AppButton @click="load">{{ zh ? '重新讀取' : 'Retry' }}</AppButton></template>
    </DataPanel>
    <template v-else-if="data">
      <FilterBar :columns="3" :ariaLabel="zh ? '雙牌組篩選器' : 'Dual-deck filters'">
        <AppSelect v-model.number="days" :label="zh ? '時間範圍' : 'Time window'">
          <option :value="7">{{ zh ? '近 7 天' : 'Past 7 days' }}</option>
          <option :value="30">{{ zh ? '近 30 天' : 'Past 30 days' }}</option>
          <option :value="0">{{ zh ? '全部已收錄' : 'All collected' }}</option>
        </AppSelect>
        <AppSelect v-model.number="minPlayers" :label="zh ? '最少參賽人數' : 'Minimum players'">
          <option v-for="value in thresholds" :key="value" :value="value">{{ value }}+</option>
        </AppSelect>
        <AppSelect v-model="eventId" :label="zh ? '賽事' : 'Tournament'">
          <option value="">{{ zh ? '全部賽事' : 'All tournaments' }}</option>
          <option v-for="event in data.tournaments" :key="event.id" :value="event.id">{{ event.name }}</option>
        </AppSelect>
      </FilterBar>
      <p class="dual-meta__scope type-body">{{ zh ? '時間範圍以最新收錄賽事日期為基準：' : 'Time windows end at the latest collected event: ' }}<span class="mono">{{ latestDate }}</span></p>

      <div class="dual-meta__stats">
        <StatBlock :label="zh ? '賽事場數' : 'Tournaments'" :value="events.length" />
        <StatBlock :label="zh ? '參賽人次' : 'Player entries'" :value="summary.coverage.entrants" />
        <StatBlock :label="zh ? '已辨識登錄牌組' : 'Identified deck slots'" :value="summary.coverage.registeredDecks" :meta="`${summary.coverage.expectedDecks} ${zh ? '個預期牌組欄位' : 'expected slots'}`" />
        <StatBlock :label="zh ? '可歸屬小局' : 'Attributed games'" :value="summary.coverage.attributedGames" tone="accent" />
      </div>

      <EmptyState v-if="!events.length" :title="zh ? '沒有符合篩選的雙牌組賽事' : 'No matching dual-deck tournaments'" :description="zh ? '試試放寬人數或時間範圍。' : 'Try a wider player threshold or time window.'" />
      <template v-else>
        <DataPanel :title="zh ? '牌組登錄與小局表現' : 'Deck registrations & game results'" :description="zh ? '登錄佔比以所有已辨識的牌組欄位為分母；每位選手可登錄兩副。小局勝率包含和局的半勝，沒有樣本顯示 —。' : 'Registration share counts identified deck slots, two per player. Game win rate counts draws as half a win; no sample is shown as —.'">
          <EmptyState v-if="!summary.decks.length" :title="zh ? '賽事未提供可辨識的牌組' : 'No identified decks were published'" />
          <div v-else class="dual-meta__deck-head type-label"><span>{{ zh ? '牌組' : 'DECK' }}</span><span>{{ zh ? '登錄份數 / 佔比' : 'REGISTERED / SHARE' }}</span><span>{{ zh ? '小局戰績 / 勝率' : 'GAME RECORD / WIN RATE' }}</span></div>
          <article v-for="deck in shownDecks" :key="deck.id" class="dual-meta__deck-row">
            <PocketDeckIdentity :deck="deck" :lang="lang" />
            <div class="dual-meta__number"><strong class="mono">{{ deck.registrations }}</strong><span class="mono">{{ percent(deck.registrations / summary.coverage.registeredDecks) }}</span><span class="dual-meta__bar"><i :style="{ width: `${deck.registrations / summary.coverage.registeredDecks * 100}%` }"></i></span></div>
            <div class="dual-meta__number"><strong class="mono">{{ percent(winRate(deck)) }}</strong><span class="mono">{{ deck.wins }}–{{ deck.losses }}–{{ deck.draws }} · {{ gameCount(deck) }} {{ zh ? '小局' : 'games' }}</span></div>
          </article>
          <template v-if="summary.decks.length > 20" #footer><AppButton @click="showAllDecks = !showAllDecks">{{ showAllDecks ? (zh ? '顯示前 20 副牌組' : 'Show top 20 decks') : (zh ? `顯示全部 ${summary.decks.length} 副牌組` : `Show all ${summary.decks.length} decks`) }}</AppButton></template>
        </DataPanel>

        <div class="dual-meta__columns">
          <DataPanel :title="zh ? '雙牌組搭配' : 'Two-deck lineups'" :description="zh ? '順序不同的同一搭配合併計算；戰績與 Top 32 按選手及整場對局計算。' : 'Deck order does not split a lineup. Records and Top 32 finishes count player entries and whole matches.'">
            <EmptyState v-if="!summary.lineups.length" :title="zh ? '沒有完整雙牌組搭配記錄' : 'No complete two-deck lineups'" />
            <article v-for="lineup in shownLineups" :key="lineup.id" class="dual-meta__lineup">
              <div class="dual-meta__lineup-decks"><PocketDeckIdentity v-for="(key, index) in lineup.decks" :key="`${index}-${key}`" :deck="deckById[key]!" :lang="lang" /></div>
              <div class="dual-meta__lineup-record mono"><strong>{{ lineup.registrations }} {{ zh ? '人次' : 'entries' }}</strong><span>Top 32 · {{ lineup.top32 }}</span><span>{{ lineup.wins }}–{{ lineup.losses }}–{{ lineup.draws }} · {{ percent(winRate(lineup)) }}</span></div>
            </article>
            <template v-if="summary.lineups.length > 12" #footer><AppButton @click="showAllLineups = !showAllLineups">{{ showAllLineups ? (zh ? '顯示前 12 組搭配' : 'Show top 12 lineups') : (zh ? `顯示全部 ${summary.lineups.length} 組搭配` : `Show all ${summary.lineups.length} lineups`) }}</AppButton></template>
          </DataPanel>
          <DataPanel :title="zh ? '資料覆蓋範圍' : 'Coverage & missing records'">
            <dl class="dual-meta__coverage">
              <div><dt>{{ zh ? '有完整雙牌組的參賽人次' : 'Entries with two identified decks' }}</dt><dd class="mono">{{ summary.coverage.completeLineups }} / {{ summary.coverage.entrants }}</dd></div>
              <div><dt>{{ zh ? '可歸屬 / 已回報小局' : 'Attributed / reported games' }}</dt><dd class="mono">{{ summary.coverage.attributedGames }} / {{ summary.coverage.reportedGames }}</dd></div>
              <div><dt>{{ zh ? '缺少牌組選擇的小局' : 'Games missing deck selections' }}</dt><dd class="mono">{{ summary.coverage.unattributedGames }}</dd></div>
              <div><dt>{{ zh ? '未提供小局記錄的已完成對局' : 'Completed matches without game records' }}</dt><dd class="mono">{{ summary.coverage.matchesWithoutGames }}</dd></div>
              <div><dt>{{ zh ? '賽果尚未確定的小局' : 'Games without a resolved result' }}</dt><dd class="mono">{{ summary.coverage.unresolvedGames }}</dd></div>
            </dl>
            <p class="type-body">{{ zh ? '輪空、自動判負，以及無法確認當局牌組的記錄，不會被補成牌組勝負。登錄率與實際使用率是不同指標。' : 'Byes, automatic losses, and unidentified deck selections are never invented as deck wins or losses. Registration share differs from actual play rate.' }}</p>
            <p v-if="data.errors.length" class="dual-meta__warning">{{ zh ? '部分賽事未能更新，畫面使用目前可用的資料。' : 'Some events could not refresh; this view uses the currently available data.' }}</p>
            <template #footer><a href="https://docs.limitlesstcg.com/developer/tournaments.html" target="_blank" rel="noopener noreferrer">{{ zh ? '資料來源：Limitless Tournament API' : 'Source: Limitless Tournament API' }} ↗</a></template>
          </DataPanel>
        </div>

        <DataPanel :title="zh ? '小局對戰矩陣' : 'Game matchup matrix'" :description="zh ? '比較登錄最多的六副牌組；格內顯示列牌組的勝率及已辨識小局數。手機可左右滑動比較。' : 'Compare the six most registered decks. Each cell shows the row deck’s win rate and attributed game count. Scroll horizontally on mobile.'">
          <div class="dual-meta__matrix" tabindex="0" :aria-label="zh ? '可水平捲動的小局勝率表' : 'Horizontally scrollable game matchup table'">
            <table><thead><tr><th>{{ zh ? '對手 →' : 'Opponent →' }}</th><th v-for="deck in matrixDecks" :key="deck.id"><PocketDeckIdentity :deck="deck" :lang="lang" compact /></th></tr></thead>
              <tbody><tr v-for="own in matrixDecks" :key="own.id"><th scope="row"><PocketDeckIdentity :deck="own" :lang="lang" compact /></th><td v-for="other in matrixDecks" :key="other.id" :style="cellStyle(own.id, other.id)"><strong class="mono">{{ own.id === other.id ? '—' : percent(winRate(matchup(own.id, other.id))) }}</strong><small class="mono">{{ own.id === other.id ? (zh ? '同牌組' : 'Mirror') : `${gameCount(matchup(own.id, other.id))} ${zh ? '小局' : 'games'}` }}</small></td></tr></tbody>
            </table>
          </div>
        </DataPanel>

        <DataPanel :title="zh ? '已收錄雙牌組賽事' : 'Collected dual-deck tournaments'">
          <RouterLink v-for="event in events" :key="event.id" :to="withLang(`/pocket/tournaments/${event.id}`, lang)" class="dual-meta__event"><span><strong>{{ event.name }}</strong><small class="mono">{{ event.date.slice(0, 10) }} · {{ event.players }} {{ zh ? '人' : 'players' }} · {{ event.coverage.attributedGames }} {{ zh ? '可歸屬小局' : 'attributed games' }}</small></span><span aria-hidden="true">↗</span></RouterLink>
        </DataPanel>
      </template>
      <p class="type-label">{{ zh ? '更新時間' : 'UPDATED' }} · {{ data.generatedAt }} · {{ data.minPlayers }}+ {{ zh ? '人賽事' : 'PLAYER EVENTS' }}</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { AppButton, AppSelect, DataPanel, EmptyState, FilterBar, LoadingState, StatBlock } from '../components/ui';
import PocketDeckIdentity from '../components/PocketDeckIdentity.vue';
import { routeLang, withLang } from '../lib/siteI18n';
import { aggregateMultiDeckEvents, filterMultiDeckEvents, gameCount, loadMultiDeckData, winRate, type GameRecord, type MultiDeckData } from '../lib/pocketMultideck';
const route = useRoute();
const lang = computed(() => routeLang(route));
const zh = computed(() => lang.value === 'zh');
const data = ref<MultiDeckData | null>(null);
const loading = ref(true);
const error = ref(false);
const days = ref(30);
const minPlayers = ref(64);
const eventId = ref('');
const showAllDecks = ref(false);
const showAllLineups = ref(false);
const thresholds = computed(() => [...new Set([data.value?.minPlayers || 64, 128, 256, 512])].filter(value => value >= (data.value?.minPlayers || 64)).sort((a,b) => a-b));
const events = computed(() => filterMultiDeckEvents(data.value?.tournaments || [], days.value, minPlayers.value, eventId.value));
const summary = computed(() => aggregateMultiDeckEvents(events.value));
const shownDecks = computed(() => showAllDecks.value ? summary.value.decks : summary.value.decks.slice(0, 20));
const shownLineups = computed(() => showAllLineups.value ? summary.value.lineups : summary.value.lineups.slice(0, 12));
const matrixDecks = computed(() => summary.value.decks.slice(0, 6));
const deckById = computed(() => Object.fromEntries(summary.value.decks.map(deck => [deck.id, deck])));
const latestDate = computed(() => data.value?.tournaments.map(event => event.date.slice(0, 10)).sort().slice(-1)[0] || '—');
const emptyRecord: GameRecord = { wins: 0, losses: 0, draws: 0 };
function matchup(own: string, other: string) { return summary.value.matchups.get(JSON.stringify([own, other])) || emptyRecord; }
function percent(value: number | null) { return value === null || !Number.isFinite(value) ? '—' : `${(value * 100).toFixed(1)}%`; }
function cellStyle(own: string, other: string) {
  const rate = winRate(matchup(own, other));
  if (own === other || rate === null) return {};
  return { background: `color-mix(in srgb, var(${rate >= 0.5 ? '--positive' : '--negative'}) 8%, var(--surface))` };
}
async function load() {
  loading.value = true; error.value = false;
  try { data.value = await loadMultiDeckData(); minPlayers.value = data.value.minPlayers; }
  catch { error.value = true; }
  finally { loading.value = false; }
}
onMounted(load);
</script>

<style scoped>
.dual-meta { min-width: 0; display: grid; gap: var(--space-5); }
.dual-meta__hero { padding: var(--space-5) 0 var(--space-6); border-bottom: 1px solid var(--border); }
.dual-meta__eyebrow { color: var(--accent); margin: 0 0 var(--space-5); }
.dual-meta__hero h1 { margin: 0 0 var(--space-5); font-size: var(--type-page-size); line-height: var(--type-display-line-height); }
.dual-meta__hero h1 em { color: var(--accent); font-style: inherit; display: block; }
.dual-meta__hero p:last-child { max-width: 760px; margin: 0; }
.dual-meta__scope { margin: 0; font-size: 12px; }
.dual-meta__stats { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: var(--space-3); }
.dual-meta__columns { display: grid; grid-template-columns: minmax(0,1.2fr) minmax(0,1fr); gap: var(--space-5); align-items: start; }
.dual-meta__deck-head,.dual-meta__deck-row { display: grid; grid-template-columns: minmax(0,1.7fr) minmax(0,1fr) minmax(0,1fr); gap: var(--space-4); align-items: center; padding: var(--space-3) 0; border-bottom: 1px solid var(--border); }
.dual-meta__deck-head { background: var(--bg-table-head); }
.dual-meta__number { display: grid; gap: var(--space-1); color: var(--text-soft); font-size: 13px; }
.dual-meta__number strong { color: var(--text); font-size: 20px; }
.dual-meta__bar { height: 4px; background: var(--bg-deep); max-width: 160px; }
.dual-meta__bar i { display: block; height: 100%; background: var(--accent); }
.dual-meta__lineup { padding: var(--space-4) 0; border-bottom: 1px solid var(--border); display: grid; gap: var(--space-3); }
.dual-meta__lineup-decks { display: grid; gap: var(--space-2); }
.dual-meta__lineup-record { display: flex; flex-wrap: wrap; gap: var(--space-3); color: var(--text-soft); font-size: 13px; }
.dual-meta__lineup-record strong { color: var(--accent-secondary); }
.dual-meta__coverage { margin: 0 0 var(--space-5); }
.dual-meta__coverage div { display: flex; justify-content: space-between; gap: var(--space-4); padding: var(--space-3) 0; border-bottom: 1px solid var(--border); font-size: 13px; }
.dual-meta__coverage dd { margin: 0; flex: 0 0 auto; color: var(--text); }
.dual-meta__warning { color: var(--warning); font-size: 13px; }
.dual-meta__matrix { max-width: 100%; overflow-x: auto; }
.dual-meta__matrix table { width: 100%; min-width: 700px; border-collapse: collapse; table-layout: fixed; }
.dual-meta__matrix th { padding: var(--space-3); text-align: left; width: 120px; }
.dual-meta__matrix td { text-align: center; border: 1px solid var(--border); padding: var(--space-3); }
.dual-meta__matrix td strong,.dual-meta__matrix td small { display: block; color: var(--text); font-size: 16px; }
.dual-meta__matrix td small { margin-top: var(--space-1); color: var(--text-soft); font-size: 12px; }
.dual-meta__event { min-height: var(--control-height); padding: var(--space-4) 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; gap: var(--space-4); text-decoration: none; }
.dual-meta__event strong { color: var(--text); font-size: 14px; overflow-wrap: anywhere; }
.dual-meta__event small { display: block; margin-top: var(--space-2); color: var(--text-soft); font-size: 12px; }
.dual-meta__event:hover strong { color: var(--accent); }
@media (max-width:1080px) { .dual-meta__columns { grid-template-columns: minmax(0,1fr); } }
@media (max-width:760px) { .dual-meta__stats { grid-template-columns: repeat(2,minmax(0,1fr)); } .dual-meta__deck-head { display: none; } .dual-meta__deck-row { grid-template-columns: repeat(2,minmax(0,1fr)); } .dual-meta__deck-row > :first-child { grid-column: 1/-1; } }
</style>
