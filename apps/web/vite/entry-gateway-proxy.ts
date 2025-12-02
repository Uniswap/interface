import process from 'process'
import type { ProxyOptions } from 'vite'

// Entry Gateway API URLs
const DEV_ENTRY_GATEWAY_API_BASE_URL = 'https://entry-gateway.backend-dev.api.uniswap.org'
const STAGING_ENTRY_GATEWAY_API_BASE_URL = 'https://entry-gateway.backend-staging.api.uniswap.org'
const PROD_ENTRY_GATEWAY_API_BASE_URL = 'https://entry-gateway.backend-prod.api.uniswap.org'

/**
 * Returns the appropriate Entry Gateway API URL for the proxy target.
 * Duplicated from @universe/api to avoid importing app code into build config.
 */
function getEntryGatewayProxyTarget(): string {
  // Allow override via environment variable
  if (process.env.ENTRY_GATEWAY_API_URL_OVERRIDE) {
    return process.env.ENTRY_GATEWAY_API_URL_OVERRIDE
  }

  // Check if we're in dev/staging/prod environment
  const nodeEnv = process.env.NODE_ENV
  const isBeta = process.env.REACT_APP_STAGING === 'true'

  // Determine URL based on environment
  if (nodeEnv === 'development') {
    return DEV_ENTRY_GATEWAY_API_BASE_URL
  } else if (isBeta) {
    return STAGING_ENTRY_GATEWAY_API_BASE_URL
  } else {
    return PROD_ENTRY_GATEWAY_API_BASE_URL
  }
}

// eslint-disable-next-line import/no-unused-modules -- used in vite.config.mts
export function createEntryGatewayProxy(ctx: {
  getLogger: () => {
    log: typeof console.log
  }
}) {
  const { getLogger } = ctx
  // Use VITE_BACKEND_URL if set, otherwise use environment-aware URL
  const target = process.env.VITE_BACKEND_URL || getEntryGatewayProxyTarget()
  return {
    target,
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/entry-gateway/, ''),

    configure: (proxy, options) => {
      // Forward cookies FROM browser TO backend
      proxy.on('proxyReq', (proxyReq, req) => {
        getLogger().log(
          `[Proxy] ${req.method} ${req.url} -> ${options.target}${req.url?.replace('/entry-gateway', '')}`,
        )

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
      // eslint-disable-next-line max-params
      proxy.on('error', (err, req, res) => {
        getLogger().log('[Proxy] Error:', err)
      })
    },
  } satisfies ProxyOptions
}
