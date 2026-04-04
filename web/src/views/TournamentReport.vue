<template>
  <div class="page">
    <div class="backBar">
      <RouterLink :to="listRoute" class="backLink">
        ← {{ ui.back }}
      </RouterLink>
    </div>

    <div v-if="loading" class="stateCard">
      {{ ui.loading }}
    </div>

    <div v-else-if="error" class="stateCard stateCard--error">
      <div class="stateTitle">{{ ui.loadFailed }}</div>
      <div class="stateText mono">{{ error }}</div>
    </div>

    <template v-else>
      <section class="hero">
        <div class="heroTop">
          <div>
            <h1 class="pageTitle">{{ tournamentTitle }}</h1>
            <div class="subline mono">{{ tournamentId }}</div>
          </div>

          <a
            class="standingsBtn"
            :href="externalStandingsUrl"
            target="_blank"
            rel="noreferrer"
          >
            {{ ui.openStandings }}
          </a>
        </div>

        <div class="summaryGrid">
          <div class="summaryItem">
            <div class="summaryLabel">{{ ui.date }}</div>
            <div class="summaryValue mono">{{ displayDate }}</div>
          </div>

          <div class="summaryItem">
            <div class="summaryLabel">{{ ui.players }}</div>
            <div class="summaryValue mono">{{ displayPlayers }}</div>
          </div>

          <div class="summaryItem">
            <div class="summaryLabel">{{ ui.set }}</div>
            <div class="summaryValue mono">{{ displaySet }}</div>
          </div>

          <div class="summaryItem">
            <div class="summaryLabel">{{ ui.format }}</div>
            <div class="summaryValue">{{ displayFormat }}</div>
          </div>

          <div class="summaryItem">
            <div class="summaryLabel">{{ ui.swiss }}</div>
            <div class="summaryValue mono">{{ displaySwiss }}</div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="sectionHead">
          <div>
            <h2 class="sectionTitle">{{ ui.top32Title }}</h2>
            <div class="sectionSub">
              {{ ui.top32Sub(top32.length, standings.length) }}
            </div>
          </div>
        </div>

        <div v-if="top32.length === 0" class="stateCard">
          {{ ui.noTop32 }}
        </div>

        <div v-else class="entries">
          <article
            v-for="row in top32"
            :key="entryKey(row)"
            class="entry"
          >
            <div class="entryHead">
              <div class="entryHead__left">
                <div class="placingBadge">#{{ row.placing }}</div>

                <div>
                  <div class="playerLine">
                    <div class="playerName">{{ playerDisplay(row) }}</div>

                    <img
                      v-if="currentFlagUrl(row)"
                      class="playerFlagImg"
                      :src="currentFlagUrl(row)"
                      :alt="currentCountryCode(row)"
                      :title="currentCountryCode(row)"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div v-if="recordText(row.record)" class="playerRecord mono">
                    {{ recordText(row.record) }}
                  </div>
                </div>
              </div>

              <div class="entryHead__right">
                <div
                  v-if="currentDeckIcons(row).length"
                  class="deckIconsPanel"
                  :class="{ 'deckIconsPanel--single': currentDeckIcons(row).length === 1 }"
                >
                  <div
                    v-for="icon in currentDeckIcons(row)"
                    :key="icon.key"
                    class="deckIconSlot"
                  >
                    <img
                      class="deckIcon"
                      :src="icon.src"
                      :alt="icon.alt"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>

                <div
                  v-else
                  class="deckIconFallback"
                  :title="row.deck?.name || ui.unknownDeck"
                >
                  {{ deckIconShortLabel(row) }}
                </div>
              </div>
            </div>

            <div v-if="allCards(row).length" class="cardsBlock">
              <div class="cardsGrid">
                <div
                  v-for="(card, idx) in allCards(row)"
                  :key="cardKey(card, idx, 'all')"
                  class="cardTile"
                >
                  <div class="cardImageWrap">
                    <img
                      v-if="hasUsableImage(card)"
                      class="cardImage"
                      :src="currentCardImage(card)"
                      :alt="cardAlt(card)"
                      loading="lazy"
                      decoding="async"
                      @error="markCardBroken(card)"
                    />

                    <div v-else class="cardFallback">
                      <div class="cardFallback__name">{{ card.name }}</div>
                      <div class="cardFallback__code mono">
                        {{ card.set }} {{ card.number }}
                      </div>
                    </div>

                    <span class="countBadge">x{{ card.count ?? 1 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";

type TournamentIndexRow = {
  game?: string;
  id: string;
  name?: string;
  date?: string;
  players?: number;
  set?: string | null;
  format?: string | null;
  swiss?: string | null;
  swissRounds?: number | null;
};

type DeckCardRow = {
  count?: number;
  set?: string;
  number?: string | number;
  name?: string;
};

type StandingRow = {
  placing?: number | null;
  player?:
    | string
    | {
        name?: string;
        country?: string | null;
        countryCode?: string | null;
      };
  name?: string;
  country?: string | null;
  countryCode?: string | null;
  playerCountry?: string | null;
  deck?: {
    id?: string;
    name?: string;
    icons?: string[];
  };
  decklist?: {
    pokemon?: DeckCardRow[];
    trainer?: DeckCardRow[];
    trainers?: DeckCardRow[];
  };
  record?: {
    wins?: number;
    losses?: number;
    ties?: number;
  };
  drop?: number | null;
};

type TournamentDetailsPhase = {
  phase?: number;
  type?: string;
  rounds?: number;
  mode?: string;
};

type TournamentDetails = {
  id: string;
  game?: string;
  format?: string | null;
  name?: string;
  date?: string;
  players?: number;
  organizer?: {
    id?: number;
    name?: string;
  };
  decklists?: boolean;
  isPublic?: boolean;
  isOnline?: boolean;
  phases?: TournamentDetailsPhase[];
};

type ResolvedDeckIcon = {
  key: string;
  src: string;
  alt: string;
};

const route = useRoute();
const BASE_URL = import.meta.env.BASE_URL ?? "/";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return (await res.json()) as T;
}

// 卡圖
const rawCardImageModules = import.meta.glob(
  "../assets/limitless_dump/images/**/*.{png,jpg,jpeg,webp,avif}",
  { eager: true, import: "default" }
) as Record<string, string>;

const cardImageMap = new Map<string, string>();

for (const [path, url] of Object.entries(rawCardImageModules)) {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");

  const folder = (parts[parts.length - 2] || "").toUpperCase();
  const file = (parts[parts.length - 1] || "").replace(/\.[^.]+$/, "");
  const base = file.toUpperCase();

  if (!base) continue;

  cardImageMap.set(base, url);

  if (folder) {
    cardImageMap.set(`${folder}/${base}`, url);
  }
}

// 牌組代表 icon
const rawDeckIconModules = import.meta.glob(
  "../assets/deck-icons/**/*.{png,jpg,jpeg,webp,avif,svg}",
  { eager: true, import: "default" }
) as Record<string, string>;

const deckIconMap = new Map<string, string>();

for (const [path, url] of Object.entries(rawDeckIconModules)) {
  const normalized = path.replace(/\\/g, "/");
  const file = (normalized.split("/").pop() || "")
    .replace(/\.[^.]+$/, "")
    .toLowerCase();

  if (file) {
    deckIconMap.set(file, url);
  }
}

const brokenCardImages = reactive<Record<string, true>>({});

const loading = ref(true);
const error = ref("");
const tournament = ref<TournamentIndexRow | null>(null);
const standings = ref<StandingRow[]>([]);
const details = ref<TournamentDetails | null>(null);

const tournamentId = computed(() => String(route.params.id ?? ""));
const lang = computed<"zh" | "en">(() => {
  const seg = String(route.path).split("/")[1];
  return seg === "en" ? "en" : "zh";
});
const isZh = computed(() => lang.value === "zh");

const listRoute = computed(() => `/${lang.value}/tournaments`);
const externalStandingsUrl = computed(
  () => `https://play.limitlesstcg.com/tournament/${tournamentId.value}/standings`
);

const ui = computed(() => {
  if (isZh.value) {
    return {
      back: "返回比賽列表",
      loading: "載入中…",
      loadFailed: "載入失敗",
      openStandings: "排位",
      date: "日期",
      players: "人數",
      set: "版本",
      format: "賽制",
      swiss: "瑞士輪",
      top32Title: "前 32 名牌表",
      top32Sub: (n: number, total: number) =>
        `顯示前 ${n} 名（standings 共 ${total} 筆）`,
      noTop32: "這個比賽沒有可顯示的前 32 名牌表。",
      unknownDeck: "未知牌組",
      unknownPlayer: "未知玩家",
    };
  }

  return {
    back: "Back to tournaments",
    loading: "Loading…",
    loadFailed: "Failed to load",
    openStandings: "Standings",
    date: "Date",
    players: "Players",
    set: "Set",
    format: "Format",
    swiss: "Swiss",
    top32Title: "Top 32 decklists",
    top32Sub: (n: number, total: number) =>
      `Showing top ${n} decklists (${total} standings rows total)`,
    noTop32: "No Top 32 decklists available for this event.",
    unknownDeck: "Unknown deck",
    unknownPlayer: "Unknown player",
  };
});

function normalizeSetCode(set?: string) {
  return String(set ?? "").trim().toUpperCase();
}

function normalizeCardNumber(num?: string | number) {
  const raw = String(num ?? "").trim().toUpperCase();
  if (!raw) return "";

  if (/^\d+$/.test(raw)) return raw.padStart(3, "0");
  return raw;
}

function buildCardFileBase(card: DeckCardRow) {
  const set = normalizeSetCode(card.set);
  const num = normalizeCardNumber(card.number);

  if (!set || !num) return "";
  return `${set}_${num}_EN_SM`;
}

function cardBaseKey(card: DeckCardRow) {
  const set = normalizeSetCode(card.set);
  const num = normalizeCardNumber(card.number);
  const name = String(card.name ?? "").trim();
  return `${set}-${num}-${name}`;
}

function resolveCardImage(card: DeckCardRow) {
  const set = normalizeSetCode(card.set);
  const base = buildCardFileBase(card);

  if (!set || !base) return "";

  const direct = cardImageMap.get(`${set}/${base}`);
  if (direct) return direct;

  const fallback = cardImageMap.get(base);
  if (fallback) return fallback;

  return "";
}

function markCardBroken(card: DeckCardRow) {
  brokenCardImages[cardBaseKey(card)] = true;
}

function hasUsableImage(card: DeckCardRow) {
  return !!resolveCardImage(card) && !brokenCardImages[cardBaseKey(card)];
}

function currentCardImage(card: DeckCardRow) {
  return resolveCardImage(card);
}

function normalizeDeckIconKey(value?: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DECK_FORM_TOKEN_RE =
  /^(ex|gx|vmax|vstar|v-union|v|break|star|prime|radiant|tera)$/i;

const DECK_FORM_SUFFIX_RE =
  /-(ex|gx|vmax|vstar|v-union|v|break|star|prime|radiant|tera)$/i;

function stripDeckFormSuffix(slug: string) {
  return slug.replace(DECK_FORM_SUFFIX_RE, "");
}

function primaryDeckSlugFromId(deckId?: string) {
  const parts = normalizeDeckIconKey(deckId)
    .split("-")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length === 0) return "";

  const picked: string[] = [];

  for (let i = 0; i < parts.length; i += 1) {
    const token = parts[i] ?? "";
    const next = parts[i + 1] ?? "";

    if (!token) continue;

    const isLikelySetToken =
      /^[a-z]\d+[a-z0-9]*$/i.test(token) ||
      (/^[a-z]$/i.test(token) && /^[a-z]$/i.test(next)) ||
      (/^\d+[a-z0-9]*$/i.test(token) && picked.length > 0);

    if (isLikelySetToken) break;

    picked.push(token);

    if (DECK_FORM_TOKEN_RE.test(token)) {
      break;
    }
  }

  return picked.join("-");
}

function primaryDeckSlugFromName(name?: string) {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (words.length === 0) return "";

  const picked: string[] = [];

  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!lower) continue;

    picked.push(lower);

    if (DECK_FORM_TOKEN_RE.test(lower)) {
      break;
    }
  }

  return normalizeDeckIconKey(picked.join("-"));
}

