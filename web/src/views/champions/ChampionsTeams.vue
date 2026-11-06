<template>
  <section class="champions-page">
    <ChampionsHero title-key="champions.teams.title" subtitle-key="champions.teams.subtitle" variant="compact" />

    <div class="champions-stack">
      <ChampionsPanel title-key="champions.sections.filters">
        <div class="champions-filters">
          <div class="champions-field">
            <label for="champions-teams-season">{{ t("champions.filters.season") }}</label>
            <select id="champions-teams-season" v-model="filters.season">
              <option value="">{{ t("champions.options.allSeasons") }}</option>
              <option v-for="season in seasons" :key="season" :value="season">{{ season }}</option>
            </select>
          </div>

          <div class="champions-field">
            <label for="champions-teams-format">{{ t("champions.filters.format") }}</label>
            <select id="champions-teams-format" v-model="filters.format">
              <option value="all">{{ t("champions.options.all") }}</option>
              <option value="singles">{{ t("champions.options.singles") }}</option>
              <option value="doubles">{{ t("champions.options.doubles") }}</option>
            </select>
          </div>

          <div class="champions-field">
            <label for="champions-teams-pokemon">{{ t("champions.filters.pokemonContains") }}</label>
            <input
              id="champions-teams-pokemon"
              v-model="filters.search"
              type="search"
              :placeholder="t('champions.placeholders.searchPokemon')"
            />
          </div>

          <div class="champions-field">
            <label for="champions-teams-source">{{ t("champions.filters.source") }}</label>
            <select id="champions-teams-source" v-model="filters.source">
              <option value="all">{{ t("champions.providers.all") }}</option>
              <option value="championsBattleData">{{ t("champions.providers.championsBattleData") }}</option>
              <option value="limitless">{{ t("champions.providers.limitless") }}</option>
            </select>
          </div>

          <div class="champions-field">
            <label for="champions-teams-result">{{ t("champions.filters.result") }}</label>
            <input id="champions-teams-result" v-model="resultFilter" type="text" />
          </div>
        </div>
      </ChampionsPanel>

      <div v-if="teamRows.length > 0" class="champions-team-grid">
        <button
          v-for="team in teamRows"
          :key="team.id"
          type="button"
          class="champions-team-card"
          @click="selectedTeamId = team.id"
        >
          <div class="champions-team-icons">
            <div v-for="pokemon in team.pokemon" :key="pokemon.slug" class="champions-team-icon">
              <ChampionsPokemonImage :slug="pokemon.slug" :name="pokemon.name" mode="pixel" />
            </div>
          </div>
          <div class="champions-titleline">
            <strong>{{ team.name }}</strong>
            <span>{{ sourceLabel(team.source) }}</span>
          </div>
          <div class="champions-kv-grid">
            <div class="champions-kv">
              <span>{{ t("champions.labels.format") }}</span>
              <strong>{{ formatLabel(team.format) }}</strong>
            </div>
            <div class="champions-kv">
              <span>{{ t("champions.labels.usage") }}</span>
              <strong>{{ formatPercent(team.usageRate) }}</strong>
            </div>
            <div class="champions-kv">
              <span>{{ t("champions.labels.sampleCount") }}</span>
              <strong>{{ team.sampleCount ?? t("champions.placeholders.notSyncedValue") }}</strong>
            </div>
          </div>
        </button>
      </div>

      <template v-else>
        <div class="champions-team-grid" aria-hidden="true">
          <article class="champions-team-card">
            <div class="champions-team-icons">
              <div v-for="slot in 6" :key="slot" class="champions-team-icon">{{ slot }}</div>
            </div>
            <div class="champions-titleline">
              <strong>{{ t("champions.placeholders.notSyncedValue") }}</strong>
              <span>{{ t("champions.labels.teamCore") }}</span>
            </div>
          </article>
        </div>
        <ChampionsEmptyState detail-key="champions.empty.teamPending" />
      </template>

      <ChampionsPanel title-key="champions.sections.teamDetail">
        <div v-if="selectedTeam" class="champions-stack champions-stack--compact">
          <div class="champions-titleline">
            <strong>{{ selectedTeam.name }}</strong>
            <span>{{ selectedTeam.tournamentResult ?? sourceLabel(selectedTeam.source) }}</span>
          </div>
          <div class="champions-row-list">
            <article v-for="pokemon in selectedTeam.pokemon" :key="pokemon.slug" class="champions-row">
              <div class="champions-row-icon champions-row-icon--large">
                <ChampionsPokemonImage :slug="pokemon.slug" :name="pokemon.name" mode="pixel" />
              </div>
              <div class="champions-titleline" :title="pokemonNameTitle(pokemon.name)">
                <strong>{{ pokemonName(pokemon.name).primary }}</strong>
                <span>{{ pokemonName(pokemon.name).secondary || formatLabel(pokemon.format) }}</span>
              </div>
            </article>
          </div>
        </div>
        <ChampionsEmptyState v-else detail-key="champions.empty.providerPending" />
      </ChampionsPanel>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import ChampionsEmptyState from "../../components/champions/ChampionsEmptyState.vue";
import ChampionsHero from "../../components/champions/ChampionsHero.vue";
import ChampionsPanel from "../../components/champions/ChampionsPanel.vue";
import ChampionsPokemonImage from "../../components/champions/ChampionsPokemonImage.vue";
import {
  championsT,
  type ChampionsTranslationKey,
} from "../../lib/champions/i18n";
import { championsDataProvider } from "../../lib/champions/providers";
import { resolveChampionsName } from "../../lib/champions/names";
import { routeLang } from "../../lib/siteI18n";
import type {
  ChampionsFilters,
  ChampionsFormat,
  ChampionsSource,
  TeamReferenceItem,
} from "../../lib/champions/types";

const route = useRoute();
const lang = computed(() => routeLang(route));
const filters = ref<ChampionsFilters>({
  season: "",
  format: "all",
  source: "all",
  search: "",
});
const resultFilter = ref("");
const seasons = ref<string[]>([]);
const allTeamRows = ref<TeamReferenceItem[]>([]);
const selectedTeamId = ref("");
const teamRows = computed(() => {
  const result = resultFilter.value.trim().toLocaleLowerCase();
  if (!result) return allTeamRows.value.slice(0, 120);
  return allTeamRows.value.filter((team) =>
    (team.tournamentResult ?? "").toLocaleLowerCase().includes(result),
  ).slice(0, 120);
});
const selectedTeam = computed(() =>
  allTeamRows.value.find((team) => team.id === selectedTeamId.value) ?? null,
);

onMounted(() => {
  void loadTeams();
});

watch(filters, () => {
  void loadTeams();
}, { deep: true });

async function loadTeams() {
  const [seasonRows, teams] = await Promise.all([
    championsDataProvider.getSeasons(),
    championsDataProvider.getTeamReferences(filters.value),
  ]);
  seasons.value = [...new Set([...seasonRows, ...teams.items.map((team) => team.season).filter(Boolean)])];
  allTeamRows.value = teams.items;
  if (selectedTeamId.value && !teams.items.some((team) => team.id === selectedTeamId.value)) {
    selectedTeamId.value = "";
  }
}

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}

function formatLabel(format: ChampionsFormat) {
  return format === "singles" ? t("champions.options.singles") : t("champions.options.doubles");
}

function sourceLabel(source: ChampionsSource) {
  return source === "limitless"
    ? t("champions.providers.limitless")
    : t("champions.providers.championsBattleData");
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
</script>
