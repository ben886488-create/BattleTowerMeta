<template>
  <span class="status-pulse" :class="{ 'status-pulse--compact': compact }">
    <span class="status-pulse__dot" aria-hidden="true"></span>
    <span class="status-pulse__label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  compact?: boolean;
}>();
</script>

<style scoped>
.status-pulse {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--positive);
  font-family: var(--font-num);
  font-size: 10px;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

.status-pulse__dot {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: var(--positive);
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.58);
  animation: btm-status-blink 2.8s ease-in-out infinite;
}

.status-pulse__label {
  animation: btm-status-flicker 7s steps(1, end) infinite;
}

.status-pulse--compact {
  gap: 8px;
  color: var(--muted);
  letter-spacing: 0.12em;
}

@media (prefers-reduced-motion: reduce) {
  .status-pulse__dot,
  .status-pulse__label {
    animation: none;
  }
}
</style>
