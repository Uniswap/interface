import { Environment } from '@universe/config'
import { ENTRY_GATEWAY_URLS, createApp } from 'functions/app'

const mockHtml = `<!DOCTYPE html><html><head><title>Uniswap</title></head><body></body></html>`

interface BuildAppOptions {
  /** frame-ancestors source list for /embed; undefined keeps /embed on the strict policy. */
  embedFrameAncestors?: string
}

// Frame protection is applied by createApp's catch-all, so exercise the module
// through the assembled app (see functions/frameProtection.ts).
function buildApp({ embedFrameAncestors }: BuildAppOptions = {}) {
  return createApp({
    fetchSpaHtml: async () => new Response(mockHtml, { headers: { 'content-type': 'text/html' } }),
    getEntryGatewayUrl: (_c, env) => {
      if (env) {
        return ENTRY_GATEWAY_URLS[env]
      }
      return ENTRY_GATEWAY_URLS.production
    },
    getWebSocketUrl: () => 'https://websockets.backend-prod.api.uniswap.org',
    getTrustedClientIp: () => undefined,
    getEmbedFrameAncestors: () => embedFrameAncestors,
  })
}

describe('frame protection headers', () => {
  it('sets frame-ancestors CSP header on SPA routes', async () => {
    const app = buildApp()
    const res = await app.request('/')

    expect(res.headers.get('Content-Security-Policy')).toBe(
      "frame-ancestors 'self' https://app.safe.global https://dexscreener.com https://*.dexscreener.com",
    )
  })

  it('sets X-Frame-Options header on SPA routes', async () => {
    const app = buildApp()
    const res = await app.request('/')

    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
  })

  it('sets frame headers on /swap route', async () => {
    const app = buildApp()
    const res = await app.request('/swap')

    expect(res.headers.get('Content-Security-Policy')).toBe(
      "frame-ancestors 'self' https://app.safe.global https://dexscreener.com https://*.dexscreener.com",
    )
    expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
  })

  it('does not include other CSP directives in the frame-ancestors header', async () => {
    const app = buildApp()
    const res = await app.request('/')

    const csp = res.headers.get('Content-Security-Policy')
    expect(csp).not.toContain('default-src')
    expect(csp).not.toContain('script-src')
  })
})

describe('embed frame policy', () => {
  const partnerAncestors = 'https://dexscreener.com https://*.dexscreener.com'

  it('serves /embed with the configured frame-ancestors allowlist and no X-Frame-Options', async () => {
    const app = buildApp({ embedFrameAncestors: partnerAncestors })
    const res = await app.request('/embed')

    expect(res.headers.get('Content-Security-Policy')).toBe(
      "frame-ancestors 'self' https://dexscreener.com https://*.dexscreener.com",
    )
    expect(res.headers.get('X-Frame-Options')).toBeNull()
  })

  it('serves /embed subpaths with the embed frame policy', async () => {
    const app = buildApp({ embedFrameAncestors: partnerAncestors })
    const res = await app.request('/embed/swap')

    expect(res.headers.get('Content-Security-Policy')).toBe(
      "frame-ancestors 'self' https://dexscreener.com https://*.dexscreener.com",
    )
    expect(res.headers.get('X-Frame-Options')).toBeNull()
  })

  it('serves frame-ancestors * on /embed when configured as open', async () => {
    const app = buildApp({ embedFrameAncestors: '*' })
    const res = await app.request('/embed')

    expect(res.headers.get('Content-Security-Policy')).toBe('frame-ancestors *')
    expect(res.headers.get('X-Frame-Options')).toBeNull()
  })

  it.each([undefined, '', '   '])(
    'keeps the strict policy on /embed when the configured ancestors are %j',
    async (embedFrameAncestors) => {
      const app = buildApp({ embedFrameAncestors })
      const res = await app.request('/embed')

      expect(res.headers.get('Content-Security-Policy')).toBe(
        "frame-ancestors 'self' https://app.safe.global https://dexscreener.com https://*.dexscreener.com",
      )
      expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    },
  )

  it.each(['/', '/swap', '/embedded', '/api/portfolio'])(
    'keeps the strict policy on %s when embed ancestors are configured',
    async (path) => {
      const app = buildApp({ embedFrameAncestors: partnerAncestors })
      const res = await app.request(path)

      expect(res.headers.get('Content-Security-Policy')).toBe(
        "frame-ancestors 'self' https://app.safe.global https://dexscreener.com https://*.dexscreener.com",
      )
      expect(res.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    },
  )
})
