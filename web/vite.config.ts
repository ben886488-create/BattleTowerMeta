import fs from 'node:fs'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'

function devDataFallbackPlugin(): Plugin {
  const projectRoot = path.resolve(__dirname, '..')
  const candidates = [
    path.resolve(__dirname, 'public'),
    path.resolve(projectRoot, 'docs'),
  ]

  const contentTypeByExt: Record<string, string> = {
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
  }

  return {
    name: 'battle-tower-meta-dev-data-fallback',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ?? '/'
        const pathname = decodeURIComponent(rawUrl.split('?')[0] ?? '/')

        if (!pathname.startsWith('/data/')) {
          next()
          return
        }

        const relativePath = pathname.replace(/^\/+/, '')

        for (const baseDir of candidates) {
          const filePath = path.resolve(baseDir, relativePath)
          if (!filePath.startsWith(baseDir + path.sep) && filePath !== baseDir) {
            continue
          }

          if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            continue
          }

          const ext = path.extname(filePath).toLowerCase()
          const contentType = contentTypeByExt[ext] ?? 'application/octet-stream'

          res.statusCode = 200
          res.setHeader('Content-Type', contentType)
          fs.createReadStream(filePath).pipe(res)
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), devDataFallbackPlugin()],
  base: '/',
  build: {
    outDir: path.resolve(__dirname, '../docs'),
    emptyOutDir: true,
  },
})
