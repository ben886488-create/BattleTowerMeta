<template>
  <section class="champions-panel">
    <div class="champions-panel__head">
      <span v-if="eyebrowKey" class="champions-eyebrow mono">{{ t(eyebrowKey) }}</span>
      <h2>{{ t(titleKey) }}</h2>
      <p v-if="descriptionKey">{{ t(descriptionKey) }}</p>
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  championsT,
  type ChampionsTranslationKey,
} from "../../lib/champions/i18n";
import { routeLang } from "../../lib/siteI18n";

defineProps<{
  titleKey: ChampionsTranslationKey;
  eyebrowKey?: ChampionsTranslationKey;
  descriptionKey?: ChampionsTranslationKey;
}>();

const route = useRoute();
const lang = computed(() => routeLang(route));

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}
</script>
