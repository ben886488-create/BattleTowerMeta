<template>
  <section class="homePage homePage--game-select">
    <header class="gameHomeHero">
      <p class="gameHomeHero__eyebrow mono">{{ t("home.hero.eyebrow") }}</p>

      <div class="gameHomeHero__brand">
        <span class="mono">{{ t("home.brand.subtitle") }}</span>
        <strong>{{ t("home.brand.title") }}</strong>
      </div>

      <h1 class="gameHomeHero__title" :class="{ 'gameHomeHero__title--zh': lang === 'zh' }">
        <span v-for="line in heroLines" :key="line">{{ line }}</span>
      </h1>

      <p class="gameHomeHero__subtitle">{{ t("home.hero.subtitle") }}</p>
    </header>

    <section class="gameHomeGrid" :aria-label="t('home.games.ariaLabel')">
      <RouterLink
        v-for="game in games"
        :key="game.key"
        :to="game.to"
        class="gameSelectCard"
        :class="`gameSelectCard--${game.key}`"
      >
        <span class="gameSelectCard__borderScan" aria-hidden="true"></span>

        <div class="gameSelectCard__scan mono">
          <span>{{ game.signal }}</span>
          <span>{{ game.status }}</span>
        </div>

        <div>
          <h2>{{ game.title }}</h2>
          <p>{{ game.subtitle }}</p>
        </div>

        <div class="gameSelectCard__cta mono">{{ game.cta }}</div>
      </RouterLink>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  routeLang,
  siteT,
  withLang,
  type SiteTranslationKey,
} from "../lib/siteI18n";

const route = useRoute();
const lang = computed(() => routeLang(route));
const heroLines = computed(() => t("home.hero.title").split("\n"));

const games = computed(() => [
  {
    key: "pocket",
    to: withLang("/pocket", lang.value),
    signal: t("home.games.pocket.signal"),
    status: t("home.games.pocket.status"),
    title: t("home.games.pocket.title"),
    subtitle: t("home.games.pocket.subtitle"),
    cta: t("home.games.pocket.cta"),
  },
  {
    key: "champions",
    to: withLang("/champions", lang.value),
    signal: t("home.games.champions.signal"),
    status: t("home.games.champions.status"),
    title: t("home.games.champions.title"),
    subtitle: t("home.games.champions.subtitle"),
    cta: t("home.games.champions.cta"),
  },
] as const);

function t(key: SiteTranslationKey) {
  return siteT(lang.value, key);
}
</script>

<style scoped>
.homePage {
  width: 100%;
  max-width: none;
  margin: 0;
  overflow-x: hidden;
}

.gameHomeHero {
  position: relative;
  min-height: clamp(420px, 58vh, 620px);
  display: grid;
  align-content: center;
  padding: var(--space-7) 0 var(--space-8);
  border-bottom: 1px solid var(--border);
}

.gameHomeHero::before {
  content: "";
  position: absolute;
  top: 18px;
  right: 0;
  width: min(520px, 42%);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-accent));
}

.gameHomeHero__eyebrow,
.gameSelectCard__scan,
.gameSelectCard__cta {
  color: var(--accent);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.gameHomeHero__brand {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-5);
}

.gameHomeHero__brand span {
  color: var(--muted);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.gameHomeHero__brand strong {
  color: var(--text);
  font-family: var(--font-display);
  font-size: clamp(32px, 4vw, 54px);
  font-style: italic;
  font-weight: 600;
  line-height: 0.9;
}

.gameHomeHero__title {
  margin: var(--space-7) 0 0;
  display: flex;
  flex-direction: column;
  color: var(--text);
  font-family: var(--font-display);
  font-size: var(--type-display-size);
  font-style: italic;
  font-weight: 600;
  letter-spacing: -0.055em;
  line-height: 0.82;
}

.gameHomeHero__title span + span {
  color: var(--accent);
  margin-left: 0.32em;
}

.gameHomeHero__title--zh {
  font-family: var(--font-display-cn);
  font-style: oblique 8deg;
  line-height: 0.92;
}

.gameHomeHero__subtitle {
  max-width: 720px;
  margin: clamp(28px, 4vw, 48px) 0 0;
  color: var(--text-soft);
  font-size: clamp(15px, 1.25vw, 18px);
  line-height: 1.72;
}

.gameHomeGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  margin-top: var(--space-7);
  border-top: 1px solid var(--border);
  border-left: 1px solid var(--border);
}

