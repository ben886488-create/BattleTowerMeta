<template>
  <div
    class="app-empty-state"
    :class="[`app-empty-state--${density}`, `app-empty-state--${tone}`]"
    :role="tone === 'error' ? 'alert' : announce ? 'status' : undefined"
    :aria-live="announce ? 'polite' : undefined"
  >
    <div v-if="$slots.visual" class="app-empty-state__visual" aria-hidden="true">
      <slot name="visual" />
    </div>
    <div v-if="eyebrow" class="app-empty-state__eyebrow">{{ eyebrow }}</div>
    <strong class="app-empty-state__title">{{ title }}</strong>
    <p v-if="description" class="app-empty-state__description">{{ description }}</p>
    <div v-if="$slots.default || $slots.actions" class="app-empty-state__actions">
      <slot />
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UiDensity } from "./types";

withDefaults(
  defineProps<{
    eyebrow?: string;
    title: string;
    description?: string;
    density?: UiDensity;
    tone?: "default" | "error";
    announce?: boolean;
  }>(),
  {
    eyebrow: "",
    description: "",
    density: "standard",
    tone: "default",
    announce: false,
  },
);
</script>

<style scoped>
.app-empty-state {
  min-width: 0;
  min-height: 148px;
  display: grid;
  align-content: center;
  gap: var(--space-2);
  border: 1px dashed var(--border-strong);
  background: var(--bg-deep);
}

.app-empty-state--comfortable {
  padding: var(--space-6);
}

.app-empty-state--standard {
  padding: var(--space-5);
}

.app-empty-state--compact {
  min-height: 0;
  padding: var(--space-4);
}

.app-empty-state--error {
  border-color: var(--negative);
}

.app-empty-state__visual {
  min-width: 0;
  color: var(--accent);
}

.app-empty-state__eyebrow {
  min-width: 0;
  color: var(--accent);
  font-family: var(--font-num);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.16em;
  line-height: 1.2;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.app-empty-state--error .app-empty-state__eyebrow {
  color: var(--negative);
}

.app-empty-state__title {
  min-width: 0;
  color: var(--text);
  font-size: 18px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.app-empty-state__description {
  max-width: 620px;
  min-width: 0;
  margin: 0;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.app-empty-state__actions {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

html[data-lang="zh"] .app-empty-state__eyebrow {
  letter-spacing: 0.02em;
  text-transform: none;
}
</style>
