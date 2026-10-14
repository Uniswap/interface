import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FRAME_PROTECTION_HEADERS } from 'functions/frameProtection'
import { staticFiles } from 'functions/staticFiles'
import { Hono } from 'hono'

const SPA_HTML = '<!DOCTYPE html><html><body>spa</body></html>'
const SPA_CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=30'

let clientDir: string
let app: Hono

function writeClientFile(relativePath: string, contents: string): void {
  const path = join(clientDir, relativePath)
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, contents)
}

beforeAll(() => {
  clientDir = mkdtempSync(join(tmpdir(), 'web-client-'))
  writeClientFile('index.html', SPA_HTML)
  writeClientFile('assets/index-abc123.js', 'console.log("chunk")')
  writeClientFile('assets/index-abc123.js.map', '{}')
  writeClientFile('fonts/Basel.woff2', 'woff2')
  writeClientFile('embed.html', '<html>embed</html>')
  writeClientFile('.well-known/apple-app-site-association', '{"applinks":{}}')

  app = new Hono()
  app.use('*', staticFiles(clientDir))
  app.all('*', (c) =>
    c.html(SPA_HTML, 200, {
      'cache-control': SPA_CACHE_CONTROL,
    }),
  )
})

afterAll(() => {
  rmSync(clientDir, { recursive: true, force: true })
})

describe('staticFiles', () => {
  it('serves an existing hashed asset as immutable', async () => {
    const res = await app.request('/assets/index-abc123.js')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/javascript/)
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(await res.text()).toBe('console.log("chunk")')
  })

  it.each(['/assets/index-STALE.js', '/fonts/missing.woff2', '/static/js/missing.js', '/favicon.ico'])(
    '404s a missing build-output file at %s instead of serving the SPA shell',
    async (path) => {
      const res = await app.request(path)
      expect(res.status).toBe(404)
      expect(res.headers.get('cache-control')).toBe('no-store')
      expect(await res.text()).toBe('')
    },
  )

  it('never serves sourcemaps under a build-output prefix, even when the file exists', async () => {
    const res = await app.request('/assets/index-abc123.js.map')
    expect(res.status).toBe(404)
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it.each(['/swap', '/explore/tokens/ethereum/0xdac17f958d2ee523a2206206994597c13d831ec7', '/'])(
    'falls through to the SPA shell for the route %s',
    async (path) => {
      const res = await app.request(path)
      expect(res.status).toBe(200)
      expect(res.headers.get('cache-control')).toBe(SPA_CACHE_CONTROL)
      expect(await res.text()).toBe(SPA_HTML)
    },
  )

  it('falls through to the SPA shell for a missing dotted path outside the build-output prefixes', async () => {
    const res = await app.request('/vitalik.eth')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(SPA_HTML)
  })

  it('falls through for /index.html so the SPA handler owns its headers', async () => {
    const res = await app.request('/index.html')
    expect(res.headers.get('cache-control')).toBe(SPA_CACHE_CONTROL)
  })

  it('serves other .html files from disk with frame protection', async () => {
    const res = await app.request('/embed.html')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('<html>embed</html>')
    for (const [name, value] of Object.entries(FRAME_PROTECTION_HEADERS)) {
      expect(res.headers.get(name)).toBe(value)
    }
  })

  it('serves the extensionless well-known doc as JSON', async () => {
    const res = await app.request('/.well-known/apple-app-site-association')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/json')
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600')
  })

  it('leaves non-GET requests to the app even under a build-output prefix', async () => {
    const res = await app.request('/assets/index-STALE.js', { method: 'POST' })
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(SPA_HTML)
  })
})
