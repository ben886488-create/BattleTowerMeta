<template>
  <component
    :is="href ? 'a' : 'div'"
    class="card-display"
    :class="[
      `card-display--${variant}`,
      {
        'card-display--empty': !imageSrc,
        'card-display--link': Boolean(href),
      },
    ]"
    :href="href || undefined"
    :target="href ? target : undefined"
    :rel="href ? rel : undefined"
    :aria-label="ariaLabel"
    @pointerenter="handlePointerEnter"
    @pointermove="handlePointerMove"
    @pointerleave="hideTooltip"
    @focusin="handleFocusIn"
    @focusout="hideTooltip"
  >
    <img
      v-if="imageSrc"
      class="card-display__image"
      :src="imageSrc"
      :alt="imageAlt"
      :loading="loading"
      :decoding="decoding"
      :crossorigin="crossorigin || undefined"
      :draggable="false"
      @error="$emit('image-error')"
    />

    <div v-else class="card-display__fallback">
      <strong>{{ fallbackName || meta.name || "—" }}</strong>
      <span class="mono">{{ fallbackCode || meta.packCode || "—" }}</span>
    </div>

    <span v-if="quantityText" class="card-display__quantity mono" aria-hidden="true">
      <span class="card-display__quantity-icon" aria-hidden="true"></span>
      {{ quantityText }}
    </span>

    <slot />

    <Teleport to="body">
      <CardHoverTooltip
        v-if="tooltipMounted"
        :meta="meta"
        :x="tooltipPosition.x"
        :y="tooltipPosition.y"
        :visible="tooltipVisible"
        :locale="locale"
      />
    </Teleport>
  </component>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { normalizeCardMeta, type CardMetaInput } from "../../lib/cardDisplay";
import CardHoverTooltip from "./CardHoverTooltip.vue";

const props = withDefaults(
  defineProps<{
    card?: CardMetaInput;
    imageSrc?: string;
    alt?: string;
    count?: number | string | null;
    showCount?: boolean;
    showTooltip?: boolean;
    fallbackName?: string;
    fallbackCode?: string;
    href?: string;
    target?: string;
    rel?: string;
    crossorigin?: "" | "anonymous" | "use-credentials";
    loading?: "lazy" | "eager";
    decoding?: "async" | "auto" | "sync";
    variant?: "grid" | "deck" | "hero" | "compact";
    locale?: "zh" | "en";
  }>(),
  {
    card: null,
    imageSrc: "",
    alt: "",
    count: null,
    showCount: true,
    showTooltip: true,
    fallbackName: "",
    fallbackCode: "",
    href: "",
    target: "_blank",
    rel: "noreferrer noopener",
    crossorigin: undefined,
    loading: "lazy",
    decoding: "async",
    variant: "grid",
    locale: "zh",
  },
);

defineEmits<{
  "image-error": [];
}>();

const TOOLTIP_WIDTH = 292;
const TOOLTIP_HEIGHT = 180;
const TOOLTIP_OFFSET_X = 14;
const TOOLTIP_OFFSET_Y = 18;

const tooltipMounted = ref(false);
const tooltipVisible = ref(false);
const tooltipPosition = reactive({ x: 0, y: 0 });
const latestPointer = reactive({ x: 0, y: 0 });
let rafId = 0;
let hideTimer = 0;

const meta = computed(() => normalizeCardMeta(props.card));

const imageAlt = computed(() => props.alt || meta.value.name || "Card image");

const ariaLabel = computed(() => {
  const name = meta.value.name || props.fallbackName || "Card";
  return props.href ? name : undefined;
});

const quantityText = computed(() => {
  if (!props.showCount || props.count == null || props.count === "") return "";
  const raw = String(props.count).trim();
  if (!raw) return "";
  return raw.toLowerCase().startsWith("x") ? raw : `x${raw}`;
});

function supportsHover() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function updateTooltipPosition() {
  rafId = 0;
  if (typeof window === "undefined") return;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxX = Math.max(12, viewportWidth - TOOLTIP_WIDTH - 12);
  const maxY = Math.max(12, viewportHeight - TOOLTIP_HEIGHT - 12);

  tooltipPosition.x = clamp(latestPointer.x + TOOLTIP_OFFSET_X, 12, maxX);
  tooltipPosition.y = clamp(latestPointer.y + TOOLTIP_OFFSET_Y, 12, maxY);
}

function scheduleTooltipPosition(clientX: number, clientY: number) {
  latestPointer.x = clientX;
  latestPointer.y = clientY;
  if (!rafId && typeof window !== "undefined") {
    rafId = window.requestAnimationFrame(updateTooltipPosition);
  }
}

function showTooltip(clientX: number, clientY: number) {
  if (!props.showTooltip || !supportsHover()) return;
  if (typeof window !== "undefined" && hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimer = 0;
  }
  tooltipMounted.value = true;
  scheduleTooltipPosition(clientX, clientY);
  requestAnimationFrame(() => {
    tooltipVisible.value = true;
  });
}