function deckIconVariants(raw?: string) {
  const base = normalizeDeckIconKey(raw);
  if (!base) return [];

  const variants = new Set<string>();

  const add = (value?: string) => {
    const normalized = normalizeDeckIconKey(value);
    if (normalized) variants.add(normalized);
  };

  add(base);

  const stripped = stripDeckFormSuffix(base);
  add(stripped);

  if (base.startsWith("mega-")) add(`${base.slice(5)}-mega`);
  if (stripped.startsWith("mega-")) add(`${stripped.slice(5)}-mega`);

  if (base.endsWith("-mega")) add(`mega-${base.slice(0, -5)}`);
  if (stripped.endsWith("-mega")) add(`mega-${stripped.slice(0, -5)}`);

  return [...variants];
}

function resolveDeckIconBySlug(raw?: string) {
  for (const variant of deckIconVariants(raw)) {
    const hit = deckIconMap.get(variant);
    if (hit) {
      return {
        key: variant,
        src: hit,
      };
    }
  }
  return null;
}

function currentDeckIcons(row: StandingRow): ResolvedDeckIcon[] {
  const out: ResolvedDeckIcon[] = [];
  const seen = new Set<string>();

  const push = (raw?: string, alt?: string) => {
    const resolved = resolveDeckIconBySlug(raw);
    if (!resolved) return;
    if (seen.has(resolved.src)) return;

    seen.add(resolved.src);
    out.push({
      key: resolved.key,
      src: resolved.src,
      alt: alt || row.deck?.name || "Deck icon",
    });
  };

  const iconSlugs = Array.isArray(row.deck?.icons) ? row.deck?.icons : [];
  iconSlugs.forEach((slug) => push(slug, slug));

  if (!out.length) {
    push(primaryDeckSlugFromId(row.deck?.id), row.deck?.name);
  }

  if (out.length < 2) {
    push(primaryDeckSlugFromName(row.deck?.name), row.deck?.name);
  }

  return out.slice(0, 2);
}

