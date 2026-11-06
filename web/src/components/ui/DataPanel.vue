<template>
  <component
    :is="as"
    class="app-data-panel"
    :class="[
      `app-data-panel--${density}`,
      {
        'app-data-panel--loading': loading,
        'app-data-panel--error': Boolean(error),
      },
    ]"
    :aria-labelledby="hasTitle ? titleId : undefined"
    :aria-busy="loading || undefined"
    :aria-invalid="Boolean(error) || undefined"
  >
    <header v-if="hasHeader" class="app-data-panel__header">
      <div class="app-data-panel__heading">
        <div v-if="eyebrow || $slots.eyebrow" class="app-data-panel__eyebrow">
          <slot name="eyebrow">{{ eyebrow }}</slot>
        </div>
        <component :is="headingTag" v-if="hasTitle" :id="titleId" class="app-data-panel__title">
          <slot name="title">{{ title }}</slot>
        </component>
        <p v-if="description || $slots.description" class="app-data-panel__description">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
      <div v-if="$slots.actions" class="app-data-panel__actions">
        <slot name="actions" />
      </div>
    </header>

    <LoadingState
      v-if="loading"
      :label="loadingLabel"
      :description="loadingDescription"
      :density="density"
    />
    <EmptyState
      v-else-if="error"
      tone="error"
      :title="errorTitle || error"
      :description="errorTitle ? error : ''"
      :density="density"
    />
    <div v-else class="app-data-panel__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="app-data-panel__footer">
      <slot name="footer" />
    </footer>
  </component>
</template>

<script setup lang="ts">
import { computed, useId, useSlots } from "vue";
import EmptyState from "./EmptyState.vue";
import LoadingState from "./LoadingState.vue";
import type { UiDensity } from "./types";

const props = withDefaults(
  defineProps<{
    as?: "section" | "article" | "div";
    title?: string;
    eyebrow?: string;
    description?: string;
    density?: UiDensity;
    headingLevel?: 2 | 3 | 4;
    loading?: boolean;
    loadingLabel?: string;
    loadingDescription?: string;
    error?: string;
    errorTitle?: string;
  }>(),
  {
    as: "section",
    title: "",
    eyebrow: "",
    description: "",
    density: "standard",
    headingLevel: 2,
    loading: false,
    loadingLabel: "Loading",
    loadingDescription: "",
    error: "",
    errorTitle: "",
  },
);

const slots = useSlots();
const generatedId = useId();
const titleId = `app-data-panel-${generatedId}`;
const headingTag = computed(() => `h${props.headingLevel}`);
const hasTitle = computed(() => Boolean(props.title || slots.title));
const hasHeader = computed(() => Boolean(
  props.eyebrow
  || props.title
  || props.description
  || slots.eyebrow
  || slots.title
  || slots.description
  || slots.actions,
));
</script>

<style scoped>
.app-data-panel {
  position: relative;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  background: var(--panel-background);
  box-shadow: none;
  transition:
    border-color var(--dur-fast) ease,
    background var(--dur-fast) ease;
}

.app-data-panel::before,
.app-data-panel::after {
  content: "";
  position: absolute;
  width: var(--space-3);
  height: var(--space-3);
  pointer-events: none;
}

.app-data-panel::before {
  top: -1px;
  left: -1px;
  border-top: 1px solid var(--accent);
  border-left: 1px solid var(--accent);
}

.app-data-panel::after {
  right: -1px;
  bottom: -1px;
  border-right: 1px solid var(--accent);
  border-bottom: 1px solid var(--accent);
}

.app-data-panel--comfortable {
  padding: var(--space-6);
}

.app-data-panel--standard {
  padding: var(--space-5);
}

.app-data-panel--compact {
  padding: var(--space-4);
}

.app-data-panel--error {
  border-color: var(--negative);
}

.app-data-panel--error::before,
.app-data-panel--error::after {
  border-color: var(--negative);
}

.app-data-panel__header {
  min-width: 0;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.app-data-panel__heading {
  min-width: 0;
  display: grid;
  gap: var(--space-2);
}

.app-data-panel__eyebrow {
  min-width: 0;
  color: var(--accent);
  font-family: var(--font-num);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  line-height: 1.2;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.app-data-panel__title {
  min-width: 0;
  margin: 0;
  color: var(--text);
  font-family: var(--font-display-en);
  font-size: 34px;
  font-style: italic;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.05;
  overflow-wrap: anywhere;
}

.app-data-panel__description {
  max-width: 760px;
  min-width: 0;
  margin: 0;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.app-data-panel__actions {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}

.app-data-panel__body,
.app-data-panel__footer {
  min-width: 0;
}

.app-data-panel__footer {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

html[data-lang="zh"] .app-data-panel__eyebrow {
  letter-spacing: 0.02em;
  text-transform: none;
}

html[data-lang="zh"] .app-data-panel__title {
  font-family: var(--font-display-cn);
  font-style: oblique 8deg;
  letter-spacing: -0.02em;
}

@media (max-width: 760px) {
  .app-data-panel--comfortable,
  .app-data-panel--standard,
  .app-data-panel--compact {
    padding: var(--space-4);
  }

  .app-data-panel__header {
    flex-direction: column;
  }

  .app-data-panel__title {
    font-size: 28px;
  }

  .app-data-panel__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
