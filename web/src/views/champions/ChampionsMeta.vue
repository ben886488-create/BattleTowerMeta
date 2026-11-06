<template>
  <section class="champions-page">
    <ChampionsHero
      title-key="champions.meta.title"
      subtitle-key="champions.meta.subtitle"
      variant="compact"
    />

    <div class="champions-stack champions-meta-dashboard">
      <div class="champions-meta-overview">
        <DataPanel
          class="champions-meta-snapshot"
          :title="t('champions.sections.metaSnapshot')"
          :description="t('champions.status.snapshotDescription')"
          density="compact"
          :loading="snapshotState === 'loading'"
          :loading-label="t('champions.status.loading')"
          :error="snapshotState === 'error' ? snapshotError : ''"
          :error-title="t('champions.empty.runtimeError')"
          :data-state="snapshotState"
        >
          <div v-if="snapshotState === 'ready'" class="champions-snapshot-grid">
            <StatBlock
              :label="t('champions.labels.season')"
              :value="snapshotSeason"
              :meta="seasonScope"
              density="compact"
            />
            <StatBlock
              :label="t('champions.labels.regulation')"
              :value="snapshotRegulation"
              :meta="regulationScope"
              density="compact"
            />
            <StatBlock
              :label="t('champions.labels.tournamentCount')"
              :value="snapshotTournamentCount"
              :meta="t('champions.providers.limitless')"
              density="compact"
            />
            <StatBlock
              :label="t('champions.labels.teamReferenceCount')"
              :value="snapshotTeamCount"
              :meta="t('champions.status.topTeamReferences')"
              density="compact"
            />
            <StatBlock
              :label="t('champions.labels.updatedAt')"
              :value="formattedUpdatedAt"
              :value-title="metaCache?.lastSyncedAt ?? ''"
              :meta="syncStatusSummary"
              density="compact"
            />
            <StatBlock
              class="champions-snapshot-source"
              :label="t('champions.labels.dataSources')"
              :value="activeSourceLabel"
              :value-title="activeSourceLabel"
              :meta="sourceStatusSummary"
              density="compact"
              :numeric="false"
            />
          </div>

          <EmptyState
            v-else-if="snapshotState === 'missing'"
            :eyebrow="t('champions.status.missing')"
            :title="t('champions.empty.snapshotMissing')"
            :description="t('champions.empty.snapshotMissingDetail')"
            density="compact"
            announce
          />

          <FilterBar
            class="champions-meta-filterbar"
            :aria-label="t('champions.sections.filters')"
            :columns="4"
            density="compact"
          >
            <AppSelect
              id="champions-meta-season"
              v-model="filters.season"
              :label="t('champions.filters.season')"
              density="compact"
            >
              <option value="">{{ t("champions.options.allSeasons") }}</option>
              <option v-for="season in seasons" :key="season" :value="season">{{ season }}</option>
            </AppSelect>

            <AppSelect
              id="champions-meta-format"
              v-model="filters.format"
              :label="t('champions.filters.format')"
              density="compact"
            >
              <option value="all">{{ t("champions.options.all") }}</option>
              <option v-for="format in formats" :key="format" :value="format">{{ formatLabel(format) }}</option>
            </AppSelect>

            <AppSelect
              id="champions-meta-regulation"
              v-model="filters.regulation"
              :label="t('champions.filters.regulation')"
              density="compact"
            >
              <option value="">{{ t("champions.options.allRegulations") }}</option>
              <option v-for="regulation in regulations" :key="regulation" :value="regulation">
                {{ regulation }}
              </option>
            </AppSelect>

            <AppSelect
              id="champions-meta-source"
              v-model="filters.source"
              :label="t('champions.filters.source')"
              density="compact"
            >
              <option value="all">{{ t("champions.providers.all") }}</option>
              <option value="championsBattleData">{{ t("champions.providers.championsBattleData") }}</option>
              <option value="limitless">{{ t("champions.providers.limitless") }}</option>
            </AppSelect>
          </FilterBar>
        </DataPanel>

        <DataPanel
          :title="t('champions.sections.metaSignals')"
          :description="t('champions.status.signalsDescription')"
          density="compact"
          :loading="signalsState === 'loading'"
          :loading-label="t('champions.status.loading')"
          :error="signalsState === 'error' ? snapshotError : ''"
          :error-title="t('champions.empty.runtimeError')"
          :data-state="signalsState"
        >
          <EmptyState
            v-if="signalsState === 'missing'"
            :eyebrow="t('champions.status.missing')"
            :title="t('champions.empty.signalsMissing')"
            :description="t('champions.empty.signalsMissingDetail')"
            density="compact"
            announce
          />
        </DataPanel>
      </div>

      <div class="champions-grid champions-meta-core-grid">
        <DataPanel
          :title="t('champions.sections.pokemonTierSummary')"
          :description="t('champions.status.pokemonSummaryDescription')"
          density="compact"
          :loading="pokemonState === 'loading'"
          :loading-label="t('champions.status.loading')"
          :error="pokemonState === 'error' ? t('champions.empty.runtimeErrorDetail') : ''"
          :error-title="t('champions.empty.runtimeError')"
          :data-state="pokemonState"
        >
          <template #actions>
            <RouterLink :to="pokemonRankingTo" class="champions-panel-link mono">
              {{ t("champions.actions.viewFullRanking") }}
            </RouterLink>
          </template>

          <div v-if="pokemonState === 'ready'" class="champions-row-list">
            <RouterLink
              v-for="pokemon in pokemonTierRows"
              :key="pokemon.slug"
              :to="pokemonTo(pokemon.slug)"
              class="champions-row champions-meta-rank-row"
            >
              <div class="champions-row-visual">
                <div class="champions-row-icon">
                  <ChampionsPokemonImage :slug="pokemon.slug" :name="pokemon.name" mode="pixel" />
                </div>
                <span class="champions-rank mono">#{{ pokemon.rank ?? "—" }}</span>
              </div>
              <div class="champions-titleline" :title="localizedNameTitle('pokemon', pokemon.name)">
                <strong>{{ localizedName("pokemon", pokemon.name).primary }}</strong>
                <span>{{ localizedName("pokemon", pokemon.name).secondary || localizedTypes(pokemon.types) }}</span>
              </div>
              <div class="champions-stat champions-stat--primary">
                <span>{{ t("champions.labels.format") }}</span>
                <strong>{{ formatLabel(pokemon.format) }}</strong>
              </div>
            </RouterLink>
          </div>

          <EmptyState
            v-else-if="pokemonState === 'missing'"
            :eyebrow="t('champions.status.missing')"
            :title="t('champions.empty.pokemonSourceMissing')"
            :description="t('champions.empty.pokemonSourceMissingDetail')"
            density="compact"
          />
          <EmptyState
            v-else-if="pokemonState === 'empty'"
            :title="t('champions.empty.filteredOut')"
            :description="t('champions.empty.filteredOutDetail')"
            density="compact"
          />
        </DataPanel>

        <DataPanel
          :title="t('champions.sections.teamCoreSummary')"
          :description="t('champions.status.teamCoreDescription')"
          density="compact"
          :loading="teamState === 'loading'"
          :loading-label="t('champions.status.loading')"
          :error="teamState === 'error' ? t('champions.empty.runtimeErrorDetail') : ''"
          :error-title="t('champions.empty.runtimeError')"
          :data-state="teamState"
        >
          <template #actions>
            <RouterLink :to="teamReferencesTo" class="champions-panel-link mono">
              {{ t("champions.actions.viewTeamReferences") }}
            </RouterLink>
          </template>

          <div v-if="teamState === 'ready'" class="champions-row-list">
            <article
              v-for="(core, index) in teamCoreRows"
              :key="core.id"
              class="champions-row champions-row--compact champions-row--compact-visual champions-meta-core-row"
            >
              <div class="champions-row-visual">
                <div class="champions-team-icons champions-team-icons--row" aria-hidden="true">
                  <div v-for="pokemon in core.pokemon" :key="pokemon.slug" class="champions-team-icon">
                    <ChampionsPokemonImage :slug="pokemon.slug" :name="pokemon.name" mode="pixel" />
                  </div>
                </div>
                <span class="champions-rank mono">{{ String(index + 1).padStart(2, "0") }}</span>
              </div>
              <div class="champions-titleline" :title="core.name">
                <strong>{{ localizedTeamCoreName(core) }}</strong>
                <span>{{ t("champions.status.topTeamReferences") }}</span>
              </div>
              <div class="champions-stat champions-stat--primary">
                <span>{{ t("champions.labels.occurrence") }}</span>
                <strong>{{ formatPercent(core.occurrenceRate) }}</strong>
              </div>
              <div class="champions-stat champions-stat--secondary">
                <span>{{ t("champions.labels.referenceCount") }}</span>
                <strong>{{ formatNumber(core.count) }} / {{ formatNumber(teamRows.length) }}</strong>
              </div>
            </article>
          </div>

          <EmptyState
            v-else-if="teamState === 'missing'"
            :eyebrow="t('champions.status.missing')"
            :title="t('champions.empty.teamSourceMissing')"
            :description="t('champions.empty.teamSourceMissingDetail')"
            density="compact"
          />
          <EmptyState
            v-else-if="teamState === 'empty'"
            :title="t('champions.empty.filteredOut')"
            :description="t('champions.empty.filteredOutDetail')"
            density="compact"
          />
        </DataPanel>
      </div>

      <div class="champions-grid champions-meta-secondary-grid">
        <DataPanel
          :title="t('champions.sections.moveUsageRanking')"
          :description="t('champions.status.moveSummaryDescription')"
          density="compact"
          :loading="moveState === 'loading'"
          :loading-label="t('champions.status.loading')"
          :error="moveState === 'error' ? t('champions.empty.runtimeErrorDetail') : ''"
          :error-title="t('champions.empty.runtimeError')"
          :data-state="moveState"
        >
          <UsageRows
            v-if="moveState === 'ready'"
            :items="moveRankingRows"
            :usage-label="t('champions.labels.usage')"
            :sample-label="t('champions.labels.speciesSamples')"
            kind="move"
          />
          <EmptyState
            v-else-if="moveState === 'missing'"
            :eyebrow="t('champions.status.missing')"
            :title="t('champions.empty.usageSourceMissing')"
            :description="t('champions.empty.usageSourceMissingDetail')"
            density="compact"
          />
          <EmptyState
            v-else-if="moveState === 'empty'"
            :title="t('champions.empty.filteredOut')"
            :description="t('champions.empty.filteredOutDetail')"
            density="compact"
          />
        </DataPanel>

        <DataPanel
          :title="t('champions.sections.itemUsageRanking')"
          :description="t('champions.status.itemSummaryDescription')"
          density="compact"
          :loading="itemState === 'loading'"
          :loading-label="t('champions.status.loading')"
          :error="itemState === 'error' ? t('champions.empty.runtimeErrorDetail') : ''"
          :error-title="t('champions.empty.runtimeError')"
          :data-state="itemState"
        >
          <UsageRows
            v-if="itemState === 'ready'"
            :items="itemRankingRows"
            :usage-label="t('champions.labels.usage')"
            :sample-label="t('champions.labels.speciesSamples')"
            kind="item"
          />
          <EmptyState
            v-else-if="itemState === 'missing'"
            :eyebrow="t('champions.status.missing')"
            :title="t('champions.empty.usageSourceMissing')"
            :description="t('champions.empty.usageSourceMissingDetail')"
            density="compact"
          />
          <EmptyState
            v-else-if="itemState === 'empty'"
            :title="t('champions.empty.filteredOut')"
            :description="t('champions.empty.filteredOutDetail')"
            density="compact"
          />
        </DataPanel>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onMounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import ChampionsHero from "../../components/champions/ChampionsHero.vue";
