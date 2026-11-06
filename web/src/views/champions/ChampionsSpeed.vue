<template>
  <section class="champions-page champions-speed-page">
    <ChampionsHero title-key="champions.speed.title" subtitle-key="champions.speed.subtitle" variant="compact" />

    <div class="champions-stack champions-speed-workspace">
      <SegmentedControl
        v-model="preset"
        :options="presetOptions"
        :ariaLabel="t('champions.speed.presetLabel')"
        density="compact"
        stretch
      />

      <div class="champions-speed-summary" role="status">
        <div>
          <span class="champions-mini-label">{{ t("champions.speed.summaryMode") }}</span>
          <strong>{{ presetTitle }}</strong>
        </div>
        <div>
          <span class="champions-mini-label">{{ t("champions.speed.summarySource") }}</span>
          <strong>ChampionsBattleData</strong>
        </div>
        <div>
          <span class="champions-mini-label">{{ t("champions.speed.summaryTotal") }}</span>
          <strong class="mono">{{ fieldEntries.length }} / 50</strong>
        </div>
        <div :class="{ 'is-active': trickRoom }">
          <span class="champions-mini-label">{{ t("champions.speed.summaryTrickRoom") }}</span>
          <strong>{{ trickRoom ? t("champions.speed.lowSpeedPriority") : t("champions.options.off") }}</strong>
        </div>
        <div :class="{ 'is-active': speedInput.tailwind }">
          <span class="champions-mini-label">{{ t("champions.speed.summaryTailwind") }}</span>
          <strong>{{ speedInput.tailwind ? t("champions.options.on") : t("champions.options.off") }}</strong>
        </div>
      </div>

      <DataPanel
        v-if="loading || errorMessage"
        :loading="loading"
        :loading-label="t('champions.status.loading')"
        :error="errorMessage"
        :error-title="t('champions.empty.runtimeError')"
        density="compact"
      />

      <DataPanel
        v-else-if="preset === 'usage' && !usageAvailable"
        :title="t('champions.speed.usageTitle')"
        :description="t('champions.speed.usageDescription')"
        density="compact"
      >
        <EmptyState
          :eyebrow="t('champions.status.missing')"
          :title="t('champions.speed.usageMissingTitle')"
          :description="t('champions.speed.usageMissingDetail')"
          density="compact"
          announce
        />
      </DataPanel>

      <DataPanel
        v-else-if="!fieldEntries.length"
        :title="t('champions.speed.fieldTitle')"
        density="compact"
      >
        <EmptyState
          :title="t('champions.empty.noResults')"
          :description="t('champions.empty.providerPending')"
          density="compact"
        />
      </DataPanel>

      <div v-else class="champions-speed-layout champions-speed-layout--field">
        <ChampionsSpeedField
          :items="fieldItems"
          :selected-slug="selectedSlug"
          :trick-room="trickRoom"
          @select="selectPokemonBySlug"
        />

        <ChampionsSpeedInspector
          class="champions-speed-inspector"
          :profile="selectedProfile"
          :input="speedInput"
          :result="selectedResult"
          :order="selectedOrder"
          :trick-room="trickRoom"
          @update:input="updateSpeedInput"
          @update:trick-room="updateTrickRoom"
          @reset="resetSelectedPokemon"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ChampionsHero from "../../components/champions/ChampionsHero.vue";
import ChampionsSpeedField from "../../components/champions/ChampionsSpeedField.vue";
import ChampionsSpeedInspector from "../../components/champions/ChampionsSpeedInspector.vue";
import { DataPanel, EmptyState, SegmentedControl } from "../../components/ui";
import { championsT, type ChampionsTranslationKey } from "../../lib/champions/i18n";
import { natureSpeedModifier, resolveChampionsName } from "../../lib/champions/names";
import { championsDataProvider } from "../../lib/champions/providers";
import {
  calculateEffectiveSpeed,
  statPointsToEv,
  type SpeedAbility,
  type SpeedInput,
  type SpeedItem,
  type SpeedNature,
  type SpeedResult,
  type SpeedWeather,
  type SpeedFieldItem,
} from "../../lib/champions/speed";
import type { PokemonSpeedProfile } from "../../lib/champions/types";
import { routeLang } from "../../lib/siteI18n";

type SpeedPreset = "usage" | "fastest";
type FieldEntry = {
  profile: PokemonSpeedProfile;
  result: SpeedResult;
  order: number;
};

const route = useRoute();
const router = useRouter();
const lang = computed(() => routeLang(route));
const loading = ref(true);
const errorMessage = ref("");
const profiles = ref<PokemonSpeedProfile[]>([]);
const preset = ref<SpeedPreset>(readPreset());
const selectedSlug = ref(readStringQuery("pokemon"));
const trickRoom = ref(readBooleanQuery("trickRoom"));
let suppressRouteWrite = false;

