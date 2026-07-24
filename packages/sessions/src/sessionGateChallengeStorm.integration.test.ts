/**
 * Faithful, deterministic reproduction of the SessionService/Verify challenge storm,
 * matching the mechanism observed in production (Datadog).
 *
 * Real production mechanism (RCA): swap-quote polling (TwoSecondSwapQuotePollingInterval
 * → ~2s) routes every quote through the session-gated `TradingApiClient`
 * (`createTradingApiFetchClient` → `requireSessionFetch`). For a session that can't
 * establish, the old `createSession.ready()` re-ran the FULL `initialize()`
 * (InitSession → Challenge → Verify) on EVERY poll, because it only fast-pathed
 * `success`, not `error`. The quote itself returns 200 (public), so `recover()`/401 is
 * NOT the driver — the re-establishment is purely per-poll `ready()` re-init. Observed
 * fingerprint: one session re-running a full init every ~2s, ~30/min, all failing.
 *
 * This test drives the REAL client chain — `requireSessionFetch` → `createSession` →
 * React Query `fetchQuery` → `sessionInitQuery` → `createSessionInitializationService` —
 * with only the SessionService RPC client and solver substituted (true-external seams).
 * The gated inner returns 200 (a public quote), polled at the real ~2s cadence on a
 * session whose Verify always fails. It counts real `initialize()` cycles (InitSession
 * RPCs) and asserts the INVARIANT that actually distinguishes the bug from the fix:
 *
 *   init cycles are CONSTANT in the number of polls (O(1)), not O(M).
 *
 * Pre-fix: `ready()` re-inits per poll → cycles == polls (O(M)).
 * Post-fix: `ready()` fast-paths `error` → exactly one cycle, regardless of poll count.
 */