import ChampionsItemImage from "../../components/champions/ChampionsItemImage.vue";
import ChampionsPokemonImage from "../../components/champions/ChampionsPokemonImage.vue";
import {
  AppSelect,
  DataPanel,
  EmptyState,
  FilterBar,
  StatBlock,
} from "../../components/ui";
import {
  getChampionsMeta,
  getChampionsSyncStatus,
  getChampionsTournaments,
} from "../../data/champions/championsDataProvider";
import type {
  ChampionsMetaCache,
  ChampionsSyncStatusCache,
  ChampionsTournamentCacheItem,
} from "../../data/champions/championsCacheTypes";
import {
  championsRoute,
  championsT,
  type ChampionsTranslationKey,
} from "../../lib/champions/i18n";
import { championsDataProvider } from "../../lib/champions/providers";
import { resolveChampionsName, type ChampionsNameKind } from "../../lib/champions/names";
import { routeLang } from "../../lib/siteI18n";
import type {
  ChampionsFormat,
  ChampionsSource,
  PokemonRankingItem,
  TeamReferenceItem,
  UsageRankingItem,
} from "../../lib/champions/types";

type PanelState = "loading" | "ready" | "empty" | "missing" | "error";

type MetaFilters = {
  season: string;
  format: ChampionsFormat | "all";
  regulation: string;
  source: ChampionsSource | "all";
};

