<template>
  <span class="pocket-identity" :class="{ 'pocket-identity--compact': compact }" :title="name">
    <span v-if="sprites.length" class="pocket-identity__sprites" aria-hidden="true">
      <img v-for="sprite in sprites" :key="sprite" :src="sprite" alt="" loading="lazy" @error="broken.add(sprite)" />
    </span>
    <span class="pocket-identity__name">{{ name }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import { getLocalizedDeckName } from '../assets/pokemonNames';
import type { MultiDeckIdentity } from '../lib/pocketMultideck';
const props = withDefaults(defineProps<{ deck: MultiDeckIdentity; lang: 'zh' | 'en'; compact?: boolean }>(), { compact: false });
const files = import.meta.glob('../assets/deck-icons/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const spriteIndex = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace(/\.png$/, ''), url]));
const broken = reactive(new Set<string>());
const sprites = computed(() => props.deck.icons.slice(0, 2).map(key => spriteIndex[key]).filter((url): url is string => Boolean(url) && !broken.has(url!)));
const name = computed(() => getLocalizedDeckName(props.deck.name, props.deck.icons, props.lang) || props.deck.name);
</script>

<style scoped>
.pocket-identity { min-width: 0; display: flex; align-items: center; gap: var(--space-3); }
.pocket-identity__sprites { flex: 0 0 auto; display: inline-flex; align-items: center; }
.pocket-identity__sprites img { width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated; }
.pocket-identity__name { min-width: 0; color: var(--text); font-size: 13px; font-weight: 700; line-height: 1.5; overflow-wrap: anywhere; }
.pocket-identity--compact { flex-direction: column; gap: var(--space-1); align-items: start; }
.pocket-identity--compact .pocket-identity__sprites img { width: 24px; height: 24px; }
.pocket-identity--compact .pocket-identity__name { font-size: 12px; }
</style>
