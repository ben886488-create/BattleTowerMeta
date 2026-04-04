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

      <div class="filters-grid">
        <label class="filter-card">
          <span class="filter-label">Set</span>
          <select v-model="filters.set" class="filter-select">
            <option v-for="o in setOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </label>

        <label class="filter-card">
          <span class="filter-label">Top Cut</span>
          <select v-model="filters.topCut" class="filter-select">
            <option v-for="o in topCutOptions" :key="o.value" :value="o.value">
              {{ o.label }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <div class="tierlist-top-grid">
      <div class="pie-card">
        <div class="pie-title-row">
          <h2 class="section-title">Top 15 Tier Distribution</h2>
          <span class="mono subtle">{{ topDeckRows.length }}/15</span>
        </div>

        <div class="pie-row">
          <div class="pie-wrap">
            <div class="pie" :style="{ backgroundImage: pieConicGradient }" aria-hidden="true"></div>
            <div class="pie-center mono">
              <div class="pie-center__top">{{ pieCenterText }}</div>
              <div class="pie-center__bottom">Decks</div>
            </div>
          </div>

          <div class="pie-legend">
            <div v-for="seg in pieLegendSegments" :key="seg.tier" class="pie-legend-item">
              <span class="pie-swatch" :style="{ backgroundColor: tierColor(seg.tier) }"></span>
              <span class="mono">{{ seg.tier }}</span>
              <span class="mono subtle">{{ seg.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="tier-table-card">
        <div class="tier-table-head">
          <h2 class="section-title tier-table-title">Tier List</h2>
          <span class="mono tier-table-meta">{{ topDeckRows.length }}/15</span>
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
        <h2 class="section-title">Win Rate Matrix</h2>
        <span class="mono subtle">
          <template v-if="heatLoading">Loading matchups…</template>
          <template v-else>{{ topDeckRows.length }} × {{ topDeckRows.length }}</template>
        </span>
      </div>

      <div class="heatmap-scroll" v-if="topDeckRows.length > 0">
        <table class="heatmap-table" aria-label="Win rate matrix">
          <thead>
            <tr>
              <th class="heatmap-corner"></th>

              <th v-for="c in topDeckRows" :key="c.deck" class="heatmap-col-label">
                <RouterLink :to="deckProfileTo(c.deck)" class="heatmap-label-link" :title="c.deck">
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
            <tr v-for="(r, i) in topDeckRows" :key="r.deck">
              <th class="heatmap-row-label">
                <RouterLink :to="deckProfileTo(r.deck)" class="heatmap-label-link" :title="r.deck">
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

              <td v-for="(c, j) in topDeckRows" :key="`${r.deck}__${c.deck}`" class="heatmap-cell">
                <div
                  v-if="heatCells[i]?.[j]?.winrate != null"
                  class="heatmap-cell__inner"
                  :style="heatCells[i][j].style"
                  :title="heatCells[i][j].tooltip"
                >
                  <span class="heatmap-cell__text mono">{{ heatCells[i][j].text }}</span>
                </div>

                <div v-else class="heatmap-cell__inner heatmap-cell__inner--empty">—</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="tier-empty mono">
        {{ heatLoading ? "Loading…" : locale === "en" ? "No matchup data" : "沒有對戰資料" }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import deckIconsManifest from "../assets/deck-icons/manifest.json";

const BASE_URL = (import.meta as any).env?.BASE_URL ?? "/";

type TierRow = {
  deck: string;
  tier: string;
  score: number;
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
};

type NormalizedTournament = TournamentListItem & {
  startMs: number;
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
const PRESET_CURRENT_7 = "__current_7__";
const PRESET_CURRENT_14 = "__current_14__";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status})`);
  return (await response.json()) as T;
}

function utcMs(year: number, month: number, day: number) {
  return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
}

type SetFilterValue = "" | typeof PRESET_CURRENT_7 | typeof PRESET_CURRENT_14 | string;
type TopCutValue = "all" | "64" | "32" | "16" | "8" | "4" | "2" | "1";

const filters = reactive<{ set: SetFilterValue; topCut: TopCutValue }>({
  set: PRESET_CURRENT_14,
  topCut: "all",
});

const setOptions = computed(() => {
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
  return [...tierRows.value].sort((a, b) => b.score - a.score).slice(0, 15);
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

const TIER_PIE_ORDER = ["SSS", "SS", "S", "A", "B", "C", "D", "E", "F"] as const;
const TIER_LIST_ORDER = TIER_PIE_ORDER;

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

const pieTierCounts = computed<Record<string, number>>(() => {
  const out: Record<string, number> = {};
  for (const row of topDeckRows.value) {
    const key = String(row.tier ?? "").toUpperCase();
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
});

const pieLegendSegments = computed(() => {
  return TIER_PIE_ORDER.filter((t) => (pieTierCounts.value[t] ?? 0) > 0).map((t) => ({
    tier: t,
    count: pieTierCounts.value[t] ?? 0,
  }));
});

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

const matchupMap = ref<Map<string, MatchupRecord>>(new Map());
const heatLoading = ref(true);

type HeatCell = {
  winrate: number | null;
  total: number | null;
  wins: number | null;
  text: string;
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
  const decks = topDeckRows.value;
  const map = matchupMap.value;

  return decks.map((rowDeck) => {
    return decks.map((colDeck) => {
      const rowKey = rowDeck.deck;
      const colKey = colDeck.deck;

      if (rowKey === colKey) {
        return {
          winrate: null,
          total: null,
          wins: null,
          text: "—",
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
          text: `${(wr * 100).toFixed(1)}%`,
          style: heatCellStyle(wr),
          tooltip: `${rowDeck.deck} vs ${colDeck.deck}\n${direct.winsA} / ${direct.total} winrate: ${(wr * 100).toFixed(2)}%`,
        };
      }

      return {
        winrate: null,
        total: null,
        wins: null,
        text: "—",
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
const standingsLoading = reactive<Record<string, boolean>>({});
const pairingsLoading = reactive<Record<string, boolean>>({});

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

function hasStandings(id: string) {
  return Object.prototype.hasOwnProperty.call(standingsCache, id);
}

function hasPairings(id: string) {
  return Object.prototype.hasOwnProperty.call(pairingsCache, id);
}

function startOfUtcDayMs(ms: number) {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
}

function parseMs(value: unknown): number {
  const ms = Date.parse(String(value ?? ""));
  return Number.isFinite(ms) ? ms : NaN;
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

function filteredTournamentIds() {
  const ids = tournaments.value.map((t) => t.id);
  if (filters.set === "") return ids;

  if (filters.set === PRESET_CURRENT_7 || filters.set === PRESET_CURRENT_14) {
    const current = currentVersionWindow.value;
    if (!current) return [];

    const days = filters.set === PRESET_CURRENT_7 ? 7 : 14;
    const todayUtcStart = startOfUtcDayMs(Date.now());
    const rollingStartMs = todayUtcStart - (days - 1) * DAY_MS;
    const effectiveStartMs = Math.max(rollingStartMs, current.startMs);

    return tournaments.value
      .filter((t) => t.startMs >= effectiveStartMs && t.startMs < current.endMs)
      .map((t) => t.id);
  }

  return tournaments.value.filter((t) => t.set === filters.set).map((t) => t.id);
}

async function recomputeTierRows() {
  const token = ++recomputeToken.tier;
  const ids = filteredTournamentIds();

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
  const keys = topDeckRows.value.map((r) => r.deck);
  const keySet = new Set(keys);

  if (!keys.length) {
    matchupMap.value = new Map();
    return;
  }

  const ids = filteredTournamentIds();
  await ensureTournamentDataForIds(ids);

  const pairMap = new Map<string, { games: number; matchPoints: number }>();

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
        const rec = pairMap.get(key) ?? { games: 0, matchPoints: 0 };
        rec.games += 1;
        if (p1Won) rec.matchPoints += 1;
        else if (isTie) rec.matchPoints += 0.5;
        pairMap.set(key, rec);
      }

      if (keySet.has(deck2) && keySet.has(deck1) && qualifiesByTopCut(place2, filters.topCut)) {
        const key = `${deck2}__${deck1}`;
        const rec = pairMap.get(key) ?? { games: 0, matchPoints: 0 };
        rec.games += 1;
        if (p2Won) rec.matchPoints += 1;
        else if (isTie) rec.matchPoints += 0.5;
        pairMap.set(key, rec);
      }
    }
  }

  if (token !== recomputeToken.heat) return;

  const map = new Map<string, MatchupRecord>();
  for (const [key, value] of pairMap.entries()) {
    const total = value.games;
    const winrateA = total > 0 ? value.matchPoints / total : 0;

    const parts = key.split("__");
    const deckA = parts[0] ?? "";
    const deckB = parts[1] ?? "";

    if (!deckA || !deckB) continue;

    map.set(key, {
      deckA,
      deckB,
      winsA: value.matchPoints,
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
            return { ...r, startMs };
          })
          .filter((r): r is NormalizedTournament => r !== null)
          .sort((a, b) => b.startMs - a.startMs)
      : [];

    tournaments.value = normalized;
    meta.value = {
      generated_at: new Date().toISOString(),
      days_back: filters.set === PRESET_CURRENT_7 ? 7 : 14,
      min_players: 0,
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
  () => filters.set,
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

.filters-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.7fr);
  gap: 16px;
}

.filter-card {
  padding: 14px;
  border: 1px solid rgba(90, 130, 180, 0.24);
  background: linear-gradient(180deg, rgba(16, 34, 60, 0.92), rgba(9, 20, 35, 0.96));
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
}

.filter-label {
  display: block;
  margin-bottom: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #c6d6ea;
}

.filter-select {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(104, 146, 196, 0.34);
  background: rgba(8, 22, 40, 0.95);
  color: #eef4fb;
  padding: 12px 14px;
  font-size: 1rem;
  outline: none;
}

.filter-select:focus {
  border-color: rgba(115, 180, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(80, 150, 255, 0.14);
}

.tierlist-top-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(320px, 370px);
  gap: 16px;
  align-items: start;
}

@media (max-width: 1080px) {
  .tierlist-top-grid {
    grid-template-columns: 1fr;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }
}

.pie-card,
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

.pie-title-row,
.heatmap-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.pie-row {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 16px;
  align-items: center;
}

@media (max-width: 620px) {
  .pie-row {
    grid-template-columns: 1fr;
  }
}

.pie-wrap {
  position: relative;
  width: 190px;
  height: 190px;
  display: grid;
  place-items: center;
}

.pie {
  width: 190px;
  height: 190px;
  border-radius: 50%;
  filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.25));
}

.pie-center {
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: rgba(8, 22, 40, 0.94);
  border: 1px solid rgba(104, 146, 196, 0.22);
  display: grid;
  place-items: center;
  padding: 10px;
}

.pie-center__top {
  font-weight: 950;
  font-size: 1.4rem;
  color: #ffffff;
  letter-spacing: 0.06em;
}

.pie-center__bottom {
  margin-top: 4px;
  font-size: 0.82rem;
  color: #a9c7ea;
}

.pie-legend {
  display: grid;
  gap: 10px;
}

.pie-legend-item {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  gap: 10px;
  align-items: center;
}

.pie-swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.tier-table-card {
  position: relative;
  justify-self: end;
  width: 100%;
  max-width: 370px;
  aspect-ratio: 1 / 2;
  min-height: 720px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 10px;
  overflow: hidden;
  padding: 14px;
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
  left: 14px;
  right: 14px;
  top: 54px;
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
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 10px;
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
  min-height: 72px;
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
  min-height: 72px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-flow: row;
  align-content: start;
  gap: 8px;
  padding: 8px 10px;
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
  min-height: 48px;
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
  width: 45px;
  height: 40px;
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
    max-width: 420px;
    margin: 0 auto;
    aspect-ratio: auto;
    min-height: auto;
  }
}

.heatmap-card {
  margin-top: 16px;
}

.heatmap-scroll {
  overflow: auto;
  padding-bottom: 4px;
}

.heatmap-table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  min-width: 1280px;
}

.heatmap-corner {
  width: 146px;
  min-width: 146px;
  position: sticky;
  left: 0;
  top: 0;
  z-index: 4;
  background: rgba(13, 28, 50, 0.98);
  border-right: 1px solid rgba(97, 134, 179, 0.16);
  border-bottom: 1px solid rgba(97, 134, 179, 0.16);
}

.heatmap-col-label {
  min-width: 90px;
  padding: 8px 6px;
  text-align: center;
  background: rgba(13, 28, 50, 0.98);
  border-bottom: 1px solid rgba(97, 134, 179, 0.16);
  vertical-align: bottom;
  position: sticky;
  top: 0;
  z-index: 3;
}

.heatmap-row-label {
  width: 146px;
  min-width: 146px;
  padding: 8px;
  text-align: right;
  background: rgba(13, 28, 50, 0.98);
  border-right: 1px solid rgba(97, 134, 179, 0.16);
  vertical-align: middle;
  position: sticky;
  left: 0;
  z-index: 2;
}

.heatmap-label-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
}

.heatmap-axis-chip {
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  border-radius: 18px;
  border: 1px solid rgba(92, 130, 176, 0.22);
  background: rgba(255, 255, 255, 0.04);
  transition:
    background-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.heatmap-axis-chip--row {
  justify-content: flex-end;
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
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5));
  border-radius: 0;
}

.heatmap-cell {
  min-width: 90px;
  padding: 4px;
  background: rgba(9, 22, 40, 0.55);
  border-right: 1px solid rgba(97, 134, 179, 0.08);
  border-bottom: 1px solid rgba(97, 134, 179, 0.08);
}

.heatmap-cell__inner {
  width: 100%;
  min-width: 80px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
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
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

@media (max-width: 640px) {
  .tierlist-page {
    padding: 16px;
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

  .heatmap-sprite {
    width: 24px;
    height: 24px;
  }

  .heatmap-cell__inner {
    min-width: 74px;
    height: 52px;
  }

  .heatmap-cell__text {
    font-size: 0.9rem;
  }
}
</style>