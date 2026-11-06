<template>
  <div
    class="app-field"
    :class="[
      `app-field--${density}`,
      {
        'app-field--disabled': disabled,
        'app-field--loading': loading,
        'app-field--error': Boolean(error),
      },
    ]"
  >
    <label v-if="label || $slots.label" class="app-field__label" :for="inputId">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="app-field__required" aria-hidden="true">*</span>
    </label>

    <span class="app-field__control-wrap">
      <input
        v-bind="$attrs"
        :id="inputId"
        class="app-field__control"
        :type="type"
        :value="modelValue ?? ''"
        :disabled="disabled || loading"
        :required="required"
        :aria-busy="loading || undefined"
        :aria-invalid="Boolean(error) || undefined"
        :aria-describedby="describedBy"
        @input="handleInput"
        @change="handleChange"
      />
      <span v-if="loading" class="app-field__loader" aria-hidden="true">...</span>
    </span>

    <p v-if="hint" :id="hintId" class="app-field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="app-field__error" role="alert">{{ error }}</p>
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
    error?: string;
    type?: string;
    required?: boolean;
    disabled?: boolean;
    loading?: boolean;
    density?: UiDensity;
  }>(),
  {
    modelModifiers: () => ({}),
    id: "",
    label: "",
    hint: "",
    error: "",
    type: "text",
    required: false,
    disabled: false,
    loading: false,
    density: "standard",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: UiControlValue];
  input: [event: Event];
  change: [event: Event];
}>();

const generatedId = useId();
const inputId = computed(() => props.id || `app-field-${generatedId}`);
const hintId = computed(() => `${inputId.value}-hint`);
const errorId = computed(() => `${inputId.value}-error`);
const describedBy = computed(() => {
  const ids = [];
  if (props.hint) ids.push(hintId.value);
  if (props.error) ids.push(errorId.value);
  return ids.join(" ") || undefined;
});

function normalizeValue(rawValue: string): UiControlValue {
  let value: UiControlValue = rawValue;

  if (props.modelModifiers.trim && typeof value === "string") {
    value = value.trim();
  }

  if (props.modelModifiers.number) {
    const numericValue = Number.parseFloat(String(value));
    value = Number.isNaN(numericValue) ? value : numericValue;
  }

  return value;
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!props.modelModifiers.lazy) {
    emit("update:modelValue", normalizeValue(target.value));
  }
  emit("input", event);
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (props.modelModifiers.lazy) {
    emit("update:modelValue", normalizeValue(target.value));
  }
  emit("change", event);
}
</script>

<style scoped>
.app-field {
  min-width: 0;
  display: grid;
  gap: var(--space-2);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.app-field--comfortable {
  padding: var(--space-4);
}

.app-field--standard {
  padding: var(--space-3);
}

.app-field--compact {
  padding: var(--space-2);
}

.app-field--disabled {
  opacity: 0.52;
}

.app-field__label {
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

.app-field__required,
.app-field__error {
  color: var(--negative);
}

.app-field__control-wrap {
  position: relative;
  min-width: 0;
  display: block;
}

.app-field__control {
  width: 100%;
  min-width: 0;
  min-height: var(--control-height);
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  background: var(--bg-deep);
  color: var(--text);
  font-size: 13px;
}

.app-field--comfortable .app-field__control {
  min-height: var(--space-7);
  padding-inline: var(--space-4);
}

.app-field--compact .app-field__control {
  padding-inline: var(--space-2);
}

.app-field__control:disabled {
  cursor: not-allowed;
}

:global(#app .app-field:not(.app-field--disabled):not(.app-field--loading):not(.app-field--error) .app-field__control:hover) {
  border-color: var(--border-accent) !important;
  background: var(--surface-warm) !important;
}

.app-field__hint,
.app-field__error {
  min-width: 0;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.app-field__hint {
  color: var(--text-soft);
}

.app-field__loader {
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

:global(#app .app-field--error .app-field__control) {
  border-color: var(--negative) !important;
}

html[data-lang="zh"] .app-field__label {
  letter-spacing: 0.02em;
  text-transform: none;
}
</style>