type TeamCoreRow = {
  id: string;
  name: string;
  pokemon: Array<{ slug: string; name: string }>;
  count: number;
  occurrenceRate: number;
};

const route = useRoute();
const router = useRouter();
const lang = computed(() => routeLang(route));
const filters = ref<MetaFilters>(readFiltersFromRoute());
const seasons = ref<string[]>([]);
const formats = ref<ChampionsFormat[]>([]);
const regulations = ref<string[]>([]);
const metaCache = ref<ChampionsMetaCache | null>(null);
const syncStatus = ref<ChampionsSyncStatusCache | null>(null);
const tournamentRows = ref<ChampionsTournamentCacheItem[]>([]);
const pokemonRows = ref<PokemonRankingItem[]>([]);
const teamRows = ref<TeamReferenceItem[]>([]);
const moveRows = ref<UsageRankingItem[]>([]);
const itemRows = ref<UsageRankingItem[]>([]);
const snapshotState = ref<PanelState>("loading");
const pokemonState = ref<PanelState>("loading");
const teamState = ref<PanelState>("loading");
const moveState = ref<PanelState>("loading");
const itemState = ref<PanelState>("loading");
const snapshotError = ref("");
let requestId = 0;
let mounted = false;
let suppressRouteWrite = false;

const signalsState = computed<PanelState>(() => {
  if (snapshotState.value === "loading") return "loading";
  if (snapshotState.value === "error") return "error";
  return "missing";
});
const pokemonTierRows = computed(() => pokemonRows.value.slice(0, 5));
const moveRankingRows = computed(() => moveRows.value.slice(0, 5));
const itemRankingRows = computed(() => itemRows.value.slice(0, 5));
const teamCoreRows = computed(() => buildTeamCores(teamRows.value).slice(0, 5));
const filteredTournaments = computed(() => tournamentRows.value.filter((tournament) => (
  !filters.value.regulation || tournament.format === filters.value.regulation
)));
const supportsPokemonSource = computed(() => filters.value.source !== "limitless");
const supportsTeamSource = computed(() => (
  filters.value.source !== "championsBattleData" && filters.value.format !== "singles"
));
const championsBattleDataAvailable = computed(() => (
  syncStatus.value?.sources.championsBattleData.status !== "failed"
));
const limitlessAvailable = computed(() => (
  syncStatus.value?.sources.limitless.status !== "failed"
));
const snapshotSeason = computed(() => {
  if (!supportsPokemonSource.value || !championsBattleDataAvailable.value) return "—";
  return filters.value.season || metaCache.value?.defaultSeason || "—";
});
const snapshotRegulation = computed(() => {
  if (!supportsTeamSource.value || !limitlessAvailable.value) return "—";
  return filters.value.regulation || regulations.value.join(" / ") || "—";
});
const snapshotTournamentCount = computed(() => (
  supportsTeamSource.value && limitlessAvailable.value
    ? formatNumber(filteredTournaments.value.length)
    : "—"
));
const snapshotTeamCount = computed(() => (
  teamState.value === "ready" ? formatNumber(teamRows.value.length) : "—"
));
const seasonScope = computed(() => {
  if (!supportsPokemonSource.value) return t("champions.empty.pokemonSourceMissingDetail");
  if (!championsBattleDataAvailable.value) {
    return syncStatus.value?.sources.championsBattleData.message || t("champions.empty.runtimeErrorDetail");
  }
  return "CBD";
});
const regulationScope = computed(() => {
  if (!supportsTeamSource.value) return t("champions.empty.teamSourceMissingDetail");
  if (!limitlessAvailable.value) {
    return syncStatus.value?.sources.limitless.message || t("champions.empty.runtimeErrorDetail");
  }
  return t("champions.providers.limitless");
});
const activeSourceLabel = computed(() => {
  if (filters.value.source === "championsBattleData") return t("champions.providers.championsBattleData");
  if (filters.value.source === "limitless") return t("champions.providers.limitless");
  return `${t("champions.providers.championsBattleData")} + ${t("champions.providers.limitless")}`;
});
const sourceStatusSummary = computed(() => {
  const status = syncStatus.value;
  if (!status) return "—";
  const rows = [];
  if (filters.value.source !== "limitless") {
    rows.push(`CBD ${status.sources.championsBattleData.status.toUpperCase()}`);
  }
  if (filters.value.source !== "championsBattleData") {
    rows.push(`LIMITLESS ${status.sources.limitless.status.toUpperCase()}`);
  }
  return rows.join(" · ");
});
const syncStatusSummary = computed(() => syncStatus.value?.status.toUpperCase() ?? "—");
const formattedUpdatedAt = computed(() => formatDate(metaCache.value?.lastSyncedAt ?? null));
const pokemonRankingTo = computed(() => championsRoute(lang.value, "/pokemon"));
const teamReferencesTo = computed(() => championsRoute(lang.value, "/teams"));

