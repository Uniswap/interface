import { gated } from '@universe/sessions/src/session-gate/createGate'
import { SessionReadyTimeoutError, SessionRecoveryFailedError } from '@universe/sessions/src/session-gate/errors'
import type { Session } from '@universe/sessions/src/session-gate/types'
import type { Logger } from 'utilities/src/logger/logger'
import { describe, expect, it, vi } from 'vitest'

function fakeSession(behavior: { ready?: () => Promise<void>; recover?: () => Promise<void> } = {}): Session {
  return {
    ready: behavior.ready ?? (() => Promise.resolve()),
    recover: behavior.recover ?? (() => Promise.resolve()),
    getState: () => 'ready',
    subscribe: () => () => {},
  }
}

interface CapturedCall {
  level: string
  event: string
  tags?: { source?: string }
  extra?: Record<string, unknown>
}

function fakeLogger(): { logger: Logger; calls: CapturedCall[] } {
  const calls: CapturedCall[] = []
  const record =
    (level: string) =>
    (
      _file: string,
      event: string,
      _msg: string,
      extras?: { tags?: { source?: string }; extra?: Record<string, unknown> },
    ): void => {
      calls.push({ level, event, tags: extras?.tags, extra: extras?.extra })
    }
  return {
    calls,
    logger: { info: record('info'), warn: record('warn'), error: record('error'), debug: record('debug') } as Logger,
  }
}

const isUnauthError = (err: unknown): boolean => err instanceof Error && err.message === '401'
const baseOpts = { source: 'test' as const, isUnauthError }

