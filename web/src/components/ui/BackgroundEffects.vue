<template>
  <div class="background-effects" aria-hidden="true">
    <div class="background-effects__ambient"></div>
    <div class="background-effects__grid"></div>
    <div class="background-effects__data-lines"></div>
    <div class="background-effects__transmission"></div>
    <div class="background-effects__nodes"></div>
    <div class="background-effects__noise"></div>
    <div class="background-effects__scanline"></div>
    <div class="background-effects__cursor"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";

let pointerQuery: MediaQueryList | null = null;
let motionQuery: MediaQueryList | null = null;
let frame = 0;

function setPointerGlowEnabled(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("has-pointer-glow", enabled);
}

function syncPointerGlow() {
  const canTrackPointer = pointerQuery?.matches ?? false;
  const reduceMotion = motionQuery?.matches ?? false;
  setPointerGlowEnabled(canTrackPointer && !reduceMotion);
}

function handlePointerMove(event: PointerEvent) {
  if (!document.documentElement.classList.contains("has-pointer-glow")) return;
  if (frame) cancelAnimationFrame(frame);

  frame = requestAnimationFrame(() => {
    document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    frame = 0;
  });
}

onMounted(() => {
  if (typeof window === "undefined") return;

  pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 901px)");
  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  syncPointerGlow();

  pointerQuery.addEventListener("change", syncPointerGlow);
  motionQuery.addEventListener("change", syncPointerGlow);
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
});

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame);
  pointerQuery?.removeEventListener("change", syncPointerGlow);
  motionQuery?.removeEventListener("change", syncPointerGlow);
  window.removeEventListener("pointermove", handlePointerMove);
  setPointerGlowEnabled(false);
});
</script>

<style scoped>
.background-effects {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.background-effects__ambient,
.background-effects__grid,
.background-effects__data-lines,
.background-effects__transmission,
.background-effects__nodes,
.background-effects__noise,
.background-effects__scanline,
.background-effects__cursor {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.background-effects__ambient {
  opacity: calc(0.46 + (var(--motion-bg-boost, 0) * 0.1));
  background:
    radial-gradient(720px 520px at 18% 24%, rgba(77, 163, 255, calc(0.078 + (var(--motion-bg-boost, 0) * 0.026))), transparent 72%),
    radial-gradient(820px 580px at 78% 28%, rgba(124, 203, 255, 0.048), transparent 74%),
    radial-gradient(580px 440px at 48% 82%, rgba(255, 209, 102, 0.026), transparent 76%);
  filter: blur(1px);
  animation: btm-ambient-drift 18s ease-in-out infinite alternate;
}

.background-effects__grid {
  opacity: 0.18;
  background:
    linear-gradient(rgba(77, 163, 255, 0.038) 1px, transparent 1px),
    linear-gradient(90deg, rgba(77, 163, 255, 0.026) 1px, transparent 1px);
  background-size: 96px 96px, 96px 96px;
  transform: translate3d(0, 0, 0);
  animation: btm-grid-drift 32s linear infinite;
  mask-image: radial-gradient(circle at 50% 36%, #000 0%, transparent 72%);
}

.background-effects__data-lines {
  opacity: calc(0.1 + (var(--motion-bg-boost, 0) * 0.05));
  background:
    linear-gradient(90deg, transparent 0 18%, rgba(77, 163, 255, 0.15) 20%, transparent 23% 100%),
    linear-gradient(90deg, transparent 0 46%, rgba(255, 209, 102, 0.09) 48%, transparent 51% 100%),
    linear-gradient(90deg, transparent 0 71%, rgba(124, 203, 255, 0.12) 73%, transparent 76% 100%);
  background-size: 680px 1px, 920px 1px, 760px 1px;
  background-position: 0 23%, 0 58%, 0 78%;
  background-repeat: repeat-x;
  animation: btm-data-lines 22s linear infinite;
}

.background-effects__transmission {
  opacity: calc(0.11 + (var(--motion-bg-boost, 0) * 0.06));
  background:
    linear-gradient(135deg, transparent 0 48%, rgba(77, 163, 255, 0.13) 49%, rgba(124, 203, 255, 0.05) 50%, transparent 51% 100%);
  background-size: 1800px 1800px;
  background-position: -620px -380px;
  animation: btm-transmission-line 26s linear infinite;
  mix-blend-mode: screen;
}

.background-effects__nodes {
  opacity: calc(0.16 + (var(--motion-bg-boost, 0) * 0.05));
  background:
    radial-gradient(circle at 17% 30%, rgba(77, 163, 255, 0.42) 0 2px, transparent 3px),
    radial-gradient(circle at 64% 22%, rgba(124, 203, 255, 0.28) 0 1.5px, transparent 3px),
    radial-gradient(circle at 82% 68%, rgba(255, 209, 102, 0.18) 0 1.5px, transparent 3px),
    radial-gradient(circle at 38% 82%, rgba(77, 163, 255, 0.24) 0 1.5px, transparent 3px);
  animation: btm-node-pulse 9.5s ease-in-out infinite;
}

.background-effects__noise {
  opacity: 0.11;
  background-image:
    radial-gradient(circle at 14% 18%, rgba(248, 250, 252, 0.14) 0 1px, transparent 1.5px),
    radial-gradient(circle at 72% 42%, rgba(77, 163, 255, 0.11) 0 1px, transparent 1.5px),
    radial-gradient(circle at 34% 76%, rgba(255, 209, 102, 0.07) 0 1px, transparent 1.5px),
    radial-gradient(circle at 86% 70%, rgba(248, 250, 252, 0.08) 0 1px, transparent 1.5px);
  background-size: 240px 240px, 310px 310px, 360px 360px, 420px 420px;
  animation: btm-noise-flicker 12s steps(4, end) infinite;
}

.background-effects__scanline {
  opacity: 0.16;
  background: linear-gradient(
    180deg,
    transparent 0%,
    transparent 45%,
    rgba(77, 163, 255, 0.11) 49%,
    rgba(124, 203, 255, 0.062) 50%,
    transparent 54%,
    transparent 100%
  );
  transform: translateY(-115%);
  animation: btm-scanline 16s linear infinite;
  mix-blend-mode: screen;
}

.background-effects__cursor {
  opacity: 0;
  background: radial-gradient(
    420px 420px at var(--pointer-x, 50vw) var(--pointer-y, 50vh),
    rgba(77, 163, 255, 0.062),
    rgba(124, 203, 255, 0.026) 34%,
    transparent 68%
  );
  transition: opacity 260ms ease;
}

@media (max-width: 900px), (pointer: coarse) {
  .background-effects__cursor {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .background-effects__ambient,
  .background-effects__grid,
  .background-effects__data-lines,
  .background-effects__transmission,
  .background-effects__nodes,
  .background-effects__noise,
  .background-effects__scanline {
    animation: none;
  }

  .background-effects__scanline,
  .background-effects__transmission,
  .background-effects__cursor {
    display: none;
  }
}

@keyframes btm-grid-drift {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(96px, 96px, 0); }
}

@keyframes btm-data-lines {
  from { background-position: 0 23%, 0 58%, 0 78%; }
  to { background-position: 680px 23%, -920px 58%, 760px 78%; }
}

@keyframes btm-transmission-line {
  from { background-position: -620px -380px; }
  to { background-position: 1180px 1420px; }
}

@keyframes btm-node-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 3px rgba(77, 163, 255, 0.16));
    transform: scale(1);
  }
  48%, 56% {
    filter: drop-shadow(0 0 8px rgba(77, 163, 255, 0.28));
    transform: scale(1.006);
  }
}
</style>