const UsageRows = defineComponent({
  name: "ChampionsMetaUsageRows",
  props: {
    items: {
      type: Array as () => UsageRankingItem[],
      required: true,
    },
    usageLabel: {
      type: String,
      required: true,
    },
    sampleLabel: {
      type: String,
      required: true,
    },
    kind: {
      type: String as () => "move" | "item",
      required: true,
    },
  },
  setup(props) {
    return () => h(
      "div",
      { class: "champions-row-list" },
      props.items.map((item, index) => {
        const resolved = localizedName(props.kind, item.name);
        return h("article", {
        class: [
          "champions-row champions-row--compact champions-meta-usage-row",
          props.kind === "item" ? "champions-meta-usage-row--item" : "",
        ],
        key: item.id,
      }, [
        h("span", { class: "champions-rank mono" }, String(index + 1).padStart(2, "0")),
        props.kind === "item"
          ? h(ChampionsItemImage, {
              name: item.name,
              missingLabel: t("champions.status.imageMissing"),
            })
          : null,
        h("div", { class: "champions-titleline", title: localizedNameTitle(props.kind, item.name) }, [
          h("strong", resolved.primary),
          h("span", resolved.secondary || t("champions.status.translationMissing")),
        ]),
        h("div", { class: "champions-stat champions-stat--primary" }, [
          h("span", props.usageLabel),
          h("strong", formatPercent(item.usageRate)),
        ]),
        h("div", { class: "champions-stat champions-stat--secondary" }, [
          h("span", props.sampleLabel),
          h("strong", item.sampleCount == null ? "—" : formatNumber(item.sampleCount)),
        ]),
      ]);
      }),
    );
  },
});

