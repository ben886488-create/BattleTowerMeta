import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './routes'
import { initGoogleAnalytics } from './lib/analytics'
import { SSG_STATIC_ROUTES } from './lib/siteSeo'

import './assets/theme.css'
import './assets/fonts.css'
import './responsive.css'
import './assets/editorial.css'
import './assets/champions.css'

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

const NODE_FS_PROMISES_MODULE = 'node:fs/promises'
const NODE_PATH_MODULE = 'node:path'

async function loadDeckProfileRoutes() {
  const [{ readFile, readdir }, pathModule] = await Promise.all([
    import(/* @vite-ignore */ NODE_FS_PROMISES_MODULE) as Promise<typeof import('node:fs/promises')>,
    import(/* @vite-ignore */ NODE_PATH_MODULE) as Promise<typeof import('node:path')>,
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

  return deckKeys.map((deckKey) => `/pocket/decks/${deckKey}`)
}

export async function includedRoutes(paths: string[]) {
  const deckProfileRoutes = await loadDeckProfileRoutes()
  void paths
  return Array.from(new Set([...SSG_STATIC_ROUTES, ...deckProfileRoutes]))
}