import { QueryClient } from '@tanstack/react-query'
import {
  ChallengeResponse,
  ChallengeType,
  GetChallengeTypesResponse,
  InitSessionResponse,
  SignoutResponse,
  VerifyResponse,
} from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createChallengeSolverService } from '@universe/sessions/src/challenge-solvers/createChallengeSolverService'
import type { ChallengeSolver } from '@universe/sessions/src/challenge-solvers/types'
import type { PerformanceTracker } from '@universe/sessions/src/performance/types'
import { createSession } from '@universe/sessions/src/session-gate/createSession'
import { requireSessionFetch } from '@universe/sessions/src/session-gate/requireSessionFetch'
import type { SessionAdapter } from '@universe/sessions/src/session-gate/types'
import { createSessionInitializationService } from '@universe/sessions/src/session-initialization/createSessionInitializationService'
import { sessionInitQuery } from '@universe/sessions/src/session-initialization/sessionInitQuery'
import { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
import { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
import {
  createMockSessionClient,
  defineMockEndpoints,
  InMemoryDeviceIdService,
  InMemorySessionStorage,
  InMemoryUniswapIdentifierService,
} from '@universe/sessions/src/test-utils'
import { describe, expect, it } from 'vitest'

const NOOP_PERF: PerformanceTracker = { now: () => 0 }
const QUOTE_POLL_CADENCE_MS = 2_000 // real swap-quote polling cadence (TwoSecondSwapQuotePollingInterval)

/** A stuck session whose every establishment fails; counts real init cycles + challenges. */
function buildStuckSessionChain(getNow: () => number): {
  gatedQuoteFetch: (input: string) => Promise<Response>
  initCycles: () => number
  challenges: () => number
} {
  let initCount = 0
  let challengeCount = 0
  const sessionStorage = new InMemorySessionStorage()
  const deviceIdService = new InMemoryDeviceIdService()
  const uniswapIdentifierService = new InMemoryUniswapIdentifierService()

  const mockEndpoints = defineMockEndpoints({
    '/uniswap.platformservice.v1.SessionService/InitSession': async () => {
      initCount += 1 // one per full initialize() cycle — the metric that distinguishes O(M) from O(1)
      return new InitSessionResponse({ sessionId: '', needChallenge: true, extra: {} })
    },
    '/uniswap.platformservice.v1.SessionService/Challenge': async () => {
      challengeCount += 1
      return new ChallengeResponse({
        challengeId: `challenge-${challengeCount}`,
        challengeType: ChallengeType.TURNSTILE,
        extra: { challengeData: '{"siteKey":"x","action":"session_verification"}' },
      })
    },
    // Verify always fails → initialize() exhausts retries and throws → query lands in `error`.
    '/uniswap.platformservice.v1.SessionService/Verify': async () => new VerifyResponse({ retry: true }),
    '/uniswap.platformservice.v1.SessionService/GetChallengeTypes': async () =>
      new GetChallengeTypesResponse({ challengeTypes: [] }),
    '/uniswap.platformservice.v1.SessionService/Signout': async () => new SignoutResponse({}),
  })

  const sessionClient = createMockSessionClient(mockEndpoints, sessionStorage, deviceIdService)
  const sessionRepository = createSessionRepository({ client: sessionClient })
  const sessionService = createSessionService({
    sessionStorage,
    deviceIdService,
    uniswapIdentifierService,
    sessionRepository,
  })

  const challengeSolverService = createChallengeSolverService()
  challengeSolverService.getSolver = (type): ChallengeSolver | null =>
    type === ChallengeType.TURNSTILE ? { solve: async () => 'mock-turnstile-token' } : null

  const initService = createSessionInitializationService({
    getSessionService: () => sessionService,
    challengeSolverService,
    performanceTracker: NOOP_PERF,
    getIsSessionUpgradeAutoEnabled: () => true,
  })

  // REAL React Query adapter — mirrors provideSession.ts `bootstrapSession`.
  const queryClient = new QueryClient()
  const queryOptions = sessionInitQuery({ getService: () => initService })
  const adapter: SessionAdapter = {
    fetchSession: async () => {
      await queryClient.fetchQuery(queryOptions)
    },
    refetchSession: async () => {
      await queryClient.refetchQueries({ queryKey: queryOptions.queryKey })
    },
    getStatus: () => queryClient.getQueryState(queryOptions.queryKey)?.status ?? 'idle',
    hasData: () => queryClient.getQueryState(queryOptions.queryKey)?.data != null,
    subscribe: (listener) => queryClient.getQueryCache().subscribe(listener),
  }

  const session = createSession({ adapter, getNow })
  // The gated request is a PUBLIC quote: it succeeds (200). This is the real driver —
  // re-establishment comes from ready() re-running init per poll, NOT from a 401/recover.
  const gatedQuoteFetch = requireSessionFetch({ getSession: () => session, source: 'test' })(
    async () => new Response(null, { status: 200 }),
  )

  return { gatedQuoteFetch, initCycles: () => initCount, challenges: () => challengeCount }
}

/** Polls a stuck session `polls` times at the real ~2s quote cadence; returns init-cycle count. */
async function pollStuckSession(polls: number): Promise<{ initCycles: number; challenges: number }> {
  let clock = 0
  const chain = buildStuckSessionChain(() => clock)
  for (let i = 0; i < polls; i += 1) {
    clock += QUOTE_POLL_CADENCE_MS
    // The first poll's establish rejects (init throws); later polls succeed (200). We are
    // counting init cycles, so swallow the transient rejection.
    await chain.gatedQuoteFetch('https://interface.gateway.uniswap.org/v2/quote').catch(() => undefined)
  }
  return { initCycles: chain.initCycles(), challenges: chain.challenges() }
}

describe('challenge storm — real client chain, real quote-poll mechanism', () => {
  it('re-establishment is constant in poll count (O(1)), not O(M) — the real-storm invariant', async () => {
    const fewPolls = await pollStuckSession(8)
    const manyPolls = await pollStuckSession(24)

    // The bug is that init cycles scale with the number of quote polls. The fix makes them
    // independent of it. Asserting equality across two poll counts encodes exactly that —
    // no hand-picked threshold.
    //   Pre-fix:  fewPolls.initCycles = 8,  manyPolls.initCycles = 24  → not equal → FAIL.
    //   Post-fix: both = 1 (ready() fast-paths `error`)                → equal     → PASS.
    expect(manyPolls.initCycles).toBe(fewPolls.initCycles)
    expect(manyPolls.challenges).toBe(fewPolls.challenges)
  })
})
