import { Environment } from '@universe/config'
import { ENTRY_GATEWAY_URLS, createApp } from 'functions/app'

const mockHtml = `<!DOCTYPE html><html><head><title>Uniswap</title></head><body></body></html>`

interface BuildAppOptions {
  fetchSpy?: typeof fetch
  /** Capture the env passed into the entry-gateway URL resolver per request. */
  onResolveEntryGateway?: (env: Environment | undefined) => void
}

function buildApp({ fetchSpy, onResolveEntryGateway }: BuildAppOptions = {}) {
  if (fetchSpy) {
    vi.stubGlobal('fetch', fetchSpy)
  }
  return createApp({
    fetchSpaHtml: async () => new Response(mockHtml, { headers: { 'content-type': 'text/html' } }),
    getEntryGatewayUrl: (_c, env) => {
      onResolveEntryGateway?.(env)
      if (env) {
        return ENTRY_GATEWAY_URLS[env]
      }
      return ENTRY_GATEWAY_URLS.production
    },
    getWebSocketUrl: () => 'https://websockets.backend-prod.api.uniswap.org',
    getTrustedClientIp: () => undefined,
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

describe('entry-gateway proxy: env pinning', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function extractFetchUrl(spy: ReturnType<typeof vi.fn>): string {
    const arg = spy.mock.calls[0]?.[0]
    if (typeof arg === 'string') {
      return arg
    }
    if (arg instanceof URL) {
      return arg.toString()
    }
    if (arg && typeof arg === 'object' && 'url' in arg) {
      return (arg as { url: string }).url
    }
    throw new Error('No fetch call captured')
  }

  it.each([
    ['prod', 'production'],
    ['staging', 'staging'],
    ['dev', 'development'],
  ] as const)(
    'forwards /entry-gateway/%s/<path> to the matching upstream and strips the env segment',
    async (segment, expectedEnv) => {
      const fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }))
      const onResolveEntryGateway = vi.fn()
      const app = buildApp({ fetchSpy: fetchSpy as unknown as typeof fetch, onResolveEntryGateway })

      await app.request(`/entry-gateway/${segment}/uniswap.unitag.v1.UnitagService/Lookup`, { method: 'POST' })

      expect(onResolveEntryGateway).toHaveBeenCalledWith(expectedEnv)
      expect(extractFetchUrl(fetchSpy)).toBe(
        `${ENTRY_GATEWAY_URLS[expectedEnv]}/uniswap.unitag.v1.UnitagService/Lookup`,
      )
    },
  )

  it('falls back to the deployment default when no env is pinned', async () => {
    const fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }))
    const onResolveEntryGateway = vi.fn()
    const app = buildApp({ fetchSpy: fetchSpy as unknown as typeof fetch, onResolveEntryGateway })

    await app.request('/entry-gateway/v1/sessions', { method: 'POST' })

    expect(onResolveEntryGateway).toHaveBeenCalledWith(undefined)
    expect(extractFetchUrl(fetchSpy)).toBe(`${ENTRY_GATEWAY_URLS.production}/v1/sessions`)
  })

  it('treats a non-env first segment as a normal path', async () => {
    const fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }))
    const onResolveEntryGateway = vi.fn()
    const app = buildApp({ fetchSpy: fetchSpy as unknown as typeof fetch, onResolveEntryGateway })

    await app.request('/entry-gateway/FOR.v1.FORService/Quote', { method: 'POST' })

    expect(onResolveEntryGateway).toHaveBeenCalledWith(undefined)
    expect(extractFetchUrl(fetchSpy)).toBe(`${ENTRY_GATEWAY_URLS.production}/FOR.v1.FORService/Quote`)
  })
})
