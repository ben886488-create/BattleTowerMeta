<template>
  <section class="champions-page">
    <ChampionsHero title-key="champions.pokemon.title" subtitle-key="champions.pokemon.subtitle" variant="compact" />

    <div class="champions-stack">
      <ChampionsPanel title-key="champions.sections.filters">
        <div class="champions-filters">
          <div class="champions-field">
            <label for="champions-pokemon-search">{{ t("champions.filters.searchPokemon") }}</label>
            <input
              id="champions-pokemon-search"
              v-model="filters.search"
              type="search"
              :placeholder="t('champions.placeholders.searchPokemon')"
            />
          </div>

          <div class="champions-field">
            <label for="champions-pokemon-type">{{ t("champions.filters.type") }}</label>
            <select id="champions-pokemon-type" v-model="filters.type">
              <option value="">{{ t("champions.options.allTypes") }}</option>
              <option v-for="type in types" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>

          <div class="champions-field">
            <label for="champions-pokemon-format">{{ t("champions.filters.format") }}</label>
            <select id="champions-pokemon-format" v-model="filters.format">
              <option value="all">{{ t("champions.options.all") }}</option>
              <option value="singles">{{ t("champions.options.singles") }}</option>
              <option value="doubles">{{ t("champions.options.doubles") }}</option>
            </select>
          </div>

          <div class="champions-field">
            <label for="champions-pokemon-season">{{ t("champions.filters.season") }}</label>
            <select id="champions-pokemon-season" v-model="filters.season">
              <option value="">{{ t("champions.options.allSeasons") }}</option>
              <option v-for="season in seasons" :key="season" :value="season">{{ season }}</option>
            </select>
          </div>

          <div class="champions-field">
            <label for="champions-pokemon-sort">{{ t("champions.filters.sortBy") }}</label>
            <select id="champions-pokemon-sort" v-model="filters.sortBy">
              <option value="usage">{{ t("champions.options.usage") }}</option>
              <option value="speed">{{ t("champions.options.speed") }}</option>
              <option value="totalStats">{{ t("champions.options.totalStats") }}</option>
              <option value="rank">{{ t("champions.options.rank") }}</option>
              <option value="name">{{ t("champions.options.name") }}</option>
            </select>
          </div>
        </div>
      </ChampionsPanel>

      <div v-if="pokemonRows.length > 0" class="champions-pokemon-grid">
        <RouterLink
          v-for="pokemon in pokemonRows"
          :key="pokemon.slug"
          :to="pokemonTo(pokemon.slug)"
          class="champions-pokemon-card"
        >
          <div class="champions-pokemon-card__top">
            <div class="champions-sprite champions-sprite--artwork">
              <ChampionsPokemonImage
                :slug="pokemon.slug"
                :name="pokemon.name"
                :src="pokemon.artworkUrl"
                mode="artwork"
              />
            </div>
            <div class="champions-titleline" :title="pokemonNameTitle(pokemon.name)">
              <strong>{{ pokemonName(pokemon.name).primary }}</strong>
              <span>{{ pokemonName(pokemon.name).secondary || localizedTypes(pokemon.types) }}</span>
              <div class="champions-chip-row">
                <span class="champions-chip champions-chip--accent">{{ formatLabel(pokemon.format) }}</span>
                <span class="champions-chip">{{ pokemon.season }}</span>
              </div>
            </div>
          </div>

          <RadarSkeleton :stats="pokemon.stats" />

          <div class="champions-kv-grid">
            <div class="champions-kv">
              <span>{{ t("champions.labels.usage") }}</span>
              <strong>{{ formatPercent(pokemon.usageRate) }}</strong>
            </div>
            <div class="champions-kv">
              <span>{{ t("champions.labels.rank") }}</span>
              <strong>{{ pokemon.rank ?? t("champions.placeholders.notSyncedValue") }}</strong>
            </div>
            <div class="champions-kv">
              <span>{{ t("champions.labels.sampleCount") }}</span>
              <strong>{{ pokemon.sampleCount ?? t("champions.placeholders.notSyncedValue") }}</strong>
            </div>
          </div>
        </RouterLink>
      </div>

      <template v-else>
        <div class="champions-pokemon-grid" aria-hidden="true">
          <article class="champions-pokemon-card">
            <div class="champions-pokemon-card__top">
              <div class="champions-sprite">PK</div>
              <div class="champions-titleline">
                <strong>{{ t("champions.placeholders.notSyncedValue") }}</strong>
                <span>{{ t("champions.labels.types") }}</span>
              </div>
            </div>
            <RadarSkeleton />
            <div class="champions-kv-grid">
              <div class="champions-kv">
                <span>{{ t("champions.labels.usage") }}</span>
                <strong>{{ t("champions.placeholders.notSyncedValue") }}</strong>
              </div>
              <div class="champions-kv">
                <span>{{ t("champions.labels.rank") }}</span>
                <strong>{{ t("champions.placeholders.notSyncedValue") }}</strong>
              </div>
              <div class="champions-kv">
                <span>{{ t("champions.labels.format") }}</span>
                <strong>{{ t("champions.options.singles") }}</strong>
              </div>
            </div>
          </article>
        </div>
        <ChampionsEmptyState />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import ChampionsEmptyState from "../../components/champions/ChampionsEmptyState.vue";