function deckIconShortLabel(row: StandingRow) {
  const source = String(row.deck?.name || row.deck?.id || "").trim();
  return source ? source.slice(0, 1).toUpperCase() : "?";
}

const ISO3_TO_2: Record<string, string> = {
  USA: "US",
  CAN: "CA",
  MEX: "MX",
  BRA: "BR",
  ARG: "AR",
  CHL: "CL",
  COL: "CO",
  PER: "PE",
  ECU: "EC",
  VEN: "VE",
  URY: "UY",
  PRY: "PY",
  BOL: "BO",

  GBR: "GB",
  IRL: "IE",
  FRA: "FR",
  DEU: "DE",
  ESP: "ES",
  PRT: "PT",
  ITA: "IT",
  NLD: "NL",
  BEL: "BE",
  LUX: "LU",
  CHE: "CH",
  AUT: "AT",
  POL: "PL",
  CZE: "CZ",
  SVK: "SK",
  HUN: "HU",
  ROU: "RO",
  BGR: "BG",
  GRC: "GR",
  TUR: "TR",
  SWE: "SE",
  NOR: "NO",
  DNK: "DK",
  FIN: "FI",
  ISL: "IS",
  HRV: "HR",
  SVN: "SI",
  SRB: "RS",
  UKR: "UA",
  LTU: "LT",
  LVA: "LV",
  EST: "EE",

  AUS: "AU",
  NZL: "NZ",
  JPN: "JP",
  KOR: "KR",
  TWN: "TW",
  HKG: "HK",
  SGP: "SG",
  MYS: "MY",
  IDN: "ID",
  THA: "TH",
  VNM: "VN",
  PHL: "PH",
  CHN: "CN",
  IND: "IN",

  ARE: "AE",
  SAU: "SA",
  ISR: "IL",
  ZAF: "ZA",
};

