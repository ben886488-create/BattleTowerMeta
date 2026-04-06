<template>
  <section class="tierlist-page">
    <header class="tierlist-header">
      <div>
        <h1 class="page-title">Tier List</h1>
        <p class="page-subtitle mono">
          {{
            loadingTournaments
              ? locale === "en"
                ? "Loading tournaments…"
                : "載入賽事中…"
              : meta?.generated_at
                ? `Generated: ${meta.generated_at}`
                : "—"
          }}
        </p>
        <p v-if="tournamentsError" class="page-error mono">
          {{ tournamentsError }}
        </p>
      </div>

      <div class="filters">
        <div class="f">
          <label>{{ locale === "en" ? "Players" : "玩家數" }}</label>
          <input
            v-model.number="filters.minPlayers"
            type="number"
            inputmode="numeric"
            min="0"
            :placeholder="locale === 'en' ? 'e.g. 32' : '例如 32'"
          />
          <div class="hint">{{ locale === "en" ? "Minimum player count" : "最少參賽人數" }}</div>
        </div>

        <div class="f">
          <label>{{ locale === "en" ? "Time" : "時間" }}</label>
          <select v-model="filters.time">
            <option v-for="option in timeOptionGroups.base" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
            <optgroup v-if="timeOptionGroups.months.length" :label="locale === 'en' ? 'Month' : '月份'">
              <option v-for="option in timeOptionGroups.months" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </optgroup>
          </select>
          <div class="hint">{{ locale === "en" ? "Based on UTC date" : "以 UTC 日期計算" }}</div>
        </div>

        <div class="f">
          <label>{{ locale === "en" ? "Set" : "版本" }}</label>
          <select v-model="filters.set">
            <option v-for="o in setOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </div>

        <div class="f">
          <label>Top Cut</label>
          <select v-model="filters.topCut">
            <option v-for="o in topCutOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </div>
      </div>
    </header>

    <div class="tierlist-top-grid">
      <div class="usage-card">
        <div class="usage-title-row">
          <div>
            <h2 class="section-title">Usage Breakdown</h2>
            <p class="usage-subtitle">Top 10 by usage, plus an aggregated other bucket</p>
          </div>
          <span class="mono subtle">{{ usageTopDeckRows.length }} + other</span>
        </div>

        <div v-if="usageBreakdownRows.length > 0" class="usage-list">
          <div
            v-for="(row, index) in usageBreakdownRows"
            :key="row.deck"
            class="usage-row"
            :class="{ 'usage-row--other': row.isOther }"
          >
            <div class="usage-row__rank mono">{{ row.isOther ? "OT" : `${index + 1}.` }}</div>

            <RouterLink
              v-if="!row.isOther"
              :to="deckProfileTo(row.deck)"
              class="usage-row__identity"
              :title="usageDeckDisplayName(row)"
            >
              <div
                class="usage-row__spritepair"
                :class="{ 'usage-row__spritepair--single': (row.spriteUrls?.length ?? 0) < 2 }"
              >
                <img
                  v-for="(src, idx) in row.spriteUrls ?? []"
                  :key="`${row.deck}-usage-${idx}`"
                  :src="src"
                  class="usage-row__sprite"
                  :alt="usageDeckDisplayName(row)"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />

                <span v-if="!row.spriteUrls?.length" class="usage-row__fallback mono">
                  {{ deckShortLabel(row.deck) }}
                </span>
              </div>

              <div class="usage-row__copy">
                <div class="usage-row__name">{{ usageDeckDisplayName(row) }}</div>
                <div class="usage-row__meta mono">
                  <span
                    v-if="!row.isOther"
                    class="usage-row__tier"
                    :style="{ backgroundImage: tierBadgeGradient(row.tier) }"
                  >
                    {{ row.tier }}
                  </span>
                  <span class="usage-row__samples">{{ row.total_samples.toLocaleString() }} samples</span>
                </div>
              </div>
            </RouterLink>

            <div v-else class="usage-row__identity usage-row__identity--static" :title="usageDeckDisplayName(row)">
              <div class="usage-row__spritepair usage-row__spritepair--single">
                <img
                  v-for="(src, idx) in row.spriteUrls ?? []"
                  :key="`${row.deck}-usage-static-${idx}`"
                  :src="src"
                  class="usage-row__sprite"
                  :alt="usageDeckDisplayName(row)"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              </div>

              <div class="usage-row__copy">
                <div class="usage-row__name">{{ usageDeckDisplayName(row) }}</div>
                <div class="usage-row__meta mono">
                  <span class="usage-row__samples">{{ row.total_samples.toLocaleString() }} samples</span>
                </div>
              </div>
            </div>

            <div class="usage-row__pct mono">{{ formatUsagePct(row.usage) }}</div>

            <div class="usage-row__bar">
              <div class="usage-row__barTrack">
                <div
                  class="usage-row__barFill"
                  :style="{ width: usageBarWidth(row.usage), background: usageBarFill(row) }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="tier-empty mono">
          {{ loadingTournaments ? "Loading..." : locale === "en" ? "No usage data" : "No usage data" }}
        </div>
      </div>

      <div class="tier-table-card">
        <div class="tier-table-head">
          <h2 class="section-title tier-table-title">Tier List</h2>
          <span class="mono tier-table-meta">{{ topDeckRows.length }}/{{ TOP_DECK_LIMIT }}</span>
        </div>

        <div v-if="visibleTierGroups.length > 0" class="tier-lanes">
          <div
            v-for="group in visibleTierGroups"
            :key="group.tier"
            class="tier-lane"
            :class="`tier-lane--${normalizeTierKey(group.tier)}`"
          >
            <div
              class="tier-lane__badge"
              :class="`tier-lane__badge--${normalizeTierKey(group.tier)}`"
              :style="{ backgroundImage: tierBadgeGradient(group.tier) }"
            >
              <span :class="tierBadgeTextClass(group.tier)">
                {{ group.tier }}
              </span>
            </div>

            <div class="tier-lane__deckbar">
              <RouterLink
                v-for="d in group.rows"
                :key="d.deck"
                :to="deckProfileTo(d.deck)"
                class="tier-lane__decklink"
                :title="d.deck"
              >
                <div
                  class="tier-lane__spritepair"
                  :class="{ 'tier-lane__spritepair--single': (d.spriteUrls?.length ?? 0) < 2 }"
                >
                  <img
                    v-for="(src, idx) in d.spriteUrls ?? []"
                    :key="`${d.deck}-${idx}`"
                    :src="src"
                    class="tier-lane__sprite"
                    :alt="d.deck"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />

                  <span v-if="!d.spriteUrls?.length" class="tier-lane__fallback mono">
                    {{ deckShortLabel(d.deck) }}
                  </span>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>

        <div v-else class="tier-empty mono">
          {{ loadingTournaments ? "Loading…" : locale === "en" ? "No tier data" : "沒有可顯示的牌組" }}
        </div>
      </div>
    </div>

    <div class="heatmap-card">
      <div class="heatmap-title-row">
        <div>
          <h2 class="section-title">Win Rate Matrix</h2>
          <p class="usage-subtitle">Top 10 by score with one image-based custom slot</p>
        </div>
        <span class="mono subtle">
          <template v-if="heatLoading">Loading matchups…</template>
          <template v-else>{{ topDeckRows.length }} + 1 slot</template>
        </span>
      </div>

      <div v-if="matrixOptionRows.length > 0" class="matrix-picker-panel">
        <div class="matrix-picker-panel__label">
          {{ locale === "en" ? "Custom Slot" : "自選牌組" }}
        </div>

        <details ref="matrixPickerRef" class="matrix-picker">
          <summary class="matrix-picker__trigger">
            <div class="matrix-picker__trigger-copy">
              <div v-if="matrixSelectedDeckRow" class="heatmap-sprite-stack">
                <img
                  v-for="(src, idx) in matrixSelectedDeckRow.spriteUrls ?? []"
                  :key="`${matrixSelectedDeckRow.deck}-picker-trigger-${idx}`"
                  class="heatmap-sprite heatmap-sprite--picker"
                  :src="src"
                  :alt="usageDeckDisplayName(matrixSelectedDeckRow)"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              </div>
              <div v-else class="matrix-picker__placeholder mono">
                {{ locale === "en" ? "Select a deck for the custom slot" : "選擇一副牌組放進自選格" }}
              </div>

              <div v-if="!matrixSelectedDeckRow" class="matrix-picker__trigger-text">
                {{ locale === "en" ? "All decks in current filter" : "目前篩選內所有牌組" }}
              </div>
            </div>
          </summary>

          <div class="matrix-picker__menu">
            <button
              type="button"
              class="matrix-picker__option matrix-picker__option--clear"
              :class="{ 'matrix-picker__option--active': !matrixExtraDeck }"
              @click="clearMatrixDeck"
            >
              <span class="matrix-picker__option-copy">
                {{ locale === "en" ? "Clear custom slot" : "清空自選格" }}
              </span>
            </button>

            <button
              v-for="option in matrixOptionRows"
              :key="option.deck"
              type="button"
              class="matrix-picker__option"
              :class="{ 'matrix-picker__option--active': matrixExtraDeck === option.deck }"
              @click="selectMatrixDeck(option.deck)"
            >
              <div class="heatmap-sprite-stack">
                <img
                  v-for="(src, idx) in option.spriteUrls ?? []"
                  :key="`${option.deck}-picker-option-${idx}`"
                  class="heatmap-sprite heatmap-sprite--picker"
                  :src="src"
                  :alt="usageDeckDisplayName(option)"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              </div>
              <span class="matrix-picker__option-copy">
                {{ usageDeckDisplayName(option) }}
              </span>
            </button>
          </div>
        </details>
      </div>

      <div class="heatmap-shell" v-if="topDeckRows.length > 0">
        <table class="heatmap-table" aria-label="Win rate matrix">
          <thead>
            <tr>
              <th class="heatmap-corner"></th>

              <th
                v-for="(c, index) in matrixAxisRows"
                :key="c?.deck ?? `matrix-column-${index}`"
                class="heatmap-col-label"
              >
                <div v-if="index === topDeckRows.length" class="heatmap-picker-cell" :class="{ 'heatmap-picker-cell--empty': !matrixSelectedDeckRow }">
                  <div v-if="matrixSelectedDeckRow" class="heatmap-sprite-stack">
                    <img
                      v-for="(src, idx) in matrixSelectedDeckRow.spriteUrls ?? []"
                      :key="`${matrixSelectedDeckRow.deck}-picker-col-${idx}`"
                      class="heatmap-sprite"
                      :src="src"
                      :alt="usageDeckDisplayName(matrixSelectedDeckRow)"
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                    />
                  </div>
                  <span v-if="!matrixSelectedDeckRow" class="heatmap-picker-label mono">
                    {{ locale === "en" ? "Custom slot" : "自選格" }}
                  </span>
                </div>

                <RouterLink v-else-if="c" :to="deckProfileTo(c.deck)" class="heatmap-label-link" :title="c.deck">
                  <div class="heatmap-axis-chip">
                    <div class="heatmap-sprite-stack">
                      <img
                        v-for="(src, idx) in c.spriteUrls ?? []"
                        :key="`${c.deck}-hdr-${idx}`"
                        class="heatmap-sprite"
                        :src="src"
                        :alt="c.deck"
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                      />
                    </div>
                  </div>
                </RouterLink>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(r, i) in matrixAxisRows" :key="r?.deck ?? `matrix-row-${i}`">
              <th class="heatmap-row-label">
                <div
                  v-if="i === topDeckRows.length"
                  class="heatmap-axis-chip heatmap-axis-chip--row heatmap-axis-chip--picker"
                >
                  <div v-if="r" class="heatmap-row-sprite-stack">
                    <img
                      v-for="(src, idx) in r.spriteUrls ?? []"
                      :key="`${r.deck}-picker-row-${idx}`"
                      class="heatmap-sprite"
                      :src="src"
                      :alt="usageDeckDisplayName(r)"
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                    />
                  </div>
                  <span v-if="!r" class="heatmap-picker-row-label mono">
                    {{ locale === "en" ? "Custom deck" : "自選牌組" }}
                  </span>
                </div>

                <RouterLink v-else-if="r" :to="deckProfileTo(r.deck)" class="heatmap-label-link" :title="r.deck">
                  <div class="heatmap-axis-chip heatmap-axis-chip--row">
                    <div class="heatmap-row-sprite-stack">
                      <img
                        v-for="(src, idx) in r.spriteUrls ?? []"
                        :key="`${r.deck}-row-${idx}`"
                        class="heatmap-sprite"
                        :src="src"
                        :alt="r.deck"
                        loading="lazy"
                        decoding="async"
                        draggable="false"
                      />
                    </div>
                  </div>
                </RouterLink>
              </th>

              <td
                v-for="(c, j) in matrixAxisRows"
                :key="`${r?.deck ?? 'matrix-row'}__${c?.deck ?? 'matrix-col'}__${j}`"
                class="heatmap-cell"
              >
                <div
                  v-if="heatCells[i]?.[j]?.winrate != null"
                  class="heatmap-cell__inner"
                  :style="heatCells[i][j].style"
                  :title="heatCells[i][j].tooltip"
                >
                  <span class="heatmap-cell__copy">
                    <span class="heatmap-cell__rate mono">{{ heatCells[i][j].text }}</span>
                    <span class="heatmap-cell__record mono">{{ heatCells[i][j].recordText }}</span>
                  </span>
                </div>

                <div v-else class="heatmap-cell__inner heatmap-cell__inner--empty">—</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="topDeckRows.length > 0" class="heatmap-mobile">
        <section
          v-for="entry in mobileHeatRows"
          :key="entry.row?.deck ?? `mobile-matrix-${entry.index}`"
          class="heatmap-mobile__section"
        >
          <div class="heatmap-mobile__header">
            <div class="heatmap-mobile__deck">
              <div class="heatmap-row-sprite-stack">
                <img
                  v-for="(src, idx) in entry.row?.spriteUrls ?? []"
                  :key="`${entry.row?.deck ?? 'custom'}-mobile-row-${idx}`"
                  class="heatmap-sprite heatmap-sprite--mobile"
                  :src="src"
                  :alt="entry.row ? usageDeckDisplayName(entry.row) : locale === 'en' ? 'Custom deck' : '自選牌組'"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              </div>
              <div v-if="entry.index !== topDeckRows.length || !entry.row" class="heatmap-mobile__deck-name">
                {{ entry.row ? usageDeckDisplayName(entry.row) : locale === "en" ? "Custom deck" : "自選牌組" }}
              </div>
            </div>
          </div>

          <div v-if="entry.row" class="heatmap-mobile__grid">
            <div
              v-for="matchup in entry.matchups"
              :key="`${entry.row.deck}-${matchup.col.deck}-${matchup.index}`"
              class="heatmap-mobile__cell"
            >
              <div
                v-if="matchup.cell.winrate != null"
                class="heatmap-mobile__cellInner"
                :style="matchup.cell.style"
                :title="matchup.cell.tooltip"
              >
                <div class="heatmap-mobile__versus mono">vs.</div>
                <div class="heatmap-mobile__opponent">
                  <img
                    v-for="(src, idx) in matchup.col.spriteUrls ?? []"
                    :key="`${matchup.col.deck}-mobile-col-${idx}`"
                    class="heatmap-sprite heatmap-sprite--mobile"
                    :src="src"
                    :alt="usageDeckDisplayName(matchup.col)"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                  />
                </div>
                <div class="heatmap-mobile__rate mono">{{ matchup.cell.text }}</div>
                <div class="heatmap-mobile__record mono">{{ matchup.cell.recordText }}</div>
              </div>
            </div>
          </div>

          <div v-else class="heatmap-mobile__empty mono">
            {{ locale === "en" ? "Choose a custom deck above to fill this slot." : "先在上方選擇一副牌組，這裡才會顯示對戰資料。" }}
          </div>
        </section>
      </div>

      <div v-else class="tier-empty mono">
        {{ heatLoading ? "Loading…" : locale === "en" ? "No matchup data" : "沒有對戰資料" }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import deckIconsManifest from "../assets/deck-icons/manifest.json";
import substituteIcon from "../assets/deck-icons/substitute.png";

const BASE_URL = (import.meta as any).env?.BASE_URL ?? "/";

type TierRow = {
  deck: string;
  tier: string;
  score: number;
  raw_name?: string;
  isOther?: boolean;
  iconKeys: string[];
  spriteUrls: string[];
  usage: number;
  total_samples: number;
  data1_top32_appearances: number;
  data2_weighted_points: number;
  data3_top32_share_pct: number;
};

type Meta = {
  generated_at: string;
  days_back: number;
  min_players: number;
  usage_threshold: number;
  tournaments_count: number;
};

type MatchupRecord = {
  deckA: string;
  deckB: string;
  winsA: number;
  lossesA: number;
  ties: number;
  total: number;
  winrateA: number;
};

type TournamentListItem = {
  id: string;
  date: string;
  players?: number;
  game?: string;
  format?: string;
  set?: string;
  swiss?: string | null;
};

type NormalizedTournament = TournamentListItem & {
  startMs: number;
  versionCode: string;
  swiss?: SwissLabel;
};

type StandingRow = Record<string, any>;
type PairingRow = Record<string, any>;

type DeckIdentity = {
  key: string;
  rawName: string;
  iconKeys: string[];
};

type DeckAggregate = {
  key: string;
  rawName: string;
  iconKeys: string[];
  allSamples: number;
  baselineTop32Samples: number;
  weightedPoints: number;
};

interface VersionMarker {
  code: string;
  name: string;
  startMs: number;
}

interface VersionWindow extends VersionMarker {
  label: string;
  endMs: number;
}

const VERSION_MARKERS: VersionMarker[] = [
  { code: "A1", name: "Genetic Apex", startMs: utcMs(2024, 10, 30) },
  { code: "A1a", name: "Mythical Island", startMs: utcMs(2024, 12, 17) },
  { code: "A2", name: "Space-Time Smackdown", startMs: utcMs(2025, 1, 29) },
  { code: "A2a", name: "Triumphant Light", startMs: utcMs(2025, 2, 28) },
  { code: "A2b", name: "Shining Revelry", startMs: utcMs(2025, 3, 27) },
  { code: "A3", name: "Celestial Guardians", startMs: utcMs(2025, 4, 30) },
  { code: "A3a", name: "Extradimensional Crisis", startMs: utcMs(2025, 5, 29) },
  { code: "A3b", name: "Eevee Grove", startMs: utcMs(2025, 6, 26) },
  { code: "A4", name: "Wisdom of Sea and Sky", startMs: utcMs(2025, 7, 30) },
  { code: "A4a", name: "Secluded Springs", startMs: utcMs(2025, 8, 28) },
  { code: "A4b", name: "Deluxe Pack: ex", startMs: utcMs(2025, 9, 30) },
  { code: "B1", name: "Mega Rising", startMs: utcMs(2025, 10, 30) },
  { code: "B1a", name: "Crimson Blaze", startMs: utcMs(2025, 12, 17) },
  { code: "B2", name: "Fantastical Parade", startMs: utcMs(2026, 1, 29) },
  { code: "B2a", name: "Paldean Wonders", startMs: utcMs(2026, 2, 26) },
  { code: "B2b", name: "Mega Shine", startMs: utcMs(2026, 3, 25) },
];

const VERSION_WINDOWS: VersionWindow[] = VERSION_MARKERS.map((item, index, arr) => ({
  ...item,
  label: `${item.code} - ${item.name}`,
  endMs: arr[index + 1]?.startMs ?? Number.POSITIVE_INFINITY,
}));

function inferVersionByStartMs(ms: number): VersionWindow | null {
  let hit: VersionWindow | null = null;
  for (const version of VERSION_WINDOWS) {
    if (ms >= version.startMs) hit = version;
    else break;
  }
  return hit;
}

const route = useRoute();

const locale = computed<"zh" | "en">(() => {
  return String(route.path).split("/")[1] === "en" ? "en" : "zh";
});

const currentVersionWindow = computed(() => inferVersionByStartMs(Date.now()));

const meta = ref<Meta | null>(null);
const tierRows = ref<TierRow[]>([]);

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_DECK_LIMIT = 10;
const PRESET_CURRENT_7 = "__current_7__";
const PRESET_CURRENT_14 = "__current_14__";
type TimeFilterValue = "all" | "past7" | "prev7" | "past4w" | string;
type SetFilterValue = "" | string;
type SwissLabel = "BO1" | "BO3" | "Other";
type SwissValue = "" | SwissLabel;
type TopCutValue = "all" | "64" | "32" | "16" | "8" | "4" | "2" | "1";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status})`);
  return (await response.json()) as T;
}

function utcMs(year: number, month: number, day: number) {
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
}

const filters = reactive<{
  minPlayers: number | undefined;
  time: TimeFilterValue;
  set: SetFilterValue;
  topCut: TopCutValue;
}>({
  minPlayers: undefined,
  time: "past4w",
  set: "",
  topCut: "all",
});

const legacySetOptions = computed(() => {
  const isZh = locale.value === "zh";

  function versionLabel(version: VersionWindow, includeCurrentSuffix: boolean) {
    const isCurrent = currentVersionWindow.value?.code === version.code;
    const suffix = includeCurrentSuffix && isCurrent ? (isZh ? "（目前）" : " (current)") : "";
    return `${version.code} - ${version.name}${suffix}`;
  }

  return [
    { value: "" as SetFilterValue, label: isZh ? "全部資料" : "All data" },
    {
      value: PRESET_CURRENT_7 as SetFilterValue,
      label: isZh ? "近 7 天（僅目前版本）" : "Past 7 days (current set only)",
    },
    {
      value: PRESET_CURRENT_14 as SetFilterValue,
      label: isZh ? "近 14 天（僅目前版本）" : "Past 14 days (current set only)",
    },
    ...[...VERSION_WINDOWS].reverse().map((v) => ({
      value: v.code as SetFilterValue,
      label: versionLabel(v, true),
    })),
  ];
});

const legacyTopCutOptions = computed<Array<{ value: TopCutValue; label: string }>>(() => {
  return [
    { value: "all", label: locale.value === "en" ? "All" : "全部" },
    { value: "64", label: "Top 64" },
    { value: "32", label: "Top 32" },
    { value: "16", label: "Top 16" },
    { value: "8", label: "Top 8" },
    { value: "4", label: "Top 4" },
    { value: "2", label: "Top 2" },
    { value: "1", label: locale.value === "en" ? "Winner" : "冠軍" },
  ];
});

void legacySetOptions;
void legacyTopCutOptions;

function versionLabel(version: VersionWindow, includeCurrentSuffix = true) {
  const isZh = locale.value === "zh";
  const isCurrent = currentVersionWindow.value?.code === version.code;
  const suffix = includeCurrentSuffix && isCurrent ? (isZh ? " (目前版本)" : " (current)") : "";
  return `${version.code} - ${version.name}${suffix}`;
}

const setOptions = computed<Array<{ value: SetFilterValue; label: string }>>(() => {
  return [
    { value: "", label: locale.value === "en" ? "All" : "全部" },
    ...[...VERSION_WINDOWS].reverse().map((version) => ({
      value: version.code,
      label: versionLabel(version),
    })),
  ];
});

const topCutOptions = computed<Array<{ value: TopCutValue; label: string }>>(() => {
  return [
    { value: "all", label: locale.value === "en" ? "All" : "全部" },
    { value: "64", label: "Top 64" },
    { value: "32", label: "Top 32" },
    { value: "16", label: "Top 16" },
    { value: "8", label: "Top 8" },
    { value: "4", label: "Top 4" },
    { value: "2", label: "Top 2" },
    { value: "1", label: locale.value === "en" ? "Winner" : "冠軍" },
  ];
});

const topDeckRows = computed(() => {
  return [...tierRows.value].sort((a, b) => b.score - a.score).slice(0, TOP_DECK_LIMIT);
});

const usageTopDeckRows = computed(() => {
  return [...tierRows.value]
    .sort((a, b) => {
      return (
        b.usage - a.usage ||
        b.total_samples - a.total_samples ||
        b.score - a.score ||
        a.deck.localeCompare(b.deck)
      );
    })
    .slice(0, TOP_DECK_LIMIT);
});

function isSetToken(token: string) {
  return /^[ab]\d+[a-z]?$/i.test(token);
}

function normalizeTierKey(tier: string) {
  const key = String(tier ?? "F").trim().toLowerCase();
  return key || "f";
}

function tierColor(tier: string) {
  switch (normalizeTierKey(tier)) {
    case "sss":
      return "rgba(186, 97, 58, 0.92)";
    case "ss":
      return "rgba(175, 107, 60, 0.92)";
    case "s":
      return "rgba(162, 118, 63, 0.92)";
    case "a":
      return "rgba(150, 122, 67, 0.92)";
    case "b":
      return "rgba(134, 128, 73, 0.92)";
    case "c":
      return "rgba(96, 137, 86, 0.92)";
    case "d":
      return "rgba(82, 113, 145, 0.92)";
    case "e":
      return "rgba(112, 94, 149, 0.92)";
    case "f":
      return "rgba(93, 102, 116, 0.86)";
    default:
      return "rgba(160, 168, 180, 0.36)";
  }
}

function tierBadgeGradient(tier: string) {
  switch (normalizeTierKey(tier)) {
    case "sss":
    case "ss":
    case "s":
      return "linear-gradient(180deg, rgba(231, 76, 60, 0.96) 0%, rgba(103, 49, 22, 0.98) 100%)";
    case "a":
      return "linear-gradient(180deg, rgba(255, 127, 80, 0.95) 0%, rgba(89, 61, 23, 0.98) 100%)";
    case "b":
      return "linear-gradient(180deg, rgba(241, 196, 15, 0.95) 0%, rgba(84, 73, 24, 0.98) 100%)";
    case "c":
      return "linear-gradient(180deg, rgba(126, 217, 87, 0.94) 0%, rgba(55, 92, 46, 0.98) 100%)";
    case "d":
      return "linear-gradient(180deg, rgba(82, 113, 255, 0.94) 0%, rgba(46, 61, 86, 0.98) 100%)";
    case "e":
      return "linear-gradient(180deg, rgba(105, 92, 140, 0.94) 0%, rgba(59, 49, 84, 0.98) 100%)";
    case "f":
      return "linear-gradient(180deg, rgba(78, 86, 99, 0.94) 0%, rgba(41, 46, 55, 0.98) 100%)";
    default:
      return "linear-gradient(180deg, rgba(95, 105, 120, 0.94) 0%, rgba(50, 58, 70, 0.98) 100%)";
  }
}

function tierBadgeTextClass(tier: string) {
  const key = normalizeTierKey(tier);
  if (key === "sss") return "tier-lane__badge-text tier-lane__badge-text--sss";
  if (key === "ss") return "tier-lane__badge-text tier-lane__badge-text--ss";
  if (key === "s") return "tier-lane__badge-text tier-lane__badge-text--s";
  return "tier-lane__badge-text";
}

function deckShortLabel(deckKey: string) {
  const tokens = String(deckKey ?? "")
    .split("-")
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !isSetToken(t));

  const mapped = tokens.map((part) => {
    const lower = part.toLowerCase();
    if (lower === "ex") return "EX";
    if (lower === "gx") return "GX";
    if (lower === "vstar") return "VSTAR";
    if (lower === "vmax") return "VMAX";
    if (lower === "mega") return "Mega";
    if (lower === "x" || lower === "y") return lower.toUpperCase();
    if (part.length <= 1) return part.toUpperCase();
    return part.charAt(0).toUpperCase() + part.slice(1);
  });

  return mapped.slice(0, 2).join(" ");
}

function deckProfileTo(deckKey: string) {
  return {
    path: `/${locale.value}/top-decks/${encodeURIComponent(deckKey)}`,
    query: {
      set: filters.set,
      topCut: filters.topCut,
    },
  };
}

const TIER_LIST_ORDER = ["SSS", "SS", "S", "A", "B", "C", "D", "E", "F"] as const;

const tierGroups = computed<Record<string, TierRow[]>>(() => {
  const out: Record<string, TierRow[]> = {};
  for (const r of topDeckRows.value) {
    const t = String(r.tier ?? "F").toUpperCase();
    if (!out[t]) out[t] = [];
    out[t].push(r);
  }
  return out;
});

const visibleTierGroups = computed(() => {
  return TIER_LIST_ORDER.map((tier) => ({
    tier,
    rows: tierGroups.value[tier] ?? [],
  })).filter((group) => group.rows.length > 0);
});

const topDeckKeySet = computed(() => new Set(topDeckRows.value.map((row) => row.deck)));
const usageTopDeckKeySet = computed(() => new Set(usageTopDeckRows.value.map((row) => row.deck)));

const otherUsageRow = computed<TierRow | null>(() => {
  const others = tierRows.value.filter((row) => !usageTopDeckKeySet.value.has(row.deck));
  if (others.length === 0) return null;

  return {
    deck: "__other__",
    tier: "OTHER",
    score: -1,
    raw_name: locale.value === "en" ? "Other Decks" : "其他牌組",
    isOther: true,
    iconKeys: ["substitute"],
    spriteUrls: [substituteIcon],
    usage: others.reduce((sum, row) => sum + row.usage, 0),
    total_samples: others.reduce((sum, row) => sum + row.total_samples, 0),
    data1_top32_appearances: others.reduce((sum, row) => sum + row.data1_top32_appearances, 0),
    data2_weighted_points: others.reduce((sum, row) => sum + row.data2_weighted_points, 0),
    data3_top32_share_pct: others.reduce((sum, row) => sum + row.data3_top32_share_pct, 0),
  };
});

const usageBreakdownRows = computed(() => {
  return otherUsageRow.value ? [...usageTopDeckRows.value, otherUsageRow.value] : [...usageTopDeckRows.value];
});

const usageMax = computed(() => {
  return usageTopDeckRows.value.reduce((max, row) => Math.max(max, row.usage), 0);
});

function usageDeckDisplayName(row: TierRow) {
  if (row.isOther) {
    return locale.value === "en" ? "Other Decks" : "其他牌組";
  }
  return String(row.raw_name ?? "").trim() || humanizeDeckId(row.deck);
}

function formatUsagePct(usage: number) {
  return `${(usage * 100).toFixed(1)}%`;
}

function usageBarWidth(usage: number) {
  const max = usageMax.value;
  if (!max || usage <= 0) return "0%";
  return `${Math.max(3, Math.min(100, (usage / max) * 100)).toFixed(2)}%`;
}

function usageBarFill(row: TierRow) {
  if (row.isOther) {
    return "linear-gradient(90deg, rgba(142, 180, 226, 0.95), rgba(117, 138, 166, 0.92))";
  }
  const tier = row.tier;
  const accent = tierColor(tier).replace(/0\.\d+\)/, "0.98)");
  return `linear-gradient(90deg, rgba(102, 176, 255, 0.98), ${accent})`;
}

const matrixExtraDeck = ref("");
const matrixPickerRef = ref<HTMLDetailsElement | null>(null);

const matrixOptionRows = computed(() => {
  return [...tierRows.value]
    .sort((a, b) => {
      return (
        b.usage - a.usage ||
        b.total_samples - a.total_samples ||
        b.score - a.score ||
        b.data2_weighted_points - a.data2_weighted_points ||
        b.data1_top32_appearances - a.data1_top32_appearances ||
        a.deck.localeCompare(b.deck)
      );
    });
});

function closeMatrixPicker() {
  if (matrixPickerRef.value) {
    matrixPickerRef.value.open = false;
  }
}

function clearMatrixDeck() {
  matrixExtraDeck.value = "";
  closeMatrixPicker();
}

function selectMatrixDeck(deckKey: string) {
  matrixExtraDeck.value = deckKey;
  closeMatrixPicker();
}

const mobileHeatRows = computed(() => {
  return matrixAxisRows.value.map((row, index) => ({
    row,
    index,
    matchups: matrixAxisRows.value
      .map((col, matchupIndex) => ({
        col,
        index: matchupIndex,
        cell: heatCells.value[index]?.[matchupIndex] ?? {
          winrate: null,
          total: null,
          wins: null,
          losses: null,
          ties: null,
          text: "",
          recordText: "",
          style: {},
          tooltip: "",
        },
      }))
      .filter(
        (item): item is { col: TierRow; index: number; cell: HeatCell } =>
          row !== null && item.col !== null && item.col.deck !== row.deck,
      ),
  }));
});

const pieLegendSegments = computed<Array<{ tier: string; count: number }>>(() => []);

const pieConicGradient = computed(() => {
  const total = topDeckRows.value.length || 1;
  let angle = 0;
  const stops: string[] = [];

  for (const seg of pieLegendSegments.value) {
    const part = seg.count / total;
    const start = angle;
    angle += part * 360;
    const end = angle;
    const color = tierColor(seg.tier);
    stops.push(`${color} ${start}deg ${end}deg`);
  }

  if (stops.length === 0) return "conic-gradient(rgba(255,255,255,0.18) 0deg 360deg)";
  return `conic-gradient(from 90deg, ${stops.join(", ")})`;
});

const pieCenterText = computed(() => {
  const seg = [...pieLegendSegments.value].sort((a, b) => b.count - a.count)[0];
  return seg?.tier ?? "—";
});

const legacyPieCompat = [pieLegendSegments, pieConicGradient, pieCenterText];
void legacyPieCompat;
const matrixSelectedDeckRow = computed(() => {
  return tierRows.value.find((row) => row.deck === matrixExtraDeck.value) ?? null;
});

const matrixAxisRows = computed<Array<TierRow | null>>(() => {
  return [...topDeckRows.value, matrixSelectedDeckRow.value];
});

const matchupMap = ref<Map<string, MatchupRecord>>(new Map());
const heatLoading = ref(true);

type HeatCell = {
  winrate: number | null;
  total: number | null;
  wins: number | null;
  losses: number | null;
  ties: number | null;
  text: string;
  recordText: string;
  style: Record<string, string>;
  tooltip: string;
};

type HeatTone = {
  bg: string;
  border: string;
  text: string;
  glow: string;
};

const ADVANTAGE_TONES: HeatTone[] = [
  {
    bg: "rgba(34, 106, 73, 0.34)",
    border: "rgba(92, 230, 160, 0.32)",
    text: "#effff4",
    glow: "rgba(60, 200, 120, 0.10)",
  },
  {
    bg: "rgba(28, 125, 77, 0.42)",
    border: "rgba(97, 236, 164, 0.40)",
    text: "#f2fff6",
    glow: "rgba(64, 204, 124, 0.12)",
  },
  {
    bg: "rgba(22, 145, 82, 0.50)",
    border: "rgba(106, 243, 171, 0.48)",
    text: "#f5fff7",
    glow: "rgba(72, 214, 132, 0.14)",
  },
  {
    bg: "rgba(18, 162, 88, 0.58)",
    border: "rgba(114, 250, 178, 0.56)",
    text: "#f8fff9",
    glow: "rgba(78, 224, 138, 0.16)",
  },
  {
    bg: "rgba(16, 178, 94, 0.68)",
    border: "rgba(126, 255, 188, 0.64)",
    text: "#ffffff",
    glow: "rgba(86, 235, 145, 0.20)",
  },
  {
    bg: "rgba(14, 193, 100, 0.76)",
    border: "rgba(139, 255, 199, 0.72)",
    text: "#ffffff",
    glow: "rgba(100, 245, 154, 0.24)",
  },
  {
    bg: "rgba(12, 208, 105, 0.84)",
    border: "rgba(156, 255, 212, 0.80)",
    text: "#ffffff",
    glow: "rgba(114, 255, 162, 0.28)",
  },
  {
    bg: "rgba(10, 222, 110, 0.94)",
    border: "rgba(178, 255, 230, 0.90)",
    text: "#ffffff",
    glow: "rgba(128, 255, 176, 0.32)",
  },
];

const DISADVANTAGE_TONES: HeatTone[] = [
  {
    bg: "rgba(128, 47, 58, 0.28)",
    border: "rgba(237, 112, 127, 0.32)",
    text: "#fff3f5",
    glow: "rgba(200, 70, 90, 0.08)",
  },
  {
    bg: "rgba(116, 34, 44, 0.40)",
    border: "rgba(226, 102, 118, 0.40)",
    text: "#fff4f6",
    glow: "rgba(190, 60, 78, 0.10)",
  },
  {
    bg: "rgba(100, 25, 34, 0.56)",
    border: "rgba(212, 90, 108, 0.46)",
    text: "#fff5f7",
    glow: "rgba(180, 54, 70, 0.12)",
  },
  {
    bg: "rgba(84, 19, 27, 0.70)",
    border: "rgba(200, 80, 98, 0.50)",
    text: "#fff7f8",
    glow: "rgba(168, 48, 62, 0.14)",
  },
  {
    bg: "rgba(64, 15, 21, 0.82)",
    border: "rgba(184, 68, 86, 0.52)",
    text: "#fff8f9",
    glow: "rgba(154, 44, 56, 0.16)",
  },
  {
    bg: "rgba(42, 10, 14, 0.92)",
    border: "rgba(164, 54, 70, 0.54)",
    text: "#ffffff",
    glow: "rgba(138, 36, 48, 0.18)",
  },
  {
    bg: "rgba(18, 4, 6, 0.98)",
    border: "rgba(136, 40, 54, 0.52)",
    text: "#ffffff",
    glow: "rgba(112, 28, 38, 0.20)",
  },
  {
    bg: "rgba(0, 0, 0, 1)",
    border: "rgba(255, 255, 255, 0.14)",
    text: "#ffffff",
    glow: "rgba(0, 0, 0, 0.28)",
  },
];

function heatCellStyle(winrate: number | null): Record<string, string> {
  const neutral = {
    backgroundColor: "rgba(12, 27, 48, 0.92)",
    borderColor: "rgba(86, 116, 156, 0.22)",
    color: "#eaf4ff",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  if (winrate == null) return neutral;

  const pct = winrate * 100;

  if (pct >= 46 && pct <= 54) {
    return neutral;
  }

  if (pct >= 55) {
    const idx = Math.min(ADVANTAGE_TONES.length - 1, Math.max(0, Math.floor((pct - 55) / 5)));
    const tone = ADVANTAGE_TONES[idx] ?? ADVANTAGE_TONES[ADVANTAGE_TONES.length - 1];
    if (!tone) return neutral;
    return {
      backgroundColor: tone.bg,
      borderColor: tone.border,
      color: tone.text,
      boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 18px ${tone.glow}`,
    };
  }

  const idx =
    pct <= 10
      ? DISADVANTAGE_TONES.length - 1
      : Math.min(DISADVANTAGE_TONES.length - 2, Math.floor((45 - pct) / 5));

  const tone =
    DISADVANTAGE_TONES[Math.max(0, Math.min(idx, DISADVANTAGE_TONES.length - 1))] ??
    DISADVANTAGE_TONES[DISADVANTAGE_TONES.length - 1];
  if (!tone) return neutral;

  return {
    backgroundColor: tone.bg,
    borderColor: tone.border,
    color: tone.text,
    boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.02), 0 0 18px ${tone.glow}`,
  };
}

const heatCells = computed<HeatCell[][]>(() => {
  const decks = matrixAxisRows.value;
  const map = matchupMap.value;

  return decks.map((rowDeck) => {
    return decks.map((colDeck) => {
      if (!rowDeck || !colDeck) {
        return {
          winrate: null,
          total: null,
          wins: null,
          losses: null,
          ties: null,
          text: "",
          recordText: "",
          style: {},
          tooltip: "",
        };
      }

      const rowKey = rowDeck.deck;
      const colKey = colDeck.deck;

      if (rowKey === colKey) {
        return {
          winrate: null,
          total: null,
          wins: null,
          losses: null,
          ties: null,
          text: "—",
          recordText: "—",
          style: {},
          tooltip: "",
        };
      }

      const direct = map.get(`${rowKey}__${colKey}`);
      if (direct) {
        const wr = direct.winrateA;

        return {
          winrate: wr,
          total: direct.total,
          wins: direct.winsA,
          losses: direct.lossesA,
          ties: direct.ties,
          text: `${(wr * 100).toFixed(1)}%`,
          recordText: `${direct.winsA}-${direct.lossesA}-${direct.ties}`,
          style: heatCellStyle(wr),
          tooltip: `${rowDeck.deck} vs ${colDeck.deck}\n${direct.winsA}-${direct.lossesA}-${direct.ties} | ${(wr * 100).toFixed(2)}%`,
        };
      }

      return {
        winrate: null,
        total: null,
        wins: null,
        losses: null,
        ties: null,
        text: "—",
        recordText: "",
        style: {},
        tooltip: "",
      };
    });
  });
});

const tournaments = ref<NormalizedTournament[]>([]);
const loadingTournaments = ref(false);
const tournamentsError = ref("");

const standingsCache = reactive<Record<string, StandingRow[]>>({});
const pairingsCache = reactive<Record<string, PairingRow[]>>({});
const detailsCache = reactive<Record<string, Record<string, any> | null>>({});
const standingsLoading = reactive<Record<string, boolean>>({});
const pairingsLoading = reactive<Record<string, boolean>>({});
const detailsLoading = reactive<Record<string, boolean>>({});

function dataUrl(path: string) {
  return `${BASE_URL}${path}`;
}

function tournamentsUrl() {
  return dataUrl("data/tournaments.json");
}

function standingsUrl(id: string) {
  return dataUrl(`data/raw/${id}/standings.json`);
}

function pairingsUrl(id: string) {
  return dataUrl(`data/raw/${id}/pairings.json`);
}

function detailsUrl(id: string) {
  return dataUrl(`data/raw/${id}/details.json`);
}

function hasStandings(id: string) {
  return Object.prototype.hasOwnProperty.call(standingsCache, id);
}

function hasPairings(id: string) {
  return Object.prototype.hasOwnProperty.call(pairingsCache, id);
}

function hasDetails(id: string) {
  return Object.prototype.hasOwnProperty.call(detailsCache, id);
}

function startOfUtcDayMs(ms: number) {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
}

function parseMs(value: unknown): number {
  const ms = Date.parse(String(value ?? ""));
  return Number.isFinite(ms) ? ms : NaN;
}

function normalizeSwissValue(raw: unknown): SwissLabel | undefined {
  const text = String(raw ?? "").trim().toUpperCase();
  if (!text) return undefined;
  if (text === "BO1") return "BO1";
  if (text === "BO3") return "BO3";
  return "Other";
}

function swissLabelFromDetails(details: Record<string, any> | null | undefined): SwissLabel {
  const phases = Array.isArray(details?.phases) ? details.phases : [];
  const phase1 = phases.find((phase: any) => phase?.phase === 1) ?? phases[0];
  const phaseType = String(phase1?.type ?? "").trim().toUpperCase();
  const phaseMode = String(phase1?.mode ?? "").trim().toUpperCase();

  if (phaseType !== "SWISS") return "Other";
  if (phaseMode === "BO1") return "BO1";
  if (phaseMode === "BO3") return "BO3";
  return "Other";
}

const monthOptions = computed<Array<{ value: TimeFilterValue; label: string }>>(() => {
  const seen = new Set<string>();
  const items: Array<{ value: TimeFilterValue; label: string }> = [];

  for (const tournament of tournaments.value) {
    const date = new Date(tournament.startMs);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      value: `month:${key}`,
      label: locale.value === "en" ? key : key.replace("-", " 年 ") + " 月",
    });
  }

  return items.sort((a, b) => (a.value < b.value ? 1 : -1));
});

const timeOptionGroups = computed(() => {
  const baseOptions = [
    { value: "all" as TimeFilterValue, label: locale.value === "en" ? "All" : "全部" },
    { value: "past7" as TimeFilterValue, label: locale.value === "en" ? "Past 7 days" : "近 7 天" },
    { value: "prev7" as TimeFilterValue, label: locale.value === "en" ? "Previous 7 days" : "前 7 天" },
    { value: "past4w" as TimeFilterValue, label: locale.value === "en" ? "Past 4 weeks" : "近 4 週" },
  ];

  return {
    base: baseOptions,
    months: monthOptions.value,
  };
});

function inTimeRange(tournament: NormalizedTournament) {
  if (filters.time === "all") return true;

  const now = Date.now();
  if (filters.time === "past7") return tournament.startMs >= now - 7 * DAY_MS;
  if (filters.time === "prev7") {
    return tournament.startMs < now - 7 * DAY_MS && tournament.startMs >= now - 14 * DAY_MS;
  }
  if (filters.time === "past4w") return tournament.startMs >= now - 28 * DAY_MS;

  if (String(filters.time).startsWith("month:")) {
    const ym = String(filters.time).slice("month:".length);
    const [yearText, monthText] = ym.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) return true;
    const start = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
    const end = Date.UTC(year, month, 1, 0, 0, 0, 0);
    return tournament.startMs >= start && tournament.startMs < end;
  }

  return true;
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.max(1, Math.min(limit, queue.length)) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  });
  await Promise.allSettled(workers);
}

async function ensureTournamentDataForIds(ids: string[]) {
  const standingsMissing = ids.filter((id) => !hasStandings(id) && !standingsLoading[id]);
  const pairingsMissing = ids.filter((id) => !hasPairings(id) && !pairingsLoading[id]);

  await runWithConcurrency(standingsMissing, 4, async (id) => {
    standingsLoading[id] = true;
    try {
      const rows = await fetchJson<StandingRow[]>(standingsUrl(id));
      standingsCache[id] = Array.isArray(rows) ? rows : [];
    } catch {
      standingsCache[id] = [];
    } finally {
      standingsLoading[id] = false;
    }
  });

  await runWithConcurrency(pairingsMissing, 4, async (id) => {
    pairingsLoading[id] = true;
    try {
      const rows = await fetchJson<PairingRow[]>(pairingsUrl(id));
      pairingsCache[id] = Array.isArray(rows) ? rows : [];
    } catch {
      pairingsCache[id] = [];
    } finally {
      pairingsLoading[id] = false;
    }
  });
}

async function ensureSwissForIds(ids: string[]) {
  const missing = ids.filter((id) => !hasDetails(id) && !detailsLoading[id]);

  await runWithConcurrency(missing, 4, async (id) => {
    detailsLoading[id] = true;
    try {
      const details = await fetchJson<Record<string, any>>(detailsUrl(id));
      detailsCache[id] = details ?? null;
    } catch {
      detailsCache[id] = null;
    } finally {
      detailsLoading[id] = false;
    }
  });

  if (ids.length === 0) return;
  const idSet = new Set(ids);
  tournaments.value = tournaments.value.map((tournament) => {
    if (!idSet.has(tournament.id)) return tournament;
    const swiss =
      normalizeSwissValue(tournament.swiss) ??
      swissLabelFromDetails(detailsCache[tournament.id]);
    return { ...tournament, swiss };
  });
}

function normalizeStringArray(value: unknown): string[] {
  const input = Array.isArray(value) ? value : value == null ? [] : [value];
  const mapped = input
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const hit = (item as any).src ?? (item as any).url ?? (item as any).path ?? (item as any).name ?? "";
        return String(hit).trim();
      }
      return String(item).trim();
    })
    .filter(Boolean);
  return [...new Set(mapped)];
}

function isInvalidDeckToken(value: string) {
  const s = String(value ?? "").trim().toLowerCase();
  return !s || ["unknown", "undefined", "null", "none", "nan"].includes(s);
}

function cleanDeckText(value: string) {
  return isInvalidDeckToken(value) ? "" : String(value).trim();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeDeckId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (/^[ab]\d+[a-z]?$/i.test(part)) return part.toUpperCase();
      if (lower === "ex") return "ex";
      if (lower === "gx") return "GX";
      if (lower === "vstar") return "VSTAR";
      if (lower === "vmax") return "VMAX";
      if (lower === "mega") return "Mega";
      if (lower === "x" || lower === "y") return lower.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function parseTwoFromDeckId(deckId?: string) {
  if (!deckId) return [];
  const tokens = String(deckId).toLowerCase().split("-").filter(Boolean);
  const mons: string[] = [];
  let cur: string[] = [];

  for (const t of tokens) {
    if (isSetToken(t)) {
      if (cur.length) mons.push(cur.join("-"));
      cur = [];
      continue;
    }
    cur.push(t);
  }
  if (cur.length) mons.push(cur.join("-"));
  return mons.slice(0, 2);
}

function parseTwoFromDeckName(deckName?: string) {
  if (!deckName) return [];
  const s = String(deckName).trim();
  const re = /\bex\b/gi;
  const hits: number[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(s)) && hits.length < 2) hits.push(m.index + m[0].length);
  if (hits.length < 2) return s ? [s] : [];

  const firstEnd = hits[0];
  const secondEnd = hits[1];
  const part1 = s.slice(0, firstEnd).trim();
  const part2 = s.slice(firstEnd, secondEnd).trim();
  return [part1, part2].filter(Boolean);
}

function extractDeckIconKeys(row: StandingRow) {
  const deck = row?.deck ?? {};
  const direct = normalizeStringArray(
    deck?.icons ?? deck?.icon ?? deck?.pokemon ?? deck?.pokemons ?? deck?.iconKeys ?? row?.deckIconKeys,
  );
  if (direct.length > 0) return direct.slice(0, 2);

  const main =
    deck?.primaryIconKey ??
    deck?.mainIconKey ??
    row?.deckIconKeyMain ??
    row?.primaryIconKey ??
    row?.mainIconKey ??
    deck?.mainPokemon ??
    deck?.main;

  const sub =
    deck?.secondaryIconKey ??
    deck?.subIconKey ??
    row?.deckIconKeySub ??
    row?.secondaryIconKey ??
    row?.subIconKey ??
    deck?.subPokemon ??
    deck?.sub;

  const paired = normalizeStringArray([main, sub]);
  if (paired.length > 0) return paired.slice(0, 2);

  const fromId = parseTwoFromDeckId(String(deck?.id ?? ""));
  if (fromId.length > 0) return fromId.slice(0, 2);

  const fromName = parseTwoFromDeckName(String(deck?.name ?? deck?.archetype ?? row?.archetype ?? ""));
  return fromName.slice(0, 2);
}

function buildDeckIdentity(row: StandingRow): DeckIdentity | null {
  const deck = row?.deck ?? {};
  const rawName = cleanDeckText(String(deck?.name ?? deck?.archetype ?? row?.archetype ?? ""));
  const rawId = cleanDeckText(String(deck?.id ?? ""));
  const iconKeys = extractDeckIconKeys(row);
  const key = rawId || slugify(rawName) || slugify(iconKeys.join("-"));

  if (!key || isInvalidDeckToken(key)) return null;
  return { key, rawName: rawName || humanizeDeckId(key), iconKeys };
}

function getPlace(row: StandingRow): number | null {
  const value = Number(row?.placing);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function pointsForPlace(place: number | null) {
  if (place == null) return 0;
  if (place === 1) return 10;
  if (place === 2) return 8;
  if (place >= 3 && place <= 4) return 6;
  if (place >= 5 && place <= 8) return 4;
  if (place >= 9 && place <= 16) return 2;
  if (place >= 17 && place <= 32) return 1;
  return 0;
}

type TopCutValueLocal = typeof filters.topCut;

function qualifiesByTopCut(place: number | null, cut: TopCutValueLocal) {
  if (cut === "all") return true;
  if (place == null) return false;
  return place <= Number(cut);
}

function mapNumberRecord(input: Record<string, number>, fn: (value: number) => number) {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input)) out[key] = fn(value);
  return out;
}

function minmaxScale(input: Record<string, number>) {
  const entries = Object.entries(input);
  if (entries.length === 0) return {};
  const values = entries.map(([, value]) => value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) {
    const fill = entries.length === 1 ? 1 : 0;
    return Object.fromEntries(entries.map(([key]) => [key, fill]));
  }

  return Object.fromEntries(entries.map(([key, value]) => [key, (value - min) / (max - min)]));
}

function isPerfectScore(score: number) {
  return Math.abs(score - 1) < 1e-9;
}

function tierLabel(score: number, top32SharePct: number, hasAnotherDeckScoreAtLeast09: boolean) {
  if (top32SharePct < 0.5) return "F";
  if (isPerfectScore(score)) return hasAnotherDeckScoreAtLeast09 ? "SS" : "SSS";
  if (score >= 0.9) return "S";
  if (score >= 0.8) return "A";
  if (score >= 0.7) return "B";
  if (score >= 0.5) return "C";
  if (score >= 0.3) return "D";
  if (score >= 0.1) return "E";
  return "F";
}

function uniqStrings(list: string[]) {
  return [...new Set(list)];
}

const deckIconSrcBySlug = new Map<string, string>(
  (deckIconsManifest as any[]).map((item) => [String(item.slug), String(item.src)]),
);

function normalizeIconLookupKey(raw: string) {
  let text = String(raw ?? "").trim();
  if (!text) return "";
  text = text.split("?")[0]?.split("#")[0] ?? text;
  text = text.replace(/\\/g, "/");
  text = text.split("/").pop() ?? text;
  text = text.replace(/\.[a-z0-9]+$/i, "");
  text = text.replace(/_/g, "-");
  return slugify(text);
}

function rawIconVariants(raw: string) {
  const first = normalizeIconLookupKey(raw);
  if (!first) return [];

  const queue = [first];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const key = queue.shift()!;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (key.startsWith("mega-")) queue.push(`${key.slice(5)}-mega`);
    if (key.endsWith("-mega")) queue.push(`mega-${key.slice(0, -5)}`);
    if (key.endsWith("-ex")) queue.push(key.slice(0, -3));
    if (key.endsWith("-gx")) queue.push(key.slice(0, -3));
    if (key.endsWith("-v")) queue.push(key.slice(0, -2));
  }

  return [...seen];
}

function resolveDeckSpriteUrlsFromIconKeys(iconKeys: string[]) {
  const urls: string[] = [];

  for (const iconKey of iconKeys ?? []) {
    if (/^https?:\/\//i.test(String(iconKey))) {
      urls.push(String(iconKey));
      continue;
    }

    const candidates = rawIconVariants(String(iconKey));
    for (const cand of candidates) {
      const hit = deckIconSrcBySlug.get(cand);
      if (hit) {
        urls.push(hit);
        break;
      }
    }
  }

  return uniqStrings(urls).slice(0, 2);
}

const recomputeToken = { tier: 0, heat: 0 };

async function filteredTournamentsForCurrentFilters() {
  return tournaments.value.filter((tournament) => {
    if (filters.minPlayers != null && Number.isFinite(filters.minPlayers)) {
      if ((tournament.players ?? 0) < filters.minPlayers) return false;
    }

    if (!inTimeRange(tournament)) return false;
    if (filters.set && tournament.versionCode !== filters.set) return false;
    return true;
  });
}

async function recomputeTierRows() {
  const token = ++recomputeToken.tier;
  const scopedTournaments = await filteredTournamentsForCurrentFilters();
  const ids = scopedTournaments.map((tournament) => tournament.id);

  if (meta.value) {
    meta.value = {
      ...meta.value,
      days_back:
        filters.time === "past7" ? 7 : filters.time === "prev7" ? 14 : filters.time === "past4w" ? 28 : 0,
      min_players: filters.minPlayers ?? 0,
      tournaments_count: scopedTournaments.length,
    };
  }

  if (!ids.length) {
    tierRows.value = [];
    return;
  }

  await runWithConcurrency(
    ids.filter((id) => !hasStandings(id) && !standingsLoading[id]),
    4,
    async (id) => {
      standingsLoading[id] = true;
      try {
        const rows = await fetchJson<StandingRow[]>(standingsUrl(id));
        standingsCache[id] = Array.isArray(rows) ? rows : [];
      } catch {
        standingsCache[id] = [];
      } finally {
        standingsLoading[id] = false;
      }
    },
  );

  const deckMap = new Map<string, DeckAggregate>();
  let totalBaselineTop32Samples = 0;
  let totalAllSamples = 0;

  for (const tid of ids) {
    const standings = standingsCache[tid];
    if (!Array.isArray(standings)) continue;

    for (const row of standings) {
      const deck = buildDeckIdentity(row);
      if (!deck) continue;

      const place = getPlace(row);
      if (!qualifiesByTopCut(place, filters.topCut)) continue;
      let hit = deckMap.get(deck.key);

      if (!hit) {
        hit = {
          key: deck.key,
          rawName: deck.rawName,
          iconKeys: deck.iconKeys,
          allSamples: 0,
          baselineTop32Samples: 0,
          weightedPoints: 0,
        };
        deckMap.set(deck.key, hit);
      } else if (hit.iconKeys.length < deck.iconKeys.length) {
        hit.iconKeys = deck.iconKeys;
      }

      hit.allSamples += 1;
      totalAllSamples += 1;

      if (place != null && place <= 32) {
        hit.baselineTop32Samples += 1;
        totalBaselineTop32Samples += 1;
        hit.weightedPoints += pointsForPlace(place);
      }
    }
  }

  if (token !== recomputeToken.tier) return;

  const data1: Record<string, number> = {};
  const data2: Record<string, number> = {};
  const data3: Record<string, number> = {};

  for (const item of deckMap.values()) {
    data1[item.key] = item.baselineTop32Samples;
    data2[item.key] = item.weightedPoints;
    data3[item.key] =
      totalBaselineTop32Samples > 0 ? (item.baselineTop32Samples / totalBaselineTop32Samples) * 100 : 0;
  }

  const log1 = mapNumberRecord(data1, (value) => Math.log1p(value));
  const log2 = mapNumberRecord(data2, (value) => Math.log1p(value));
  const log3 = mapNumberRecord(data3, (value) => Math.log1p(value));

  const std1 = minmaxScale(log1);
  const std2 = minmaxScale(log2);
  const std3 = minmaxScale(log3);

  const baseRows = Array.from(deckMap.values()).map((item) => {
    const top32SharePct = data3[item.key] ?? 0;
    const score = 0.4 * (std1[item.key] ?? 0) + 0.5 * (std2[item.key] ?? 0) + 0.1 * (std3[item.key] ?? 0);

    return {
      deck: item.key,
      tier: "F",
      score,
      raw_name: item.rawName,
      iconKeys: item.iconKeys,
      spriteUrls: resolveDeckSpriteUrlsFromIconKeys(item.iconKeys),
      usage: totalAllSamples > 0 ? item.allSamples / totalAllSamples : 0,
      total_samples: item.allSamples,
      data1_top32_appearances: item.baselineTop32Samples,
      data2_weighted_points: item.weightedPoints,
      data3_top32_share_pct: top32SharePct,
    } satisfies TierRow;
  });

  baseRows.sort((a, b) => {
    return (
      b.score - a.score ||
      b.data2_weighted_points - a.data2_weighted_points ||
      b.data1_top32_appearances - a.data1_top32_appearances ||
      b.total_samples - a.total_samples
    );
  });

  const finalized = baseRows.map((row, index, arr) => {
    const hasAnotherDeckScoreAtLeast09 = arr.some((other, otherIndex) => otherIndex !== index && other.score >= 0.9);
    const tier = tierLabel(row.score, row.data3_top32_share_pct ?? 0, hasAnotherDeckScoreAtLeast09);
    return { ...row, tier };
  });

  tierRows.value = finalized.slice(0, 2000);
}

async function recomputeHeatmapForTopCut() {
  const token = ++recomputeToken.heat;
  const keys = matrixAxisRows.value.filter((row): row is TierRow => row !== null).map((row) => row.deck);
  const keySet = new Set(keys);

  if (!keys.length) {
    matchupMap.value = new Map();
    return;
  }

  const ids = (await filteredTournamentsForCurrentFilters()).map((tournament) => tournament.id);
  await ensureTournamentDataForIds(ids);

  const pairMap = new Map<string, { wins: number; losses: number; ties: number }>();

  for (const tid of ids) {
    const standings = standingsCache[tid];
    const pairings = pairingsCache[tid];
    if (!Array.isArray(standings) || !Array.isArray(pairings)) continue;

    const playerDeckKey = new Map<string, string>();
    const playerPlace = new Map<string, number | null>();

    for (const row of standings) {
      const deck = buildDeckIdentity(row);
      if (!deck) continue;

      const playerId = String(row?.player ?? "").trim();
      if (!playerId) continue;

      playerDeckKey.set(playerId, deck.key);
      playerPlace.set(playerId, getPlace(row));
    }

    for (const match of pairings) {
      const p1 = String(match?.player1 ?? "").trim();
      const p2 = String(match?.player2 ?? "").trim();
      if (!p1 || !p2) continue;

      const deck1 = playerDeckKey.get(p1);
      const deck2 = playerDeckKey.get(p2);
      if (!deck1 || !deck2) continue;

      const place1 = playerPlace.get(p1) ?? null;
      const place2 = playerPlace.get(p2) ?? null;

      const winner = match?.winner;
      const isTie = winner === 0 || winner === "0" || winner === "draw" || winner === "tie";
      const isDoubleLoss = winner === -1 || winner === "-1";
      const p1Won = winner === p1;
      const p2Won = winner === p2;

      if (!isTie && !isDoubleLoss && !p1Won && !p2Won) continue;
      if (isDoubleLoss) continue;

      if (keySet.has(deck1) && keySet.has(deck2) && qualifiesByTopCut(place1, filters.topCut)) {
        const key = `${deck1}__${deck2}`;
        const rec = pairMap.get(key) ?? { wins: 0, losses: 0, ties: 0 };
        if (p1Won) rec.wins += 1;
        else if (p2Won) rec.losses += 1;
        else if (isTie) rec.ties += 1;
        pairMap.set(key, rec);
      }

      if (keySet.has(deck2) && keySet.has(deck1) && qualifiesByTopCut(place2, filters.topCut)) {
        const key = `${deck2}__${deck1}`;
        const rec = pairMap.get(key) ?? { wins: 0, losses: 0, ties: 0 };
        if (p2Won) rec.wins += 1;
        else if (p1Won) rec.losses += 1;
        else if (isTie) rec.ties += 1;
        pairMap.set(key, rec);
      }
    }
  }

  if (token !== recomputeToken.heat) return;

  const map = new Map<string, MatchupRecord>();
  for (const [key, value] of pairMap.entries()) {
    const total = value.wins + value.losses + value.ties;
    const winrateA = total > 0 ? (value.wins + value.ties * 0.5) / total : 0;

    const parts = key.split("__");
    const deckA = parts[0] ?? "";
    const deckB = parts[1] ?? "";

    if (!deckA || !deckB) continue;

    map.set(key, {
      deckA,
      deckB,
      winsA: value.wins,
      lossesA: value.losses,
      ties: value.ties,
      total,
      winrateA,
    });
  }

  matchupMap.value = map;
}

async function loadTournaments() {
  if (loadingTournaments.value) return;

  loadingTournaments.value = true;
  tournamentsError.value = "";

  try {
    const rows = await fetchJson<TournamentListItem[]>(tournamentsUrl());
    const normalized = Array.isArray(rows)
      ? rows
          .map((r): NormalizedTournament | null => {
            const startMs = parseMs(r.date);
            if (!Number.isFinite(startMs)) return null;
            const versionCode = inferVersionByStartMs(startMs)?.code ?? "";
            return {
              ...r,
              startMs,
              versionCode,
              swiss: normalizeSwissValue(r.swiss),
            };
          })
          .filter((r): r is NormalizedTournament => r !== null)
          .sort((a, b) => b.startMs - a.startMs)
      : [];

    tournaments.value = normalized;
    if (!filters.set && currentVersionWindow.value?.code) {
      filters.set = currentVersionWindow.value.code;
    }
    meta.value = {
      generated_at: new Date().toISOString(),
      days_back:
        filters.time === "past7" ? 7 : filters.time === "prev7" ? 14 : filters.time === "past4w" ? 28 : 0,
      min_players: filters.minPlayers ?? 0,
      usage_threshold: 0,
      tournaments_count: normalized.length,
    };
  } catch (e: any) {
    tournamentsError.value = e?.message ?? "Failed to load tournaments";
    tournaments.value = [];
  } finally {
    loadingTournaments.value = false;
  }
}

watch(
  () => [filters.minPlayers ?? "", filters.time, filters.set].join("|"),
  async () => {
    heatLoading.value = true;
    await recomputeTierRows();
    await recomputeHeatmapForTopCut();
    heatLoading.value = false;
  },
);

watch(
  () => filters.topCut,
  async () => {
    heatLoading.value = true;
    await recomputeTierRows();
    await recomputeHeatmapForTopCut();
    heatLoading.value = false;
  },
);

watch(
  () => matrixOptionRows.value.map((row) => row.deck).join("|"),
  () => {
    if (matrixExtraDeck.value && !matrixOptionRows.value.some((row) => row.deck === matrixExtraDeck.value)) {
      matrixExtraDeck.value = "";
    }
  },
);

watch(
  () => matrixExtraDeck.value,
  async () => {
    heatLoading.value = true;
    await recomputeHeatmapForTopCut();
    heatLoading.value = false;
  },
);

onMounted(async () => {
  await loadTournaments();
  heatLoading.value = true;
  await recomputeTierRows();
  await recomputeHeatmapForTopCut();
  heatLoading.value = false;
});
</script>

<style scoped>
.tierlist-page {
  color: #e7edf6;
  padding: 24px;
  width: 100%;
}

.tierlist-header {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 18px;
}

.page-title {
  margin: 0;
  font-size: 2rem;
  line-height: 1.1;
  font-weight: 800;
  color: #f5f8fc;
}

.page-subtitle {
  margin: 10px 0 0;
  color: #8fb0d8;
  font-size: 1.05rem;
  font-weight: 600;
}

.page-error {
  margin: 10px 0 0;
  color: #ff9ea8;
  font-size: 0.95rem;
}

.mono {
  font-variant-numeric: tabular-nums;
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    "Courier New",
    monospace;
}

.subtle {
  color: #9fb3cf;
  font-size: 0.92rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.f {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.38);
  padding: 12px;
}

.f label {
  display: block;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.88);
  margin-bottom: 6px;
}

.f input,
.f select {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(2, 6, 23, 0.35);
  color: rgba(255, 255, 255, 0.92);
  padding: 8px 10px;
  outline: none;
}

.hint {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.65);
}

.tierlist-top-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: stretch;
}

@media (max-width: 1080px) {
  .tierlist-top-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.usage-card,
.tier-table-card,
.heatmap-card {
  border: 1px solid rgba(90, 130, 180, 0.24);
  background: linear-gradient(180deg, rgba(16, 34, 60, 0.92), rgba(9, 20, 35, 0.96));
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  padding: 16px;
}

.section-title {
  margin: 0;
  font-size: 1.16rem;
  font-weight: 900;
  color: #f5f8fc;
  letter-spacing: 0.01em;
}

.usage-title-row,
.heatmap-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.usage-card {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto;
  gap: 12px;
}

.usage-subtitle {
  margin: 6px 0 0;
  color: #9fb3cf;
  font-size: 0.92rem;
}

.usage-list {
  display: grid;
  gap: 10px;
  align-content: start;
}

.usage-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1.35fr) auto minmax(260px, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(90, 130, 180, 0.18);
  background: linear-gradient(180deg, rgba(10, 23, 40, 0.88), rgba(8, 18, 31, 0.96));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.usage-row--other {
  position: relative;
  margin-top: 16px;
}

.usage-row--other::before {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  top: -9px;
  height: 1px;
  background: linear-gradient(90deg, rgba(120, 165, 215, 0), rgba(120, 165, 215, 0.55), rgba(120, 165, 215, 0));
}

.usage-row__rank {
  min-width: 28px;
  color: #9fb3cf;
  font-weight: 800;
  font-size: 0.95rem;
}

.usage-row__identity {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.usage-row__identity--static {
  cursor: default;
}

.usage-row__identity:hover {
  text-decoration: none;
}

.usage-row__identity:hover .usage-row__name {
  color: #8cc4ff;
}

.usage-row__spritepair {
  flex: 0 0 auto;
  min-width: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
}

.usage-row__spritepair--single {
  min-width: 38px;
}

.usage-row__sprite {
  width: 34px;
  height: 34px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.28));
}

.usage-row__sprite + .usage-row__sprite {
  margin-left: -7px;
}

.usage-row__fallback {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(18, 36, 58, 0.96);
  border: 1px solid rgba(111, 156, 212, 0.18);
  color: #eef4fb;
  font-size: 0.8rem;
  font-weight: 800;
}

.usage-row__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.usage-row__name {
  min-width: 0;
  color: #eef4fb;
  font-size: 1rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.usage-row__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: #9fb3cf;
  font-size: 0.78rem;
}

.usage-row__tier {
  padding: 3px 8px;
  border-radius: 999px;
  color: #f8fbff;
  font-weight: 900;
  letter-spacing: 0.04em;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.usage-row__samples {
  color: #8fa4c0;
}

.usage-row__pct {
  min-width: 58px;
  text-align: right;
  color: #eef4fb;
  font-size: 0.96rem;
  font-weight: 900;
}

.usage-row__bar {
  min-width: 0;
}

.usage-row__barTrack {
  width: 100%;
  height: 18px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(111, 156, 212, 0.14);
  border: 1px solid rgba(111, 156, 212, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.usage-row__barFill {
  height: 100%;
  min-width: 12px;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(96, 166, 255, 0.98), rgba(63, 117, 218, 0.96));
  box-shadow: 0 0 18px rgba(61, 124, 230, 0.22);
}

@media (max-width: 1080px) {
  .usage-card {
    min-height: auto;
  }
}

@media (max-width: 760px) {
  .usage-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .usage-row__bar {
    grid-column: 2 / -1;
  }
}

@media (max-width: 520px) {
  .usage-row {
    gap: 10px;
    padding: 10px;
  }

  .usage-row__name {
    font-size: 0.92rem;
  }

  .usage-row__pct {
    min-width: 52px;
    font-size: 0.88rem;
  }
}

.tier-table-card {
  position: relative;
  justify-self: center;
  align-self: stretch;
  width: auto;
  height: 100%;
  max-width: min(100%, 420px);
  aspect-ratio: 1 / 2;
  min-height: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
  overflow: hidden;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(112, 131, 160, 0.22);
  background:
    radial-gradient(circle at 100% 0%, rgba(255, 194, 104, 0.08), transparent 32%),
    linear-gradient(180deg, rgba(12, 22, 36, 0.98), rgba(8, 14, 24, 0.99));
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.tier-table-card::before {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  top: 58px;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 206, 101, 0.5), rgba(255, 206, 101, 0));
  pointer-events: none;
}

.tier-table-card::after {
  content: "TL-01";
  position: absolute;
  top: 14px;
  right: 14px;
  font-family:
    "Rajdhani",
    "Orbitron",
    "Eurostile",
    "Bank Gothic",
    "Segoe UI",
    sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(255, 214, 112, 0.52);
  pointer-events: none;
}

.tier-table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-right: 44px;
}

.tier-table-title {
  margin: 0;
  font-family:
    "Orbitron",
    "Rajdhani",
    "Eurostile",
    "Bank Gothic",
    "Segoe UI",
    sans-serif;
  font-size: 0.98rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #edf4ff;
}

.tier-table-meta {
  color: #8fa4c0;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
}

.tier-lanes {
  display: grid;
  gap: 8px;
  align-content: start;
  margin-top: 2px;
}

.tier-lane {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
}

@media (max-width: 560px) {
  .tier-lane {
    grid-template-columns: 74px minmax(0, 1fr);
    gap: 8px;
  }
}

.tier-lane__badge {
  position: relative;
  min-height: 82px;
  border-radius: 16px 18px 16px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  isolation: isolate;
  clip-path: polygon(0 12px, 12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(46, 55, 68, 0.96);
  background-repeat: no-repeat;
  background-size: cover;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 8px 18px rgba(0, 0, 0, 0.18);
}

.tier-lane__badge::before,
.tier-lane__badge::after {
  position: absolute;
  pointer-events: none;
  z-index: 0;
}

.tier-lane__badge::before {
  content: "";
  inset: 0;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 42%),
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0 1px, transparent 1px 6px);
  opacity: 0.72;
}

.tier-lane__badge::after {
  content: "";
  right: 8px;
  top: 8px;
  width: 16px;
  height: 2px;
  background: rgba(255, 255, 255, 0.28);
  box-shadow: 0 6px 0 rgba(255, 255, 255, 0.18);
  opacity: 0.72;
}

.tier-lane__badge-text {
  position: relative;
  z-index: 1;
  font-family:
    "Orbitron",
    "Rajdhani",
    "Eurostile",
    "Bank Gothic",
    "Segoe UI",
    sans-serif;
  font-size: 2.08rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.04em;
  color: #eef4fc;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
}

.tier-lane__badge--sss,
.tier-lane__badge--ss,
.tier-lane__badge--s {
  border-color: rgba(226, 164, 98, 0.24);
}

.tier-lane__badge--sss::before {
  background:
    radial-gradient(circle at 22% 22%, rgba(255, 233, 152, 0.18), transparent 18%),
    linear-gradient(135deg, rgba(255, 240, 180, 0.12), transparent 44%),
    repeating-linear-gradient(180deg, rgba(255, 243, 196, 0.04) 0 1px, transparent 1px 6px);
}

.tier-lane__badge-text--sss {
  font-size: 1.9rem;
  letter-spacing: 0.08em;
  background: linear-gradient(180deg, #fff5b4 0%, #ffd95e 38%, #d69a20 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  filter: drop-shadow(0 0 12px rgba(255, 210, 84, 0.16));
}

.tier-lane__badge--ss::after {
  content: "//";
  top: 8px;
  right: 8px;
  width: auto;
  height: auto;
  background: none;
  box-shadow: none;
  font-family:
    "Orbitron",
    "Rajdhani",
    sans-serif;
  font-size: 0.72rem;
  line-height: 1;
  font-weight: 900;
  color: rgba(255, 216, 92, 0.82);
  opacity: 1;
}

.tier-lane__badge-text--ss {
  font-size: 1.92rem;
  letter-spacing: 0.08em;
  color: #ffd85a;
  text-shadow:
    0 0 12px rgba(255, 213, 93, 0.12),
    0 1px 0 rgba(0, 0, 0, 0.4);
}

.tier-lane__badge-text--s {
  font-size: 1.96rem;
  color: #f7f2de;
  letter-spacing: 0.08em;
}

.tier-lane__deckbar {
  min-height: 82px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-flow: row;
  align-content: start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 18px;
  border: 1px solid rgba(102, 122, 151, 0.16);
  background: linear-gradient(180deg, rgba(28, 42, 66, 0.78), rgba(13, 20, 32, 0.9));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 8px 16px rgba(0, 0, 0, 0.14);
}

.tier-lane--sss .tier-lane__deckbar,
.tier-lane--ss .tier-lane__deckbar,
.tier-lane--s .tier-lane__deckbar {
  border-color: rgba(226, 164, 98, 0.18);
  background: linear-gradient(180deg, rgba(38, 50, 73, 0.8), rgba(15, 21, 31, 0.92));
}

.tier-lane__decklink {
  display: block;
  width: 100%;
  min-width: 0;
  text-decoration: none;
}

.tier-lane__deckbar > .tier-lane__decklink:only-child,
.tier-lane__deckbar > .tier-lane__decklink:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

.tier-lane__spritepair {
  width: 100%;
  min-width: 0;
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 9px 14px;
  border-radius: 16px;
  border: 1px solid rgba(115, 134, 162, 0.14);
  background: linear-gradient(180deg, rgba(10, 18, 30, 0.75), rgba(7, 13, 22, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition:
    transform 0.16s ease,
    border-color 0.16s ease,
    background 0.16s ease;
}

.tier-lane__decklink:hover .tier-lane__spritepair {
  transform: translateY(-1px);
  border-color: rgba(255, 204, 96, 0.24);
  background: linear-gradient(180deg, rgba(16, 28, 45, 0.84), rgba(8, 15, 26, 0.96));
}

.tier-lane__spritepair--single {
  min-width: 0;
}

.tier-lane__sprite {
  width: 48px;
  height: 44px;
  object-fit: contain;
  image-rendering: auto;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
  border-radius: 0;
}

.tier-lane__fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 30px;
  padding: 0 8px;
  border-radius: 10px;
  color: #dbe7f5;
  font-weight: 800;
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.08);
}

.tier-empty {
  padding-top: 4px;
  color: #97adc8;
}

@media (max-width: 1080px) {
  .tier-table-card {
    justify-self: stretch;
    width: 100%;
    height: auto;
    max-width: 420px;
    margin: 0 auto;
    aspect-ratio: auto;
    min-height: auto;
  }
}

.heatmap-card {
  margin-top: 16px;
}

.heatmap-shell {
  width: 100%;
}

.heatmap-mobile {
  display: none;
}

.heatmap-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

.heatmap-corner {
  width: 148px;
  background: rgba(13, 28, 50, 0.98);
  border-right: 1px solid rgba(97, 134, 179, 0.16);
  border-bottom: 1px solid rgba(97, 134, 179, 0.16);
}

.heatmap-col-label {
  width: calc((100% - 148px) / 11);
  padding: 8px 6px 10px;
  text-align: center;
  background: rgba(13, 28, 50, 0.98);
  border-bottom: 1px solid rgba(97, 134, 179, 0.16);
  vertical-align: bottom;
}

.heatmap-row-label {
  width: 148px;
  padding: 8px;
  text-align: center;
  background: rgba(13, 28, 50, 0.98);
  border-right: 1px solid rgba(97, 134, 179, 0.16);
  vertical-align: middle;
}

.heatmap-label-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
}

.heatmap-axis-chip {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  border-radius: 16px;
  border: 1px solid rgba(92, 130, 176, 0.22);
  background: rgba(255, 255, 255, 0.04);
  transition:
    background-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.heatmap-axis-chip--row {
  justify-content: center;
}

.heatmap-axis-chip--picker {
  justify-content: center;
  flex-direction: column;
  gap: 8px;
}

.heatmap-label-link:hover .heatmap-axis-chip {
  background: rgba(110, 175, 255, 0.12);
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
}

.heatmap-sprite-stack,
.heatmap-row-sprite-stack {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.heatmap-row-sprite-stack {
  justify-content: flex-end;
}

.heatmap-sprite {
  width: 30px;
  height: 30px;
  object-fit: contain;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5));
  border-radius: 0;
}

.heatmap-sprite--picker {
  width: 34px;
  height: 34px;
}

.heatmap-sprite--mobile {
  width: 28px;
  height: 28px;
}

.heatmap-cell {
  padding: 6px;
  background: rgba(9, 22, 40, 0.55);
  border-right: 1px solid rgba(97, 134, 179, 0.08);
  border-bottom: 1px solid rgba(97, 134, 179, 0.08);
}

.heatmap-cell__inner {
  width: 100%;
  min-width: 0;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px solid transparent;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    background-color 0.12s ease;
}

.heatmap-cell__inner:hover {
  transform: translateY(-1px);
}

.heatmap-cell__inner--empty {
  color: rgba(199, 215, 235, 0.55);
  background: rgba(13, 28, 50, 0.62);
  border-color: rgba(97, 134, 179, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
}

.heatmap-cell__text {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.heatmap-cell__copy {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  line-height: 1;
}

.heatmap-cell__rate {
  font-size: 1.02rem;
  font-weight: 900;
}

.heatmap-cell__record {
  max-width: 100%;
  font-size: 0.8rem;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}

.heatmap-picker-cell {
  min-height: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 8px;
  border-radius: 16px;
  border: 1px solid rgba(92, 130, 176, 0.22);
  background: rgba(255, 255, 255, 0.04);
}

.heatmap-picker-cell--empty {
  background: rgba(255, 255, 255, 0.025);
}

.heatmap-picker-label {
  display: block;
  max-width: 100%;
  color: #d7e4f3;
  font-size: 0.8rem;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.heatmap-picker-row-label {
  color: #d7e4f3;
  max-width: 100%;
  font-size: 0.82rem;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matrix-picker-panel {
  margin-bottom: 16px;
  display: grid;
  gap: 8px;
}

.matrix-picker-panel__label {
  color: #8fb0d8;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.matrix-picker {
  position: relative;
}

.matrix-picker__trigger {
  list-style: none;
  cursor: pointer;
  border-radius: 16px;
  border: 1px solid rgba(97, 145, 196, 0.24);
  background: rgba(10, 23, 40, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.matrix-picker__trigger::-webkit-details-marker {
  display: none;
}

.matrix-picker__trigger-copy {
  min-height: 62px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.matrix-picker__placeholder {
  color: #8fa4c0;
  font-size: 0.82rem;
  white-space: nowrap;
}

.matrix-picker__trigger-text {
  min-width: 0;
  color: #eef4fb;
  font-size: 0.95rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matrix-picker__menu {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  z-index: 12;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(97, 145, 196, 0.26);
  background:
    linear-gradient(180deg, rgba(14, 28, 48, 0.98), rgba(8, 18, 31, 0.99)),
    rgba(8, 18, 31, 0.99);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.34);
  max-height: min(48vh, 380px);
  overflow: auto;
  scrollbar-width: none;
}

.matrix-picker__menu::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.matrix-picker__option {
  border: 1px solid rgba(97, 145, 196, 0.18);
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  color: #eef4fb;
  min-height: 56px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.14s ease,
    background-color 0.14s ease,
    border-color 0.14s ease;
}

.matrix-picker__option:hover {
  transform: translateY(-1px);
  border-color: rgba(126, 190, 255, 0.34);
  background: rgba(126, 190, 255, 0.08);
}

.matrix-picker__option--active {
  border-color: rgba(126, 190, 255, 0.52);
  background: rgba(126, 190, 255, 0.14);
}

.matrix-picker__option--clear {
  justify-content: center;
}

.matrix-picker__option-copy {
  min-width: 0;
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .tierlist-page {
    padding: 16px;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .tier-lane__badge {
    min-height: 64px;
  }

  .tier-lane__deckbar {
    min-height: 64px;
    padding: 8px 9px;
    gap: 7px;
  }

  .tier-lane__badge-text {
    font-size: 1.76rem;
  }

  .tier-lane__badge-text--ss {
    font-size: 1.62rem;
  }

  .tier-lane__badge-text--sss {
    font-size: 1.24rem;
  }

  .tier-lane__badge-text--s {
    font-size: 1.68rem;
  }

  .tier-lane__spritepair {
    min-height: 44px;
    padding: 8px 10px;
    gap: 8px;
  }

  .tier-lane__sprite {
    width: 24px;
    height: 24px;
  }

  .matrix-picker__trigger-copy {
    min-height: 56px;
    padding: 10px 12px;
  }
}

@media (max-width: 760px) {
  .heatmap-shell {
    display: none;
  }

  .heatmap-mobile {
    display: grid;
    gap: 16px;
  }

  .heatmap-mobile__section {
    display: grid;
    gap: 10px;
  }

  .heatmap-mobile__header {
    display: flex;
  }

  .heatmap-mobile__deck {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(92, 130, 176, 0.22);
    background: rgba(13, 28, 50, 0.72);
  }

  .heatmap-mobile__deck-name {
    min-width: 0;
    font-size: 1rem;
    font-weight: 800;
    color: #eef4fb;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .heatmap-mobile__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .heatmap-mobile__cellInner {
    min-height: 118px;
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 6px;
    padding: 10px 8px;
    border-radius: 14px;
    border: 1px solid transparent;
  }

  .heatmap-mobile__versus {
    color: currentColor;
    font-size: 0.8rem;
    opacity: 0.9;
  }

  .heatmap-mobile__opponent {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .heatmap-mobile__rate {
    font-size: 1rem;
    font-weight: 900;
    line-height: 1;
  }

  .heatmap-mobile__record {
    font-size: 0.84rem;
    line-height: 1;
    white-space: nowrap;
  }

  .heatmap-mobile__empty {
    padding: 14px;
    text-align: center;
    border-radius: 14px;
    border: 1px dashed rgba(111, 156, 212, 0.22);
    color: #a7bdd9;
    background: rgba(13, 28, 50, 0.52);
  }

  .matrix-picker__menu {
    position: static;
    margin-top: 10px;
    max-height: none;
    overflow: visible;
  }
}
</style>