const speedInput = reactive<SpeedInput>({
  baseSpeed: 1,
  level: readLevelQuery(50),
  nature: readNatureQuery("neutral"),
  ev: readNumberQuery("ev", 0, 0, 252),
  iv: readNumberQuery("iv", 31, 0, 31),
  stage: readNumberQuery("stage", 0, -6, 6),
  item: readItemQuery(),
  ability: readAbilityQuery(),
  weather: readWeatherQuery(),
  tailwind: readBooleanQuery("tailwind"),
});

const presetOptions = computed(() => [
  { value: "usage", label: t("champions.speed.presetUsage") },
  { value: "fastest", label: t("champions.speed.presetFastest") },
]);
const presetTitle = computed(() => preset.value === "usage"
  ? t("champions.speed.usageTitle")
  : t("champions.speed.fastestTitle"));
const usageAvailable = computed(() => profiles.value.some((profile) => profile.usageRate != null));
const selectedProfile = computed(() => profiles.value.find((profile) => profile.slug === selectedSlug.value) ?? null);
const selectedResult = computed(() => calculateEffectiveSpeed(speedInput));

const fieldEntries = computed<FieldEntry[]>(() => {
  if (preset.value === "usage" && !usageAvailable.value) return [];
  const rows = profiles.value
    .filter((profile) => preset.value !== "usage" || profile.usageRate != null)
    .map((profile) => ({
      profile,
      result: calculateEffectiveSpeed(profile.slug === selectedSlug.value ? speedInput : inputForProfile(profile)),
    }));
  const ordered = [...rows].sort((a, b) => {
    const speedDifference = trickRoom.value
      ? a.result.effectiveSpeed - b.result.effectiveSpeed
      : b.result.effectiveSpeed - a.result.effectiveSpeed;
    return speedDifference
      || compareRank(a.profile.rank, b.profile.rank)
      || a.profile.name.localeCompare(b.profile.name);
  });
  const orderBySpeed = new Map<number, number>();
  ordered.forEach((row, index) => {
    if (!orderBySpeed.has(row.result.effectiveSpeed)) orderBySpeed.set(row.result.effectiveSpeed, index + 1);
  });
  return rows.map((row) => ({
    ...row,
    order: orderBySpeed.get(row.result.effectiveSpeed) ?? 1,
  }));
});

const selectedOrder = computed(() => fieldEntries.value.find((entry) => entry.profile.slug === selectedSlug.value)?.order ?? 1);
const fieldItems = computed<SpeedFieldItem[]>(() => fieldEntries.value.map((entry) => {
  const name = resolveChampionsName("pokemon", entry.profile.name, lang.value);
  return {
    slug: entry.profile.slug,
    name: entry.profile.name,
    spriteUrl: entry.profile.spriteUrl,
    effectiveSpeed: entry.result.effectiveSpeed,
    order: entry.order,
    accessibleLabel: `${name.primary}${name.secondary ? ` · ${name.secondary}` : ""} · ${t("champions.speed.effectiveSpeed")} ${entry.result.effectiveSpeed} · #${entry.order}`,
  };
}));

onMounted(loadProfiles);

watch(preset, async () => {
  const shouldWriteRoute = !suppressRouteWrite;
  if (shouldWriteRoute) suppressRouteWrite = true;
  await loadProfiles();
  if (shouldWriteRoute) {
    suppressRouteWrite = false;
    syncRoute("push");
  }
});

watch(
  [
    () => speedInput.level,
    () => speedInput.nature,
    () => speedInput.ev,
    () => speedInput.iv,
    () => speedInput.stage,
    () => speedInput.item,
    () => speedInput.ability,
    () => speedInput.weather,
    () => speedInput.tailwind,
    trickRoom,
  ],
  () => {
    if (!suppressRouteWrite) syncRoute();
  },
);

watch(() => route.query, async () => {
  const nextPreset = readPreset();
  const nextSlug = readStringQuery("pokemon");
  if (nextPreset !== preset.value) {
    suppressRouteWrite = true;
    preset.value = nextPreset;
    await nextTick();
    suppressRouteWrite = false;
  }
  const profile = profiles.value.find((item) => item.slug === nextSlug) ?? selectedProfile.value;
  if (profile && profile.slug !== selectedSlug.value) selectedSlug.value = profile.slug;
  if (profile) Object.assign(speedInput, inputFromQuery(profile));
  trickRoom.value = readBooleanQuery("trickRoom");
}, { deep: true });

async function loadProfiles() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await championsDataProvider.getPokemonSpeedProfiles({
      format: "doubles",
      sortBy: preset.value === "usage" ? "usage" : "speed",
    }, { strict: true });
    profiles.value = result.items;
    const requested = profiles.value.find((profile) => profile.slug === selectedSlug.value);
    const first = requested ?? profiles.value[0];
    if (first) {
      selectedSlug.value = first.slug;
      Object.assign(speedInput, inputFromQuery(first));
    }
  } catch (error) {
    console.error("[ChampionsSpeed] speed profiles failed", error);
    errorMessage.value = t("champions.empty.runtimeErrorDetail");
  } finally {
    loading.value = false;
  }
}

