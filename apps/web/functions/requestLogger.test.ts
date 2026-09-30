import { classifyPath, requestLogger } from 'functions/requestLogger'
import { Hono } from 'hono'
import { vi } from 'vitest'

function buildApp(handler: () => Response | Promise<Response>): { app: Hono; logged: () => Record<string, unknown>[] } {
  const lines: Record<string, unknown>[] = []
  vi.spyOn(console, 'log').mockImplementation((line: string) => {
    lines.push(JSON.parse(line))
  })
  const app = new Hono()
  app.get('/health', (c) => c.text('ok'))
  app.use('*', requestLogger())
  app.all('*', handler)
  return { app, logged: () => lines }
}

describe('requestLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('records method, classified path, status and duration', async () => {
    const { app, logged } = buildApp(() => new Response('hi', { status: 200 }))
    await app.request('/explore/tokens/eth/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')

    expect(logged()).toHaveLength(1)
    const [entry] = logged()
    expect(entry).toMatchObject({
      status: 'info',
      message: 'GET /explore/tokens/eth/:id 200',
      http: { method: 'GET', status_code: 200, path: '/explore/tokens/eth/:id' },
    })
    expect(typeof entry.duration_ms).toBe('number')
  })

  it('maps status codes onto Datadog log levels', async () => {
    const { app, logged } = buildApp(() => new Response('', { status: 404 }))
    await app.request('/nope')
    expect(logged()[0]).toMatchObject({ status: 'warn' })

    const server = buildApp(() => new Response('', { status: 503 }))
    await server.app.request('/nope')
    expect(server.logged()[0]).toMatchObject({ status: 'error' })
  })

  // A throwing handler is the request most worth a log line, and it is the one an
  // `await next()` without a finally silently drops.
  it('still logs when the handler throws', async () => {
    const { app, logged } = buildApp(() => {
      throw new Error('boom')
    })
    await app.request('/swap')

    expect(logged()).toHaveLength(1)
    expect(logged()[0]).toMatchObject({ status: 'error', http: { path: '/swap', status_code: 500 } })
  })

  it('leaves ALB health probes out of the log', async () => {
    const { app, logged } = buildApp(() => new Response('unused'))
    await app.request('/health')

    expect(logged()).toEqual([])
  })
})

describe('classifyPath', () => {
  it('leaves bounded route paths intact', () => {
    expect(classifyPath('/swap')).toBe('/swap')
    expect(classifyPath('/explore/tokens/eth/WETH')).toBe('/explore/tokens/eth/WETH')
    expect(classifyPath('/')).toBe('/')
  })

  it('collapses addresses, numeric ids and tx hashes', () => {
    expect(classifyPath('/explore/tokens/eth/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')).toBe(
      '/explore/tokens/eth/:id',
    )
    expect(classifyPath('/positions/v3/ethereum/1234567')).toBe('/positions/v3/ethereum/:id')
  })

  it('collapses every variable segment in one path', () => {
    expect(classifyPath('/positions/0xabc/999')).toBe('/positions/:id/:id')
  })
})
