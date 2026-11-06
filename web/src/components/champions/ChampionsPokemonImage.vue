<template>
  <img
    v-if="resolvedSrc"
    :src="resolvedSrc"
    :alt="name"
    :class="{ 'is-pixel': usingPixelFallback }"
    loading="lazy"
    decoding="async"
    @error="handleImageError"
  />
  <span v-else aria-hidden="true">{{ initials }}</span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { resolveChampionsPixelIcon } from "../../lib/champions/images";

const props = withDefaults(defineProps<{
  slug: string;
  name: string;
  src?: string;
  mode?: "pixel" | "artwork";
}>(), {
  src: "",
  mode: "pixel",
});

const artworkFailed = ref(false);
const pixelFailed = ref(false);
const pixelSrc = computed(() => resolveChampionsPixelIcon(props.slug, props.name));
const usingPixelFallback = computed(() =>
  props.mode === "pixel" || !props.src || artworkFailed.value,
);
const resolvedSrc = computed(() => {
  if (!usingPixelFallback.value) return props.src;
  return pixelFailed.value ? "" : pixelSrc.value;
});
const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
);

watch(() => [props.slug, props.src], () => {
  artworkFailed.value = false;
  pixelFailed.value = false;
});

function handleImageError(): void {
  if (!usingPixelFallback.value) {
    artworkFailed.value = true;
    return;
  }
  pixelFailed.value = true;
}
</script>
