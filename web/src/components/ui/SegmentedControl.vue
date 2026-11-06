<template>
  <div
    class="app-segmented-control"
    :class="[
      `app-segmented-control--${density}`,
      {
        'app-segmented-control--stretch': stretch,
        'app-segmented-control--loading': loading,
        'app-segmented-control--error': Boolean(error),
      },
    ]"
  >
    <div
      class="app-segmented-control__group"
      role="group"
      :aria-label="ariaLabel"
      :aria-busy="loading || undefined"
      :aria-invalid="Boolean(error) || undefined"
    >
      <button
        v-for="option in options"
        :key="String(option.value)"
        class="app-segmented-control__option"
        :class="{ 'is-active': option.value === modelValue }"
        type="button"
        :disabled="disabled || loading || option.disabled"
        :aria-pressed="option.value === modelValue"
        @click="selectOption(option)"
      >
        <slot name="option" :option="option" :active="option.value === modelValue">
          {{ option.label }}
        </slot>
      </button>
    </div>
    <LoadingState v-if="loading" inline :label="loadingLabel" :density="density" />
    <p v-if="errorMessage" class="app-segmented-control__error" role="alert">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import LoadingState from "./LoadingState.vue";
import type { SegmentedOption, UiDensity, UiSegmentValue } from "./types";

const props = withDefaults(
  defineProps<{
    modelValue: UiSegmentValue;
    options: SegmentedOption[];
    ariaLabel: string;
    density?: UiDensity;
    stretch?: boolean;
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    error?: boolean | string;
  }>(),
  {
    density: "standard",
    stretch: false,
    disabled: false,
    loading: false,
    loadingLabel: "Loading",
    error: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: UiSegmentValue];
  change: [value: UiSegmentValue];
}>();

const errorMessage = computed(() => (typeof props.error === "string" ? props.error : ""));

function selectOption(option: SegmentedOption) {
  if (props.disabled || props.loading || option.disabled) return;
  emit("update:modelValue", option.value);
  emit("change", option.value);
}
</script>

<style scoped>
.app-segmented-control {
  min-width: 0;
}

.app-segmented-control__group {
  min-width: 0;
  display: inline-flex;
  flex-wrap: wrap;
  border-top: 1px solid var(--border);
  border-left: 1px solid var(--border);
}

.app-segmented-control--stretch .app-segmented-control__group {
  width: 100%;
}

.app-segmented-control__option {
  min-width: 0;
  min-height: var(--control-height);
  flex: 1 1 auto;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--bg-deep);
  color: var(--text-soft);
  font-family: var(--font-num);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.3;
  overflow-wrap: anywhere;
  text-transform: uppercase;
  box-shadow: none;
  cursor: pointer;
  transition:
    background var(--dur-fast) ease,
    border-color var(--dur-fast) ease,
    color var(--dur-fast) ease,
    opacity var(--dur-fast) ease;
}

.app-segmented-control--comfortable .app-segmented-control__option {
  min-height: var(--space-7);
  padding-inline: var(--space-4);
}

.app-segmented-control--compact .app-segmented-control__option {
  padding-inline: var(--space-2);
}

.app-segmented-control__option:hover:not(:disabled):not(.is-active) {
  background: var(--surface-warm);
  color: var(--text);
}

.app-segmented-control__option.is-active {
  background: var(--accent);
  color: var(--bg-deep);
}

.app-segmented-control__option:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.app-segmented-control__error {
  min-width: 0;
  margin: var(--space-2) 0 0;
  color: var(--negative);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

:global(#app .app-segmented-control__option.is-active) {
  border-color: var(--accent) !important;
}

:global(#app .app-segmented-control--error .app-segmented-control__group) {
  border-color: var(--negative) !important;
}

html[data-lang="zh"] .app-segmented-control__option {
  letter-spacing: 0.02em;
  text-transform: none;
}
</style>
