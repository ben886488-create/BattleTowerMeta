import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './routes'

import './assets/theme.css'
import './assets/fonts.css'
import './responsive.css'

export const createApp = ViteSSG(App, {
  routes,
  base: import.meta.env.BASE_URL,
})

type TierRow = {
  deck?: string
}

async function loadDeckProfileRoutes() {
  const [{ readFile }, pathModule] = await Promise.all([
    import('node:fs/promises'),
    import('node:path'),
  ])

  const tierJsonPath = pathModule.resolve(process.cwd(), 'public/data/tier.json')
  const tierRows = JSON.parse(await readFile(tierJsonPath, 'utf-8')) as TierRow[]

  const deckKeys = Array.from(
    new Set(
      tierRows
        .map((row) => row.deck?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  )

  return deckKeys.flatMap((deckKey) => [`/zh/top-decks/${deckKey}`, `/en/top-decks/${deckKey}`])
}

export async function includedRoutes(paths: string[]) {
  const deckProfileRoutes = await loadDeckProfileRoutes()
  const staticPaths = paths.filter((path) => !path.includes(':'))
  return Array.from(new Set([...staticPaths, ...deckProfileRoutes]))
}
