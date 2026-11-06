<template>
  <div class="pocket-meta">
    <div class="pocket-meta__format">
      <span class="type-label">{{ lang === 'zh' ? '賽制 / FORMAT' : 'TOURNAMENT FORMAT' }}</span>
      <SegmentedControl :model-value="mode" :options="options" :ariaLabel="lang === 'zh' ? '牌組賽制' : 'Deck format'" @update:model-value="setMode" />
    </div>
    <component :is="mode === 'dual' ? PocketMultiDeckMeta : TierList" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SegmentedControl from '../components/ui/SegmentedControl.vue';
import { routeLang } from '../lib/siteI18n';
const TierList = defineAsyncComponent(() => import('./TierList.vue'));
const PocketMultiDeckMeta = defineAsyncComponent(() => import('./PocketMultiDeckMeta.vue'));
const route = useRoute();
const router = useRouter();
const lang = computed(() => routeLang(route));
const mode = computed(() => route.query.deckMode === 'dual' ? 'dual' : 'single');
const options = computed(() => [
  { value: 'single', label: lang.value === 'zh' ? '單牌組' : 'Single deck' },
  { value: 'dual', label: lang.value === 'zh' ? '雙牌組' : 'Dual deck' },
]);
function setMode(value: string | number | boolean | null | undefined) {
  void router.replace({ path: '/pocket', query: { ...route.query, deckMode: value === 'dual' ? 'dual' : undefined } });
}
</script>

<style scoped>
.pocket-meta { min-width: 0; }
.pocket-meta__format { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: var(--space-3); padding-bottom: var(--space-4); border-bottom: 1px solid var(--border); margin-bottom: var(--space-5); }
@media (max-width: 760px) { .pocket-meta__format { justify-content: space-between; } }
</style>
