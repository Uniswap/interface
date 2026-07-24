// @vitest-environment node
import { STAGING_ENTRY_GATEWAY_API_BASE_URL as GATEWAY_BASE_URL } from '@universe/sessions/src/entryGatewayUrls'
import type {
  HeadlessSessionClient,
  HeadlessSessionHeaders,
} from '@universe/sessions/src/headless/createHeadlessSessionClient'
import { createSessionTransport } from '@universe/sessions/src/headless/createSessionTransport'
import { mainnet } from 'viem/chains'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const HEADERS_A: HeadlessSessionHeaders = {
  'x-request-source': 'uniswap-extension',
  'X-Session-ID': 'session-a',
  'X-Device-ID': 'device-a',
}

const HEADERS_B: HeadlessSessionHeaders = {
  'x-request-source': 'uniswap-extension',
  'X-Session-ID': 'session-b',
  'X-Device-ID': 'device-b',
}

interface StubSessionClient extends HeadlessSessionClient {
  getSessionHeaders: ReturnType<typeof vi.fn>
  recover: ReturnType<typeof vi.fn>
}

function createStubSessionClient(headers: HeadlessSessionHeaders = HEADERS_A): StubSessionClient {
  return {
    getSessionHeaders: vi.fn().mockResolvedValue(headers),
    recover: vi.fn().mockResolvedValue(undefined),
  }
}

interface CapturedRequest {
  url: string
  headers: Headers
  body: { jsonrpc: string; id: number; method: string }
}

let captured: CapturedRequest[]

function stubFetch(...responses: (() => Response)[]): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    captured.push({
      url: String(url),
      headers: new Headers(init?.headers as HeadersInit),
      body: JSON.parse(init?.body as string),
    })
    const next = responses.length > 0 ? responses.shift()! : (): Response => okResponse()
    return next()
  })
  globalThis.fetch = fetchMock as typeof fetch
  return fetchMock
}

function okResponse(result = '0x2328'): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'Unauthenticated' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  captured = []
})

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Drive one JSON-RPC request through the factory without createPublicClient.
 * `retryCount: 0` disables viem's transport-level retries so a mocked failure
 * is observed exactly once per request() call.
 */
async function sendRequest(transportFor: ReturnType<typeof createSessionTransport>, chainId = 1): Promise<unknown> {
  const transport = transportFor(chainId)({ chain: mainnet, retryCount: 0 })
  return transport.request({ method: 'eth_blockNumber' })
}

describe('createSessionTransport', () => {
  // Must run first in this file: viem's shared JSON-RPC id counter starts at 0
  // in a fresh module registry, so the file's first request is the id:0 case.
  describe('JSON-RPC id rewrite', () => {
    it('rewrites the initial id:0 to a positive id before the body leaves the transport', async () => {
      stubFetch()
      const transportFor = createSessionTransport({ client: createStubSessionClient() })

      await sendRequest(transportFor)

      expect(captured[0]?.body.id).toBe(1)
    })

    it('passes non-zero ids through unchanged', async () => {
      stubFetch()
      const transportFor = createSessionTransport({ client: createStubSessionClient() })

      // viem's counter is past 0 now — these ids must not be rewritten.
      await sendRequest(transportFor)
      await sendRequest(transportFor)

      expect(captured.map((r) => r.body.id)).toEqual([1, 2])
    })
  })

  describe('session header injection', () => {
    it('merges session headers from the client into every outgoing fetch', async () => {
      stubFetch()
      const client = createStubSessionClient()
      const transportFor = createSessionTransport({ client })

      await sendRequest(transportFor)

      const headers = captured[0]!.headers
      expect(headers.get('x-request-source')).toBe('uniswap-extension')
      expect(headers.get('X-Session-ID')).toBe('session-a')
      expect(headers.get('X-Device-ID')).toBe('device-a')
      expect(headers.get('Content-Type')).toBe('application/json')
    })

    it('resolves headers per request — a session change is visible on the next request', async () => {
      stubFetch()
      const client = createStubSessionClient()
      const transportFor = createSessionTransport({ client })

      await sendRequest(transportFor)
      client.getSessionHeaders.mockResolvedValue(HEADERS_B)
      await sendRequest(transportFor)

      expect(captured[0]!.headers.get('X-Session-ID')).toBe('session-a')
      expect(captured[1]!.headers.get('X-Session-ID')).toBe('session-b')
    })
  })

  describe('routing', () => {
    it('targets {gatewayBaseUrl}/rpc/{chainId}', async () => {
      stubFetch()
      const transportFor = createSessionTransport({
        client: createStubSessionClient(),
        gatewayBaseUrl: GATEWAY_BASE_URL,
      })

      await sendRequest(transportFor, 1)
      await sendRequest(transportFor, 8453)

      expect(captured[0]?.url).toBe(`${GATEWAY_BASE_URL}/rpc/1`)
      expect(captured[1]?.url).toBe(`${GATEWAY_BASE_URL}/rpc/8453`)
    })
  })

  describe('401 recovery', () => {
    it('recovers once and retries with fresh headers on 401', async () => {
      const fetchMock = stubFetch(unauthorizedResponse, () => okResponse('0x10'))
      const client = createStubSessionClient()
      client.recover.mockImplementation(async () => {
        client.getSessionHeaders.mockResolvedValue(HEADERS_B)
      })
      const transportFor = createSessionTransport({ client })

      const result = await sendRequest(transportFor)

      expect(result).toBe('0x10')
      expect(client.recover).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(captured[1]!.headers.get('X-Session-ID')).toBe('session-b')
    })

    it('does not retry more than once — a second 401 propagates', async () => {
      const fetchMock = stubFetch(unauthorizedResponse, unauthorizedResponse)
      const client = createStubSessionClient()
      const transportFor = createSessionTransport({ client })

      await expect(sendRequest(transportFor)).rejects.toThrow(/401/)
      expect(client.recover).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('propagates non-401 failures without recovering', async () => {
      const fetchMock = stubFetch(() => new Response('boom', { status: 500 }))
      const client = createStubSessionClient()
      const transportFor = createSessionTransport({ client })

      await expect(sendRequest(transportFor)).rejects.toThrow(/500/)
      expect(client.recover).not.toHaveBeenCalled()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('timeout', () => {
    it('defaults the request timeout to 6s (UniRPC parity with packages/chains)', () => {
      const transport = createSessionTransport({ client: createStubSessionClient() })(1)({ chain: mainnet })
      expect(transport.config.timeout).toBe(6000)
    })

    it('honors a custom timeout', () => {
      const transport = createSessionTransport({ client: createStubSessionClient(), timeoutMs: 1234 })(1)({
        chain: mainnet,
      })
      expect(transport.config.timeout).toBe(1234)
    })
  })
})
