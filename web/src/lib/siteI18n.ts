import type { RouteLocationNormalizedLoaded } from "vue-router";

export type SiteLang = "zh" | "en";
export type GameSection = "home" | "pocket" | "champions";

export const siteTranslations = {
  zh: {
    "home.hero.eyebrow": "BTM // GAME SELECT",
    "home.brand.title": "BattleTowerMeta",
    "home.brand.subtitle": "Competition intelligence terminal",
    "home.hero.title": "戰術資料庫，\n已啟動。",
    "home.hero.subtitle": "選擇資料分區，進入對應遊戲的競技情報終端。",
    "home.games.pocket.title": "PTCG Pocket",
    "home.games.pocket.subtitle": "牌組環境、賽事、泛用卡片與排名資料",
    "home.games.pocket.cta": "進入 PTCG Pocket",
    "home.games.pocket.signal": "BTM / POCKET",
    "home.games.pocket.status": "DATA ONLINE",
    "home.games.champions.title": "Pokémon Champions",
    "home.games.champions.subtitle": "對戰環境、寶可夢數據、速度線與工具",
    "home.games.champions.cta": "進入 Pokémon Champions",
    "home.games.champions.signal": "BTM / CHAMPIONS",
    "home.games.champions.status": "SYNC PENDING",
    "home.games.ariaLabel": "遊戲分區選擇",

    "nav.games.pocket": "PTCG Pocket",
    "nav.games.champions": "Pokémon Champions",
    "nav.games.switcher": "切換遊戲分區",

    "pocket.nav.meta": "牌組環境",
    "pocket.nav.tournaments": "線上比賽",
    "pocket.nav.topDecks": "最強牌組",
    "pocket.nav.topCards": "泛用卡片",
    "pocket.nav.records": "排位記錄",
    "pocket.nav.players": "玩家排名",
    "pocket.nav.countries": "地區排名",

    "champions.nav.meta": "對戰環境",
    "champions.nav.pokemon": "寶可夢排名",
    "champions.nav.teams": "隊伍參考",
    "champions.nav.speed": "速度線",
    "champions.nav.damage": "傷害計算器",
    "champions.nav.simulator": "對戰模擬器",

    "status.pocket.noUpcoming": "未來 24 小時暫無 PTCG Pocket 比賽",
    "status.champions.pending": "Champions 賽事資料尚未同步",
    "status.home.online": "BTM · SYSTEM ONLINE",
    "status.champions.footer": "CHAMPIONS · DATA PENDING",
    "status.ticker.pocket": "UPCOMING / 24H",
    "status.ticker.champions": "CHAMPIONS / EVENTS",
  },
  en: {
    "home.hero.eyebrow": "BTM // GAME SELECT",
    "home.brand.title": "BattleTowerMeta",
    "home.brand.subtitle": "Competition intelligence terminal",
    "home.hero.title": "Competitive Intelligence,\nOnline.",
    "home.hero.subtitle": "Choose a data division and enter the competitive intelligence terminal for that game.",
    "home.games.pocket.title": "PTCG Pocket",
    "home.games.pocket.subtitle": "Deck meta, tournaments, staple cards, and rankings",
    "home.games.pocket.cta": "Enter PTCG Pocket",
    "home.games.pocket.signal": "BTM / POCKET",
    "home.games.pocket.status": "DATA ONLINE",
    "home.games.champions.title": "Pokémon Champions",
    "home.games.champions.subtitle": "Battle meta, Pokémon data, speed tiers, and tools",
    "home.games.champions.cta": "Enter Pokémon Champions",
    "home.games.champions.signal": "BTM / CHAMPIONS",
    "home.games.champions.status": "SYNC PENDING",
    "home.games.ariaLabel": "Game selection",

    "nav.games.pocket": "PTCG Pocket",
    "nav.games.champions": "Pokémon Champions",
    "nav.games.switcher": "Game switcher",

    "pocket.nav.meta": "Deck Meta",
    "pocket.nav.tournaments": "Online Tournaments",
    "pocket.nav.topDecks": "Top Decks",
    "pocket.nav.topCards": "Staple Cards",
    "pocket.nav.records": "Records",
    "pocket.nav.players": "Player Ranking",
    "pocket.nav.countries": "Region Ranking",

    "champions.nav.meta": "Battle Meta",
    "champions.nav.pokemon": "Pokémon Ranking",
    "champions.nav.teams": "Team References",
    "champions.nav.speed": "Speed Tiers",
    "champions.nav.damage": "Damage Calculator",
    "champions.nav.simulator": "Battle Simulator",

    "status.pocket.noUpcoming": "No PTCG Pocket tournaments in next 24h",
    "status.champions.pending": "Champions tournament data not synced yet",
    "status.home.online": "BTM · SYSTEM ONLINE",
    "status.champions.footer": "CHAMPIONS · DATA PENDING",
    "status.ticker.pocket": "UPCOMING / 24H",
    "status.ticker.champions": "CHAMPIONS / EVENTS",
  },
} as const;

export type SiteTranslationKey = keyof (typeof siteTranslations)["zh"];

export const pocketNavItems = [
  { key: "pocket.nav.meta", path: "/pocket" },
  { key: "pocket.nav.tournaments", path: "/pocket/tournaments" },
  { key: "pocket.nav.topDecks", path: "/pocket/top-decks" },
  { key: "pocket.nav.topCards", path: "/pocket/top-cards" },
  { key: "pocket.nav.records", path: "/pocket/records" },
  { key: "pocket.nav.players", path: "/pocket/players" },
  { key: "pocket.nav.countries", path: "/pocket/countries" },
] as const satisfies readonly { key: SiteTranslationKey; path: string }[];

export const championsSectionNavItems = [
  { key: "champions.nav.meta", path: "/champions" },
  { key: "champions.nav.pokemon", path: "/champions/pokemon" },
  { key: "champions.nav.teams", path: "/champions/teams" },
  { key: "champions.nav.speed", path: "/champions/speed" },
  { key: "champions.nav.damage", path: "/champions/damage-calculator" },
  { key: "champions.nav.simulator", path: "/champions/simulator" },
] as const satisfies readonly { key: SiteTranslationKey; path: string }[];

export function routeLang(route: Pick<RouteLocationNormalizedLoaded, "path" | "query">): SiteLang {
  const queryLang = route.query.lang;
  const queryValue = Array.isArray(queryLang) ? queryLang[0] : queryLang;
  if (queryValue === "en" || queryValue === "zh") return queryValue;

  const firstSegment = route.path.split("/")[1];
  return firstSegment === "en" ? "en" : "zh";
}

export function siteT(lang: SiteLang, key: SiteTranslationKey): string {
  return siteTranslations[lang][key] ?? key;
}

export function withLang(path: string, lang: SiteLang) {
  return lang === "en" ? { path, query: { lang } } : { path };
}

export function routeSection(path: string): GameSection {
  const firstSegment = path.split("/")[1];
  if (firstSegment === "pocket") return "pocket";
  if (firstSegment === "champions") return "champions";
  return "home";
}
