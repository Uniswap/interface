import { createSession, type CreateSessionContext } from '@universe/sessions/src/session-gate/createSession'
import { SessionReadyTimeoutError } from '@universe/sessions/src/session-gate/errors'
import type { Session, SessionAdapter } from '@universe/sessions/src/session-gate/types'
import { describe, expect, it, vi } from 'vitest'

type Status = ReturnType<SessionAdapter['getStatus']>
type AdapterBehavior = Partial<SessionAdapter> & { status?: Status; hasData?: boolean }

function fakeAdapter(behavior: AdapterBehavior = {}): SessionAdapter {
  return {
    fetchSession: behavior.fetchSession ?? (() => Promise.resolve()),
    refetchSession: behavior.refetchSession ?? (() => Promise.resolve()),
    getStatus: behavior.getStatus ?? (() => behavior.status ?? 'idle'),
    hasData: behavior.hasData != null ? () => behavior.hasData ?? false : () => false,
    subscribe: behavior.subscribe ?? (() => () => {}),
  }
}

/** Builds a Session over a fake adapter with a controllable clock (frozen at 0 unless overridden). */
function makeSession(
  behavior: AdapterBehavior = {},
  ctx: Partial<Omit<CreateSessionContext, 'adapter'>> = {},
): Session {
  return createSession({ adapter: fakeAdapter(behavior), getNow: (): number => 0, ...ctx })
}

describe('createSession.getState', () => {
  it.each<[Status, boolean, string]>([
    ['idle', false, 'idle'],
    ['pending', false, 'initializing'],
    ['pending', true, 'recovering'],
    ['success', true, 'ready'],
    ['error', false, 'failed'],
  ])('maps adapter (%s, hasData=%s) → %s', (status, hasData, expected) => {
    expect(makeSession({ status, hasData }).getState()).toBe(expected)
  })
})

describe('createSession.ready', () => {
  it('resolves when fetchSession resolves', async () => {
    await expect(makeSession().ready()).resolves.toBeUndefined()
  })

  it('fast-paths an already-successful session without calling fetchSession', async () => {
    // fetchSession would hang forever if called — the fast path must not touch it.
    const fetchSession = vi.fn(() => new Promise<void>(() => {}))
    const session = makeSession({ status: 'success', fetchSession })
    await expect(session.ready()).resolves.toBeUndefined()
    expect(fetchSession).not.toHaveBeenCalled()
  })

  it('fast-paths a failed (error) session without calling fetchSession', async () => {
    // ready() runs on every gated request. Re-running establishment on a terminal
    // error state per request is the challenge-storm bug — surface instead and let
    // recover() (cooldown-bounded) own healing.
    const fetchSession = vi.fn(() => Promise.resolve())
    const session = makeSession({ status: 'error', fetchSession })
    await expect(session.ready()).resolves.toBeUndefined()
    expect(fetchSession).not.toHaveBeenCalled()
  })

  it('rejects with SessionReadyTimeoutError when adapter hangs', async () => {
    vi.useFakeTimers()
    const session = makeSession({ fetchSession: () => new Promise(() => {}) })
    const promise = session.ready({ timeoutMs: 100 })
    vi.advanceTimersByTime(101)
    await expect(promise).rejects.toBeInstanceOf(SessionReadyTimeoutError)
    vi.useRealTimers()
  })

  it('forwards underlying adapter errors', async () => {
    const err = new Error('init failed')
    const session = makeSession({ fetchSession: () => Promise.reject(err) })
    await expect(session.ready()).rejects.toBe(err)
  })
})

describe('createSession.recover', () => {
  it('delegates to adapter refetchSession', async () => {
    const refetch = vi.fn(() => Promise.resolve())
    await makeSession({ refetchSession: refetch }).recover()
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('skips re-establishment within the cooldown window (bounds the sequential 401 storm)', async () => {
    const refetch = vi.fn(() => Promise.resolve())
    let clock = 1000
    const session = makeSession(
      { status: 'error', refetchSession: refetch },
      { getNow: () => clock, recoverCooldownMs: 5000 },
    )
    await session.recover() // first heal fires
    clock = 1100 // 100ms later — same burst, well within cooldown
    await session.recover()
    await session.recover()
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('re-establishes again once the cooldown elapses (heals promptly after the window)', async () => {
    const refetch = vi.fn(() => Promise.resolve())
    let clock = 1000
    const session = makeSession(
      { status: 'error', refetchSession: refetch },
      { getNow: () => clock, recoverCooldownMs: 5000 },
    )
    await session.recover() // fires (1)
    clock = 7000 // past the cooldown
    await session.recover() // fires (2)
    expect(refetch).toHaveBeenCalledTimes(2)
  })

  it('throttles after a failed heal too — a rejecting refetch still arms the cooldown', async () => {
    // The attempt timestamp is armed at heal start, so a persistently-failing session can't
    // re-establish on every request just because each heal rejects.
    const refetch = vi.fn(() => Promise.reject(new Error('heal failed')))
    let clock = 1000
    const session = makeSession(
      { status: 'error', refetchSession: refetch },
      { getNow: () => clock, recoverCooldownMs: 5000 },
    )
    await session.recover().catch(() => undefined) // first heal fires and rejects
    clock = 1100 // within cooldown
    await session.recover().catch(() => undefined)
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('arms the cooldown when ready() establishes, so an immediate 401 recover does not double-establish', async () => {
    const fetchSession = vi.fn(() => Promise.resolve())
    const refetch = vi.fn(() => Promise.resolve())
    let clock = 1000
    const session = makeSession(
      { status: 'idle', fetchSession, refetchSession: refetch },
      { getNow: () => clock, recoverCooldownMs: 5000 },
    )
    await session.ready() // idle → fetchSession establishes; arms the cooldown
    expect(fetchSession).toHaveBeenCalledTimes(1)
    clock = 1100 // same burst
    await session.recover() // within cooldown of the ready() attempt → skip
    expect(refetch).not.toHaveBeenCalled()
  })
})

describe('createSession.subscribe', () => {
  it('delegates to adapter subscribe', () => {
    const subscribe = vi.fn(() => () => {})
    const listener = vi.fn()
    makeSession({ subscribe }).subscribe(listener)
    expect(subscribe).toHaveBeenCalledWith(listener)
  })
})
