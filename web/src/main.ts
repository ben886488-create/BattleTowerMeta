import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './routes'
import { initGoogleAnalytics } from './lib/analytics'

import './assets/theme.css'
import './assets/fonts.css'
import './responsive.css'
import './assets/editorial.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL,
  },
  ({ router, isClient }) => {
    if (isClient) {
      initGoogleAnalytics(router)
    }
  },
)

type TierRow = {
  deck?: string
}

async function loadDeckProfileRoutes() {
  const [{ readFile, readdir }, pathModule] = await Promise.all([
    import('node:fs/promises'),
    import('node:path'),
  ])

  const tierJsonPath = pathModule.resolve(process.cwd(), 'public/data/tier.json')
  const profileDir = pathModule.resolve(process.cwd(), 'public/data/precomputed/deck_profiles')
  const tierRows = JSON.parse(await readFile(tierJsonPath, 'utf-8')) as TierRow[]
  const profileFiles = await readdir(profileDir)

  const deckKeys = Array.from(
    new Set(
      [
        ...tierRows.map((row) => row.deck?.trim()),
        ...profileFiles
          .filter((fileName) => fileName.endsWith('.json') && fileName !== 'index.json')
          .map((fileName) => fileName.replace(/\.json$/i, '')),
      ].filter((value): value is string => Boolean(value)),
    ),
  )

  return deckKeys.flatMap((deckKey) => [`/zh/top-decks/${deckKey}`, `/en/top-decks/${deckKey}`])
}

export async function includedRoutes(paths: string[]) {
  const deckProfileRoutes = await loadDeckProfileRoutes()
  const staticPaths = paths.filter((path) => !path.includes(':'))
  return Array.from(new Set([...staticPaths, ...deckProfileRoutes]))
}
