<template>
  <aside class="speed-inspector" :aria-labelledby="titleId">
    <header class="speed-inspector__head">
      <span class="speed-inspector__eyebrow mono">{{ t("champions.speed.inspectorEyebrow") }}</span>
      <h2 :id="titleId">{{ t("champions.speed.inspectorTitle") }}</h2>
      <p>{{ t("champions.speed.inspectorDescription") }}</p>
    </header>

    <template v-if="profile">
      <div class="speed-inspector__identity">
        <span class="speed-inspector__sprite">
          <ChampionsPokemonImage
            :slug="profile.slug"
            :name="profile.name"
            :src="profile.spriteUrl"
            mode="pixel"
          />
        </span>
        <div class="speed-inspector__name" :title="`${resolvedName.primary} · ${resolvedName.secondary}`">
          <strong>{{ resolvedName.primary }}</strong>
          <span>{{ resolvedName.secondary }}</span>
          <div class="speed-inspector__types">
            <span v-for="typeName in profile.types" :key="typeName">{{ localizedType(typeName) }}</span>
          </div>
        </div>
        <div class="speed-inspector__order mono">
          <span>{{ trickRoom ? t("champions.speed.trickOrder") : t("champions.speed.currentOrder") }}</span>
          <strong>#{{ order }}</strong>
        </div>
      </div>

      <div class="speed-inspector__metrics">
        <div>
          <span>{{ t("champions.speed.baseSpeed") }}</span>
          <strong class="mono">{{ profile.baseSpeed ?? "—" }}</strong>
        </div>
        <div>
          <span>{{ t("champions.speed.calculatedSpeed") }}</span>
          <strong class="mono">{{ result.calculatedSpeed }}</strong>
        </div>
        <div class="is-accent">
          <span>{{ t("champions.speed.effectiveSpeed") }}</span>
          <strong class="mono">{{ result.effectiveSpeed }}</strong>
        </div>
      </div>

      <div class="speed-inspector__controls">
        <AppSelect
          id="champions-speed-level"
          :model-value="input.level"
          :label="t('champions.filters.level')"
          density="compact"
          @update:model-value="updateLevel"
        >
          <option :value="50">50</option>
          <option :value="100">100</option>
        </AppSelect>

        <AppSelect
          id="champions-speed-nature"
          :model-value="input.nature"
          :label="t('champions.filters.nature')"
          density="compact"
          @update:model-value="updateChoice('nature', $event)"
        >
          <option value="plus">{{ t("champions.speed.naturePlus") }}</option>
          <option value="neutral">{{ t("champions.speed.natureNeutral") }}</option>
          <option value="minus">{{ t("champions.speed.natureMinus") }}</option>
        </AppSelect>

        <AppField
          id="champions-speed-iv"
          :model-value="input.iv"
          :label="t('champions.filters.iv')"
          type="number"
          min="0"
          max="31"
          step="1"
          density="compact"
          @update:model-value="updateNumber('iv', $event, 0, 31, 1)"
        />

        <AppField
          id="champions-speed-ev"
          :model-value="input.ev"
          :label="t('champions.filters.ev')"
          type="number"
          min="0"
          max="252"
          step="4"
          density="compact"
          @update:model-value="updateNumber('ev', $event, 0, 252, 4)"
        />

        <AppField
          id="champions-speed-stage"
          :model-value="input.stage"
          :label="t('champions.filters.statStage')"
          type="number"
          min="-6"
          max="6"
          step="1"
          density="compact"
          @update:model-value="updateNumber('stage', $event, -6, 6, 1)"
        />

        <AppSelect
          id="champions-speed-item"
          :model-value="input.item"
          :label="t('champions.speed.item')"
          density="compact"
          @update:model-value="updateChoice('item', $event)"
        >
          <option value="none">{{ t("champions.options.none") }}</option>
          <option value="choiceScarf">{{ t("champions.options.choiceScarf") }}</option>
          <option value="ironBall">{{ t("champions.options.ironBall") }}</option>
        </AppSelect>

        <AppSelect
          id="champions-speed-ability"
          :model-value="input.ability"
          :label="t('champions.speed.abilityEffect')"
          density="compact"
          @update:model-value="updateChoice('ability', $event)"
        >
          <option value="none">{{ t("champions.options.none") }}</option>
          <option value="swiftSwim">{{ t("champions.options.swiftSwim") }}</option>
          <option value="chlorophyll">{{ t("champions.options.chlorophyll") }}</option>
          <option value="sandRush">{{ t("champions.options.sandRush") }}</option>
          <option value="slushRush">{{ t("champions.options.slushRush") }}</option>
          <option value="quickFeet">{{ t("champions.options.quickFeet") }}</option>
          <option value="unburden">{{ t("champions.options.unburden") }}</option>
          <option value="surgeSurfer">{{ t("champions.options.surgeSurfer") }}</option>
        </AppSelect>

        <AppSelect
          id="champions-speed-weather"
          :model-value="input.weather"
          :label="t('champions.filters.weather')"
          density="compact"
          @update:model-value="updateChoice('weather', $event)"
        >
          <option value="none">{{ t("champions.options.none") }}</option>
          <option value="sun">{{ t("champions.options.sun") }}</option>
          <option value="rain">{{ t("champions.options.rain") }}</option>
          <option value="sand">{{ t("champions.options.sand") }}</option>
          <option value="snow">{{ t("champions.options.snow") }}</option>
        </AppSelect>
      </div>

      <div class="speed-inspector__toggles">
        <label class="champions-check">
          <input
            :checked="input.tailwind"
            type="checkbox"
            @change="updateBoolean('tailwind', $event)"
          />
          <span>{{ t("champions.options.tailwind") }}</span>
        </label>
        <label class="champions-check">
          <input
            :checked="trickRoom"
            type="checkbox"
            @change="updateTrickRoom"
          />
          <span>{{ t("champions.options.trickRoom") }}</span>
        </label>
      </div>

      <div class="speed-inspector__context">
        <div>
          <span class="champions-mini-label">{{ t("champions.speed.nativeAbilities") }}</span>
          <p>{{ nativeAbilities }}</p>
        </div>
        <p v-if="input.ability !== 'none' && !selectedAbilityIsNative" class="speed-inspector__scenario">
          {{ t("champions.speed.scenarioOverride") }}
        </p>
        <p v-if="input.ability !== 'none' && !result.abilityActive" class="speed-inspector__inactive">
          {{ t("champions.speed.abilityInactive") }}
        </p>
        <div>
          <span class="champions-mini-label">{{ t("champions.labels.defaultSpread") }}</span>
          <p>{{ defaultSpread }}</p>
          <small>{{ t("champions.speed.ivFallback") }}</small>
        </div>
      </div>

      <button type="button" class="speed-inspector__reset mono" @click="$emit('reset')">
        {{ t("champions.speed.resetModifiers") }}
      </button>
    </template>

    <div v-else class="speed-inspector__empty">
      <strong>{{ t("champions.speed.selectTitle") }}</strong>
      <p>{{ t("champions.speed.selectDetail") }}</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import { useRoute } from "vue-router";
