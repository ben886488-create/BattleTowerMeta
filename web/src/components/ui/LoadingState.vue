<template>
  <div
    class="app-loading-state"
    :class="[`app-loading-state--${density}`, { 'app-loading-state--inline': inline }]"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <span class="app-loading-state__signal" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </span>
    <span class="app-loading-state__copy">
      <strong>{{ label }}</strong>
      <span v-if="description">{{ description }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { UiDensity } from "./types";

withDefaults(
  defineProps<{
    label: string;
    description?: string;
    density?: UiDensity;
    inline?: boolean;
  }>(),
  {
    description: "",
    density: "standard",
    inline: false,
  },
);
</script>

<style scoped>
.app-loading-state {
  min-width: 0;
  min-height: 148px;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border: 1px dashed var(--border-strong);
  background: var(--bg-deep);
}

.app-loading-state--comfortable {
  padding: var(--space-6);
}

.app-loading-state--standard {
  padding: var(--space-5);
}

.app-loading-state--compact {
  min-height: 0;
  padding: var(--space-4);
}

.app-loading-state--inline {
  min-height: var(--control-height);
  padding: var(--space-2);
  border: 0;
  background: transparent;
}

.app-loading-state__signal {
  display: inline-grid;
  grid-template-columns: repeat(3, var(--space-1));
  gap: var(--space-1);
  flex: 0 0 auto;
}

.app-loading-state__signal span {
  width: var(--space-1);
  height: var(--space-3);
  background: var(--accent);
  animation: app-loading-signal var(--dur-slow) ease-in-out infinite alternate;
}

.app-loading-state__signal span:nth-child(2) {
  animation-delay: var(--dur-fast);
}

.app-loading-state__signal span:nth-child(3) {
  animation-delay: var(--dur-base);
}

.app-loading-state__copy {
  min-width: 0;
  display: grid;
  gap: var(--space-1);
}

.app-loading-state__copy strong {
  color: var(--text);
  font-family: var(--font-num);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  line-height: 1.3;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.app-loading-state__copy span {
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@keyframes app-loading-signal {
  from {
    opacity: 0.35;
    transform: scaleY(0.5);
  }

  to {
    opacity: 1;
    transform: scaleY(1);
  }
}

html[data-lang="zh"] .app-loading-state__copy strong {
  letter-spacing: 0.02em;
  text-transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .app-loading-state__signal span {
    animation: none;
  }
}
</style>