function hideTooltip() {
  tooltipVisible.value = false;
  if (typeof window === "undefined") {
    tooltipMounted.value = false;
    return;
  }
  if (hideTimer) window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    tooltipMounted.value = false;
    hideTimer = 0;
  }, 170);
}

function handlePointerEnter(event: PointerEvent) {
  if (event.pointerType && event.pointerType !== "mouse") return;
  showTooltip(event.clientX, event.clientY);
}

function handlePointerMove(event: PointerEvent) {
  if (!tooltipMounted.value || (event.pointerType && event.pointerType !== "mouse")) return;
  scheduleTooltipPosition(event.clientX, event.clientY);
}

function handleFocusIn(event: FocusEvent) {
  const target = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  if (!target) return;
  const rect = target.getBoundingClientRect();
  showTooltip(rect.right, rect.top + rect.height * 0.22);
}

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    if (rafId) window.cancelAnimationFrame(rafId);
    if (hideTimer) window.clearTimeout(hideTimer);
  }
});
</script>

<style scoped>
.card-display {
  --card-display-max: 260px;
  position: relative;
  display: block;
  width: 100%;
  max-width: var(--card-display-max);
  aspect-ratio: 5 / 7;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 0;
  background: rgba(8, 15, 28, 0.96);
  color: inherit;
  text-decoration: none;
  box-shadow:
    inset 0 1px 0 rgba(248, 250, 252, 0.04),
    0 12px 28px rgba(0, 0, 0, 0.18);
  outline: none;
  transform: translateZ(0);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    filter 160ms ease,
    transform 160ms ease;
}

.card-display--deck {
  --card-display-max: 280px;
}

.card-display--hero {
  --card-display-max: 340px;
}

.card-display--compact {
  --card-display-max: 220px;
}

.card-display:hover,
.card-display:focus-visible {
  border-color: rgba(77, 163, 255, 0.76);
  box-shadow:
    0 0 0 1px rgba(77, 163, 255, 0.16),
    0 0 24px rgba(77, 163, 255, 0.18),
    0 14px 30px rgba(0, 0, 0, 0.22);
  filter: brightness(1.05);
  transform: scale(1.015);
}

.card-display:focus-visible {
  outline: none;
}

.card-display__image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  background: rgba(3, 7, 16, 0.96);
}

.card-display__fallback {
  width: 100%;
  height: 100%;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 10px;
  padding: 14px;
  box-sizing: border-box;
  text-align: center;
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.12), transparent 54%),
    rgba(5, 10, 20, 0.96);
}

.card-display__fallback strong {
  color: var(--text-main, #f8fafc);
  font-size: 13px;
  font-weight: 850;
  line-height: 1.25;
}

.card-display__fallback span {
  color: var(--text-muted, #64748b);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.card-display__quantity {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 3;
  min-width: 52px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  box-sizing: border-box;
  border: 1px solid rgba(77, 163, 255, 0.65);
  background: rgba(3, 10, 20, 0.82);
  color: var(--text-main, #f8fafc);
  font-size: 14px;
  font-weight: 900;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  box-shadow:
    0 0 18px rgba(77, 163, 255, 0.22),
    inset 0 1px 0 rgba(248, 250, 252, 0.08);
  backdrop-filter: blur(4px);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.card-display:hover .card-display__quantity,
.card-display:focus-visible .card-display__quantity {
  border-color: rgba(124, 203, 255, 0.92);
  background: rgba(5, 18, 34, 0.9);
  box-shadow:
    0 0 22px rgba(77, 163, 255, 0.34),
    inset 0 1px 0 rgba(248, 250, 252, 0.12);
}

.card-display__quantity-icon {
  width: 10px;
  height: 14px;
  display: inline-block;
  border: 1px solid rgba(124, 203, 255, 0.72);
  background: linear-gradient(180deg, rgba(77, 163, 255, 0.2), rgba(77, 163, 255, 0.04));
  box-shadow: inset 0 1px 0 rgba(248, 250, 252, 0.12);
}

@media (max-width: 760px), (hover: none) {
  .card-display:hover {
    filter: none;
    transform: none;
  }
}

@media (max-width: 640px) {
  .card-display {
    max-width: none;
    border-radius: 6px;
  }

  .card-display__image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .card-display__quantity {
    right: 3px;
    bottom: 3px;
    min-width: 30px;
    height: 22px;
    gap: 0;
    padding: 0 5px;
    font-size: 10px;
    border-color: rgba(77, 163, 255, 0.58);
    box-shadow:
      0 0 10px rgba(77, 163, 255, 0.18),
      inset 0 1px 0 rgba(248, 250, 252, 0.08);
    backdrop-filter: none;
  }

  .card-display__quantity-icon {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-display,
  .card-display__quantity {
    transition: none;
  }
}
</style>
