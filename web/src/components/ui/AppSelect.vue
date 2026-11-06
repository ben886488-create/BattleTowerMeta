<template>
  <div
    class="app-select"
    :class="[
      `app-select--${density}`,
      {
        'app-select--disabled': disabled,
        'app-select--loading': loading,
        'app-select--error': Boolean(error),
      },
    ]"
  >
    <label v-if="label || $slots.label" class="app-select__label" :for="inputId">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="app-select__required" aria-hidden="true">*</span>
    </label>

    <span class="app-select__control-wrap">
      <select
        v-bind="$attrs"
        :id="inputId"
        class="app-select__control"
        :value="modelValue ?? ''"
        :disabled="disabled || loading"
        :required="required"
        :aria-busy="loading || undefined"
        :aria-invalid="Boolean(error) || undefined"
        :aria-describedby="describedBy"
        @change="handleChange"
      >
        <slot />
      </select>
      <span v-if="loading" class="app-select__loader" aria-hidden="true">...</span>
    </span>

    <p v-if="hint" :id="hintId" class="app-select__hint">{{ hint }}</p>
    <p v-if="errorMessage" :id="errorId" class="app-select__error" role="alert">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import type { UiControlValue, UiDensity } from "./types";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    modelValue: UiControlValue;
    modelModifiers?: Record<string, boolean>;
    id?: string;
    label?: string;
    hint?: string;
    error?: boolean | string;
    density?: UiDensity;
    disabled?: boolean;
    required?: boolean;
    loading?: boolean;
  }>(),
  {
    modelModifiers: () => ({}),
    id: "",
    label: "",
    hint: "",
    error: false,
    density: "standard",
    disabled: false,
    required: false,
    loading: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: UiControlValue];
  change: [event: Event];
}>();

const generatedId = useId();
const inputId = computed(() => props.id || `app-select-${generatedId}`);
const hintId = computed(() => `${inputId.value}-hint`);
const errorId = computed(() => `${inputId.value}-error`);
const errorMessage = computed(() => (typeof props.error === "string" ? props.error : ""));
const describedBy = computed(() => {
  const ids = [];
  if (props.hint) ids.push(hintId.value);
  if (errorMessage.value) ids.push(errorId.value);
  return ids.join(" ") || undefined;
});

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  const option = target.options[target.selectedIndex] as HTMLOptionElement & { _value?: unknown };
  let value = (option && "_value" in option ? option._value : target.value) as UiControlValue;

  if (props.modelModifiers.number && value !== null && value !== undefined) {
    const numericValue = Number.parseFloat(String(value));
    value = Number.isNaN(numericValue) ? value : numericValue;
  }

  emit("update:modelValue", value);
  emit("change", event);
}
</script>

<style scoped>
.app-select {
  min-width: 0;
  display: grid;
  gap: var(--space-2);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.app-select--comfortable {
  padding: var(--space-4);
}

.app-select--standard {
  padding: var(--space-3);
}

.app-select--compact {
  padding: var(--space-2);
}

.app-select--disabled {
  opacity: 0.52;
}

.app-select__label {
  min-width: 0;
  color: var(--text-soft);
  font-family: var(--font-num);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1.2;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.app-select__required,
.app-select__error {
  color: var(--negative);
}

.app-select__control-wrap {
  position: relative;
  min-width: 0;
  display: block;
}

.app-select__control {
  width: 100%;
  min-width: 0;
  min-height: var(--control-height);
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  background: var(--bg-deep);
  color: var(--text);
  font-size: 13px;
  line-height: 1.35;
  text-overflow: ellipsis;
}

.app-select--comfortable .app-select__control {
  min-height: var(--space-7);
  padding-inline: var(--space-4);
}

.app-select--compact .app-select__control {
  padding-inline: var(--space-2);
}

.app-select__control:disabled {
  cursor: not-allowed;
}

:global(#app .app-select:not(.app-select--disabled):not(.app-select--loading):not(.app-select--error) .app-select__control:hover) {
  border-color: var(--border-accent) !important;
  background: var(--surface-warm) !important;
}

.app-select__hint,
.app-select__error {
  min-width: 0;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.app-select__hint {
  color: var(--text-soft);
}

.app-select__loader {
  position: absolute;
  top: 50%;
  right: var(--space-3);
  color: var(--accent);
  font-family: var(--font-num);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  pointer-events: none;
  transform: translateY(-50%);
}

:global(#app .app-select--error .app-select__control) {
  border-color: var(--negative) !important;
}

html[data-lang="zh"] .app-select__label {
  letter-spacing: 0.02em;
  text-transform: none;
}
</style>
