<template>
  <div class="champions-radar" :aria-label="t('champions.a11y.radarSkeleton')">
    <div class="champions-radar__frame" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <div v-if="dataPolygon" class="champions-radar__data" :style="{ clipPath: dataPolygon }"></div>
    </div>
    <div class="champions-radar__axis champions-radar__axis--hp mono">{{ t("champions.labels.hp") }}</div>
    <div class="champions-radar__axis champions-radar__axis--atk mono">{{ t("champions.labels.attack") }}</div>
    <div class="champions-radar__axis champions-radar__axis--def mono">{{ t("champions.labels.defense") }}</div>
    <div class="champions-radar__axis champions-radar__axis--spa mono">{{ t("champions.labels.spAttack") }}</div>
    <div class="champions-radar__axis champions-radar__axis--spd mono">{{ t("champions.labels.spDefense") }}</div>
    <div class="champions-radar__axis champions-radar__axis--spe mono">{{ t("champions.labels.speed") }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  championsT,
  type ChampionsTranslationKey,
} from "../../lib/champions/i18n";
import { routeLang } from "../../lib/siteI18n";
import type { PokemonStats } from "../../lib/champions/types";

const props = defineProps<{
  stats?: PokemonStats | null;
}>();

const route = useRoute();
const lang = computed(() => routeLang(route));
const dataPolygon = computed(() => {
  if (!props.stats) return "";
  const values = [
    props.stats.hp,
    props.stats.attack,
    props.stats.defense,
    props.stats.spAttack,
    props.stats.spDefense,
    props.stats.speed,
  ];
  if (values.every((value) => value == null)) return "";
  const maxValue = Math.max(200, ...values.map((value) => value ?? 0));
  const points = values.map((value, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 3);
    const radius = 48 * Math.max(0.08, (value ?? 0) / maxValue);
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
  });
  return `polygon(${points.join(", ")})`;
});

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}
</script>