onMounted(() => {
  mounted = true;
  void loadChampionsMeta();
});

watch(filters, () => {
  if (!suppressRouteWrite) syncFiltersToRoute();
  if (mounted) void loadChampionsMeta();
}, { deep: true });

watch(() => route.query, () => {
  const next = readFiltersFromRoute();
  if (sameFilters(next, filters.value)) return;
  suppressRouteWrite = true;
  filters.value = next;
  void nextTick(() => {
    suppressRouteWrite = false;
  });
}, { deep: true });

async function loadChampionsMeta() {
  const activeRequest = ++requestId;
  snapshotState.value = "loading";
  snapshotError.value = "";
  pokemonRows.value = [];
  teamRows.value = [];
  moveRows.value = [];
  itemRows.value = [];
  pokemonState.value = supportsPokemonSource.value ? "loading" : "missing";
  moveState.value = supportsPokemonSource.value ? "loading" : "missing";
  itemState.value = supportsPokemonSource.value ? "loading" : "missing";
  teamState.value = supportsTeamSource.value ? "loading" : "missing";

  try {
    const [meta, status, tournaments] = await Promise.all([
      getChampionsMeta({ strict: true }),
      getChampionsSyncStatus({ strict: true }),
      getChampionsTournaments({ strict: true }),
    ]);
    if (activeRequest !== requestId) return;

    metaCache.value = meta;
    syncStatus.value = status;
    tournamentRows.value = tournaments;
    seasons.value = meta?.seasons ?? [];
    formats.value = (meta?.formats ?? []).map((format) => format.toLowerCase() as ChampionsFormat);
    regulations.value = [...new Set(tournaments.map((row) => row.format).filter(Boolean))].sort();

    if (normalizeKnownFilters()) return;

    if (!meta || !status) {
      snapshotState.value = "missing";
    } else if (status.status === "failed") {
      snapshotState.value = "error";
      snapshotError.value = sourceFailureMessage(status);
    } else {
      snapshotState.value = "ready";
    }
  } catch (error) {
    if (activeRequest !== requestId) return;
    console.error("[ChampionsMeta] snapshot load failed", error);
    snapshotState.value = "error";
    snapshotError.value = t("champions.empty.runtimeErrorDetail");
    pokemonState.value = supportsPokemonSource.value ? "error" : "missing";
    moveState.value = supportsPokemonSource.value ? "error" : "missing";
    itemState.value = supportsPokemonSource.value ? "error" : "missing";
    teamState.value = supportsTeamSource.value ? "error" : "missing";
    return;
  }

  await Promise.all([
    loadPokemon(activeRequest),
    loadTeams(activeRequest),
    loadUsage("move", activeRequest),
    loadUsage("item", activeRequest),
  ]);
}