describe('gated (throw-based)', () => {
  it('awaits ready, then calls', async () => {
    const order: string[] = []
    const session = fakeSession({ ready: async () => void order.push('ready') })
    const call = vi.fn(async () => {
      order.push('call')
      return 'ok'
    })
    await gated({ ...baseOpts, session, call })
    expect(order).toEqual(['ready', 'call'])
  })

  it('returns the result on success without logging', async () => {
    const { logger, calls } = fakeLogger()
    const result = await gated({
      ...baseOpts,
      session: fakeSession(),
      call: async () => 'ok',
      getLogger: () => logger,
    })
    expect(result).toBe('ok')
    expect(calls).toEqual([])
  })

  it('does not retry non-session errors', async () => {
    const err = new Error('boom')
    const call = vi.fn(async () => {
      throw err
    })
    await expect(gated({ ...baseOpts, session: fakeSession(), call })).rejects.toBe(err)
    expect(call).toHaveBeenCalledOnce()
  })

  it('recovers, retries once, and logs the lifecycle on a 401', async () => {
    const { logger, calls } = fakeLogger()
    let attempts = 0
    const call = vi.fn(async () => {
      attempts++
      if (attempts === 1) throw new Error('401')
      return 'ok'
    })
    const result = await gated({ ...baseOpts, session: fakeSession(), call, getLogger: () => logger })
    expect(result).toBe('ok')
    expect(call).toHaveBeenCalledTimes(2)
    expect(calls.map((c) => c.event)).toEqual(['recover.start', 'retry.success'])
    expect(calls.every((c) => c.tags?.source === 'test')).toBe(true)
  })

  it('logs retry.failure with safe error fields (not raw error) when retry still throws', async () => {
    const { logger, calls } = fakeLogger()
    const call = vi.fn(async () => {
      throw new Error('401')
    })
    await expect(gated({ ...baseOpts, session: fakeSession(), call, getLogger: () => logger })).rejects.toBeInstanceOf(
      Error,
    )
    expect(calls.map((c) => c.event)).toEqual(['recover.start', 'retry.failure'])
    const retryFailure = calls[1]?.extra
    expect(retryFailure).toMatchObject({ errorName: 'Error', errorMessage: '401' })
    expect(retryFailure).not.toHaveProperty('error') // raw error object never logged
  })

  it('throws SessionRecoveryFailedError preserving original error and cause', async () => {
    const { logger, calls } = fakeLogger()
    const recoveryError = new Error('recovery boom')
    const originalError = new Error('401')
    const session = fakeSession({ recover: () => Promise.reject(recoveryError) })
    let caught: unknown
    try {
      await gated({
        ...baseOpts,
        session,
        call: () => Promise.reject(originalError),
        getLogger: () => logger,
      })
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(SessionRecoveryFailedError)
    const err = caught as SessionRecoveryFailedError
    expect(err.originalError).toBe(originalError)
    expect(err.recoveryError).toBe(recoveryError)
    expect(err.cause).toBe(recoveryError)
    // Raw payloads must not leak through default serialization.
    expect(Object.keys(err)).not.toContain('originalError')
    expect(Object.keys(err)).not.toContain('recoveryError')
    expect(JSON.stringify(err)).not.toContain('originalError')
    expect(calls.map((c) => c.event)).toEqual(['recover.start', 'recover.failure'])
    expect(calls[1]?.extra).toMatchObject({ errorName: 'Error', errorMessage: 'recovery boom' })
  })

  it('logs ready.timeout when session.ready throws SessionReadyTimeoutError', async () => {
    const { logger, calls } = fakeLogger()
    const session = fakeSession({ ready: () => Promise.reject(new SessionReadyTimeoutError(100)) })
    await expect(
      gated({
        ...baseOpts,
        session,
        call: async () => 'ok',
        getLogger: () => logger,
      }),
    ).rejects.toBeInstanceOf(SessionReadyTimeoutError)
    expect(calls).toEqual([
      { level: 'warn', event: 'ready.timeout', tags: { source: 'test' }, extra: { timeoutMs: 100 } },
    ])
  })

  it('logs ready.failure for non-timeout ready rejections', async () => {
    const { logger, calls } = fakeLogger()
    const initError = new Error('init boom')
    const session = fakeSession({ ready: () => Promise.reject(initError) })
    await expect(gated({ ...baseOpts, session, call: async () => 'ok', getLogger: () => logger })).rejects.toBe(
      initError,
    )
    expect(calls).toEqual([
      {
        level: 'warn',
        event: 'ready.failure',
        tags: { source: 'test' },
        extra: { errorName: 'Error', errorMessage: 'init boom' },
      },
    ])
  })

  it('propagates ready() rejection without calling', async () => {
    const readyError = new Error('ready boom')
    const call = vi.fn(async () => 'ok')
    await expect(
      gated({ ...baseOpts, session: fakeSession({ ready: () => Promise.reject(readyError) }), call }),
    ).rejects.toBe(readyError)
    expect(call).not.toHaveBeenCalled()
  })
})

describe('gated (result-based, for fetch-shaped wrappers)', () => {
  const isUnauthResult = (r: { status: number }): boolean => r.status === 401

  it('returns the result when isUnauthResult is false', async () => {
    const result = await gated({
      session: fakeSession(),
      call: async () => ({ status: 200, body: 'ok' }),
      isUnauthResult,
      source: 'test',
    })
    expect(result).toEqual({ status: 200, body: 'ok' })
  })

  it('recovers and retries when the first result is 401', async () => {
    const { logger, calls } = fakeLogger()
    let attempts = 0
    const result = await gated({
      session: fakeSession(),
      call: async () => {
        attempts++
        return { status: attempts === 1 ? 401 : 200, body: 'ok' }
      },
      isUnauthResult,
      source: 'test',
      getLogger: () => logger,
    })
    expect(result).toEqual({ status: 200, body: 'ok' })
    expect(attempts).toBe(2)
    expect(calls.map((c) => c.event)).toEqual(['recover.start', 'retry.success'])
  })

  it('returns the persistent 401 result on retry failure and logs status', async () => {
    const { logger, calls } = fakeLogger()
    const persistent = { status: 401, body: 'still nope' }
    const result = await gated({
      session: fakeSession(),
      call: async () => persistent,
      isUnauthResult,
      source: 'test',
      getLogger: () => logger,
    })
    expect(result).toBe(persistent)
    expect(calls.map((c) => c.event)).toEqual(['recover.start', 'retry.failure'])
    expect(calls[1]?.extra).toMatchObject({ status: 401 })
  })

  it('wraps the persistent 401 result as originalError on recovery failure', async () => {
    const persistent = { status: 401, body: 'fail' }
    const recoveryError = new Error('recovery boom')
    let caught: unknown
    try {
      await gated({
        session: fakeSession({ recover: () => Promise.reject(recoveryError) }),
        call: async () => persistent,
        isUnauthResult,
        source: 'test',
      })
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(SessionRecoveryFailedError)
    expect((caught as SessionRecoveryFailedError).originalError).toBe(persistent)
  })
})
