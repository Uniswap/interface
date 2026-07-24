import { createFetchClient } from '@universe/api/src/clients/base/createFetchClient'
import type { Session, SessionService } from '@universe/sessions'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * `x-session-id` must be resolved per underlying request so the gate's
 * recover-and-retry sends the freshly-recovered id — not the stale one
 * captured before the first attempt. On mobile a stale id would 401 again
 * and silently fail recovery.
 */
describe('createFetchClient session-id header', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the recovered session id on the post-401 retry, not the stale one', async () => {
    let sessionId = 'old-session'
    const getSessionService = (): SessionService =>
      ({ getSessionState: async () => ({ sessionId }) }) as unknown as SessionService

    const session: Session = {
      ready: () => Promise.resolve(),
      recover: async () => {
        sessionId = 'new-session'
      },
      getState: () => 'ready',
      subscribe: () => () => {},
    }

    const seenSessionIds: (string | null)[] = []
    let calls = 0
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      seenSessionIds.push(new Headers(init?.headers).get('x-session-id'))
      calls += 1
      return new Response(null, { status: calls === 1 ? 401 : 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = createFetchClient({
      baseUrl: 'https://example.com',
      getSessionService,
      getSession: () => session,
      source: 'test',
    })

    const res = await client.fetch('/path', { method: 'GET' })

    expect((res as Response).status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(seenSessionIds).toEqual(['old-session', 'new-session'])
  })

  it('omits x-session-id when there is no session id (web/cookie auth)', async () => {
    const getSessionService = (): SessionService => ({ getSessionState: async () => null }) as unknown as SessionService

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(new Headers(init?.headers).has('x-session-id')).toBe(false)
      return new Response(null, { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = createFetchClient({ baseUrl: 'https://example.com', getSessionService })
    const res = await client.fetch('/path', { method: 'GET' })

    expect((res as Response).status).toBe(200)
  })
})

describe('createFetchClient onResponse', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const getSessionService = (): SessionService => ({ getSessionState: async () => null }) as unknown as SessionService

  it('invokes onResponse with the raw response so callers can read headers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200, headers: { 'x-experiments': '{"exp":{"value":{}}}' } })),
    )

    const seen: (string | null)[] = []
    const client = createFetchClient({
      baseUrl: 'https://example.com',
      getSessionService,
      onResponse: (response) => seen.push(response.headers.get('x-experiments')),
    })

    await client.fetch('/path', { method: 'GET' })

    expect(seen).toEqual(['{"exp":{"value":{}}}'])
  })

  it('still resolves the response when no onResponse is provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 })),
    )

    const client = createFetchClient({ baseUrl: 'https://example.com', getSessionService })
    const res = await client.fetch('/path', { method: 'GET' })

    expect((res as Response).status).toBe(200)
  })
})
