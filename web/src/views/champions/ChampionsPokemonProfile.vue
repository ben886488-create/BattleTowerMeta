<template>
  <section class="champions-page">
    <ChampionsHero
      title-key="champions.pokemon.detail.title"
      subtitle-key="champions.pokemon.detail.subtitle"
      variant="compact"
    />

    <div class="champions-stack">
      <div class="champions-detail-layout">
        <aside class="champions-panel champions-identity">
          <div class="champions-identity__sprite">
            <ChampionsPokemonImage
              v-if="detail"
              :slug="detail.slug"
              :name="detail.name"
              :src="detail.artworkUrl"
              mode="artwork"
            />
            <span v-else>{{ displayInitials }}</span>
          </div>
          <div class="champions-titleline">
            <strong>{{ displayName }}</strong>
            <span>{{ detail?.form ?? t("champions.placeholders.notSyncedValue") }}</span>
          </div>
          <div class="champions-chip-row">
            <span v-if="detail" class="champions-chip champions-chip--accent">{{ formatLabel(detail.format) }}</span>
            <span class="champions-chip champions-chip--violet">{{ detail?.season ?? t("champions.status.syncPending") }}</span>
          </div>
          <div class="champions-kv-grid">
            <div class="champions-kv">
              <span>{{ t("champions.labels.usage") }}</span>
              <strong>{{ formatPercent(detail?.usageRate ?? null) }}</strong>
            </div>
            <div class="champions-kv">
              <span>{{ t("champions.labels.rank") }}</span>
              <strong>{{ detail?.rank ?? t("champions.placeholders.notSyncedValue") }}</strong>
            </div>
            <div class="champions-kv">
              <span>{{ t("champions.labels.types") }}</span>
              <strong>{{ detail?.types.join(" / ") || t("champions.placeholders.notSyncedValue") }}</strong>
            </div>
          </div>
        </aside>

        <main class="champions-stack">
          <div class="champions-tabs" role="tablist">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="champions-tab"
              :class="{ 'is-active': activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ t(tab.labelKey) }}
            </button>
          </div>

          <ChampionsPanel title-key="champions.sections.baseStats">
            <div class="champions-grid">
              <RadarSkeleton :stats="detail?.stats ?? null" />
              <div class="champions-kv-grid">
                <div v-for="stat in statRows" :key="stat.key" class="champions-kv">
                  <span>{{ t(stat.labelKey) }}</span>
                  <strong>{{ stat.value }}</strong>
                </div>
              </div>
            </div>
          </ChampionsPanel>

          <ChampionsPanel title-key="champions.sections.moveUsage">
            <ProfileRows :rows="detail?.moveUsage ?? []" kind="moves" />
          </ChampionsPanel>

          <ChampionsPanel title-key="champions.sections.itemUsage">
            <ProfileRows :rows="detail?.itemUsage ?? []" kind="items" />
          </ChampionsPanel>

          <ChampionsPanel title-key="champions.sections.bestTeammates">
            <div v-if="detail && detail.teammates.length > 0" class="champions-row-list">
              <article v-for="(teammate, index) in detail.teammates" :key="teammate.slug" class="champions-row">
                <div class="champions-row-visual">
                  <div class="champions-row-icon">
                    <ChampionsPokemonImage :slug="teammate.slug" :name="teammate.name" mode="pixel" />
                  </div>
                  <span class="champions-rank mono">{{ index + 1 }}</span>
                </div>
                <div class="champions-titleline">
                  <strong>{{ teammate.name }}</strong>
                  <span>{{ t("champions.labels.teamCore") }}</span>
                </div>
                <div class="champions-stat">
                  <span>{{ t("champions.labels.usage") }}</span>
                  <strong>{{ formatPercent(teammate.usageTogetherRate) }}</strong>
                </div>
              </article>
            </div>
            <ChampionsEmptyState v-else detail-key="champions.empty.detailPending" />
          </ChampionsPanel>

          <ChampionsPanel title-key="champions.sections.teamReferences">
            <div v-if="detail && detail.teamReferences.length > 0" class="champions-row-list">
              <article v-for="team in detail.teamReferences.slice(0, 12)" :key="team.id" class="champions-row">
                <span class="champions-rank mono">{{ team.tournamentResult ?? "—" }}</span>
                <div class="champions-titleline">
                  <strong>{{ team.name }}</strong>
                  <span>{{ team.pokemon.map((pokemon) => pokemon.name).join(" / ") }}</span>
                </div>
                <div class="champions-stat">
                  <span>{{ t("champions.labels.winRate") }}</span>
                  <strong>{{ formatPercent(team.winRate) }}</strong>
                </div>
              </article>
            </div>
            <ChampionsEmptyState v-else detail-key="champions.empty.teamPending" />
          </ChampionsPanel>

          <ChampionsPanel title-key="champions.sections.movePool">
            <ProfileRows :rows="detail?.movePool ?? []" kind="moves" />
          </ChampionsPanel>
        </main>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ChampionsEmptyState from "../../components/champions/ChampionsEmptyState.vue";
