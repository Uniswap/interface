/**
 * Gate-level regression guard for the recover-driven branch of the SessionService/Verify
 * challenge storm.
 *
 * Sociable test: the real `requireSessionFetch` gate + real `createSession`, with a fake
 * `SessionAdapter` (a real seam, no mocks) whose every establishment fails. The gated inner
 * returns 401, so each request exercises the gate's `recover()` path. This complements the
 * end-to-end `sessionGateChallengeStorm.integration.test.ts`, which covers the `ready()`/200
 * branch — the branch actually observed in production.
 *
 * Asserts the bug-vs-fix invariant with no hand-picked threshold: re-establishment is
 * constant in the number of gated requests, not O(M).
 *   Pre-fix:  ready() re-inits on `error` + recover() re-establishes per request → O(M).
 *   Post-fix: ready() fast-paths `error` + recover() cooldown                    → constant.
 */
import { createSession } from '@universe/sessions/src/session-gate/createSession'
import { requireSessionFetch } from '@universe/sessions/src/session-gate/requireSessionFetch'
import type { SessionAdapter } from '@universe/sessions/src/session-gate/types'
import { describe, expect, it } from 'vitest'

/** Fires `requests` sequential gated 401s on a never-establishing session; returns the establish count. */
async function pollFailingGate(requests: number): Promise<number> {
  let establishCount = 0
  let status: ReturnType<SessionAdapter['getStatus']> = 'idle'
  let clock = 0
  const establish = async (): Promise<void> => {
    establishCount += 1
    status = 'error'
  }
  const adapter: SessionAdapter = {
    fetchSession: establish,
    refetchSession: establish,
    getStatus: () => status,
    hasData: () => false,
    subscribe: () => () => {},
  }
  const session = createSession({ adapter, getNow: () => clock, recoverCooldownMs: 5000 })
  const gatedFetch = requireSessionFetch({ getSession: () => session, source: 'test' })(
    async () => new Response(null, { status: 401 }),
  )
  for (let i = 0; i < requests; i += 1) {
    clock += 50 // within the cooldown window
    await gatedFetch('https://x').catch(() => undefined)
  }
  return establishCount
}

describe('challenge storm (recover path) — gate-level guard', () => {
  it('re-establishment is constant in request count, not O(M)', async () => {
    const fewRequests = await pollFailingGate(8)
    const manyRequests = await pollFailingGate(24)
    // Pre-fix: few ≈ 16, many ≈ 48 (re-establish per request) → not equal → FAIL.
    // Post-fix: both = 1 (ready() fast-path + recover() cooldown) → equal → PASS.
    expect(manyRequests).toBe(fewRequests)
  })
})
