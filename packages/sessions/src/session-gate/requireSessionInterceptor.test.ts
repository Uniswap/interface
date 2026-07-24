import { Code, ConnectError } from '@connectrpc/connect'
import { SessionService } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_connect'
import {
  requireSessionInterceptor,
  SESSION_SERVICE_LOOP_BREAKER_TYPE_NAME,
} from '@universe/sessions/src/session-gate/requireSessionInterceptor'
import type { Session } from '@universe/sessions/src/session-gate/types'
import { describe, expect, it, vi } from 'vitest'

function fakeSession(behavior: { recover?: () => Promise<void> } = {}): Session {
  return {
    ready: () => Promise.resolve(),
    recover: behavior.recover ?? (() => Promise.resolve()),
    getState: () => 'ready',
    subscribe: () => () => {},
  }
}

// Minimal request-like shape: only what the interceptor inspects.
const req = (typeName: string): { service: { typeName: string } } => ({ service: { typeName } })

describe('requireSessionInterceptor', () => {
  it('loop-breaker constant is pinned to the generated SessionService.typeName', () => {
    // This is the deadlock guard. If the generated client renames or versions
    // the service, this test fails loudly instead of silently looping.
    expect(SESSION_SERVICE_LOOP_BREAKER_TYPE_NAME).toBe(SessionService.typeName)
    expect(SESSION_SERVICE_LOOP_BREAKER_TYPE_NAME).toBe('uniswap.platformservice.v1.SessionService')
  })

  it('skips gating for SessionService calls (loop-breaker)', async () => {
    const session = fakeSession()
    const readySpy = vi.spyOn(session, 'ready')
    const interceptor = requireSessionInterceptor({ getSession: () => session, source: 'test' })
    const next = vi.fn(async () => 'session-result')
    const result = await interceptor(next as never)(req(SessionService.typeName) as never)
    expect(result).toBe('session-result')
    expect(readySpy).not.toHaveBeenCalled()
  })

  it('passes through when getSession returns null', async () => {
    const interceptor = requireSessionInterceptor({ getSession: () => null, source: 'test' })
    const next = vi.fn(async () => 'ok')
    const result = await interceptor(next as never)(req('some.other.Service') as never)
    expect(result).toBe('ok')
    expect(next).toHaveBeenCalledOnce()
  })

  it('gates non-SessionService calls when session is present', async () => {
    const session = fakeSession()
    const readySpy = vi.spyOn(session, 'ready')
    const interceptor = requireSessionInterceptor({ getSession: () => session, source: 'test' })
    const next = vi.fn(async () => 'ok')
    await interceptor(next as never)(req('some.other.Service') as never)
    expect(readySpy).toHaveBeenCalledOnce()
  })

  it('recovers and retries on Connect Unauthenticated', async () => {
    const session = fakeSession()
    const recoverSpy = vi.spyOn(session, 'recover')
    let attempts = 0
    const next = vi.fn(async () => {
      attempts++
      if (attempts === 1) throw new ConnectError('nope', Code.Unauthenticated)
      return 'ok'
    })
    const interceptor = requireSessionInterceptor({ getSession: () => session, source: 'test' })
    const result = await interceptor(next as never)(req('some.other.Service') as never)
    expect(result).toBe('ok')
    expect(recoverSpy).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledTimes(2)
  })

  it('recovers and retries on Connect PermissionDenied (403 — no session yet)', async () => {
    const session = fakeSession()
    const recoverSpy = vi.spyOn(session, 'recover')
    let attempts = 0
    const next = vi.fn(async () => {
      attempts++
      if (attempts === 1) throw new ConnectError('forbidden', Code.PermissionDenied)
      return 'ok'
    })
    const interceptor = requireSessionInterceptor({ getSession: () => session, source: 'test' })
    const result = await interceptor(next as never)(req('some.other.Service') as never)
    expect(result).toBe('ok')
    expect(recoverSpy).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledTimes(2)
  })
})