async function loadPokemon(activeRequest: number) {
  if (!supportsPokemonSource.value) return;
  if (syncStatus.value?.sources.championsBattleData.status === "failed") {
    pokemonState.value = "error";
    return;
  }
  try {
    const result = await championsDataProvider.getPokemonRankings({
      season: filters.value.season || undefined,
      format: filters.value.format,
      source: filters.value.source,
      sortBy: "rank",
    }, { strict: true });
    if (activeRequest !== requestId) return;
    pokemonRows.value = result.items;
    pokemonState.value = !result.synced ? "missing" : result.items.length > 0 ? "ready" : "empty";
  } catch (error) {
    if (activeRequest !== requestId) return;
    console.error("[ChampionsMeta] Pokémon ranking load failed", error);
    pokemonState.value = "error";
  }
}

async function loadTeams(activeRequest: number) {
  if (!supportsTeamSource.value) return;
  if (syncStatus.value?.sources.limitless.status === "failed") {
    teamState.value = "error";
    return;
  }
  try {
    const result = await championsDataProvider.getTeamReferences({
      season: filters.value.regulation || undefined,
      format: filters.value.format,
      source: filters.value.source,
    }, { strict: true });
    if (activeRequest !== requestId) return;
    teamRows.value = result.items;
    teamState.value = !result.synced ? "missing" : result.items.length > 0 ? "ready" : "empty";
  } catch (error) {
    if (activeRequest !== requestId) return;
    console.error("[ChampionsMeta] team reference load failed", error);
    teamState.value = "error";
  }
}

async function loadUsage(kind: "move" | "item", activeRequest: number) {
  if (!supportsPokemonSource.value) return;
  const state = kind === "move" ? moveState : itemState;
  const rows = kind === "move" ? moveRows : itemRows;
  if (syncStatus.value?.sources.championsBattleData.status === "failed") {
    state.value = "error";
    return;
  }
  try {
    const getter = kind === "move"
      ? championsDataProvider.getMoveRankings
      : championsDataProvider.getItemRankings;
    const result = await getter({
      season: filters.value.season || undefined,
      format: filters.value.format,
      source: filters.value.source,
    }, { strict: true });
    if (activeRequest !== requestId) return;
    rows.value = result.items;
    state.value = !result.synced ? "missing" : result.items.length > 0 ? "ready" : "empty";
  } catch (error) {
    if (activeRequest !== requestId) return;
    console.error(`[ChampionsMeta] ${kind} ranking load failed`, error);
    state.value = "error";
  }
}