import ChampionsHero from "../../components/champions/ChampionsHero.vue";
import ChampionsPanel from "../../components/champions/ChampionsPanel.vue";
import ChampionsPokemonImage from "../../components/champions/ChampionsPokemonImage.vue";
import RadarSkeleton from "../../components/champions/RadarSkeleton.vue";
import {
  championsT,
  type ChampionsTranslationKey,
} from "../../lib/champions/i18n";
import { championsDataProvider } from "../../lib/champions/providers";
import { routeLang } from "../../lib/siteI18n";
import type {
  ChampionsFormat,
  PokemonDetail,
  PokemonMoveUsage,
  UsageRankingItem,
} from "../../lib/champions/types";

type ProfileTab = "overview" | "moves" | "items" | "teammates" | "teams" | "movePool";

const route = useRoute();
const lang = computed(() => routeLang(route));
const detail = ref<PokemonDetail | null>(null);
const activeTab = ref<ProfileTab>("overview");
const tabs = [
  { key: "overview", labelKey: "champions.tabs.overview" },
  { key: "moves", labelKey: "champions.tabs.moves" },
  { key: "items", labelKey: "champions.tabs.items" },
  { key: "teammates", labelKey: "champions.tabs.teammates" },
  { key: "teams", labelKey: "champions.tabs.teams" },
  { key: "movePool", labelKey: "champions.tabs.movePool" },
] as const satisfies readonly { key: ProfileTab; labelKey: ChampionsTranslationKey }[];

const slug = computed(() => String(route.params.slug ?? ""));
const displayName = computed(() => detail.value?.name ?? slugToTitle(slug.value));
const displayInitials = computed(() =>
  displayName.value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
);

const statRows = computed(() => {
  const stats = detail.value?.stats;
  return [
    { key: "hp", labelKey: "champions.labels.hp", value: statValue(stats?.hp) },
    { key: "attack", labelKey: "champions.labels.attack", value: statValue(stats?.attack) },
    { key: "defense", labelKey: "champions.labels.defense", value: statValue(stats?.defense) },
    { key: "spAttack", labelKey: "champions.labels.spAttack", value: statValue(stats?.spAttack) },
    { key: "spDefense", labelKey: "champions.labels.spDefense", value: statValue(stats?.spDefense) },
    { key: "speed", labelKey: "champions.labels.speed", value: statValue(stats?.speed) },
    { key: "total", labelKey: "champions.labels.total", value: statValue(stats?.total) },
  ] as const;
});

const ProfileRows = defineComponent({
  name: "ChampionsProfileRows",
  props: {
    rows: {
      type: Array as () => Array<PokemonMoveUsage | UsageRankingItem>,
      required: true,
    },
    kind: {
      type: String as () => "moves" | "items",
      required: true,
    },
  },
  setup(props) {
    return () => {
      if (props.rows.length === 0) {
        return h(ChampionsEmptyState, {
          titleKey: "champions.empty.notSynced",
          detailKey: "champions.empty.detailPending",
        });
      }

      return h(
        "div",
        { class: "champions-row-list" },
        props.rows.map((row, index) =>
          h("article", { class: "champions-row", key: row.id }, [
            h("span", { class: "champions-rank mono" }, String(index + 1)),
            h("div", { class: "champions-titleline" }, [
              h("strong", row.name),
              h("span", props.kind === "moves" ? row.type ?? "—" : row.category ?? "—"),
            ]),
            h("div", { class: "champions-stat" }, [
              h("span", tStatic("champions.labels.usage")),
              h("strong", formatStaticPercent(row.usageRate)),
            ]),
            h("div", { class: "champions-stat" }, [
              h("span", tStatic("champions.labels.sampleCount")),
              h("strong", row.sampleCount == null ? "—" : row.sampleCount.toLocaleString()),
            ]),
          ]),
        ),
      );
    };
  },
});

onMounted(() => {
  void loadPokemonDetail();
});

async function loadPokemonDetail() {
  detail.value = await championsDataProvider.getPokemonDetail(slug.value);
}

function t(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}

function tStatic(key: ChampionsTranslationKey) {
  return championsT(lang.value, key);
}

function statValue(value: number | null | undefined) {
  return value == null ? t("champions.placeholders.notSyncedValue") : value.toLocaleString();
}

function formatPercent(value: number | null) {
  return value == null ? t("champions.placeholders.notSyncedValue") : `${(value * 100).toFixed(1)}%`;
}

function formatStaticPercent(value: number | null) {
  return value == null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function formatLabel(format: ChampionsFormat) {
  return format === "singles" ? t("champions.options.singles") : t("champions.options.doubles");
}

function slugToTitle(value: string) {
  if (!value) return t("champions.placeholders.selectPokemon");
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
</script>