const COUNTRY_ALIASES: Record<string, string> = {
  UK: "GB",
  UAE: "AE",
  KSA: "SA",
  TPE: "TW",
  ROC: "TW",
  ROK: "KR",
};

function normalizeCountryCode(raw?: unknown) {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s) return "";

  if (COUNTRY_ALIASES[s]) return COUNTRY_ALIASES[s];
  if (/^[A-Z]{2}$/.test(s)) return s;
  if (/^[A-Z]{3}$/.test(s) && ISO3_TO_2[s]) return ISO3_TO_2[s];

  return "";
}

function inferCountryCodeFromName(value?: string) {
  const s = String(value ?? "").trim();
  if (!s) return "";

  const m = s.match(/\s([A-Z]{2}|[A-Z]{3})$/);
  if (!m) return "";

  return normalizeCountryCode(m[1]);
}

function rowCountryRaw(row: StandingRow) {
  const player = row?.player as any;

  const direct =
    row?.country ??
    row?.countryCode ??
    row?.playerCountry ??
    player?.country ??
    player?.countryCode ??
    "";

  if (String(direct).trim()) return direct;

  const nestedName =
    player && typeof player === "object" && typeof player.name === "string"
      ? player.name
      : "";

  const flatName = typeof row?.name === "string" ? row.name : "";
  const playerString = typeof player === "string" ? player : "";

  return (
    inferCountryCodeFromName(nestedName) ||
    inferCountryCodeFromName(flatName) ||
    inferCountryCodeFromName(playerString) ||
    ""
  );
}

