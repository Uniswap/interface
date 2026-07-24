import process from 'process'
import type { ProxyOptions } from 'vite'
// Deep import of the zero-dependency canonical module (not the @universe/api barrel):
// this file runs at vite config load time, where vite's esbuild bundler inlines
// TS-resolving imports — verified to load fine in plain node via loadConfigFromFile.
import {
  DEV_ENTRY_GATEWAY_API_BASE_URL,
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
} from '@universe/api/src/clients/base/entryGatewayUrls'

const ENTRY_GATEWAY_PROXY_PATH = '/entry-gateway'

/**
 * Returns the appropriate Entry Gateway API URL for the default proxy target.
 * Duplicated from @universe/api to avoid pulling app config into vite.config.
 */
function getDefaultProxyTarget(env: Record<string, string>): string {
  const override = process.env.ENTRY_GATEWAY_API_URL_OVERRIDE || env.ENTRY_GATEWAY_API_URL_OVERRIDE
  if (override) {
    return override
  }

  const isDev = (process.env.NODE_ENV || env.NODE_ENV) === 'development'
  const isStaging = (process.env.ENVIRONMENT || env.ENVIRONMENT) === 'staging'

  if (isDev || isStaging) {
    return STAGING_ENTRY_GATEWAY_API_BASE_URL
  } else {
    return PROD_ENTRY_GATEWAY_API_BASE_URL
  }
}

interface CreateProxyContext {
  getLogger: () => {
    log: typeof console.log
  }
  /**
   * Parsed env values from Vite config
   */
  env: Record<string, string>
}

/**
 * Vite's `server.proxy` config picks one entry per request based on URL
 * prefix. To support env-pinned proxy paths like
 * `/entry-gateway/prod/<service>` we register a separate proxy entry per env
 * with its own backend target, plus the default `/entry-gateway` entry as
 * a fallback.
 *
 * Env-pinned entries strip `/entry-gateway/<env>` so the upstream sees the
 * same path the default proxy would forward. The env segment is the only
 * piece of "knowledge" the proxy needs — there is no feature registry.
 */
// oxlint-disable-next-line import/no-unused-modules -- used in vite.config.mts
export function createEntryGatewayProxies(ctx: CreateProxyContext): Record<string, ProxyOptions> {
  return {
    [`${ENTRY_GATEWAY_PROXY_PATH}/dev`]: createEntryGatewayProxy(ctx, {
      target: DEV_ENTRY_GATEWAY_API_BASE_URL,
      pathPrefix: `${ENTRY_GATEWAY_PROXY_PATH}/dev`,
    }),
    [`${ENTRY_GATEWAY_PROXY_PATH}/staging`]: createEntryGatewayProxy(ctx, {
      target: STAGING_ENTRY_GATEWAY_API_BASE_URL,
      pathPrefix: `${ENTRY_GATEWAY_PROXY_PATH}/staging`,
    }),
    [`${ENTRY_GATEWAY_PROXY_PATH}/prod`]: createEntryGatewayProxy(ctx, {
      target: PROD_ENTRY_GATEWAY_API_BASE_URL,
      pathPrefix: `${ENTRY_GATEWAY_PROXY_PATH}/prod`,
    }),
    [ENTRY_GATEWAY_PROXY_PATH]: createEntryGatewayProxy(ctx, {
      target:
        process.env.BACKEND_URL ||
        process.env.VITE_BACKEND_URL ||
        ctx.env.BACKEND_URL ||
        ctx.env.VITE_BACKEND_URL ||
        getDefaultProxyTarget(ctx.env),
      pathPrefix: ENTRY_GATEWAY_PROXY_PATH,
    }),
  }
}

