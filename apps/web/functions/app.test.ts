import { Environment } from '@universe/config'
import { ENTRY_GATEWAY_URLS, createApp } from 'functions/app'

const mockHtml = `<!DOCTYPE html><html><head><title>Uniswap</title></head><body></body></html>`

interface BuildAppOptions {
  fetchSpy?: typeof fetch
  /** Capture the env passed into the entry-gateway URL resolver per request. */
  onResolveEntryGateway?: (env: Environment | undefined) => void
  /** Stands in for the platform's trusted-IP header read (see each entry point). */
  trustedClientIp?: string
}

function buildApp({ fetchSpy, onResolveEntryGateway, trustedClientIp }: BuildAppOptions = {}) {
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
    getTrustedClientIp: () => trustedClientIp,
    getEmbedFrameAncestors: () => undefined,
  })
}

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

describe('BFF proxies: upstream header hygiene', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function capturedHeaders(spy: ReturnType<typeof vi.fn>): Headers {
    const [input, init] = spy.mock.calls[0] ?? []
    if (input instanceof Request) {
      return input.headers
    }
    return new Headers((init as RequestInit | undefined)?.headers)
  }

  const edgeHeaders = {
    via: '1.1 abcdef.cloudfront.net (CloudFront)',
    'x-amz-cf-id': 'cf-id',
    'x-origin-verify': 'secret',
    'x-keep-me': 'yes',
  }

  it.each(['/config/v1/initialize', '/entry-gateway/v1/sessions'])(
    'drops CloudFront hop headers and the origin-verify secret on %s',
    async (path) => {
      const fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }))
      const app = buildApp({ fetchSpy: fetchSpy as unknown as typeof fetch, onResolveEntryGateway: vi.fn() })

      await app.request(path, { method: 'POST', headers: edgeHeaders })

      const headers = capturedHeaders(fetchSpy)
      expect(headers.get('via')).toBeNull()
      expect(headers.get('x-amz-cf-id')).toBeNull()
      expect(headers.get('x-origin-verify')).toBeNull()
      expect(headers.get('x-keep-me')).toBe('yes')
    },
  )
})

describe('/debug/my-ip-address', () => {
  // The flag each bundler bakes in via scripts/debug-routes.ts.
  beforeEach(() => {
    vi.stubEnv('ENABLE_DEBUG_ROUTES', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is nosniff like every other route', async () => {
    const res = await buildApp({ trustedClientIp: '203.0.113.9' }).request('/debug/my-ip-address')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('reports whatever the platform resolver returned', async () => {
    const res = await buildApp({ trustedClientIp: '203.0.113.9' }).request('/debug/my-ip-address')

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('resolved: 203.0.113.9')
  })

  it.each([undefined, ''])('reports unknown when the platform resolves %j', async (trustedClientIp) => {
    const res = await buildApp({ trustedClientIp }).request('/debug/my-ip-address')

    expect(await res.text()).toContain('resolved: unknown')
  })

  // The point of the endpoint: the resolved value must be attributable to a header.
  it('lists every candidate header, present or not', async () => {
    const res = await buildApp({ trustedClientIp: '203.0.113.9' }).request('/debug/my-ip-address', {
      headers: { 'x-forwarded-for': '203.0.113.9, 130.176.1.4' },
    })

    const body = await res.text()
    expect(body).toContain('x-forwarded-for: 203.0.113.9, 130.176.1.4')
    expect(body).toContain('cf-connecting-ip: -')
    expect(body).toContain('cloudfront-viewer-address: -')
    expect(body).toContain('x-real-ip: -')
  })

  it('is never cached', async () => {
    const res = await buildApp({ trustedClientIp: '203.0.113.9' }).request('/debug/my-ip-address')

    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  // Guards the registration order — behind the SPA catch-all this returns HTML.
  it('does not fall through to the SPA shell', async () => {
    const res = await buildApp({ trustedClientIp: '203.0.113.9' }).request('/debug/my-ip-address')

    expect(res.headers.get('content-type')).toContain('text/plain')
  })

  // Falls through to the SPA catch-all (shell at 200, client renders not-found).
  // The unset case is the fail-closed one: only the literal 'true' enables it.
  it.each(['false', '', 'TRUE', undefined])('is not registered when the flag is %j', async (flag) => {
    if (flag === undefined) {
      vi.stubEnv('ENABLE_DEBUG_ROUTES', undefined)
    } else {
      vi.stubEnv('ENABLE_DEBUG_ROUTES', flag)
    }

    const res = await buildApp({ trustedClientIp: '203.0.113.9' }).request('/debug/my-ip-address')

    expect(res.headers.get('content-type')).toContain('text/html')
    expect(await res.text()).not.toContain('203.0.113.9')
  })
})

describe('nosniff', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // A same-origin body whose bytes an attacker shapes on-chain (GetPosition token metadata)
  // must never load as <script src>.
  it('stamps nosniff on proxied entry-gateway responses', async () => {
    const fetchSpy = vi.fn(
      async () => new Response('proto-bytes', { headers: { 'content-type': 'application/proto' } }),
    )
    const app = buildApp({ fetchSpy: fetchSpy as unknown as typeof fetch })

    const res = await app.request('/entry-gateway/v1/sessions', { method: 'POST' })

    expect(res.status).toBe(200)
    expect(await res.text()).toBe('proto-bytes')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('stamps nosniff on proxied config responses', async () => {
    const fetchSpy = vi.fn(async () => new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } }))
    const app = buildApp({ fetchSpy: fetchSpy as unknown as typeof fetch })

    const res = await app.request('/config/v1/initialize')

    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it.each(['/swap', '/', '/api/not-an-image-route'])(
    'keeps nosniff and frame protection on the SPA document at %s',
    async (path) => {
      const res = await buildApp().request(path)

      expect(res.headers.get('content-type')).toContain('text/html')
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
      expect(res.headers.get('content-security-policy')).toContain('frame-ancestors')
    },
  )
})