function currentCountryCode(row: StandingRow) {
  return normalizeCountryCode(rowCountryRaw(row));
}

function currentFlagUrl(row: StandingRow) {
  const code = currentCountryCode(row);
  return code ? `https://flagcdn.com/24x18/${code.toLowerCase()}.png` : "";
}

function stripTrailingCountryToken(name?: string) {
  const s = String(name ?? "").trim();
  if (!s) return "";

  return s
    .replace(/\s([A-Z]{2}|[A-Z]{3})$/, (_, token) => {
      return normalizeCountryCode(token) ? "" : ` ${token}`;
    })
    .trim();
}

function playerDisplay(row: StandingRow) {
  const player = row?.player as any;

  const nestedName =
    player && typeof player === "object" && typeof player.name === "string"
      ? player.name.trim()
      : "";

  const flatName = typeof row?.name === "string" ? row.name.trim() : "";
  const playerString = typeof player === "string" ? player.trim() : "";

  return stripTrailingCountryToken(
    nestedName || flatName || playerString || ui.value.unknownPlayer
  );
}

function normalizeFormat(raw?: string | null) {
  if (!raw) return "—";

  const s = String(raw).trim().toUpperCase();

  if (s === "STANDARD") return isZh.value ? "標準" : "Standard";
  if (s === "NOEX" || s === "NO-EX" || s === "NO_EX") return "NoEX";
  if (s === "CUSTOM" || s === "SPECIAL") return isZh.value ? "特殊" : "Special";

  return raw;
}

