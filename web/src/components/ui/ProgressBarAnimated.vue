<template>
  <div
    ref="barRef"
    class="progress-bar-animated"
    :class="{ 'progress-bar-animated--ready': isReady }"
    :style="{
      '--btm-bar-width': width,
      '--btm-bar-fill': background,
      '--btm-bar-height': height,
      '--btm-bar-delay': `${delay}ms`,
    }"
  >
    <div class="progress-bar-animated__fill"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

withDefaults(
  defineProps<{
    width: string;
    background: string;
    height?: string;
    delay?: number;
  }>(),
  {
    height: "12px",
    delay: 0,
  },
);

const barRef = ref<HTMLElement | null>(null);
const isReady = ref(false);
let observer: IntersectionObserver | null = null;

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

onMounted(() => {
  if (typeof window === "undefined" || !barRef.value || prefersReducedMotion()) {
    isReady.value = true;
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      isReady.value = true;
      observer?.disconnect();
      observer = null;
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.18 },
  );
  observer.observe(barRef.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<style scoped>
.progress-bar-animated {
  width: 100%;
  height: var(--btm-bar-height);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(3, 7, 16, 0.96);
  box-shadow: inset 0 1px 0 rgba(248, 250, 252, 0.05);
}

.progress-bar-animated__fill {
  position: relative;
  width: var(--btm-bar-width);
  min-width: 10px;
  height: 100%;
  overflow: hidden;
  background: var(--btm-bar-fill);
  box-shadow: 0 0 16px rgba(77, 163, 255, 0.22);
  transform-origin: left center;
  transform: scaleX(0);
}

.progress-bar-animated--ready .progress-bar-animated__fill {
  animation: btm-progress-grow var(--dur-slow, 860ms) var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)) both;
  animation-delay: var(--btm-bar-delay);
}

.progress-bar-animated__fill::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translateX(-120%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
  transition: transform 0.35s ease, opacity 0.2s ease;
}

:global(.usage-row:hover) .progress-bar-animated__fill::after,
:global(.mobile-deck-card:hover) .progress-bar-animated__fill::after {
  opacity: 0.32;
  transform: translateX(120%);
}

@media (prefers-reduced-motion: reduce) {
  .progress-bar-animated__fill {
    animation: none;
    transform: none;
  }

  .progress-bar-animated__fill::after {
    display: none;
  }
}
</style>