import { AppField, AppSelect } from "../ui";
import { championsT, type ChampionsTranslationKey } from "../../lib/champions/i18n";
import { normalizeChampionsNameId, resolveChampionsName } from "../../lib/champions/names";
import {
  statPointsToEv,
  type SpeedAbility,
  type SpeedInput,
  type SpeedItem,
  type SpeedNature,
  type SpeedResult,
  type SpeedWeather,
} from "../../lib/champions/speed";
import type { PokemonSpeedProfile } from "../../lib/champions/types";
import { routeLang } from "../../lib/siteI18n";
import ChampionsPokemonImage from "./ChampionsPokemonImage.vue";

const props = defineProps<{
  profile: PokemonSpeedProfile | null;
  input: SpeedInput;
  result: SpeedResult;
  order: number;
  trickRoom: boolean;
}>();

const emit = defineEmits<{
  "update:input": [input: SpeedInput];
  "update:trickRoom": [value: boolean];
  reset: [];
}>();

const route = useRoute();
const titleId = `speed-inspector-${useId()}`;
const lang = computed(() => routeLang(route));
const resolvedName = computed(() => resolveChampionsName("pokemon", props.profile?.name, lang.value));
const nativeAbilities = computed(() => {
  if (!props.profile?.abilities.length) return t("champions.status.missing");
  return props.profile.abilities
    .map((ability) => resolveChampionsName("ability", ability, lang.value).primary)
    .join(" / ");
});
const selectedAbilityIsNative = computed(() => {
  if (!props.profile || props.input.ability === "none") return true;
  const selectedId = normalizeChampionsNameId(speedAbilityName(props.input.ability));
  return props.profile.abilities.some((ability) => normalizeChampionsNameId(ability) === selectedId);
});
const defaultSpread = computed(() => {
  if (!props.profile) return "—";
  const nature = props.profile.nature
    ? resolveChampionsName("nature", props.profile.nature, lang.value).primary
    : t("champions.status.missing");
  const ev = props.profile.speedStatPoints == null ? "—" : statPointsToEv(props.profile.speedStatPoints);
  return `${nature} · EV ${ev} · IV ${props.profile.speedIv} · Lv. ${props.profile.level}`;
});

