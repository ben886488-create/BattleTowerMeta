<template>
  <section class="speed-field-shell" :aria-labelledby="titleId">
    <header class="speed-field-head">
      <div>
        <span class="speed-field-eyebrow mono">{{ t("champions.speed.fieldEyebrow") }}</span>
        <h2 :id="titleId">{{ t("champions.speed.fieldTitle") }}</h2>
        <p>{{ t("champions.speed.fieldDescription") }}</p>
      </div>
      <div class="speed-field-legend" aria-label="Speed field legend">
        <span><i class="speed-field-legend__minor" />{{ t("champions.speed.minorLine") }}</span>
        <span><i class="speed-field-legend__major" />{{ t("champions.speed.majorLine") }}</span>
      </div>
    </header>

    <div v-if="trickRoom" class="speed-field-trick" role="status">
      <span class="mono">TRICK ROOM</span>
      <strong>{{ t("champions.speed.trickRoomNotice") }}</strong>
    </div>

    <div
      class="speed-field"
      :style="{ '--speed-minor-height': `${minorBandHeight}px` }"
      role="list"
      :aria-label="t('champions.speed.fieldA11y')"
    >
      <div
        v-for="band in bands"
        :key="band.speed"
        class="speed-field-band"
        :class="{
          'is-major': band.major,
          'is-alt': band.alt,
          'has-pokemon': band.items.length,
        }"
        :data-speed="band.speed"
      >
        <span class="speed-field-band__tick mono" :aria-hidden="!band.major">
          {{ band.major ? band.speed : "" }}
        </span>
        <div v-if="band.items.length" class="speed-field-band__lane" role="group" :aria-label="`${band.speed} Speed`">
          <button
            v-for="item in band.items"
            :key="item.slug"
            :ref="(element) => setSpriteElement(item.slug, element)"
            type="button"
            class="speed-field-sprite"
            :class="{ 'is-selected': item.slug === selectedSlug }"
            :aria-label="item.accessibleLabel"
            :aria-pressed="item.slug === selectedSlug"
            :title="item.accessibleLabel"
            @click="$emit('select', item.slug)"
          >
            <ChampionsPokemonImage
              :slug="item.slug"
              :name="item.name"
              :src="item.spriteUrl"
              mode="pixel"
            />
            <span v-if="item.slug === selectedSlug" class="speed-field-sprite__signal mono" aria-hidden="true">
              {{ item.order }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  onBeforeUpdate,
  onUpdated,
  useId,
  watch,
  type ComponentPublicInstance,
} from "vue";
import { useRoute } from "vue-router";
import { championsT, type ChampionsTranslationKey } from "../../lib/champions/i18n";
import type { SpeedFieldItem } from "../../lib/champions/speed";
import { routeLang } from "../../lib/siteI18n";
import ChampionsPokemonImage from "./ChampionsPokemonImage.vue";

const props = defineProps<{
  items: SpeedFieldItem[];
  selectedSlug: string;
  trickRoom: boolean;
}>();

defineEmits<{
  select: [slug: string];
}>();

const route = useRoute();
const titleId = `speed-field-${useId()}`;
const spriteElements = new Map<string, HTMLElement>();
const previousRects = new Map<string, DOMRect>();

const grouped = computed(() => {
  const map = new Map<number, SpeedFieldItem[]>();
  for (const item of props.items) {
    const group = map.get(item.effectiveSpeed) ?? [];
    group.push(item);
    map.set(item.effectiveSpeed, group);
  }
  for (const group of map.values()) group.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return map;
});

const range = computed(() => {
  const speeds = props.items.map((item) => item.effectiveSpeed);
  const maximum = speeds.length ? Math.max(...speeds) : 200;
  const minimum = speeds.length ? Math.min(...speeds) : 100;
  return {
    top: Math.ceil(maximum / 5) * 5 + 5,
    bottom: Math.max(0, Math.floor(minimum / 5) * 5 - 5),
  };
});

const minorBandHeight = computed(() => {
  const span = range.value.top - range.value.bottom;
  if (span > 1000) return 1;
  if (span > 500) return 2;
  if (span > 250) return 3;
  if (span > 140) return 4;
  return 6;
});

const bands = computed(() => {
  const result: Array<{ speed: number; major: boolean; alt: boolean; items: SpeedFieldItem[] }> = [];
  for (let speed = range.value.top; speed >= range.value.bottom; speed -= 1) {
    result.push({
      speed,
      major: speed % 5 === 0,
      alt: Math.abs(Math.floor(speed / 5)) % 2 === 0,
      items: grouped.value.get(speed) ?? [],
    });
  }
  return result;
});

watch(
  () => props.items.map((item) => `${item.slug}:${item.effectiveSpeed}:${item.order}`).join("|"),
  () => {
    previousRects.clear();
    for (const [slug, element] of spriteElements) previousRects.set(slug, element.getBoundingClientRect());
  },
  { flush: "pre" },
);

onBeforeUpdate(() => spriteElements.clear());

