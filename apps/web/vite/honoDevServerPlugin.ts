import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getRequestListener } from '@hono/node-server'
import { createServer, type Plugin } from 'vite'
import { enableDebugRoutes } from '../scripts/debug-routes'

const DEV_ENTRY = '/functions/dev-entry.ts'
// Deps whose published ESM Node can't load natively (CJS `main`, extensionless imports).
const SSR_NO_EXTERNAL = ['@apollo/client', /^@uniswap\//]

type AppFetch = (request: Request) => Promise<Response>
interface DevEntryModule {
  createDevApp: (deps: { publicDir: string; renderSpaHtml: (url: string) => Promise<string> }) => AppFetch
}

/**
 * Serves `vite dev` page requests through the Hono app (functions/dev-entry.ts), the same app
 * ecs-entry.ts runs in production, so meta-tag injection and /api/image routes work locally.
 */
// oxlint-disable-next-line import/no-unused-modules -- used in vite.config.mts
export function honoDevServerPlugin(): Plugin {
  return {
    name: 'hono-dev-server',
    apply: (_config, { command, isPreview }) => command === 'serve' && !isPreview,
    // The Hono app owns HTML: Vite's SPA fallback would answer page routes before it.
    config: () => ({ appType: 'custom' }),
    async configureServer(server) {
      const { root, publicDir, mode } = server.config
      // Server code loads through its own Vite instance, as vite.server.config.mts builds it for ECS:
      // the client config's node-polyfill aliases and .env defines must not reach it.
      const serverVite = await createServer({
        configFile: false,
        root,
        // Kept apart from the client's dep cache, which the outer server's optimizer owns.
        cacheDir: path.join(root, 'node_modules/.vite-hono-dev'),
        envDir: false,
        logLevel: 'warn',
        appType: 'custom',
        define: { 'process.env.ENABLE_DEBUG_ROUTES': JSON.stringify(enableDebugRoutes(mode)) },
        resolve: { tsconfigPaths: true },
        ssr: { noExternal: SSR_NO_EXTERNAL },
        // Serves no browser code, so skip the client dep scan of index.html.
        optimizeDeps: { noDiscovery: true, include: [] },
        server: { middlewareMode: true, hmr: false, ws: false },
      })
      server.httpServer?.once('close', () => void serverVite.close())

      const renderSpaHtml = async (url: string): Promise<string> =>
        server.transformIndexHtml(url, await readFile(path.join(root, 'index.html'), 'utf-8'))

      let loaded: { entry: DevEntryModule; fetch: AppFetch } | undefined
      const listener = getRequestListener(
        async (request) => {
          // Cached until a file in its graph changes, so edits to functions/ apply on the next request.
          const entry = (await serverVite.ssrLoadModule(DEV_ENTRY)) as DevEntryModule
          if (loaded?.entry !== entry) {
            loaded = { entry, fetch: entry.createDevApp({ publicDir, renderSpaHtml }) }
          }
          return loaded.fetch(request)
        },
        {
          overrideGlobalObjects: false,
          errorHandler: (error) => {
            if (error instanceof Error) {
              serverVite.ssrFixStacktrace(error)
            }
            const message = error instanceof Error ? (error.stack ?? error.message) : String(error)
            server.config.logger.error(`[hono-dev-server] ${message}`)
            return new Response(message, { status: 500 })
          },
        },
      )

      // Post middleware: Vite's proxy (/config, /ws, and /entry-gateway when ENABLE_ENTRY_GATEWAY_PROXY
      // is set, else the Hono route owns it), module transforms and public/ files answer first.
      return () => {
        server.middlewares.use((req, res) => {
          void listener(req, res)
        })
      }
    },
  }
}