function updateChoice(key: "nature" | "item" | "ability" | "weather", value: unknown) {
  const next = { ...props.input };
  if (key === "nature") next.nature = String(value) as SpeedNature;
  if (key === "item") next.item = String(value) as SpeedItem;
  if (key === "ability") next.ability = String(value) as SpeedAbility;
  if (key === "weather") next.weather = String(value) as SpeedWeather;
  emit("update:input", next);
}

function updateLevel(value: unknown) {
  emit("update:input", { ...props.input, level: Number(value) === 100 ? 100 : 50 });
}

function updateNumber(key: "iv" | "ev" | "stage", value: unknown, min: number, max: number, step: number) {
  const parsed = Number(value);
  const fallback = props.input[key];
  const clamped = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  const normalized = step > 1 ? Math.round(clamped / step) * step : Math.round(clamped);
  emit("update:input", { ...props.input, [key]: normalized });
}

function updateBoolean(key: "tailwind", event: Event) {
  emit("update:input", { ...props.input, [key]: (event.target as HTMLInputElement).checked });
}

function updateTrickRoom(event: Event) {
  emit("update:trickRoom", (event.target as HTMLInputElement).checked);
}

function localizedType(value: string) {
  return resolveChampionsName("type", value, lang.value).primary;
}

function speedAbilityName(value: SpeedInput["ability"]) {
  const names: Record<SpeedInput["ability"], string> = {
    none: "",
    chlorophyll: "Chlorophyll",
    swiftSwim: "Swift Swim",
    sandRush: "Sand Rush",
    slushRush: "Slush Rush",
    unburden: "Unburden",
    surgeSurfer: "Surge Surfer",
    quickFeet: "Quick Feet",
  };
  return names[value];
}

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}
</script>

<style scoped>
.speed-inspector {
  position: sticky;
  top: calc(var(--topbar-height) + var(--ticker-height) + var(--space-3));
  min-width: 0;
  border: 1px solid var(--border);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--accent) 7%, transparent), transparent 44%),
    var(--bg-panel);
}

.speed-inspector__head {
  padding: var(--space-5);
  border-bottom: 1px solid var(--border);
}

.speed-inspector__eyebrow {
  color: var(--champions-accent-cyan);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
}

.speed-inspector__head h2 {
  margin: var(--space-2) 0 0;
  color: var(--text);
  font-family: var(--font-display-en);
  font-size: 34px;
  font-style: italic;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1;
}

