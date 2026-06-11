import { createSession } from '@universe/sessions/src/session-gate/createSession'
import { SessionReadyTimeoutError } from '@universe/sessions/src/session-gate/errors'
import type { SessionAdapter } from '@universe/sessions/src/session-gate/types'
import { describe, expect, it, vi } from 'vitest'

type Status = ReturnType<SessionAdapter['getStatus']>

function fakeAdapter(behavior: Partial<SessionAdapter> & { status?: Status; hasData?: boolean } = {}): SessionAdapter {
  return {
    fetchSession: behavior.fetchSession ?? (() => Promise.resolve()),
    refetchSession: behavior.refetchSession ?? (() => Promise.resolve()),
    getStatus: behavior.getStatus ?? (() => behavior.status ?? 'idle'),
    hasData: behavior.hasData != null ? () => behavior.hasData ?? false : () => false,
    subscribe: behavior.subscribe ?? (() => () => {}),
  }
}

describe('createSession.getState', () => {
  it.each<[Status, boolean, string]>([
    ['idle', false, 'idle'],
    ['pending', false, 'initializing'],
    ['pending', true, 'recovering'],
    ['success', true, 'ready'],
    ['error', false, 'failed'],
  ])('maps adapter (%s, hasData=%s) → %s', (status, hasData, expected) => {
    expect(createSession(fakeAdapter({ status, hasData })).getState()).toBe(expected)
  })
})

describe('createSession.ready', () => {
  it('resolves when fetchSession resolves', async () => {
    await expect(createSession(fakeAdapter()).ready()).resolves.toBeUndefined()
  })

  it('fast-paths an already-successful session without calling fetchSession', async () => {
    // fetchSession would hang forever if called — the fast path must not touch it.
    const fetchSession = vi.fn(() => new Promise<void>(() => {}))
    const session = createSession(fakeAdapter({ status: 'success', fetchSession }))
    await expect(session.ready()).resolves.toBeUndefined()
    expect(fetchSession).not.toHaveBeenCalled()
  })

  it('rejects with SessionReadyTimeoutError when adapter hangs', async () => {
    vi.useFakeTimers()
    const session = createSession(fakeAdapter({ fetchSession: () => new Promise(() => {}) }))
    const promise = session.ready({ timeoutMs: 100 })
    vi.advanceTimersByTime(101)
    await expect(promise).rejects.toBeInstanceOf(SessionReadyTimeoutError)
    vi.useRealTimers()
  })

  it('forwards underlying adapter errors', async () => {
    const err = new Error('init failed')
    const session = createSession(fakeAdapter({ fetchSession: () => Promise.reject(err) }))
    await expect(session.ready()).rejects.toBe(err)
  })
})

describe('createSession.recover', () => {
  it('delegates to adapter refetchSession', async () => {
    const refetch = vi.fn(() => Promise.resolve())
    await createSession(fakeAdapter({ refetchSession: refetch })).recover()
    expect(refetch).toHaveBeenCalledOnce()
  })
})

describe('createSession.subscribe', () => {
  it('delegates to adapter subscribe', () => {
    const subscribe = vi.fn(() => () => {})
    const listener = vi.fn()
    createSession(fakeAdapter({ subscribe })).subscribe(listener)
    expect(subscribe).toHaveBeenCalledWith(listener)
  })
})
