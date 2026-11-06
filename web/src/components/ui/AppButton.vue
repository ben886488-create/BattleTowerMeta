<template>
  <button
    class="app-button"
    :class="[
      `app-button--${variant}`,
      `app-button--${density}`,
      {
        'app-button--block': block,
        'app-button--loading': loading,
        'app-button--error': error,
      },
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-invalid="error || undefined"
  >
    <span v-if="loading" class="app-button__loader" aria-hidden="true"></span>
    <span class="app-button__content">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import type { UiDensity } from "./types";

withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary";
    density?: UiDensity;
    block?: boolean;
    disabled?: boolean;
    loading?: boolean;
    error?: boolean;
  }>(),
  {
    type: "button",
    variant: "secondary",
    density: "standard",
    block: false,
    disabled: false,
    loading: false,
    error: false,
  },
);
</script>

<style scoped>
.app-button {
  min-width: 0;
  min-height: var(--control-height);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  background: var(--bg-deep);
  color: var(--text);
  font-family: var(--font-num);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  line-height: 1.2;
  text-align: center;
  text-transform: uppercase;
  box-shadow: none;
  cursor: pointer;
  transition:
    background var(--dur-fast) ease,
    border-color var(--dur-fast) ease,
    color var(--dur-fast) ease,
    opacity var(--dur-fast) ease;
}

.app-button--comfortable {
  min-height: var(--space-7);
  padding: var(--space-2) var(--space-4);
}

.app-button--standard {
  padding: var(--space-2) var(--space-3);
}

.app-button--compact {
  padding: var(--space-1) var(--space-2);
}

.app-button--block {
  width: 100%;
}

.app-button--primary {
  background: var(--accent);
  color: var(--bg-deep);
}

.app-button--secondary:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--surface-warm);
  color: var(--text);
}

.app-button--primary:hover:not(:disabled) {
  background: var(--bg-selected);
  color: var(--text);
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.app-button__content {
  min-width: 0;
  overflow-wrap: anywhere;
}

.app-button__loader {
  width: var(--space-3);
  height: var(--space-3);
  flex: 0 0 var(--space-3);
  border: 1px solid currentColor;
  border-right-color: transparent;
  animation: app-button-loading var(--dur-slow) linear infinite;
}

:global(#app .app-button--primary) {
  border-color: var(--border-accent) !important;
}

:global(#app .app-button--primary:hover:not(:disabled)) {
  border-color: var(--accent) !important;
}

:global(#app .app-button--secondary:hover:not(:disabled)) {
  border-color: var(--accent) !important;
}

:global(#app .app-button--error) {
  border-color: var(--negative) !important;
}

@keyframes app-button-loading {
  to {
    transform: rotate(1turn);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-button,
  .app-button__loader {
    transition: none;
    animation: none;
  }
}
</style>