.speed-inspector__head p {
  margin: var(--space-2) 0 0;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.6;
}

.speed-inspector__identity {
  min-width: 0;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.speed-inspector__sprite {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-accent);
  background: var(--surface-warm);
}

.speed-inspector__sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.speed-inspector__name {
  min-width: 0;
  display: grid;
  gap: var(--space-1);
}

.speed-inspector__name strong {
  overflow: hidden;
  color: var(--text);
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.speed-inspector__name > span {
  overflow: hidden;
  color: var(--text-soft);
  font-family: var(--font-num);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.speed-inspector__types {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.speed-inspector__types span {
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--border);
  color: var(--muted);
  font-family: var(--font-num);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.speed-inspector__order {
  display: grid;
  gap: var(--space-1);
  text-align: right;
}

.speed-inspector__order span {
  color: var(--muted);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.speed-inspector__order strong {
  color: var(--accent);
  font-size: 25px;
  font-weight: 900;
}

.speed-inspector__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-bottom: 1px solid var(--border);
}

.speed-inspector__metrics > div {
  min-width: 0;
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border-right: 1px solid var(--border);
  background: var(--bg-deep);
}

.speed-inspector__metrics > div:last-child {
  border-right: 0;
}

.speed-inspector__metrics span {
  color: var(--muted);
  font-family: var(--font-num);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.2;
}

.speed-inspector__metrics strong {
  color: var(--text);
  font-size: 27px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.speed-inspector__metrics .is-accent strong {
  color: var(--accent);
}

.speed-inspector__controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-bottom: 1px solid var(--border);
}

.speed-inspector__toggles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-bottom: 1px solid var(--border);
}

.speed-inspector__toggles label {
  min-height: var(--control-height);
  padding: var(--space-3);
  border-right: 1px solid var(--border);
  background: var(--bg-deep);
}

.speed-inspector__toggles label:last-child {
  border-right: 0;
}

.speed-inspector__context {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.speed-inspector__context p,
.speed-inspector__context small {
  margin: var(--space-1) 0 0;
  color: var(--text-soft);
  font-size: 12px;
  line-height: 1.55;
}

.speed-inspector__context small {
  display: block;
  color: var(--muted);
}

.speed-inspector__scenario,
.speed-inspector__inactive {
  padding: var(--space-2);
  border-left: 2px solid var(--warning);
  background: color-mix(in srgb, var(--warning) 7%, transparent);
}

.speed-inspector__inactive {
  border-left-color: var(--champions-accent-cyan);
  background: color-mix(in srgb, var(--champions-accent-cyan) 7%, transparent);
}

.speed-inspector__reset {
  width: calc(100% - var(--space-6));
  min-height: var(--control-height);
  margin: var(--space-3);
  border: 1px solid var(--border);
  background: var(--bg-deep);
  color: var(--text-soft);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.1em;
  cursor: pointer;
}

.speed-inspector__reset:hover,
.speed-inspector__reset:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
}

.speed-inspector__empty {
  padding: var(--space-5);
}

.speed-inspector__empty strong {
  color: var(--text);
  font-size: 17px;
}

.speed-inspector__empty p {
  margin: var(--space-2) 0 0;
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.6;
}

html[data-lang="zh"] .speed-inspector__head h2 {
  font-family: var(--font-display-cn);
  font-style: normal;
}

@media (max-width: 1080px) {
  .speed-inspector {
    position: static;
  }
}

@media (max-width: 560px) {
  .speed-inspector__head {
    padding: var(--space-4);
  }

  .speed-inspector__identity {
    grid-template-columns: 56px minmax(0, 1fr) auto;
    padding: var(--space-3);
  }

  .speed-inspector__sprite {
    width: 56px;
    height: 56px;
  }

  .speed-inspector__metrics strong {
    font-size: 23px;
  }

  .speed-inspector__controls {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
