<template>
  <span class="champions-item-image" :class="{ 'is-missing': failed || !src }">
    <img
      v-if="src && !failed"
      :src="src"
      :alt="name"
      loading="lazy"
      decoding="async"
      @error="failed = true"
    />
    <span v-else class="mono" role="img" :aria-label="`${name}: ${missingLabel}`">—</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { itemIconUrl } from "../../lib/champions/names";

const props = defineProps<{
  name: string;
  missingLabel: string;
}>();

const failed = ref(false);
const src = computed(() => itemIconUrl(props.name));

watch(() => props.name, () => {
  failed.value = false;
});
</script>