function formatDate(raw?: string) {
  if (!raw) return "—";

  const s = String(raw).trim();
  const ms = /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? Date.parse(`${s}T00:00:00Z`)
    : Date.parse(s);

  if (!Number.isFinite(ms)) return s;

  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

const swissPhase = computed(() => {
  const phases = Array.isArray(details.value?.phases) ? details.value?.phases : [];
  return phases.find((p) => String(p?.type ?? "").toUpperCase() === "SWISS") ?? null;
});

const displaySwiss = computed(() => {
  const phase = swissPhase.value;
  const mode = String(phase?.mode ?? tournament.value?.swiss ?? "")
    .trim()
    .toUpperCase();
  const rounds = Number(phase?.rounds ?? tournament.value?.swissRounds ?? 0);

  if (mode && Number.isFinite(rounds) && rounds > 0) {
    return isZh.value ? `${mode}・${rounds} 輪` : `${mode} · ${rounds} rounds`;
  }

  if (mode) return mode;

  if (Number.isFinite(rounds) && rounds > 0) {
    return isZh.value ? `${rounds} 輪` : `${rounds} rounds`;
  }

  return "—";
});

const tournamentTitle = computed(
  () => details.value?.name || tournament.value?.name || tournamentId.value || "—"
);

const displayDate = computed(
  () => formatDate(details.value?.date || tournament.value?.date)
);

const displayPlayers = computed(() => {
  const v = details.value?.players ?? tournament.value?.players;
  return v == null ? "—" : String(v);
});

const displaySet = computed(() => tournament.value?.set || "—");

const displayFormat = computed(() =>
  normalizeFormat(details.value?.format ?? tournament.value?.format)
);

function getPlacing(row: StandingRow) {
  const n = Number(row?.placing);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

const top32 = computed(() => {
  return [...standings.value]
    .filter((r) => Number.isFinite(Number(r?.placing)) && Number(r?.placing) > 0)
    .sort((a, b) => getPlacing(a) - getPlacing(b))
    .slice(0, 32);
});

async function loadTournamentPage() {
  if (!tournamentId.value) {
    loading.value = false;
    error.value = "Missing tournament id";
    tournament.value = null;
    standings.value = [];
    details.value = null;
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const [list, rows, detailDoc] = await Promise.all([
      fetchJson<TournamentIndexRow[]>(`${BASE_URL}data/tournaments.json`).catch(
        () => [] as TournamentIndexRow[]
      ),
      fetchJson<StandingRow[]>(`${BASE_URL}data/raw/${tournamentId.value}/standings.json`),
      fetchJson<TournamentDetails>(
        `${BASE_URL}data/raw/${tournamentId.value}/details.json`
      ).catch(() => null),
    ]);

    details.value = detailDoc;

    tournament.value =
      list.find((r) => String(r.id) === tournamentId.value) ?? {
        id: tournamentId.value,
        name: detailDoc?.name || tournamentId.value,
        date: detailDoc?.date,
        players: detailDoc?.players,
        format: detailDoc?.format ?? null,
      };

    standings.value = Array.isArray(rows) ? rows : [];
  } catch (e: any) {
    error.value = e?.message ?? "Unknown error";
    tournament.value = null;
    standings.value = [];
    details.value = null;
  } finally {
    loading.value = false;
  }
}

watch(tournamentId, loadTournamentPage, { immediate: true });

function recordText(record?: StandingRow["record"]) {
  if (!record) return "";

  const w = Number(record.wins ?? 0);
  const l = Number(record.losses ?? 0);
  const t = Number(record.ties ?? 0);

  return `${w}-${l}-${t}`;
}

function pokemonCards(row: StandingRow): DeckCardRow[] {
  return Array.isArray(row.decklist?.pokemon) ? row.decklist.pokemon : [];
}

function trainerCards(row: StandingRow): DeckCardRow[] {
  if (Array.isArray(row.decklist?.trainer)) return row.decklist.trainer;
  if (Array.isArray(row.decklist?.trainers)) return row.decklist.trainers;
  return [];
}

function allCards(row: StandingRow): DeckCardRow[] {
  return [...pokemonCards(row), ...trainerCards(row)];
}

function entryKey(row: StandingRow) {
  const player = row.player;
  const playerKey =
    typeof player === "string"
      ? player
      : player && typeof player === "object"
        ? player.name || row.name || "unknown"
        : row.name || "unknown";

  return `${row.placing ?? "x"}-${row.deck?.id ?? ""}-${playerKey}`;
}

function cardKey(card: DeckCardRow, idx: number, group: string) {
  return `${group}-${card.set}-${card.number}-${card.name}-${idx}`;
}

function cardAlt(card: DeckCardRow) {
  return `${card.name ?? "Card"} (${card.set ?? "?"} ${card.number ?? "?"})`;
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 10px;
  box-sizing: border-box;
}

.backBar {
  margin-bottom: 12px;
}

.backLink {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(147, 197, 253, 0.95);
  text-decoration: none;
  font-weight: 800;
  font-size: 13px;
}

.backLink:hover {
  text-decoration: underline;
}

.hero {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.35);
  padding: 18px;
  margin-bottom: 16px;
}

.heroTop {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.pageTitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.94);
  font-size: 24px;
  font-weight: 900;
  line-height: 1.2;
}

.subline {
  margin-top: 6px;
  color: rgba(226, 232, 240, 0.62);
  font-size: 12px;
}

.summaryGrid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.summaryItem {
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.25);
  padding: 12px;
}

.summaryLabel {
  font-size: 11px;
  font-weight: 800;
  color: rgba(226, 232, 240, 0.68);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summaryValue {
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  font-weight: 800;
}

.standingsBtn {
  padding: 10px 14px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(59, 130, 246, 0.35);
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.18),
    rgba(37, 99, 235, 0.08)
  );
  color: rgba(147, 197, 253, 0.98);
  text-decoration: none;
  font-weight: 800;
  font-size: 13px;
  white-space: nowrap;
}

.standingsBtn:hover {
  text-decoration: none;
  border-color: rgba(59, 130, 246, 0.55);
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.28),
    rgba(37, 99, 235, 0.16)
  );
}

.section {
  margin-top: 8px;
}

.sectionHead {
  margin-bottom: 12px;
}

.sectionTitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.94);
  font-size: 18px;
  font-weight: 900;
}

.sectionSub {
  margin-top: 4px;
  color: rgba(226, 232, 240, 0.68);
  font-size: 12px;
}

.entries {
  display: grid;
  gap: 16px;
}

.entry {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.35);
  overflow: hidden;
}

.entryHead {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(2, 6, 23, 0.18);
}

.entryHead__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.entryHead__right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placingBadge {
  min-width: 56px;
  height: 36px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.18);
  border: 1px solid rgba(59, 130, 246, 0.32);
  color: rgba(191, 219, 254, 0.98);
  font-weight: 900;
  font-size: 14px;
}

.playerLine {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.playerName {
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  font-weight: 900;
  line-height: 1.2;
  min-width: 0;
  overflow-wrap: anywhere;
}

.playerFlagImg {
  width: 20px;
  height: 15px;
  object-fit: cover;
  display: block;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  transform: translateY(1px);
}

.playerRecord {
  margin-top: 6px;
  color: rgba(226, 232, 240, 0.9);
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.deckIconsPanel {
  min-width: 128px;
  height: 84px;
  padding: 8px 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(2, 6, 23, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  overflow: hidden;
}

.deckIconsPanel--single {
  min-width: 84px;
}

.deckIconSlot {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.deckIconSlot + .deckIconSlot {
  margin-left: -6px;
}

.deckIcon {
  width: 54px;
  height: 54px;
  object-fit: contain;
  display: block;
  image-rendering: pixelated;
}

.deckIconFallback {
  width: 84px;
  height: 84px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(2, 6, 23, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.92);
  font-size: 22px;
  font-weight: 900;
}

.cardsBlock {
  padding: 16px;
}

.cardsGrid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.cardTile {
  min-width: 0;
}

.cardImageWrap {
  position: relative;
  aspect-ratio: 5 / 7;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  overflow: hidden;
}

.cardImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: rgba(255, 255, 255, 0.03);
}

.cardFallback {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.85),
    rgba(15, 23, 42, 0.9)
  );
  color: rgba(255, 255, 255, 0.92);
  text-align: center;
  box-sizing: border-box;
}

.cardFallback__name {
  font-size: 12px;
  font-weight: 800;
  line-height: 1.3;
}

.cardFallback__code {
  margin-top: 6px;
  font-size: 11px;
  color: rgba(226, 232, 240, 0.72);
}

.countBadge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  min-width: 38px;
  height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.98);
  font-size: 16px;
  font-weight: 900;
  line-height: 1;
}

.stateCard {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.35);
  padding: 18px;
  color: rgba(255, 255, 255, 0.92);
}

.stateCard--error {
  border-color: rgba(248, 113, 113, 0.28);
}

.stateTitle {
  font-size: 15px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.96);
}

.stateText {
  margin-top: 8px;
  color: rgba(248, 113, 113, 0.92);
  font-size: 12px;
  word-break: break-word;
}

.mono {
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

@media (max-width: 1080px) {
  .summaryGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .page {
    padding: 0 10px;
  }

  .hero {
    padding: 14px;
  }

  .heroTop,
  .entryHead {
    flex-direction: column;
    align-items: flex-start;
  }

  .entryHead__right {
    width: 100%;
    justify-content: flex-start;
  }

  .summaryGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cardsGrid {
    gap: 8px;
  }

  .pageTitle {
    font-size: 20px;
  }

  .playerName {
    font-size: 15px;
  }

  .playerRecord {
    font-size: 15px;
  }

  .deckIconsPanel {
    min-width: 112px;
    height: 72px;
  }

  .deckIconsPanel--single {
    min-width: 72px;
  }

  .deckIconSlot {
    width: 44px;
    height: 44px;
  }

  .deckIcon {
    width: 44px;
    height: 44px;
  }

  .deckIconFallback {
    width: 72px;
    height: 72px;
    border-radius: 16px;
  }
}

@media (max-width: 480px) {
  .summaryGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cardsGrid {
    gap: 6px;
  }

  .placingBadge {
    min-width: 50px;
    height: 32px;
    font-size: 13px;
  }

  .countBadge {
    right: 6px;
    bottom: 6px;
    min-width: 32px;
    height: 32px;
    padding: 0 10px;
    font-size: 14px;
  }
}
</style>