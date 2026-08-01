/**
 * Integration coverage for the REAL app-level session wiring under the stuck-session
 * challenge storm (the Datadog `invalid-input-response` surge on web 5.151.0).
 *
 * The sessions-package storm test (`sessionGateChallengeStorm.integration.test.ts`)
 * drives the real gate chain but rebuilds the React Query adapter inline. This test
 * closes that last substituted seam: it goes through the PRODUCTION `bootstrapSession()`
 * adapter in `provideSession.ts` — module-level singleton, `SharedQueryClient`,
 * queryHash-filtered subscribe, `performance.now` cooldown clock — reached via the
 * production trading fetch-client factory (`createTradingApiFetchClient` →
 * `createFetchClient` → `requireSessionFetch` → `tryProvideSession`), i.e. the exact
 * stack `TradingApiClient` uses for the ~2s swap-quote poll. Only the true-external
 * seams are substituted: the SessionService RPCs, the challenge solver, and global
 * fetch for the (public, 200) quote itself.
 *
 * Invariant (same as the sessions-package storm test): full init cycles (InitSession
 * RPCs) are CONSTANT in the number of gated quote polls — O(1), not O(M).
 */
import { SharedQueryClient } from '@universe/api/src/clients/base/SharedQueryClient'
import { createTradingApiFetchClient } from '@universe/api/src/clients/trading/createTradingApiFetchClient'
import { __resetSessionForTests, bootstrapSession, tryProvideSession } from '@universe/api/src/session/provideSession'
import type { ChallengeSolver, SessionInitializationService, SessionService } from '@universe/sessions'
import {
  ChallengeType,
  createChallengeSolverService,
  createMockSessionClient,
  createSessionInitializationService,
  createSessionRepository,
  createSessionService,
  defineMockEndpoints,
  InMemoryDeviceIdService,
  InMemorySessionStorage,
  InMemoryUniswapIdentifierService,
} from '@universe/sessions'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** A session whose every establishment fails; counts real init cycles + challenges. */
function buildStuckSessionServices(): {
  initService: SessionInitializationService
  sessionService: SessionService
  initCycles: () => number
  challenges: () => number
} {
  let initCount = 0
  let challengeCount = 0
  const sessionStorage = new InMemorySessionStorage()
  const deviceIdService = new InMemoryDeviceIdService()
  const uniswapIdentifierService = new InMemoryUniswapIdentifierService()

  // Handlers return plain objects with the protobuf response shape (incl. the `outcome`
  // oneof on Verify) — the repository only reads plain fields, and this keeps the protobuf
  // codegen package out of @universe/api's dependency graph.
  const mockEndpoints = defineMockEndpoints({
    '/uniswap.platformservice.v1.SessionService/InitSession': async () => {
      initCount += 1 // one per full initialize() cycle — the metric that distinguishes O(M) from O(1)
      return { sessionId: '', needChallenge: true, extra: {} }
    },
    '/uniswap.platformservice.v1.SessionService/Challenge': async () => {
      challengeCount += 1
      return { challengeId: `challenge-${challengeCount}`, challengeType: ChallengeType.TURNSTILE, extra: {} }
    },
    // Verify always fails → initialize() exhausts retries → MaxChallengeRetriesError →
    // the session-init query settles in `error` (SessionError is terminal, no RQ retry).
    '/uniswap.platformservice.v1.SessionService/Verify': async () => ({ retry: true, outcome: { case: undefined } }),
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
    performanceTracker: { now: () => 0 },
    getIsSessionUpgradeAutoEnabled: () => true,
  })

  return { initService, sessionService, initCycles: () => initCount, challenges: () => challengeCount }
}

function resetSingletonState(): void {
  __resetSessionForTests()
  // The session-init query lives on the process-wide SharedQueryClient; drop it so each
  // bootstrap starts from `idle` like a fresh app boot.
  SharedQueryClient.getQueryCache().clear()
}

/**
 * Bootstraps the real singleton against a stuck session, then drives `polls` gated quote
 * requests through the production trading fetch client. Returns real init-cycle counts.
 */
async function pollStuckQuote(polls: number): Promise<{ initCycles: number; challenges: number }> {
  resetSingletonState()
  const services = buildStuckSessionServices()
  bootstrapSession({ getService: () => services.initService })

  const client = createTradingApiFetchClient({
    getBaseUrl: () => 'https://trading.test.uniswap.org',
    getHeaders: () => ({}),
    getSessionService: () => services.sessionService,
    // The production wiring under test: the gate reads the bootstrapped singleton.
    getSession: tryProvideSession,
    source: 'test',
  })

  for (let i = 0; i < polls; i += 1) {
    // The first poll's establish rejects (init settles in `error`); later polls return the
    // 200 quote. We count init cycles, so swallow the transient rejection.
    await client.fetch('/v2/quote', { method: 'GET' }).catch(() => undefined)
  }
  return { initCycles: services.initCycles(), challenges: services.challenges() }
}

describe('bootstrapSession production wiring — stuck-session challenge storm', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    resetSingletonState()
  })

  it('init cycles are constant in quote-poll count through the real SharedQueryClient adapter', async () => {
    // The gated quote is PUBLIC and succeeds — re-establishment pressure comes purely from
    // per-request `ready()`, never from a 401/recover, matching the production mechanism.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 })),
    )

    const fewPolls = await pollStuckQuote(8)
    const manyPolls = await pollStuckQuote(24)

    // The singleton wiring is live: the gated quote path drove session establishment at
    // all (an un-wired gate would leave this at 0 and pass the equality trivially).
    expect(fewPolls.initCycles).toBeGreaterThan(0)

    // The storm invariant: init cycles are independent of poll count — no hand-picked
    // threshold, just O(1) vs O(M).
    //   Pre-fix:  8 vs 24 cycles → not equal → FAIL.
    //   Post-fix: 1 vs 1 (ready() fast-paths `error`) → equal → PASS.
    expect(manyPolls.initCycles).toBe(fewPolls.initCycles)
    expect(manyPolls.challenges).toBe(fewPolls.challenges)
  })
})
