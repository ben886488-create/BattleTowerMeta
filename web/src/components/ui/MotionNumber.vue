<template>
  <span ref="numberRef" class="motion-number" v-bind="$attrs">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    value: number;
    digits?: number;
    delay?: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
  }>(),
  {
    digits: 1,
    delay: 0,
    duration: 980,
    prefix: "",
    suffix: "",
  },
);

const numberRef = ref<HTMLElement | null>(null);
const current = ref(props.value);
let observer: IntersectionObserver | null = null;
let frame = 0;
let started = false;

const displayValue = computed(() => {
  return `${props.prefix}${current.value.toFixed(props.digits)}${props.suffix}`;
});

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function stopFrame() {
  if (!frame || typeof window === "undefined") return;
  window.cancelAnimationFrame(frame);
  frame = 0;
}

function animate() {
  if (typeof window === "undefined") return;
  if (started || prefersReducedMotion()) {
    current.value = props.value;
    return;
  }

  started = true;
  const target = props.value;
  const startTime = performance.now() + props.delay;
  const duration = Math.max(1, props.duration);

  const tick = (now: number) => {
    if (now < startTime) {
      frame = window.requestAnimationFrame(tick);
      return;
    }

    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 4);
    current.value = target * eased;

    if (progress < 1) {
      frame = window.requestAnimationFrame(tick);
    } else {
      current.value = target;
      frame = 0;
    }
  };

  current.value = 0;
  frame = window.requestAnimationFrame(tick);
}

function setupObserver() {
  if (typeof window === "undefined" || !numberRef.value) return;

  if (prefersReducedMotion()) {
    current.value = props.value;
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      animate();
      observer?.disconnect();
      observer = null;
    },
    { threshold: 0.35 },
  );
  observer.observe(numberRef.value);
}

watch(
  () => props.value,
  () => {
    started = false;
    stopFrame();
    current.value = props.value;
    observer?.disconnect();
    observer = null;
    setupObserver();
  },
);

onMounted(setupObserver);

onBeforeUnmount(() => {
  stopFrame();
  observer?.disconnect();
});
</script>