.gameSelectCard {
  --card-scan-color: rgba(77, 163, 255, 0.78);
  position: relative;
  min-height: 340px;
  display: grid;
  align-content: space-between;
  gap: var(--space-6);
  padding: var(--space-6);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.032), transparent 50%),
    rgba(5, 10, 20, 0.82);
  color: inherit;
  text-decoration: none;
  transition:
    transform var(--dur-fast) var(--ease-out-expo),
    border-color var(--dur-fast) ease,
    background var(--dur-fast) ease,
    box-shadow var(--dur-fast) ease;
}

.gameSelectCard::before,
.gameSelectCard::after {
  content: "";
  position: absolute;
  width: var(--space-3);
  height: var(--space-3);
  pointer-events: none;
  transition:
    opacity var(--dur-fast) ease,
    transform var(--dur-fast) ease;
}

.gameSelectCard::before {
  top: -1px;
  left: -1px;
  border-top: 1px solid var(--accent);
  border-left: 1px solid var(--accent);
}

.gameSelectCard::after {
  right: -1px;
  bottom: -1px;
  border-right: 1px solid var(--accent);
  border-bottom: 1px solid var(--accent);
}

.gameSelectCard--champions {
  background:
    linear-gradient(315deg, rgba(255, 209, 102, 0.026), transparent 44%),
    rgba(5, 10, 20, 0.82);
}

.gameSelectCard--champions::before,
.gameSelectCard--champions::after {
  border-color: var(--accent);
}

.gameSelectCard:hover,
.gameSelectCard:focus-visible {
  z-index: 1;
  border-color: rgba(77, 163, 255, 0.62);
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.09), transparent 58%),
    linear-gradient(315deg, rgba(255, 209, 102, 0.036), transparent 58%),
    rgba(5, 10, 20, 0.96);
  box-shadow: none;
}

.gameSelectCard--champions:hover,
.gameSelectCard--champions:focus-visible {
  border-color: var(--border-accent);
  background:
    linear-gradient(135deg, rgba(77, 163, 255, 0.09), transparent 58%),
    linear-gradient(315deg, rgba(77, 163, 255, 0.052), transparent 58%),
    rgba(5, 10, 20, 0.96);
}

.gameSelectCard:hover::after,
.gameSelectCard:focus-visible::after {
  transform: translate(-2px, 2px);
}

.gameSelectCard__borderScan {
  position: absolute;
  top: -1px;
  left: 0;
  width: 32%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--card-scan-color), transparent);
  pointer-events: none;
  transform: translateX(-125%);
  transition: transform 520ms var(--ease-out-expo);
}

.gameSelectCard:hover .gameSelectCard__borderScan,
.gameSelectCard:focus-visible .gameSelectCard__borderScan {
  transform: translateX(390%);
}

.gameSelectCard__scan {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.gameSelectCard__scan span:last-child {
  color: var(--muted);
}

.gameSelectCard h2 {
  margin: 0;
  color: var(--text);
  font-family: var(--font-display);
  font-size: var(--type-card-size);
  font-style: italic;
  font-weight: 600;
  line-height: 0.92;
}

.gameSelectCard p {
  max-width: 42ch;
  margin: var(--space-4) 0 0;
  color: var(--text-soft);
  font-size: 15px;
  line-height: 1.65;
}

.gameSelectCard__cta {
  justify-self: end;
}

.gameSelectCard--champions .gameSelectCard__scan,
.gameSelectCard--champions .gameSelectCard__cta {
  color: var(--accent);
}

@media (max-width: 900px) {
  .gameHomeHero {
    min-height: 0;
  }

  .gameHomeGrid {
    grid-template-columns: minmax(0, 1fr);
  }

  .gameSelectCard {
    min-height: 280px;
  }
}

@media (max-width: 560px) {
  .gameHomeHero__title {
    font-size: var(--type-display-size);
  }

  .gameHomeHero__title--zh {
    font-size: var(--type-display-size);
    letter-spacing: -0.055em;
  }

  .gameHomeHero__title span + span {
    margin-left: 0;
  }

  .gameSelectCard {
    min-height: 250px;
    padding: var(--space-5);
  }

  .gameSelectCard__scan {
    align-items: flex-start;
    flex-direction: column;
  }

  .gameSelectCard__cta {
    justify-self: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gameSelectCard__borderScan {
    display: none;
  }
}
</style>
