<template>
  <component
    :is="as"
    class="app-filter-bar"
    :class="[
      `app-filter-bar--${density}`,
      {
        'app-filter-bar--disabled': disabled,
        'app-filter-bar--loading': loading,
        'app-filter-bar--error': Boolean(error),
      },
    ]"
    :role="as === 'div' ? 'group' : undefined"
    :aria-label="ariaLabel || undefined"
    :aria-busy="loading || undefined"
    :aria-disabled="disabled || undefined"
    :aria-invalid="Boolean(error) || undefined"
  >
    <div
      class="app-filter-bar__grid"
      :style="{ '--app-filter-columns': columns }"
      :data-columns="columns"
      :inert="disabled || loading || undefined"
    >
      <slot />
      <div v-if="$slots.actions" class="app-filter-bar__actions">
        <slot name="actions" />
      </div>
    </div>

    <LoadingState
      v-if="loading"
      inline
      :label="loadingLabel"
      :density="density"
    />
    <p v-if="error" class="app-filter-bar__error" role="alert">{{ error }}</p>
    <div v-if="$slots.summary" class="app-filter-bar__summary">
      <slot name="summary" />
    </div>
  </component>
</template>

<script setup lang="ts">
import LoadingState from "./LoadingState.vue";
import type { UiDensity } from "./types";

withDefaults(
  defineProps<{
    as?: "div" | "form" | "section";
    ariaLabel?: string;
    columns?: 1 | 2 | 3 | 4 | 5;
    density?: UiDensity;
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    error?: string;
  }>(),
  {
    as: "div",
    ariaLabel: "",
    columns: 4,
    density: "standard",
    disabled: false,
    loading: false,
    loadingLabel: "Loading",
    error: "",
  },
);
</script>

<style scoped>
.app-filter-bar {
  min-width: 0;
}

.app-filter-bar__grid {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(var(--app-filter-columns), minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--border);
  border-left: 1px solid var(--border);
}

.app-filter-bar--disabled .app-filter-bar__grid,
.app-filter-bar--loading .app-filter-bar__grid {
  pointer-events: none;
  opacity: 0.52;
}

.app-filter-bar__actions {
  min-width: 0;
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: var(--space-3);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.app-filter-bar--comfortable .app-filter-bar__actions {
  padding: var(--space-4);
}

.app-filter-bar--compact .app-filter-bar__actions {
  padding: var(--space-2);
}

.app-filter-bar__error,
.app-filter-bar__summary {
  min-width: 0;
  margin: 0;
  padding: var(--space-3);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  border-left: 1px solid var(--border);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.app-filter-bar__error {
  border-color: var(--negative);
  color: var(--negative);
}

.app-filter-bar__summary {
  color: var(--text-soft);
}

@media (max-width: 1080px) {
  .app-filter-bar__grid:not([data-columns="1"]) {
    --app-filter-columns: 2 !important;
  }
}

@media (max-width: 760px) {
  .app-filter-bar__grid:not([data-columns="1"]) {
    --app-filter-columns: 1 !important;
  }
}
</style>