onUpdated(() => {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.requestAnimationFrame(() => {
    for (const [slug, element] of spriteElements) {
      const previous = previousRects.get(slug);
      if (!previous) continue;
      const current = element.getBoundingClientRect();
      const deltaX = previous.left - current.left;
      const deltaY = previous.top - current.top;
      if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) continue;
      element.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)`, zIndex: "8" },
          { transform: "translate(0, 0)", zIndex: "8" },
        ],
        { duration: 360, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
  });
});

function setSpriteElement(slug: string, element: Element | ComponentPublicInstance | null) {
  if (element instanceof HTMLElement) spriteElements.set(slug, element);
}

function t(key: ChampionsTranslationKey) {
  return championsT(routeLang(route), key);
}
</script>

<style scoped>
.speed-field-shell {
  min-width: 0;
  border: 1px solid var(--border);
  background: var(--bg-panel);
}

.speed-field-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-5);
  padding: var(--space-5);
  border-bottom: 1px solid var(--border);
}

.speed-field-eyebrow {
  color: var(--champions-accent-cyan);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
}

.speed-field-head h2 {
  margin: var(--space-2) 0 0;
  color: var(--text);
  font-family: var(--font-display-en);
  font-size: 36px;
  font-style: italic;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1;
}

.speed-field-head p {
  max-width: 720px;
  margin: var(--space-2) 0 0;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.6;
}

.speed-field-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
  color: var(--muted);
  font-family: var(--font-num);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.speed-field-legend span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.speed-field-legend i {
  width: var(--space-5);
  height: 0;
  display: inline-block;
}

.speed-field-legend__minor {
  border-top: 1px solid var(--border);
}

.speed-field-legend__major {
  border-top: 3px solid var(--bg-page);
  outline: 1px solid var(--border-strong);
}

.speed-field {
  min-height: 720px;
  background: var(--bg-deep);
}

.speed-field-trick {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--champions-accent-violet);
  background: color-mix(in srgb, var(--champions-accent-violet) 9%, var(--bg-deep));
}

.speed-field-trick span {
  color: var(--champions-accent-violet);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.speed-field-trick strong {
  color: var(--text-soft);
  font-size: 12px;
}

.speed-field-band {
  min-width: 0;
  height: var(--speed-minor-height);
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  border-top: 1px solid color-mix(in srgb, var(--border) 42%, transparent);
  background: color-mix(in srgb, var(--accent-primary-deep) 5%, var(--bg-deep));
}

.speed-field-band.is-alt {
  background: color-mix(in srgb, var(--accent-primary) 11%, var(--bg-deep));
}

.speed-field-band.is-major {
  border-top: 3px solid var(--bg-page);
  box-shadow: inset 0 1px 0 var(--border-strong);
}

.speed-field-band.has-pokemon {
  height: auto;
  min-height: 68px;
}

.speed-field-band__tick {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: var(--space-1) var(--space-3) 0 0;
  border-right: 1px solid var(--border-strong);
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.speed-field-band.has-pokemon .speed-field-band__tick {
  align-items: center;
  padding-top: 0;
  color: var(--accent);
  font-size: 18px;
}

.speed-field-band__lane {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
}

.speed-field-sprite {
  position: relative;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  display: grid;
  place-items: center;
  padding: var(--space-1);
  border: 1px solid transparent;
  background: color-mix(in srgb, var(--bg-card) 84%, transparent);
  color: var(--text);
  box-shadow: none;
  cursor: pointer;
  transition:
    transform var(--dur-fast) ease,
    border-color var(--dur-fast) ease,
    background var(--dur-fast) ease,
    filter var(--dur-fast) ease;
}

.speed-field-sprite:hover,
.speed-field-sprite:focus-visible {
  z-index: 4;
  border-color: var(--accent-primary-soft);
  background: var(--surface-warm);
  filter: brightness(1.08) drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 42%, transparent));
  transform: translateY(-2px);
}

.speed-field-sprite.is-selected {
  z-index: 3;
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 20%, var(--bg-card));
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--accent) 55%, transparent));
}

.speed-field-sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.speed-field-sprite__signal {
  position: absolute;
  right: -1px;
  bottom: -1px;
  min-width: 18px;
  min-height: 18px;
  display: grid;
  place-items: center;
  border: 1px solid var(--accent);
  background: var(--bg-page);
  color: var(--accent);
  font-size: 10px;
  font-weight: 900;
}

html[data-lang="zh"] .speed-field-head h2 {
  font-family: var(--font-display-cn);
  font-style: normal;
}

@media (max-width: 760px) {
  .speed-field-head {
    align-items: start;
    flex-direction: column;
    padding: var(--space-4);
  }

  .speed-field-head h2 {
    font-size: 30px;
  }

  .speed-field-trick {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
  }

  .speed-field-legend {
    justify-content: flex-start;
  }

  .speed-field-band {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .speed-field-band.has-pokemon {
    min-height: 60px;
  }

  .speed-field-band__tick {
    padding-right: var(--space-2);
    font-size: 11px;
  }

  .speed-field-band.has-pokemon .speed-field-band__tick {
    font-size: 15px;
  }

  .speed-field-band__lane {
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
  }

  .speed-field-sprite {
    width: 46px;
    height: 46px;
    flex-basis: 46px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .speed-field-sprite {
    transition: none;
  }
}
</style>
