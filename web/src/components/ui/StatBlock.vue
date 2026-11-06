<template>
  <dl
    class="app-stat-block"
    :class="[
      `app-stat-block--${density}`,
      `app-stat-block--${tone}`,
      {
        'app-stat-block--loading': loading,
        'app-stat-block--error': Boolean(error),
      },
    ]"
    :aria-busy="loading || undefined"
    :aria-invalid="Boolean(error) || undefined"
  >
    <dt class="app-stat-block__label">
      <slot name="label">{{ label }}</slot>
    </dt>
    <dd class="app-stat-block__value" :class="{ 'app-stat-block__value--text': !numeric }" :title="valueTitle || undefined">
      <LoadingState v-if="loading" inline :label="loadingLabel" :density="density" />
      <slot v-else name="value">{{ error ? "—" : value }}</slot>
    </dd>
    <dd v-if="error" class="app-stat-block__error" role="alert">{{ error }}</dd>
    <dd v-else-if="meta || $slots.meta" class="app-stat-block__meta">
      <slot name="meta">{{ meta }}</slot>
    </dd>
  </dl>
</template>

<script setup lang="ts">
import LoadingState from "./LoadingState.vue";
import type { UiDensity } from "./types";

withDefaults(
  defineProps<{
    label: string;
    value?: string | number;
    valueTitle?: string;
    meta?: string;
    density?: UiDensity;
    tone?: "default" | "accent" | "positive" | "negative" | "warning";
    numeric?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    error?: string;
  }>(),
  {
    value: "—",
    valueTitle: "",
    meta: "",
    density: "standard",
    tone: "default",
    numeric: true,
    loading: false,
    loadingLabel: "Loading",
    error: "",
  },
);
</script>

<style scoped>
.app-stat-block {
  min-width: 0;
  display: grid;
  gap: var(--space-1);
  margin: 0;
  border: 1px solid var(--border);
  background: var(--bg-deep);
  box-shadow: none;
  transition:
    background var(--dur-fast) ease,
    border-color var(--dur-fast) ease;
}

.app-stat-block--comfortable {
  padding: var(--space-5);
}

.app-stat-block--standard {
  padding: var(--space-4);
}

.app-stat-block--compact {
  padding: var(--space-3);
}

.app-stat-block--error {
  border-color: var(--negative);
}

.app-stat-block__label {
  min-width: 0;
  color: var(--muted);
  font-family: var(--font-num);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1.2;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.app-stat-block__value,
.app-stat-block__meta,
.app-stat-block__error {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.app-stat-block__value {
  color: var(--text);
  font-family: var(--font-num);
  font-size: 28px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.app-stat-block__value--text {
  font-family: var(--font-body);
  font-size: 18px;
  line-height: 1.35;
}

.app-stat-block--accent .app-stat-block__value {
  color: var(--accent);
}

.app-stat-block--positive .app-stat-block__value {
  color: var(--positive);
}

.app-stat-block--negative .app-stat-block__value,
.app-stat-block__error {
  color: var(--negative);
}

.app-stat-block--warning .app-stat-block__value {
  color: var(--warning);
}

.app-stat-block__meta,
.app-stat-block__error {
  font-size: 12px;
  line-height: 1.5;
}

.app-stat-block__meta {
  color: var(--text-soft);
}

html[data-lang="zh"] .app-stat-block__label {
  letter-spacing: 0.02em;
  text-transform: none;
}
</style>
