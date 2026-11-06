<template>
  <section v-if="copy" class="site-context-panel" :aria-labelledby="headingId">
    <header class="site-context-panel__header">
      <p class="site-context-panel__eyebrow mono">{{ copy.eyebrow }}</p>
      <h2 :id="headingId">{{ copy.title }}</h2>
    </header>

    <div class="site-context-panel__grid">
      <article>
        <h3>{{ copy.valueTitle }}</h3>
        <p>{{ copy.value }}</p>
      </article>
      <article>
        <h3>{{ copy.methodTitle }}</h3>
        <p>{{ copy.method }}</p>
      </article>
      <article>
        <h3>{{ copy.limitsTitle }}</h3>
        <p>{{ copy.limits }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from 'vue-router';
import { siteContext } from "../lib/siteSeo";
import type { SiteLang } from "../lib/siteI18n";

const props = defineProps<{
  path: string;
  lang: SiteLang;
}>();

const route = useRoute();
const copy = computed(() => siteContext(props.path, props.lang, route.query.deckMode));
const headingId = computed(() => `site-context-${props.path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home"}`);
</script>

<style scoped>
.site-context-panel {
  position: relative;
  width: 100%;
  margin-top: var(--space-7);
  padding: var(--space-5);
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.032), transparent 44%),
    linear-gradient(315deg, rgba(255, 209, 102, 0.026), transparent 44%),
    var(--bg-panel);
  box-shadow: none;
}

.site-context-panel::before,
.site-context-panel::after {
  content: "";
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: none;
}

.site-context-panel::before {
  top: -1px;
  left: -1px;
  border-top: 1px solid var(--accent);
  border-left: 1px solid var(--accent);
}

.site-context-panel::after {
  right: -1px;
  bottom: -1px;
  border-right: 1px solid var(--accent);
  border-bottom: 1px solid var(--accent);
}

.site-context-panel__header {
  max-width: 840px;
  margin-bottom: var(--space-5);
}

.site-context-panel__eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--accent);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.2em;
}

.site-context-panel h2 {
  margin: 0;
  color: var(--text);
  font-family: var(--font-display);
  font-size: clamp(27px, 3vw, 38px);
  font-style: italic;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.05;
}

.site-context-panel__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--border);
  border-left: 1px solid var(--border);
}

.site-context-panel article {
  min-width: 0;
  padding: var(--space-4);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: rgba(2, 5, 12, 0.5);
}

.site-context-panel h3 {
  margin: 0 0 var(--space-2);
  color: var(--text);
  font-family: var(--font-num);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.12em;
  line-height: 1.35;
  text-transform: uppercase;
}

.site-context-panel p {
  margin: 0;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .site-context-panel__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .site-context-panel {
    margin-top: var(--space-6);
    padding: var(--space-4);
  }

  .site-context-panel p {
    font-size: 13px;
  }
}
</style>
