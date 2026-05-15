# BattleTowerMeta Project Overview

這份文件是給新 chat / 新協作者快速接手用的專案地圖。它描述整個網站的架構、資料流、常用命令、主要檔案職責，以及修改時最容易踩到的地方。

## 1. 專案一句話

BattleTowerMeta 是一個以 Pokemon TCG Pocket / Limitless Tournament Platform 賽事資料為核心的 Vue 3 靜態網站。網站每日抓取賽事、處理排名與牌組資料，再建出 GitHub Pages 可部署的靜態站點。

主要功能：

- 牌組 Tier List 與對局熱度/勝率
- 賽事列表與單場賽事報告
- 熱門牌組排行與牌組詳情頁
- 泛用卡片/投入率統計
- 玩家排名與國家排名
- Rank Recorder / Battle Hub 互動功能
- Supabase 登入、個人記錄、交易/討論資料

## 2. 技術棧

- Frontend: Vue 3, `<script setup>`, TypeScript, Vue Router
- Build: Vite + `vite-ssg`
- Hosting: GitHub Pages, build output 到 `docs/`
- Data scripts: Python 3 scripts under `scripts/`
- Runtime data: JSON files under `web/public/data/`
- Interactive backend: Supabase
- UI export helpers: `html-to-image`
- Browser/testing helper: Playwright dependency is installed in `web/package.json`

## 3. Repository 地圖

```text
BattleTowerMeta/
  .github/workflows/daily.yml       # 每日資料更新、build、部署到 GitHub Pages
  docs/                             # Vite SSG build output，GitHub Pages artifact 來源
  scripts/                          # Python 賽事抓取與資料建置 pipeline
  supabase/schema.sql               # Supabase tables, RLS policies, trigger
  web/
    package.json                    # frontend commands and dependencies
    vite.config.ts                  # Vite config, output to ../docs, dev data fallback
    public/data/                    # 前端直接 fetch 的 JSON data
    src/
      main.ts                       # ViteSSG entry, routes, GA init, includedRoutes
      routes.ts                     # zh/en route tree
      App.vue                       # topbar/sidebar/footer shell
      responsive.css                # global responsive rules
      assets/
        theme.css                   # global CSS variables/theme
        fonts.css                   # font loading
        pokemonNames.ts             # localized deck/Pokemon naming helpers
        deck-icons/                 # deck icon assets
        deck-disks/                 # rank/disk/card count icon assets
        limitless_dump/             # card catalog JSON from Limitless scrape
      components/                   # reusable interactive panels
      lib/                          # shared data loading, filtering, Supabase, rank math
      views/                        # route-level pages
```

## 4. Frontend app structure

Entry flow:

```text
web/src/main.ts
  -> ViteSSG(App, routes)
  -> initGoogleAnalytics(router) on client
  -> includedRoutes() adds static deck profile routes during SSG

web/src/routes.ts
  -> "/" redirects to "/zh"
  -> "/zh/*" and "/en/*" share the same page components
  -> Layout.vue sets html lang/data-lang
  -> App.vue renders nav, account menu, sidebar, footer, RouterView
```

The app uses locale-prefixed routes. Most pages infer language from `route.path.split("/")[1]`, so when adding routes or links, keep `/zh/...` and `/en/...` symmetry.

Important route pages:

- `Home.vue`: landing dashboard / entry cards.
- `TierList.vue`: tier list, usage panels, matchup heatmap, export UI.
- `Tournaments.vue`: tournament index, filters, pagination.
- `TournamentReport.vue`: single tournament report from prebuilt tournament-page JSON.
- `TopDecks.vue`: deck ranking by tournament filters; uses raw standings/pairings or precomputed payloads where available.
- `DeckProfile.vue`: single deck detail page, best finishes, matchup panels, card inclusion panels, export UI, discussion panel.
- `TopCards.vue`: card catalog and inclusion-rate view; uses card catalog plus tournament standings.
- `PlayerRanking.vue`: player leaderboard from `player_entries.json`.
- `PlayerProfile.vue`: single player history and ranking stats.
- `CountryRanking.vue`: country leaderboard from player entries.
- `BattleHub.vue`: shell for rank recorder / trade hub components.

## 5. Shared frontend libraries

`web/src/lib/` contains most cross-page logic:

- `publicData.ts`: cached fetch helpers for `/data/*.json`, raw standings, raw pairings.
- `playerEntries.ts`: player-entry types, version windows, time filters, top-cut filters.
- `pairingResolver.ts`: maps pairings to standings/decks and parses match results.
- `deckTier.ts`: converts score/gap into display tier.
- `precomputedViews.ts`: loads `/data/precomputed/top_decks.json` and per-deck profile payloads, and builds stable scope keys.
- `rankTracker.ts`: local rank ladder math, match log analysis, streak/delta calculations.
- `supabase.ts`: Supabase client, auth state, profile helpers.
- `interactive.ts`: Supabase-backed rank logs, trade posts, deck discussions.
- `countryNames.ts`: localized country display names.
- `analytics.ts`: Google Analytics initialization and page-view tracking.

## 6. Data pipeline

The daily data flow is:

```text
Limitless Tournament Platform API
  -> scripts/fetch_raw_data.py
     writes web/public/data/tournaments.json
     writes web/public/data/raw/<tournament_id>/{details,standings,pairings}.json
     writes excluded/failed tournament logs when needed

  -> scripts/process_data.py
     reads tournaments + raw details/standings/pairings
     writes tier.json, players.json, player_entries.json, matchups.json, meta.json

  -> scripts/build_precomputed_views.py
     writes web/public/data/precomputed/top_decks.json
     writes web/public/data/precomputed/deck_profiles/<deck_key>.json
     writes deck_profiles/index.json

  -> scripts/build_tournament_pages.py
     writes web/public/data/tournament-pages/<tournament_id>.json
     writes web/public/data/tournament-pages/manifest.json

  -> scripts/extract_tournament_players.py
     writes web/public/data/tournament_players_final.json

  -> cd web && npm ci && npm run build
     writes static site to docs/
```

The GitHub Actions workflow is `.github/workflows/daily.yml`. It runs on:

- push to `main`
- daily schedule at UTC 22:00, which is Hong Kong 06:00
- manual `workflow_dispatch`

The workflow commits changed `web/public/data` files back to `main` using `chore(data): daily refresh [skip ci]`, then builds and deploys the site to GitHub Pages.

## 7. Public data files

Key files under `web/public/data/`:

- `tournaments.json`: tournament list/index.
- `raw/<tid>/details.json`: Limitless details payload for one tournament.
- `raw/<tid>/standings.json`: standings and decklist payload.
- `raw/<tid>/pairings.json`: match pairings/results.
- `tier.json`: aggregated deck tier rows and scores.
- `players.json`: player leaderboard summary.
- `player_entries.json`: normalized per-player tournament entries.
- `matchups.json`: aggregated matchup matrix, large file.
- `meta.json`: generation metadata, thresholds, counts.
- `tournament-pages/<tid>.json`: page-ready tournament report payload.
- `tournament-pages/manifest.json`: index for report pages.
- `tournament_players_final.json`: tournament-to-player mapping.
- `precomputed/top_decks.json`: precomputed Top Decks scopes.
- `precomputed/deck_profiles/<deck_key>.json`: precomputed Deck Profile scopes.

The largest files are normal and expected. Avoid opening full `player_entries.json`, `matchups.json`, or tournament page files unless needed. Use targeted search or inspect small samples.

## 8. Card and deck assets

Important asset folders:

- `web/src/assets/deck-icons/`: Pokemon/deck icons used in deck identities.
- `web/src/assets/deck-disks/`: disk/card-count images and rank-style assets.
- `web/src/assets/limitless_dump/limitless_cards.json`: card catalog for card lookup and images.
- `web/src/assets/limitless_dump/limitless_sets.json`: set metadata.
- `web/src/assets/pokemonNames.ts`: localized deck and Pokemon naming.

Card images usually come from catalog URLs or imported assets. When building card overlays, keep the existing image lookup and fallback patterns in `TopCards.vue` and `DeckProfile.vue`.

## 9. Supabase interactive layer

Supabase is used for interactive features, not for the core public tournament stats.

Schema file:

```text
supabase/schema.sql
```

Tables/views:

- `profiles`: public profile rows linked to auth users.
- `rank_logs`: private user rank matches.
- `trade_posts`: public read trade posts, authenticated write.
- `deck_discussions`: public read deck comments, authenticated write.
- `rank_matchup_rollups`: aggregate view for rank matchups.

