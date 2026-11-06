// web/src/routes.ts
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import Layout from './layouts/Layout.vue'

type LegacyLang = 'zh' | 'en'
type LegacyRedirectTarget = Pick<RouteLocationNormalizedLoaded, 'params'>

function langQuery(lang: LegacyLang) {
  return lang === 'en' ? { lang } : undefined
}

function legacyRedirect(lang: LegacyLang, path: string) {
  return { path, query: langQuery(lang) }
}

function redirectLegacyDeck(lang: LegacyLang, to: LegacyRedirectTarget) {
  return legacyRedirect(lang, `/pocket/decks/${String(to.params.deckKey)}`)
}

function redirectLegacyTournament(lang: LegacyLang, to: LegacyRedirectTarget) {
  return legacyRedirect(lang, `/pocket/tournaments/${String(to.params.id)}`)
}

function redirectLegacyPlayer(lang: LegacyLang, to: LegacyRedirectTarget) {
  return legacyRedirect(lang, `/pocket/players/${String(to.params.playerSlug)}`)
}

function legacyLangRoutes(lang: LegacyLang): RouteRecordRaw[] {
  return [
    { path: `/${lang}`, redirect: legacyRedirect(lang, '/pocket') },
    { path: `/${lang}/tier-list`, redirect: legacyRedirect(lang, '/pocket') },
    { path: `/${lang}/tournaments`, redirect: legacyRedirect(lang, '/pocket/tournaments') },
    { path: `/${lang}/tournaments/:id`, redirect: (to) => redirectLegacyTournament(lang, to) },
    { path: `/${lang}/top-decks`, redirect: legacyRedirect(lang, '/pocket/top-decks') },
    { path: `/${lang}/top-decks/:deckKey`, redirect: (to) => redirectLegacyDeck(lang, to) },
    { path: `/${lang}/top-cards`, redirect: legacyRedirect(lang, '/pocket/top-cards') },
    { path: `/${lang}/battle-hub`, redirect: legacyRedirect(lang, '/pocket/records') },
    { path: `/${lang}/player-ranking`, redirect: legacyRedirect(lang, '/pocket/players') },
    { path: `/${lang}/player-ranking/:playerSlug`, redirect: (to) => redirectLegacyPlayer(lang, to) },
    { path: `/${lang}/country-ranking`, redirect: legacyRedirect(lang, '/pocket/countries') },
    { path: `/${lang}/champions`, redirect: legacyRedirect(lang, '/champions') },
    { path: `/${lang}/champions/pokemon`, redirect: legacyRedirect(lang, '/champions/pokemon') },
    { path: `/${lang}/champions/pokemon/:slug`, redirect: (to) => legacyRedirect(lang, `/champions/pokemon/${String(to.params.slug)}`) },
    { path: `/${lang}/champions/teams`, redirect: legacyRedirect(lang, '/champions/teams') },
    { path: `/${lang}/champions/speed`, redirect: legacyRedirect(lang, '/champions/speed') },
    { path: `/${lang}/champions/damage-calculator`, redirect: legacyRedirect(lang, '/champions/damage-calculator') },
    { path: `/${lang}/champions/simulator`, redirect: legacyRedirect(lang, '/champions/simulator') },
  ]
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('./views/Home.vue'),
      },
      {
        path: 'pocket',
        name: 'pocket-meta',
        component: () => import('./views/TierList.vue'),
      },
      {
        path: 'pocket/tournaments',
        name: 'pocket-tournaments',
        component: () => import('./views/Tournaments.vue'),
      },
      {
        path: 'pocket/tournaments/:id',
        name: 'pocket-tournament-report',
        component: () => import('./views/TournamentReport.vue'),
      },
      {
        path: 'pocket/top-decks',
        name: 'pocket-top-decks',
        component: () => import('./views/TopDecks.vue'),
      },
      {
        path: 'pocket/decks/:slug',
        name: 'pocket-deck-profile',
        component: () => import('./views/DeckProfile.vue'),
        props: (route) => ({ deckKey: route.params.slug }),
      },
      {
        path: 'pocket/top-cards',
        name: 'pocket-top-cards',
        component: () => import('./views/TopCards.vue'),
      },
      {
        path: 'pocket/records',
        name: 'pocket-records',
        component: () => import('./views/BattleHub.vue'),
      },
      {
        path: 'pocket/players',
        name: 'pocket-players',
        component: () => import('./views/PlayerRanking.vue'),
      },
      {
        path: 'pocket/players/:playerSlug',
        name: 'pocket-player-profile',
        component: () => import('./views/PlayerProfile.vue'),
      },
      {
        path: 'pocket/countries',
        name: 'pocket-countries',
        component: () => import('./views/CountryRanking.vue'),
      },
      {
        path: 'champions',
        name: 'champions-meta',
        component: () => import('./views/champions/ChampionsMeta.vue'),
      },
      {
        path: 'champions/pokemon',
        name: 'champions-pokemon',
        component: () => import('./views/champions/ChampionsPokemonRanking.vue'),
      },
      {
        path: 'champions/pokemon/:slug',
        name: 'champions-pokemon-profile',
        component: () => import('./views/champions/ChampionsPokemonProfile.vue'),
        props: true,
      },
      {
        path: 'champions/teams',
        name: 'champions-teams',
        component: () => import('./views/champions/ChampionsTeams.vue'),
      },
      {
        path: 'champions/speed',
        name: 'champions-speed',
        component: () => import('./views/champions/ChampionsSpeed.vue'),
      },
      {
        path: 'champions/damage-calculator',
        name: 'champions-damage-calculator',
        component: () => import('./views/champions/ChampionsDamageCalculator.vue'),
      },
      {
        path: 'champions/simulator',
        name: 'champions-simulator',
        component: () => import('./views/champions/ChampionsSimulator.vue'),
      },
    ],
  },

  { path: '/tier-list', redirect: '/pocket' },
  { path: '/tournaments', redirect: '/pocket/tournaments' },
  { path: '/tournaments/:id', redirect: (to) => `/pocket/tournaments/${String(to.params.id)}` },
  { path: '/top-decks', redirect: '/pocket/top-decks' },
  { path: '/top-decks/:deckKey', redirect: (to) => `/pocket/decks/${String(to.params.deckKey)}` },
  { path: '/top-cards', redirect: '/pocket/top-cards' },
  { path: '/battle-hub', redirect: '/pocket/records' },
  { path: '/records', redirect: '/pocket/records' },
  { path: '/players', redirect: '/pocket/players' },
  { path: '/player-ranking', redirect: '/pocket/players' },
  { path: '/player-ranking/:playerSlug', redirect: (to) => `/pocket/players/${String(to.params.playerSlug)}` },
  { path: '/countries', redirect: '/pocket/countries' },
  { path: '/country-ranking', redirect: '/pocket/countries' },

  ...legacyLangRoutes('zh'),
  ...legacyLangRoutes('en'),
]