function inputForProfile(profile: PokemonSpeedProfile): SpeedInput {
  return {
    baseSpeed: profile.baseSpeed ?? 1,
    level: profile.level,
    nature: natureSpeedModifier(profile.nature ?? ""),
    ev: statPointsToEv(profile.speedStatPoints ?? 0),
    iv: profile.speedIv,
    stage: 0,
    item: "none",
    ability: "none",
    weather: "none",
    tailwind: false,
  };
}

function inputFromQuery(profile: PokemonSpeedProfile): SpeedInput {
  const defaults = inputForProfile(profile);
  return {
    ...defaults,
    level: readLevelQuery(defaults.level),
    nature: readNatureQuery(defaults.nature),
    ev: readNumberQuery("ev", defaults.ev, 0, 252),
    iv: readNumberQuery("iv", defaults.iv, 0, 31),
    stage: readNumberQuery("stage", 0, -6, 6),
    item: readItemQuery(),
    ability: readAbilityQuery(),
    weather: readWeatherQuery(),
    tailwind: readBooleanQuery("tailwind"),
  };
}

function selectPokemonBySlug(slug: string) {
  const profile = profiles.value.find((item) => item.slug === slug);
  if (!profile) return;
  suppressRouteWrite = true;
  selectedSlug.value = profile.slug;
  Object.assign(speedInput, inputForProfile(profile));
  trickRoom.value = false;
  suppressRouteWrite = false;
  syncRoute("push");
}

function updateSpeedInput(input: SpeedInput) {
  Object.assign(speedInput, input, { baseSpeed: selectedProfile.value?.baseSpeed ?? input.baseSpeed });
}

function updateTrickRoom(value: boolean) {
  trickRoom.value = value;
}

function resetSelectedPokemon() {
  if (!selectedProfile.value) return;
  Object.assign(speedInput, inputForProfile(selectedProfile.value));
  trickRoom.value = false;
}

function syncRoute(history: "replace" | "push" = "replace") {
  const query = { ...route.query };
  query.preset = preset.value;
  if (selectedSlug.value) query.pokemon = selectedSlug.value;
  query.level = String(speedInput.level);
  query.nature = speedInput.nature;
  query.ev = String(Math.max(0, Math.min(252, Math.round(speedInput.ev / 4) * 4)));
  query.iv = String(Math.max(0, Math.min(31, Math.round(speedInput.iv))));
  query.stage = String(Math.max(-6, Math.min(6, Math.round(speedInput.stage))));
  query.item = speedInput.item;
  query.ability = speedInput.ability;
  query.weather = speedInput.weather;
  query.tailwind = speedInput.tailwind ? "1" : "0";
  query.trickRoom = trickRoom.value ? "1" : "0";
  delete query.speedMode;
  void router[history]({ path: route.path, query });
}

function readPreset(): SpeedPreset {
  return readStringQuery("preset") === "usage" ? "usage" : "fastest";
}

function readLevelQuery(fallback: 50 | 100): 50 | 100 {
  const value = Number(readStringQuery("level"));
  return value === 100 ? 100 : value === 50 ? 50 : fallback;
}

function readNatureQuery(fallback: SpeedNature): SpeedNature {
  return readEnumQuery("nature", ["plus", "neutral", "minus"], fallback);
}

function readItemQuery(): SpeedItem {
  return readEnumQuery("item", ["none", "choiceScarf", "ironBall"], "none");
}

function readAbilityQuery(): SpeedAbility {
  const legacy = readStringQuery("speedMode");
  const value = readStringQuery("ability") || legacy;
  const allowed: SpeedAbility[] = ["none", "chlorophyll", "swiftSwim", "sandRush", "slushRush", "unburden", "surgeSurfer", "quickFeet"];
  return allowed.includes(value as SpeedAbility) ? value as SpeedAbility : "none";
}

function readWeatherQuery(): SpeedWeather {
  return readEnumQuery("weather", ["none", "sun", "rain", "sand", "snow"], "none");
}

function readEnumQuery<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const value = readStringQuery(key) as T;
  return allowed.includes(value) ? value : fallback;
}

function readBooleanQuery(key: string) {
  return readStringQuery(key) === "1";
}

function readStringQuery(key: string) {
  const value = route.query[key];
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function readNumberQuery(key: string, fallback: number, min: number, max: number) {
  const rawValue = readStringQuery(key).trim();
  if (!rawValue) return fallback;
  const value = Number(rawValue);
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback;
}

function compareRank(a: number | null, b: number | null) {
  return (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER);
}

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}
</script>
