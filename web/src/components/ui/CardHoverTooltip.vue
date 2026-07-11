<template>
  <div
    class="card-hover-tooltip"
    :class="{ 'card-hover-tooltip--visible': visible }"
    :style="{ left: `${x}px`, top: `${y}px` }"
    role="tooltip"
  >
    <div class="card-hover-tooltip__eyebrow mono">CARD INTEL</div>

    <dl class="card-hover-tooltip__grid">
      <div
        v-for="row in rows"
        :key="row.key"
        class="card-hover-tooltip__row"
      >
        <dt class="mono">{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { displayCardMetaValue, type NormalizedCardMeta } from "../../lib/cardDisplay";

const props = withDefaults(
  defineProps<{
    meta: NormalizedCardMeta;
    x: number;
    y: number;
    visible?: boolean;
    locale?: "zh" | "en";
  }>(),
  {
    visible: false,
    locale: "zh",
  },
);

const labels = computed(() => {
  if (props.locale === "en") {
    return {
      name: "Name",
      packVersion: "Version",
      packCode: "Code",
      illustrator: "Illustrator",
    };
  }

  return {
    name: "卡片名稱",
    packVersion: "版本",
    packCode: "代號",
    illustrator: "畫師",
  };
});

const rows = computed(() => [
  { key: "name", label: labels.value.name, value: displayCardMetaValue(props.meta.name) },
  { key: "packVersion", label: labels.value.packVersion, value: displayCardMetaValue(props.meta.packVersion) },
  { key: "packCode", label: labels.value.packCode, value: displayCardMetaValue(props.meta.packCode) },
  { key: "illustrator", label: labels.value.illustrator, value: displayCardMetaValue(props.meta.illustrator) },
]);
</script>

<style scoped>
.card-hover-tooltip {
  position: fixed;
  z-index: 1200;
  width: min(292px, calc(100vw - 24px));
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 140ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)),
    transform 140ms var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1));
  padding: 12px 14px 13px;
  border: 1px solid rgba(77, 163, 255, 0.58);
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.12), transparent 48%),
    rgba(5, 10, 20, 0.98);
  box-shadow:
    0 18px 36px rgba(0, 0, 0, 0.42),
    0 0 24px rgba(77, 163, 255, 0.16),
    inset 0 1px 0 rgba(248, 250, 252, 0.06);
  color: var(--text-main, #f8fafc);
}

.card-hover-tooltip::before,
.card-hover-tooltip::after {
  content: "";
  position: absolute;
  width: 10px;
  height: 10px;
  pointer-events: none;
}

.card-hover-tooltip::before {
  top: -1px;
  left: -1px;
  border-top: 1px solid var(--accent-primary, #4da3ff);
  border-left: 1px solid var(--accent-primary, #4da3ff);
}

.card-hover-tooltip::after {
  right: -1px;
  bottom: -1px;
  border-right: 1px solid rgba(255, 209, 102, 0.68);
  border-bottom: 1px solid rgba(255, 209, 102, 0.68);
}

.card-hover-tooltip--visible {
  opacity: 1;
  transform: translateY(0);
}

.card-hover-tooltip__eyebrow {
  margin-bottom: 10px;
  color: var(--accent-primary-soft, #7ccbff);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
}

.card-hover-tooltip__grid {
  display: grid;
  gap: 7px;
  margin: 0;
}

.card-hover-tooltip__row {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 12px;
  align-items: baseline;
}

.card-hover-tooltip dt {
  color: var(--text-muted, #64748b);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.card-hover-tooltip dd {
  min-width: 0;
  margin: 0;
  color: var(--text-main, #f8fafc);
  font-size: 13px;
  font-weight: 760;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .card-hover-tooltip {
    transition: none;
  }
}
</style>