function buildTeamCores(teams: TeamReferenceItem[]): TeamCoreRow[] {
  const cores = new Map<string, Omit<TeamCoreRow, "occurrenceRate">>();
  for (const team of teams) {
    const members = [...new Map(team.pokemon.map((pokemon) => [pokemon.slug, {
      slug: pokemon.slug,
      name: pokemon.name,
    }])).values()].sort((a, b) => a.slug.localeCompare(b.slug));

    for (let first = 0; first < members.length; first += 1) {
      const firstPokemon = members[first];
      if (!firstPokemon) continue;
      for (let second = first + 1; second < members.length; second += 1) {
        const secondPokemon = members[second];
        if (!secondPokemon) continue;
        const pair = [firstPokemon, secondPokemon];
        const id = pair.map((pokemon) => pokemon.slug).join("+");
        const current = cores.get(id);
        if (current) current.count += 1;
        else {
          cores.set(id, {
            id,
            name: pair.map((pokemon) => pokemon.name).join(" + "),
            pokemon: pair,
            count: 1,
          });
        }
      }
    }
  }

  return [...cores.values()]
    .map((core) => ({
      ...core,
      occurrenceRate: teams.length > 0 ? core.count / teams.length : 0,
    }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
}

function localizedName(kind: ChampionsNameKind, value: string) {
  return resolveChampionsName(kind, value, lang.value);
}

function localizedNameTitle(kind: ChampionsNameKind, value: string) {
  const resolved = localizedName(kind, value);
  return [resolved.primary, resolved.secondary, resolved.translationMissing ? t("champions.status.translationMissing") : ""]
    .filter(Boolean)
    .join(" · ");
}

function localizedTypes(types: string[]) {
  return types.map((type) => localizedName("type", type).primary).join(" / ") || "—";
}

function localizedTeamCoreName(core: TeamCoreRow) {
  return core.pokemon.map((pokemon) => localizedName("pokemon", pokemon.name).primary).join(" + ");
}

function normalizeKnownFilters() {
  const next = { ...filters.value };
  if (next.season && !seasons.value.includes(next.season)) next.season = "";
  if (next.regulation && !regulations.value.includes(next.regulation)) next.regulation = "";
  if (sameFilters(next, filters.value)) return false;
  filters.value = next;
  return true;
}

function readFiltersFromRoute(): MetaFilters {
  const format = queryValue("format");
  const source = queryValue("source");
  return {
    season: queryValue("season"),
    format: format === "singles" || format === "doubles" ? format : "all",
    regulation: queryValue("regulation"),
    source: source === "championsBattleData" || source === "limitless" ? source : "all",
  };
}

function queryValue(key: string) {
  const value = route.query[key];
  return String(Array.isArray(value) ? value[0] ?? "" : value ?? "").trim();
}

function syncFiltersToRoute() {
  const query = { ...route.query };
  delete query.season;
  delete query.format;
  delete query.regulation;
  delete query.source;
  if (filters.value.season) query.season = filters.value.season;
  if (filters.value.format !== "all") query.format = filters.value.format;
  if (filters.value.regulation) query.regulation = filters.value.regulation;
  if (filters.value.source !== "all") query.source = filters.value.source;
  void router.replace({ path: route.path, query }).catch((error: unknown) => {
    console.error("[ChampionsMeta] failed to sync filters to URL", error);
  });
}

function sameFilters(a: MetaFilters, b: MetaFilters) {
  return a.season === b.season
    && a.format === b.format
    && a.regulation === b.regulation
    && a.source === b.source;
}

function sourceFailureMessage(status: ChampionsSyncStatusCache) {
  return [status.sources.championsBattleData, status.sources.limitless]
    .filter((source) => source.status === "failed")
    .map((source) => source.message)
    .filter(Boolean)
    .join(" · ") || t("champions.empty.runtimeErrorDetail");
}

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}

function formatLabel(format: ChampionsFormat | "all") {
  if (format === "all") return t("champions.options.all");
  return format === "singles" ? t("champions.options.singles") : t("champions.options.doubles");
}

function formatPercent(value: number | null) {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(lang.value === "zh" ? "zh-HK" : "en").format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang.value === "zh" ? "zh-HK" : "en-GB", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function pokemonTo(slug: string) {
  return championsRoute(lang.value, `/pokemon/${slug}`);
}
</script>
