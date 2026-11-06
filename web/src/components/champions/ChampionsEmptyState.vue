<template>
  <div class="champions-empty">
    <div class="champions-empty__status mono">{{ t("champions.status.syncPending") }}</div>
    <strong>{{ t(titleKey) }}</strong>
    <p>{{ t(detailKey) }}</p>
    <slot />
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

withDefaults(
  defineProps<{
    titleKey?: ChampionsTranslationKey;
    detailKey?: ChampionsTranslationKey;
  }>(),
  {
    titleKey: "champions.empty.notSynced",
    detailKey: "champions.empty.providerPending",
  },
);

const route = useRoute();
const lang = computed(() => routeLang(route));

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}
</script>