function createEntryGatewayProxy(
  ctx: CreateProxyContext,
  { target, pathPrefix }: { target: string; pathPrefix: string },
): ProxyOptions {
  const { getLogger } = ctx
  // oxlint-disable-next-line security/detect-non-literal-regexp
  const stripPrefix = new RegExp(`^${pathPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
  return {
    target,
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(stripPrefix, ''),

    configure: (proxy, options) => {
      // Forward cookies FROM browser TO backend
      proxy.on('proxyReq', (proxyReq, req) => {
        const rewrittenPath = req.url?.replace(stripPrefix, '')
        getLogger().log(`[Proxy] ${req.method} ${req.url} -> ${options.target}${rewrittenPath}`)

        // Log all headers being sent to backend
        const headers = proxyReq.getHeaders()
        getLogger().log('[Proxy] Request headers to backend:', {
          cookie: headers.cookie,
          'x-device-id': headers['x-device-id'],
          'x-session-id': headers['x-session-id'],
        })

        // Preserve gRPC-Web headers
        if (req.headers['content-type']?.includes('application/grpc-web')) {
          proxyReq.setHeader('content-type', req.headers['content-type'])
        }
      })

      // Rewrite cookies FROM backend for localhost
      proxy.on('proxyRes', (proxyRes) => {
        // Log response status and headers
        getLogger().log(`[Proxy] Response status: ${proxyRes.statusCode}`)
        getLogger().log('[Proxy] Response headers:', {
          'set-cookie': proxyRes.headers['set-cookie'],
          'x-device-id': proxyRes.headers['x-device-id'],
          'x-session-id': proxyRes.headers['x-session-id'],
        })

        const cookies = proxyRes.headers['set-cookie']
        if (cookies) {
          getLogger().log('[Proxy] Original Set-Cookie headers:', cookies)

          proxyRes.headers['set-cookie'] = cookies.map((cookie, index) => {
            let rewritten = cookie

            // Extract cookie name for logging
            const cookieName = cookie.split('=')[0].replace(/^(__Host-|__Secure-)/, '')
            getLogger().log(`[Proxy] Processing cookie #${index}: ${cookieName}`)

            // Check if this is a device-id related cookie
            if (cookieName.toLowerCase().includes('device') || cookieName.toLowerCase().includes('x-device')) {
              getLogger().log(`[Proxy] Found device cookie: ${cookie}`)
            }

            // For localhost development:
            // 1. Remove Domain restrictions
            // 2. Remove Secure flag
            // 3. Set appropriate SameSite

            // Remove domain restriction
            if (rewritten.includes('Domain=')) {
              const domain = rewritten.match(/Domain=([^;]+)/)?.[1]
              getLogger().log(`[Proxy] Removing Domain: ${domain}`)
              rewritten = rewritten.replace(/Domain=[^;]+;?\s?/gi, '')
            }

            // Remove Secure flag
            if (rewritten.includes('Secure')) {
              getLogger().log('[Proxy] Removing Secure flag')
              rewritten = rewritten.replace(/;\s?Secure/gi, '')
            }

            // Handle SameSite attribute
            if (rewritten.includes('SameSite=')) {
              const currentSameSite = rewritten.match(/SameSite=(\w+)/)?.[1]
              getLogger().log(`[Proxy] Changing SameSite from ${currentSameSite} to Lax`)
              rewritten = rewritten.replace(/SameSite=\w+/gi, 'SameSite=Lax')
            } else {
              getLogger().log('[Proxy] Adding SameSite=Lax')
              // Add SameSite before Path or at the end
              if (rewritten.includes('Path=')) {
                rewritten = rewritten.replace(/(Path=[^;]+)/, 'SameSite=Lax; $1')
              } else {
                rewritten = `${rewritten}; SameSite=Lax`
              }
            }

            // Handle HttpOnly if present
            if (rewritten.includes('HttpOnly')) {
              getLogger().log('[Proxy] Cookie has HttpOnly flag')
            }

            getLogger().log(`[Proxy] Rewritten cookie: ${rewritten}`)
            return rewritten
          })

          getLogger().log('[Proxy] Final Set-Cookie headers:', proxyRes.headers['set-cookie'])
        } else {
          getLogger().log('[Proxy] No Set-Cookie headers in response')
        }
      })

      // Log any errors
      // oxlint-disable-next-line max-params
      proxy.on('error', (err, req, res) => {
        getLogger().log('[Proxy] Error:', err)
      })
    },
  }
}