Environment variables used by the frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GA_MEASUREMENT_ID`

`web/src/lib/supabase.ts` also contains fallback Supabase config. Production deploy injects env vars through GitHub Actions secrets.

## 10. Commands

Run from repo root unless specified.

Frontend dev server:

```powershell
cd web
npm.cmd install
npm.cmd run dev
```

Production build:

```powershell
cd web
npm.cmd run build
```

Data update locally:

```powershell
$env:PYTHONUTF8='1'
$env:POCKET_GAME_ID='POCKET'
$env:UNLIMITED_DAYS='false'
$env:DAYS_BACK='30'
$env:MIN_PLAYERS='64'
python scripts/fetch_raw_data.py
python scripts/process_data.py
python scripts/build_precomputed_views.py
python scripts/build_tournament_pages.py
python scripts/extract_tournament_players.py
```

Build output:

```text
web/vite.config.ts -> build.outDir = ../docs
```

Do not hand-edit `docs/` for source changes. It is generated by `npm run build`.

## 11. Development patterns

Frontend:

- Most route pages are self-contained Vue SFCs with large scoped CSS sections.
- Shared logic should go into `web/src/lib/*` only when it is genuinely reused.
- Route-level text usually lives in local `messages` objects inside the view.
- Locale is inferred from URL, not from a global i18n plugin.
- Large dashboards often compute filtered rows with `computed()` rather than a store.
- Raw data loading is cached by `publicData.ts`.

Data:

- `tournaments.json` is the top-level index.
- Raw files are authoritative for per-tournament data.
- `process_data.py` produces global aggregates.
- `build_precomputed_views.py` exists to keep expensive Top Decks / Deck Profile work out of the browser.
- `build_tournament_pages.py` produces report-ready JSON so TournamentReport can stay mostly presentation-focused.

Deck keys:

- Deck IDs are slug-like strings such as `hydreigon-mega-absol-ex-b1`.
- Many pages use deck key as route param and data key.
- `pokemonNames.ts` and helper functions localize/pretty-print deck names.

Filters:

- Common time filters include `past7`, `prev7`, `past4w`, `all`, and `month:YYYY-MM`.
- Current-version filter values include special values such as `__current_7__`.
- Top-cut filters include values like `all`, `4`, `8`, `16`, `32`, `64` depending on page.

## 12. Build and deploy notes

The normal deploy path is:

```text
push to main
  -> GitHub Actions daily.yml
  -> data scripts
  -> optional data commit
  -> npm ci && npm run build
  -> upload docs as Pages artifact
  -> deploy-pages
```

Expected build warnings:

- Vite may warn that `node:fs/promises` and `node:path` are externalized for browser compatibility because `main.ts` uses them only for SSG route discovery.
- Vite may warn that a runtime `new URL("../data/tournaments.json", import.meta.url)` does not exist at build time if the code intentionally leaves it for runtime resolution.

Those warnings are expected unless the related code changes.

## 13. Common pitfalls

- Always run `git status -sb` before editing. This repo often has unrelated local dirty files.
- Do not revert user changes unless explicitly asked.
- Avoid committing `web/node_modules/.vite/deps/*` cache changes.
- Avoid committing `.vs/` or `scripts/.vs/` local Visual Studio files.
- `docs/` is generated output. Commit it only when the workflow/deploy strategy requires generated artifacts, not for normal source-only UI work.
- `web/public/data/` is generated by scripts and updated by GitHub Actions. Manual edits are easy to overwrite.
- Large JSON files can be hundreds of MB; use targeted reads/searches.
- If working from an old local `main`, fetch/rebase before submitting because daily data commits frequently move `origin/main`.
- If a clean worktree is needed for submit, create one from `origin/main` and apply only the intended patch.

## 14. Suggested new-chat handoff prompt

When starting a fresh chat, paste something like:

```text
Repo: C:\Users\user\Documents\GitHub\BattleTowerMeta
Read PROJECT_OVERVIEW.md first.
Before editing, run git status -sb.
Do not touch unrelated dirty files.
Frontend is Vue/Vite under web/.
Data pipeline is Python under scripts/.
Build command is cd web; npm.cmd run build.
Current task: <describe task here>
```

## 15. Quick mental model

Think of the project as three layers:

```text
1. Data builder layer
   Limitless API -> Python scripts -> web/public/data JSON

2. Static app layer
   Vue routes/views -> ViteSSG -> docs/

3. Interactive layer
   Supabase auth/tables -> account menu, rank logs, trades, deck discussion
```

Most visual tasks live in `web/src/views/*.vue`. Most data correctness tasks start in `scripts/` or `web/src/lib/*`. Most deployment issues start in `.github/workflows/daily.yml`, `web/vite.config.ts`, or the generated `docs/` output.
