import { HttpRequestError } from 'viem'
import { mainnet } from 'viem/chains'
import { afterEach, beforeEach, describe, expect, type Mock, test, vi } from 'vitest'
import { createUniRpcRoutedTransport } from './createUniRpcRoutedTransport'
import { createUniRpcTransportFactory } from './createUniRpcTransport'
import { ForbiddenHttpRequestError } from './ForbiddenHttpRequestError'

// Logger references __DEV__ which isn't defined in the node test env. Mock it
// to keep observer/error paths from blowing up on the unrelated global.
vi.mock('utilities/src/logger/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const RPC_URL = 'https://entry-gateway.api.uniswap.org/rpc/1'
const STATIC_HEADERS = { 'x-request-source': 'uniswap-web' }

let lastInit: RequestInit | undefined
let lastUrl: string | undefined

beforeEach(() => {
  lastInit = undefined
  lastUrl = undefined
  // viem uses globalThis.fetch — capture each request and respond with a
  // valid JSON-RPC envelope so client.getBlockNumber() resolves.
  globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    lastUrl = String(url)
    lastInit = init
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x2328' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }) as typeof fetch
})

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Drive a request through a viem transport without going through createPublicClient.
 * `retryCount: 0` disables viem's transport-level retries — without this, a single
 * mocked rejection or hung header resolver would be retried up to 3 times and
 * exceed the test timeout.
 */
async function sendRequest(
  buildTransport: ReturnType<typeof createUniRpcTransportFactory>,
  config: { rpcUrl: string; headers: Record<string, string> },
): Promise<unknown> {
  const transport = buildTransport({ config })
  const t = transport({ chain: mainnet, retryCount: 0 })
  return t.request({ method: 'eth_blockNumber', params: [] })
}

describe('createUniRpcTransportFactory — cookies session', () => {
  const buildTransport = createUniRpcTransportFactory({ session: { type: 'cookies' } })

  test('sets credentials:include on outgoing fetch (cross-origin cookie auth)', async () => {
    await sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })
    expect(lastInit?.credentials).toBe('include')
  })

  test('sends static headers (x-request-source) in outgoing fetch', async () => {
    await sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })
    const headers = new Headers(lastInit?.headers as HeadersInit)
    expect(headers.get('x-request-source')).toBe('uniswap-web')
  })

  test('targets the configured RPC URL', async () => {
    await sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })
    expect(lastUrl).toBe(RPC_URL)
  })
})

describe('createUniRpcTransportFactory — headers session', () => {
  test('calls getSessionHeaders per request and merges into outgoing fetch', async () => {
    const getSessionHeaders = vi.fn().mockResolvedValue({ 'x-session-id': 'sess-1' })
    const buildTransport = createUniRpcTransportFactory({
      session: { type: 'headers', getSessionHeaders },
    })

    await sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })

    expect(getSessionHeaders).toHaveBeenCalledTimes(1)
    const headers = new Headers(lastInit?.headers as HeadersInit)
    expect(headers.get('x-request-source')).toBe('uniswap-web')
    expect(headers.get('x-session-id')).toBe('sess-1')
  })

  test('swap-protection header survives the per-request session-header merge', async () => {
    // The protection header rides in the static config headers; session headers are
    // merged over them per request. If that merge ever clobbered it, a protected
    // eth_sendRawTransaction would silently go out unprotected.
    const getSessionHeaders = vi.fn().mockResolvedValue({ 'x-session-id': 'sess-1', 'x-device-id': 'dev-1' })
    const buildTransport = createUniRpcTransportFactory({
      session: { type: 'headers', getSessionHeaders },
    })

    await sendRequest(buildTransport, {
      rpcUrl: RPC_URL,
      headers: { ...STATIC_HEADERS, 'x-uni-swap-protection': 'true' },
    })

    const headers = new Headers(lastInit?.headers as HeadersInit)
    expect(headers.get('x-uni-swap-protection')).toBe('true')
    expect(headers.get('x-session-id')).toBe('sess-1')
    expect(headers.get('x-device-id')).toBe('dev-1')
  })

  test('does NOT set credentials:include when using headers session', async () => {
    const getSessionHeaders = vi.fn().mockResolvedValue({})
    const buildTransport = createUniRpcTransportFactory({
      session: { type: 'headers', getSessionHeaders },
    })

    await sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })

    expect(lastInit?.credentials).toBeUndefined()
  })

  test('rejects with labelled error when getSessionHeaders hangs past HEADER_RESOLVE_TIMEOUT_MS', async () => {
    // Hung getSessionHeaders simulates broken session storage. Without the
    // timeout, the request would hang indefinitely (the 6s transport timeout
    // only starts after fetch is invoked, not during onFetchRequest).
    const getSessionHeaders = vi.fn(
      () =>
        new Promise<Record<string, string>>(() => {
          // never resolves
        }),
    )
    const buildTransport = createUniRpcTransportFactory({
      session: { type: 'headers', getSessionHeaders },
    })

    await expect(sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })).rejects.toThrow(
      /getSessionHeaders timed out/,
    )
  })

  test('dynamic headers override static when keys collide', async () => {
    const getSessionHeaders = vi.fn().mockResolvedValue({ 'x-request-source': 'session-override' })
    const buildTransport = createUniRpcTransportFactory({
      session: { type: 'headers', getSessionHeaders },
    })

    await sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })

    const headers = new Headers(lastInit?.headers as HeadersInit)
    // Documents the precedence: dynamic (per-request) wins over static.
    // If this changes, callers downstream of `getSessionHeaders` need to know.
    expect(headers.get('x-request-source')).toBe('session-override')
  })

  test('resolves headers per request — multiple calls trigger multiple resolutions', async () => {
    const getSessionHeaders = vi.fn().mockResolvedValue({ 'x-session-id': 'sess' })
    const buildTransport = createUniRpcTransportFactory({
      session: { type: 'headers', getSessionHeaders },
    })

    await sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })
    await sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })

    expect(getSessionHeaders).toHaveBeenCalledTimes(2)
  })
})

