import { SessionReadyTimeoutError, type Session } from '@universe/sessions'
import type { Chain, EIP1193RequestFn, Transport } from 'viem'
import { HttpRequestError } from 'viem'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createSessionGatedTransport } from './createSessionGatedTransport'

// viem's HttpRequestError references __DEV__ at construction. Vite/Vitest
// would replace this at build time in the app; here we polyfill for tests.
beforeAll(() => {
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
})

function fakeSession(behavior: { ready?: () => Promise<void>; recover?: () => Promise<void> } = {}): Session {
  return {
    ready: behavior.ready ?? (() => Promise.resolve()),
    recover: behavior.recover ?? (() => Promise.resolve()),
    getState: () => 'ready',
    subscribe: () => () => {},
  }
}

const fakeChain = { id: 1 } as unknown as Chain

/** Build a fake base Transport with a configurable `request` function. */
function fakeBaseTransport(request: EIP1193RequestFn): Transport {
  return ((_config) => ({
    request,
    config: { key: 'fake', name: 'fake', request, type: 'http' as const, retryCount: 0, timeout: 1_000 },
    value: undefined,
  })) as unknown as Transport
}

const unauthorizedError = new HttpRequestError({
  url: 'https://example.com',
  status: 401,
  body: { error: 'unauthorized' },
  details: 'Unauthorized',
  headers: new Headers(),
})

describe('createSessionGatedTransport', () => {
  it('passes through when getSession returns null', async () => {
    const inner = vi.fn(async () => 'ok')
    const wrapped = createSessionGatedTransport({
      baseTransportFactory: fakeBaseTransport(inner as EIP1193RequestFn),
      getSession: () => null,
      source: 'test',
    })({ chain: fakeChain })
    const result = await wrapped.request({ method: 'eth_chainId' })
    expect(result).toBe('ok')
    expect(inner).toHaveBeenCalledOnce()
  })

  it('awaits ready and forwards request args', async () => {
    const session = fakeSession()
    const readySpy = vi.spyOn(session, 'ready')
    const inner = vi.fn(async () => 'ok')
    const wrapped = createSessionGatedTransport({
      baseTransportFactory: fakeBaseTransport(inner as EIP1193RequestFn),
      getSession: () => session,
      source: 'test',
    })({ chain: fakeChain })
    await wrapped.request({ method: 'eth_blockNumber', params: [] })
    expect(readySpy).toHaveBeenCalledOnce()
    expect(inner).toHaveBeenCalledWith({ method: 'eth_blockNumber', params: [] })
  })

  it('recovers and retries on a 401 HttpRequestError', async () => {
    const session = fakeSession()
    const recoverSpy = vi.spyOn(session, 'recover')
    let calls = 0
    const inner = vi.fn(async () => {
      calls++
      if (calls === 1) throw unauthorizedError
      return 'ok'
    })
    const wrapped = createSessionGatedTransport({
      baseTransportFactory: fakeBaseTransport(inner as EIP1193RequestFn),
      getSession: () => session,
      source: 'test',
    })({ chain: fakeChain })
    const result = await wrapped.request({ method: 'eth_chainId' })
    expect(result).toBe('ok')
    expect(recoverSpy).toHaveBeenCalledOnce()
    expect(inner).toHaveBeenCalledTimes(2)
  })

  it('recovers and retries on a 403 HttpRequestError (no session yet)', async () => {
    const session = fakeSession()
    const recoverSpy = vi.spyOn(session, 'recover')
    const forbiddenError = new HttpRequestError({
      url: 'https://example.com',
      status: 403,
      body: { error: 'forbidden' },
      details: 'Forbidden',
      headers: new Headers(),
    })
    let calls = 0
    const inner = vi.fn(async () => {
      calls++
      if (calls === 1) throw forbiddenError
      return 'ok'
    })
    const wrapped = createSessionGatedTransport({
      baseTransportFactory: fakeBaseTransport(inner as EIP1193RequestFn),
      getSession: () => session,
      source: 'test',
    })({ chain: fakeChain })
    const result = await wrapped.request({ method: 'eth_chainId' })
    expect(result).toBe('ok')
    expect(recoverSpy).toHaveBeenCalledOnce()
    expect(inner).toHaveBeenCalledTimes(2)
  })

  it('does not retry non-auth errors', async () => {
    const session = fakeSession()
    const recoverSpy = vi.spyOn(session, 'recover')
    const otherError = new Error('boom')
    const inner = vi.fn(async () => {
      throw otherError
    })
    const wrapped = createSessionGatedTransport({
      baseTransportFactory: fakeBaseTransport(inner as EIP1193RequestFn),
      getSession: () => session,
      source: 'test',
    })({ chain: fakeChain })
    await expect(wrapped.request({ method: 'eth_chainId' })).rejects.toBe(otherError)
    expect(recoverSpy).not.toHaveBeenCalled()
    expect(inner).toHaveBeenCalledOnce()
  })

  it('throws SessionReadyTimeoutError up through gate when session times out', async () => {
    const session = fakeSession({ ready: () => Promise.reject(new SessionReadyTimeoutError(50)) })
    const inner = vi.fn(async () => 'ok')
    const wrapped = createSessionGatedTransport({
      baseTransportFactory: fakeBaseTransport(inner as EIP1193RequestFn),
      getSession: () => session,
      source: 'test',
    })({ chain: fakeChain })
    await expect(wrapped.request({ method: 'eth_chainId' })).rejects.toBeInstanceOf(SessionReadyTimeoutError)
    expect(inner).not.toHaveBeenCalled()
  })
})
