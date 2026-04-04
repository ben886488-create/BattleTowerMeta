// web/src/routes.ts
import type { RouteRecordRaw } from 'vue-router'
import Layout from './layouts/Layout.vue'

const langs = ['zh', 'en'] as const

function makeLangRoutes(lang: (typeof langs)[number]): RouteRecordRaw {
  return {
    path: `/${lang}`,
    component: Layout,
    children: [
      { path: '', name: `${lang}-home`, component: () => import('./views/Home.vue') },

      {
        path: 'tier-list',
        name: `${lang}-tier-list`,
        component: () => import('./views/TierList.vue'),
        meta: { nav: true, key: 'tierList' },
      },
      {
        path: 'tournaments',
        name: `${lang}-tournaments`,
        component: () => import('./views/Tournaments.vue'),
        meta: { nav: true, key: 'tournaments' },
      },
      {
        path: 'tournaments/:id',
        name: `${lang}-tournament-report`,
        component: () => import('./views/TournamentReport.vue'),
      },
      {
        path: 'top-decks',
        name: `${lang}-top-decks`,
        component: () => import('./views/TopDecks.vue'),
        meta: { nav: true, key: 'topDecks' },
      },

      {
        path: 'top-decks/:deckKey',
        name: `${lang}-deck-profile`,
        component: () => import('./views/DeckProfile.vue'),
        props: true,
      },
    

      {
        path: 'top-cards',
        name: `${lang}-top-cards`,
        component: () => import('./views/TopCards.vue'),
        meta: { nav: true, key: 'topCards' },
      },
      {
        path: 'player-ranking',
        name: `${lang}-player-ranking`,
        component: () => import('./views/PlayerRanking.vue'),
        meta: { nav: true, key: 'playerRanking' },
      },
      {
        path: 'country-ranking',
        name: `${lang}-country-ranking`,
        component: () => import('./views/CountryRanking.vue'),
        meta: { nav: true, key: 'countryRanking' },
      },
    ],
  }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/zh' },
  { path: '/tournaments', redirect: '/zh/tournaments' },
  { path: '/tournaments/:id', redirect: (to) => `/zh/tournaments/${to.params.id}` },

  ...langs.map(makeLangRoutes),
]