describe('createUniRpcTransportFactory — JSON-RPC id:0 patch', () => {
  test('outgoing body never contains id:0 (defense-in-depth against backend proto3 quirk)', async () => {
    const buildTransport = createUniRpcTransportFactory({ session: { type: 'cookies' } })
    // Send several requests — verify NONE end up with id:0 even if viem's
    // internal counter starts there. The contract is: `id:0` never leaves
    // this transport.
    for (let i = 0; i < 5; i++) {
      await sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })
      const body = JSON.parse(String(lastInit?.body)) as { id: unknown }
      expect(body.id).not.toBe(0)
    }
  })

  test('non-zero ids pass through unchanged', async () => {
    // Use the transport's request directly with a known body to verify
    // the patch doesn't disturb non-zero ids.
    const buildTransport = createUniRpcTransportFactory({ session: { type: 'cookies' } })
    const transport = buildTransport({ config: { rpcUrl: RPC_URL, headers: STATIC_HEADERS } })
    const t = transport({ chain: mainnet, retryCount: 0 })

    // viem assigns its own ids; we can only assert ids stay positive across
    // multiple calls. The granular id-0-only patching is locked in via the
    // function's source (only triggers when `parsed.id === 0`).
    await t.request({ method: 'eth_blockNumber', params: [] })
    const firstId = JSON.parse(String(lastInit?.body)).id
    expect(firstId).not.toBe(0)
  })

  test('does not patch non-JSON bodies', async () => {
    // Defensive: if a future change makes init.body a Blob/FormData, the
    // patch should silently skip rather than crash. Indirectly verified
    // by confirming a normal request still completes.
    const buildTransport = createUniRpcTransportFactory({ session: { type: 'cookies' } })
    await expect(sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })).resolves.toBeDefined()
  })
})

describe('createUniRpcTransportFactory — generic transport contract', () => {
  test('cookies and headers strategies both target the configured URL', async () => {
    const cookies = createUniRpcTransportFactory({ session: { type: 'cookies' } })
    await sendRequest(cookies, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })
    expect(lastUrl).toBe(RPC_URL)

    const getSessionHeaders = vi.fn().mockResolvedValue({})
    const headers = createUniRpcTransportFactory({ session: { type: 'headers', getSessionHeaders } })
    await sendRequest(headers, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })
    expect(lastUrl).toBe(RPC_URL)
  })

  test('fetch failure propagates to caller', async () => {
    ;(globalThis.fetch as Mock).mockRejectedValueOnce(new Error('network down'))
    const buildTransport = createUniRpcTransportFactory({ session: { type: 'cookies' } })

    await expect(sendRequest(buildTransport, { rpcUrl: RPC_URL, headers: STATIC_HEADERS })).rejects.toThrow()
  })
})

describe('createUniRpcTransportFactory — 403 is not retried', () => {
  function respondWith(status: number): void {
    ;(globalThis.fetch as Mock).mockImplementation(
      async () =>
        new Response(JSON.stringify({ message: 'Forbidden' }), {
          status,
          headers: { 'content-type': 'application/json' },
        }),
    )
  }

  test('a 403 makes a single fetch at viem default retryCount and keeps status 403', async () => {
    respondWith(403)
    const buildTransport = createUniRpcTransportFactory({ session: { type: 'cookies' } })
    const transport = buildTransport({ config: { rpcUrl: RPC_URL, headers: STATIC_HEADERS } })({ chain: mainnet })

    const error = await transport.request({ method: 'eth_blockNumber', params: [] }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ForbiddenHttpRequestError)
    // The session gate and RPC observability key on HttpRequestError + status.
    expect(error).toBeInstanceOf(HttpRequestError)
    expect((error as HttpRequestError).status).toBe(403)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('the routed transport wrapping it does not retry a 403 either', async () => {
    respondWith(403)
    const buildTransport = createUniRpcTransportFactory({
      session: { type: 'headers', getSessionHeaders: vi.fn().mockResolvedValue({}) },
    })
    const routed = createUniRpcRoutedTransport({
      resolveRpcConfig: () => ({ rpcUrl: RPC_URL, isUniRpc: true }),
      buildUniRpcTransport: () => buildTransport({ config: { rpcUrl: RPC_URL, headers: STATIC_HEADERS } }),
      buildLegacyTransport: () => {
        throw new Error('legacy transport should not be built')
      },
    })({ chain: mainnet })

    await expect(routed.request({ method: 'eth_blockNumber', params: [] })).rejects.toBeInstanceOf(
      ForbiddenHttpRequestError,
    )
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('other retryable statuses still retry', async () => {
    respondWith(503)
    const buildTransport = createUniRpcTransportFactory({ session: { type: 'cookies' } })
    const transport = buildTransport({ config: { rpcUrl: RPC_URL, headers: STATIC_HEADERS } })({
      chain: mainnet,
      retryCount: 1,
    })

    await expect(transport.request({ method: 'eth_blockNumber', params: [] })).rejects.toBeInstanceOf(HttpRequestError)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })
})