import ChampionsHero from "../../components/champions/ChampionsHero.vue";
import ChampionsPanel from "../../components/champions/ChampionsPanel.vue";
import ChampionsPokemonImage from "../../components/champions/ChampionsPokemonImage.vue";
import RadarSkeleton from "../../components/champions/RadarSkeleton.vue";
import {
  championsRoute,
  championsT,
  type ChampionsTranslationKey,
} from "../../lib/champions/i18n";
import { championsDataProvider } from "../../lib/champions/providers";
import { resolveChampionsName } from "../../lib/champions/names";
import { routeLang } from "../../lib/siteI18n";
import type {
  ChampionsFilters,
  ChampionsFormat,
  PokemonRankingItem,
} from "../../lib/champions/types";

const route = useRoute();
const lang = computed(() => routeLang(route));
const filters = ref<ChampionsFilters>({
  season: "",
  format: "all",
  source: "all",
  type: "",
  search: "",
  sortBy: "rank",
});
const seasons = ref<string[]>([]);
const pokemonRows = ref<PokemonRankingItem[]>([]);
const types = ref<string[]>([]);

onMounted(() => {
  void loadPokemonRankings();
});

watch(filters, () => {
  void loadPokemonRankings();
}, { deep: true });

async function loadPokemonRankings() {
  const [seasonRows, rankingRows] = await Promise.all([
    championsDataProvider.getSeasons(),
    championsDataProvider.getPokemonRankings(filters.value),
  ]);
  seasons.value = seasonRows;
  pokemonRows.value = rankingRows.items;
  if (types.value.length === 0) {
    types.value = [...new Set(rankingRows.items.flatMap((pokemon) => pokemon.types))].sort();
  }
}

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}

function pokemonTo(slug: string) {
  return championsRoute(lang.value, `/pokemon/${slug}`);
}

function formatLabel(format: ChampionsFormat) {
  return format === "singles" ? t("champions.options.singles") : t("champions.options.doubles");
}

function formatPercent(value: number | null) {
  return value == null ? t("champions.placeholders.notSyncedValue") : `${(value * 100).toFixed(1)}%`;
}

function pokemonName(value: string) {
  return resolveChampionsName("pokemon", value, lang.value);
}

function pokemonNameTitle(value: string) {
  const resolved = pokemonName(value);
  return [resolved.primary, resolved.secondary, resolved.translationMissing ? t("champions.status.translationMissing") : ""]
    .filter(Boolean)
    .join(" · ");
}

function localizedTypes(values: string[]) {
  return values.map((value) => resolveChampionsName("type", value, lang.value).primary).join(" / ");
}
</script>
