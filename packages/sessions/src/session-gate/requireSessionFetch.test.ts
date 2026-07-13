import { requireSessionFetch } from '@universe/sessions/src/session-gate/requireSessionFetch'
import type { Session } from '@universe/sessions/src/session-gate/types'
import { describe, expect, it, vi } from 'vitest'

function fakeSession(behavior: { ready?: () => Promise<void>; recover?: () => Promise<void> } = {}): Session {
  return {
    ready: behavior.ready ?? (() => Promise.resolve()),
    recover: behavior.recover ?? (() => Promise.resolve()),
    getState: () => 'ready',
    subscribe: () => () => {},
  }
}

const url = 'https://example.com/rpc'
const res = (status: number): Response => new Response(null, { status })

describe('requireSessionFetch', () => {
  it('passes through when getSession returns null', async () => {
    const inner = vi.fn(async () => res(200))
    const wrapped = requireSessionFetch({ getSession: () => null, source: 'test' })(inner)
    const out = await wrapped(url)
    expect(out.status).toBe(200)
    expect(inner).toHaveBeenCalledOnce()
  })

  it('awaits ready and forwards args when session is present', async () => {
    const session = fakeSession()
    const readySpy = vi.spyOn(session, 'ready')
    const inner = vi.fn(async () => res(200))
    const wrapped = requireSessionFetch({ getSession: () => session, source: 'test' })(inner)
    await wrapped(url, { method: 'POST', body: '{}' })
    expect(readySpy).toHaveBeenCalledOnce()
    expect(inner).toHaveBeenCalledWith(url, { method: 'POST', body: '{}' })
  })

  it('returns non-401 responses unchanged', async () => {
    const inner = vi.fn(async () => res(200))
    const wrapped = requireSessionFetch({ getSession: () => fakeSession(), source: 'test' })(inner)
    const out = await wrapped(url)
    expect(out.status).toBe(200)
    expect(inner).toHaveBeenCalledOnce()
  })

  it('recovers and retries on 401', async () => {
    const session = fakeSession()
    const recoverSpy = vi.spyOn(session, 'recover')
    let calls = 0
    const inner = vi.fn(async () => {
      calls++
      return res(calls === 1 ? 401 : 200)
    })
    const wrapped = requireSessionFetch({ getSession: () => session, source: 'test' })(inner)
    const out = await wrapped(url)
    expect(out.status).toBe(200)
    expect(recoverSpy).toHaveBeenCalledOnce()
    expect(inner).toHaveBeenCalledTimes(2)
  })

  it('recovers and retries on 403 (no session yet)', async () => {
    const session = fakeSession()
    const recoverSpy = vi.spyOn(session, 'recover')
    let calls = 0
    const inner = vi.fn(async () => {
      calls++
      return res(calls === 1 ? 403 : 200)
    })
    const wrapped = requireSessionFetch({ getSession: () => session, source: 'test' })(inner)
    const out = await wrapped(url)
    expect(out.status).toBe(200)
    expect(recoverSpy).toHaveBeenCalledOnce()
    expect(inner).toHaveBeenCalledTimes(2)
  })

  it('returns the 401 response if retry still 401s', async () => {
    const inner = vi.fn(async () => res(401))
    const wrapped = requireSessionFetch({ getSession: () => fakeSession(), source: 'test' })(inner)
    const out = await wrapped(url)
    expect(out.status).toBe(401)
    expect(inner).toHaveBeenCalledTimes(2)
  })
})
