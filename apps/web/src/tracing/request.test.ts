import { Span } from '@sentry/core'
import * as Sentry from '@sentry/react'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { mocked } from 'test-utils/mocked'
import { getTraceContext, patchFetch } from './request'
import { trace } from './trace'
import { OpCode, TraceContext } from './types'

jest.mock('@sentry/react', () => {
  return {
    startInactiveSpan: jest.fn(),
  }
})

const GATEWAY_URL = new URL('https://example.gateway.uniswap.org/path')
const GRAPHQL_URL = new URL('https://example.gateway.uniswap.org/graphql')
const JSON_RPC_URL = new URL('https://mainnet.infura.io/path')
const EXAMPLE_URL = new URL('https://example.com/path')

let span: Span | undefined
const spanMap = new Map<string, Span>()

describe('request', () => {
  describe('traced fetch', () => {
    const fetch = jest.fn()
    const api = { fetch }
    beforeEach(() => {
      fetch.mockResolvedValue(new Response())
      api.fetch = fetch
      patchFetch(api)

      span = undefined
      spanMap.clear()
      mocked(Sentry.startInactiveSpan).mockImplementation((context) => {
        span = new Span(context)
        const startChild = span.startChild.bind(span)
        span.startChild = (context) => {
          span = startChild(context)
          spanMap.set(span.spanId, span)
          return span
        }
        spanMap.set(span.spanId, span)
        return span
      })
    })

    describe('errors', () => {
      describe('2xx', () => {
        it('captures wrapped `error`', async () => {
          fetch.mockResolvedValue(new Response(JSON.stringify({ error: { foo: 'bar' } })))
          await api.fetch(GATEWAY_URL)
          expect(span!.status).toBe('unknown_error')
          expect(span!.data).toHaveProperty('error', { foo: 'bar' })
        })

        it('captures wrapped `errors`', async () => {
          fetch.mockResolvedValue(new Response(JSON.stringify({ errors: [{ foo: 'bar' }] })))
          await api.fetch(GATEWAY_URL)
          expect(span!.status).toBe('unknown_error')
          expect(span!.data).toHaveProperty('error', [{ foo: 'bar' }])
        })
      })

      describe('non-2xx', () => {
        it('captures json', async () => {
          fetch.mockResolvedValue(new Response(JSON.stringify({ foo: 'bar' }), { status: 500 }))
          await api.fetch(GATEWAY_URL)
          expect(span!.status).toBe('unknown_error')
          expect(span!.data).toHaveProperty('error', { foo: 'bar' })
        })

        it('captures text', async () => {
          fetch.mockResolvedValue(new Response('foobar', { status: 500 }))
          await api.fetch(GATEWAY_URL)
          expect(span!.status).toBe('unknown_error')
          expect(span!.data).toHaveProperty('error', 'foobar')
        })
      })
    })

    it('traces a known url', async () => {
      await api.fetch(GATEWAY_URL)
      expect(span!.name).toBe(`${GATEWAY_URL.host} ${GATEWAY_URL.pathname}`)
    })

    it('does not trace an unknown url', async () => {
      await api.fetch(EXAMPLE_URL)
      expect(span).toBeUndefined()
    })

    it('traces an unknown url if already in a traced zone', async () => {
      await trace({ name: 'Test', op: 'test' as OpCode } as TraceContext, () => api.fetch(EXAMPLE_URL))
      expect(span!.name).toBe(`${EXAMPLE_URL.host} ${EXAMPLE_URL.pathname}`)
      const parent = spanMap.get(span!.parentSpanId!)
      expect(parent!.name).toBe('Test')
    })
  })

  describe('getTraceContext', () => {
    it('populates gateway context', () => {
      expect(getTraceContext(GATEWAY_URL)).toEqual({
        name: `${GATEWAY_URL.host} ${GATEWAY_URL.pathname}`,
        op: 'http.client',
        data: { path: GATEWAY_URL.pathname },
        tags: { host: GATEWAY_URL.host },
      })
    })

    it('populates graphql context', () => {
      const init = {
        body: JSON.stringify({
          operationName: 'TestOperation',
          variables: { chain: Chain.Ethereum, address: '0x0000000000000000000000000000000000000000' },
          query: 'query TestOperation {\n  testOperation {\n    id\n    __typename\n  }\n}',
        }),
      }
      expect(getTraceContext(GRAPHQL_URL, init)).toEqual({
        name: `${GRAPHQL_URL.host} TestOperation`,
        op: 'http.graphql.query',
        tags: {
          host: GRAPHQL_URL.host,
          operation: 'TestOperation',
          chain: Chain.Ethereum,
          address: '0x0000000000000000000000000000000000000000',
        },
      })
    })

    it('populates JSON-RPC context', () => {
      const init = {
        body: Buffer.from(JSON.stringify({ method: 'eth_testMethod', params: [], id: 42, jsonrpc: '2.0' })),
      }
      expect(getTraceContext(JSON_RPC_URL, init)).toEqual({
        name: `${JSON_RPC_URL.host} eth_testMethod`,
        op: 'http.json_rpc',
        tags: { host: JSON_RPC_URL.host, method: 'eth_testMethod', chain: Chain.Ethereum },
      })
    })

    describe('unknown hosts', () => {
      it('skips', () => {
        expect(getTraceContext(EXAMPLE_URL)).toBe(false)
      })

      it('populates if forced', () => {
        expect(getTraceContext(EXAMPLE_URL, undefined, true)).toEqual({
          name: `${EXAMPLE_URL.host} ${EXAMPLE_URL.pathname}`,
          op: 'http.client',
          data: { path: EXAMPLE_URL.pathname },
          tags: { host: EXAMPLE_URL.host },
        })
      })
    })
  })
})
