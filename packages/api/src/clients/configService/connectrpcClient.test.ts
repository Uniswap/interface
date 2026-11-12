import { Environment } from '@universe/environment'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import {
  RpcHttpError,
  isRpcNotFound,
  rpcConnectCode,
  rpcHttpStatus,
  rpcPost,
  rpcUpstreamFromPath,
  upstreamErrorFields,
} from './connectrpcClient'
import { createConfigServerClient } from './createConfigServerClient'

function mockFetch(response: { status: number; body: string }): Mock {
  const fetchMock = vi.fn(async () => ({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    text: async () => response.body,
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('rpcPost', () => {
  beforeEach(() => {
    vi.stubGlobal('AbortSignal', { timeout: vi.fn(() => 'mock-signal') })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('POSTs JSON with merged headers and parses a successful response', async () => {
    const fetchMock = mockFetch({ status: 200, body: JSON.stringify({ value: 42 }) })

    const result = await rpcPost<{ value: number }>(
      'example.com',
      '/service/method',
      { authorization: 'Bearer x' },
      { foo: 'bar' },
    )

    expect(result).toEqual({ value: 42 })
    expect(fetchMock).toHaveBeenCalledWith('example.com/service/method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: 'Bearer x' },
      body: JSON.stringify({ foo: 'bar' }),
      signal: 'mock-signal',
    })
  })

  it('lets caller-provided Content-Type override the default', async () => {
    const fetchMock = mockFetch({ status: 200, body: '{}' })

    await rpcPost('example.com', '/p', { 'Content-Type': 'application/grpc-web+json' }, {})

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/grpc-web+json' })
  })

  it('returns {} when a 2xx response has an unparseable body', async () => {
    mockFetch({ status: 204, body: '' })

    const result = await rpcPost('example.com', '/p', {}, {})

    expect(result).toEqual({})
  })

  it('throws with the response body message on non-2xx', async () => {
    mockFetch({ status: 400, body: JSON.stringify({ message: 'bad input' }) })

    await expect(rpcPost('example.com', '/p', {}, {})).rejects.toThrow('bad input')
  })

  it('throws "HTTP <status>" on non-2xx when the body has no message field', async () => {
    mockFetch({ status: 500, body: JSON.stringify({ code: 'internal' }) })

    await expect(rpcPost('example.com', '/p', {}, {})).rejects.toThrow('HTTP 500')
  })

  it('throws "HTTP <status>" on non-2xx with an unparseable body', async () => {
    mockFetch({ status: 502, body: '<html>bad gateway</html>' })

    await expect(rpcPost('example.com', '/p', {}, {})).rejects.toThrow('HTTP 502')
  })

  it('uses a 10s AbortSignal timeout', async () => {
    const timeoutSpy = vi.fn(() => 'mock-signal')
    vi.stubGlobal('AbortSignal', { timeout: timeoutSpy })
    mockFetch({ status: 200, body: '{}' })

    await rpcPost('example.com', '/p', {}, {})

    expect(timeoutSpy).toHaveBeenCalledWith(10_000)
  })
})

/**
 * Absence and failure arrive down the same channel, and only the status
 * distinguishes them — a Connect error body's `message` is prose the service can
 * reword. Callers that fold a 404 into `null` need the status to survive both the
 * error body and the client's re-wrap.
 */
describe('rpcHttpStatus', () => {
  beforeEach(() => {
    vi.stubGlobal('AbortSignal', { timeout: vi.fn(() => 'mock-signal') })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reports the status of a Connect error body', async () => {
    mockFetch({ status: 404, body: JSON.stringify({ code: 'not_found', message: 'NotFound: nothing here' }) })

    const error = await rpcPost('example.com', '/p', {}, {}).catch((e: unknown) => e)

    expect(rpcHttpStatus(error)).toBe(404)
    expect((error as Error).message).toBe('NotFound: nothing here')
  })

  it('reports the status when the body is not JSON at all', async () => {
    mockFetch({ status: 502, body: '<html>bad gateway</html>' })

    expect(rpcHttpStatus(await rpcPost('example.com', '/p', {}, {}).catch((e: unknown) => e))).toBe(502)
  })

  it('survives the server client naming the method in the message', async () => {
    mockFetch({
      status: 404,
      body: JSON.stringify({
        code: 'not_found',
        message: 'NotFound: There is no current proposal for this parameter.',
      }),
    })
    const client = createConfigServerClient({ environment: Environment.Staging, apiToken: 'token' })

    const error = await client.getProposedParam('/a/b/c').catch((e: unknown) => e)

    expect((error as Error).message).toMatch(/^GetProposedParam failed: /)
    expect(rpcHttpStatus(error)).toBe(404)
  })

  it('is undefined for an error that never came from an RPC', () => {
    expect(rpcHttpStatus(new Error('boom'))).toBeUndefined()
    expect(rpcHttpStatus('not an error')).toBeUndefined()
  })
})

/**
 * The status alone does not separate absence from failure: a gateway 404 for an
 * unrouted path or an undeployed service carries no Connect body, so callers that
 * fold a 404 into `null` need the `code` to confirm the service itself said
 * `not_found`.
 */
describe('rpcConnectCode', () => {
  beforeEach(() => {
    vi.stubGlobal('AbortSignal', { timeout: vi.fn(() => 'mock-signal') })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reports the code of a Connect error body', async () => {
    mockFetch({ status: 404, body: JSON.stringify({ code: 'not_found', message: 'NotFound: nothing here' }) })

    expect(rpcConnectCode(await rpcPost('example.com', '/p', {}, {}).catch((e: unknown) => e))).toBe('not_found')
  })

  it('is undefined when the body is not JSON at all, even on a 404', async () => {
    mockFetch({ status: 404, body: '<html>404 Not Found</html>' })

    const error = await rpcPost('example.com', '/p', {}, {}).catch((e: unknown) => e)

    expect(rpcHttpStatus(error)).toBe(404)
    expect(rpcConnectCode(error)).toBeUndefined()
  })

  it('is undefined when a JSON body carries no code', async () => {
    mockFetch({ status: 404, body: JSON.stringify({ message: 'not found' }) })

    expect(rpcConnectCode(await rpcPost('example.com', '/p', {}, {}).catch((e: unknown) => e))).toBeUndefined()
  })

  it('survives the server client naming the method in the message', async () => {
    mockFetch({
      status: 404,
      body: JSON.stringify({
        code: 'not_found',
        message: 'NotFound: There is no current proposal for this parameter.',
      }),
    })
    const client = createConfigServerClient({ environment: Environment.Staging, apiToken: 'token' })

    expect(rpcConnectCode(await client.getProposedParam('/a/b/c').catch((e: unknown) => e))).toBe('not_found')
  })

  it('is undefined for an error that never came from an RPC', () => {
    expect(rpcConnectCode(new Error('boom'))).toBeUndefined()
    expect(rpcConnectCode('not an error')).toBeUndefined()
  })
})

/**
 * The bodies below are the real ones, not invented shapes.
 *
 * config-service serializes its `NotFound` through Connect's `errorToJson`
 * (`defaultGrpcErrorHandler` → `JSON.stringify(errorToJson(err, {}))`), which emits
 * the code as a snake_case string — reproduced against `@connectrpc/connect@1.4.0`
 * as `{"code":"not_found","message":"NotFound: …"}`. The gateway's own 404 for a
 * path it doesn't route was captured live from
 * `entry-gateway.backend-dev.api.uniswap.org`: also JSON, also a 404, but with no
 * `code`. Absence and an undeployed service are separated by that field alone.
 */
describe('isRpcNotFound', () => {
  beforeEach(() => {
    vi.stubGlobal('AbortSignal', { timeout: vi.fn(() => 'mock-signal') })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('is true for config-service reporting no pending proposal', async () => {
    mockFetch({
      status: 404,
      body: '{"code":"not_found","message":"NotFound: There is no current proposal for this parameter."}',
    })

    expect(isRpcNotFound(await rpcPost('example.com', '/p', {}, {}).catch((e: unknown) => e))).toBe(true)
  })

  it('is true through the server client method-name re-wrap', async () => {
    mockFetch({
      status: 404,
      body: '{"code":"not_found","message":"NotFound: There is no current proposal for this parameter."}',
    })
    const client = createConfigServerClient({ environment: Environment.Staging, apiToken: 'token' })

    expect(isRpcNotFound(await client.getProposedParam('/a/b/c').catch((e: unknown) => e))).toBe(true)
  })

  it('is false for the gateway 404 an undeployed service produces', async () => {
    mockFetch({
      status: 404,
      body: '{"message":"Route POST:/configservice.v1.ConfigService/GetProposedParam not found","error":"Not Found","statusCode":404}',
    })

    expect(isRpcNotFound(await rpcPost('example.com', '/p', {}, {}).catch((e: unknown) => e))).toBe(false)
  })

  it('is false for a 404 whose body is not JSON at all', async () => {
    mockFetch({ status: 404, body: '<html>404 Not Found</html>' })

    expect(isRpcNotFound(await rpcPost('example.com', '/p', {}, {}).catch((e: unknown) => e))).toBe(false)
  })

  it('is false for a 404 carrying a different Connect code', async () => {
    mockFetch({ status: 404, body: '{"code":"unimplemented","message":"Unimplemented: GetProposedParam"}' })

    expect(isRpcNotFound(await rpcPost('example.com', '/p', {}, {}).catch((e: unknown) => e))).toBe(false)
  })

  it('is false for a non-404 that reports not_found', async () => {
    mockFetch({ status: 500, body: '{"code":"not_found","message":"NotFound: something else"}' })

    expect(isRpcNotFound(await rpcPost('example.com', '/p', {}, {}).catch((e: unknown) => e))).toBe(false)
  })

  it('is false for an error that never came from an RPC', () => {
    expect(isRpcNotFound(new Error('boom'))).toBe(false)
    expect(isRpcNotFound('not an error')).toBe(false)
  })
})

describe('rpcUpstreamFromPath', () => {
  it('splits a Connect path into service and rpc', () => {
    expect(rpcUpstreamFromPath('/configservice.v1.ConfigService/GetParameterValue')).toEqual({
      service: 'configservice.v1.ConfigService',
      rpc: 'GetParameterValue',
    })
  })
})

describe('upstreamErrorFields', () => {
  beforeEach(() => {
    vi.stubGlobal('AbortSignal', { timeout: vi.fn(() => 'mock-signal') })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('reports status, code and rpc for a Connect error, through a re-wrap', async () => {
    mockFetch({ status: 400, body: JSON.stringify({ code: 'invalid_argument', message: 'BadRequest: key' }) })

    const rpcError = await rpcPost('example.com', '/svc.v1.Svc/Method', {}, {}).catch((e: unknown) => e)
    const wrapped = new Error('Method failed', { cause: rpcError })

    expect(upstreamErrorFields(wrapped)).toEqual({
      upstream_status: 400,
      upstream_code: 'invalid_argument',
      upstream_service: 'svc.v1.Svc',
      upstream_rpc: 'Method',
    })
  })

  it('omits the code for a code-less gateway 404 so it stays distinguishable from absence', () => {
    const error = new RpcHttpError('Route POST:/x not found', 404, undefined, { service: 's', rpc: 'r' })

    expect(upstreamErrorFields(error)).toEqual({ upstream_status: 404, upstream_service: 's', upstream_rpc: 'r' })
    expect(isRpcNotFound(error)).toBe(false)
  })

  it('is empty for an error that never came from an RPC', () => {
    expect(upstreamErrorFields(new Error('boom'))).toEqual({})
  })
})
