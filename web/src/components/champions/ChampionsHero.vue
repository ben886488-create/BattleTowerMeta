<template>
  <header class="champions-hero" :class="`champions-hero--${variant}`">
    <div class="champions-hero__copy">
      <p class="champions-eyebrow mono">{{ t(eyebrowKey ?? "champions.meta.eyebrow") }}</p>
      <h1 class="champions-hero__title" :class="{ 'champions-hero__title--zh': lang === 'zh' }">
        <span v-for="line in titleLines" :key="line">{{ line }}</span>
      </h1>
      <p class="champions-hero__subtitle">{{ t(subtitleKey) }}</p>
    </div>

    <div class="champions-hero__intel" aria-hidden="true">
      <span class="mono">{{ t("champions.status.interfaceReady") }}</span>
      <strong class="mono">{{ t("champions.providers.championsBattleData") }}</strong>
      <strong class="mono">{{ t("champions.providers.limitless") }}</strong>
    </div>

  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  championsT,
  type ChampionsTranslationKey,
} from "../../lib/champions/i18n";
import { routeLang } from "../../lib/siteI18n";

const props = defineProps<{
  titleKey: ChampionsTranslationKey;
  subtitleKey: ChampionsTranslationKey;
  eyebrowKey?: ChampionsTranslationKey;
  variant?: "default" | "compact";
}>();

const variant = computed(() => props.variant ?? "default");

const route = useRoute();
const lang = computed(() => routeLang(route));
const titleLines = computed(() => t(props.titleKey).split("\n"));

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}
</script>
