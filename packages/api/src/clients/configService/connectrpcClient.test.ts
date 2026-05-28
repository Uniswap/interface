import { rpcPost } from '@universe/api/src/clients/configService/connectrpcClient'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function mockFetch(response: { status: number; body: string }): ReturnType<typeof vi.fn> {
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
