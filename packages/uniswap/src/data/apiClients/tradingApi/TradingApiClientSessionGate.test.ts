/**
 * Un-wiring canary for the swap-quote challenge storm (the regression class #34154
 * introduced): asserts that `TradingApiClient`'s quote path actually flows through the
 * session gate (`createTradingApiFetchClient` → `requireSessionFetch` →
 * `tryProvideSession` → the bootstrapped singleton), and that polling the quote against
 * a session stuck in `error` does NOT re-run establishment per poll.
 *
 * Everything between the quote call and the session singleton is real. Substituted
 * seams: gating flags, the `SessionInitializationService` (a stuck one that counts
 * establishment attempts), the x-session-id lookup (`provideSessionService`, orthogonal
 * to the gate invariant), and global fetch for the public 200 quote.
 */
vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    getFeatureFlag: vi.fn().mockReturnValue(false),
    getExperimentValueFromLayer: vi.fn().mockReturnValue(false),
    waitForStatsigReady: vi.fn().mockResolvedValue(undefined),
    // The flag under test: session service ON, i.e. the production storm configuration.
    getIsSessionServiceEnabled: vi.fn().mockReturnValue(true),
  }
})

vi.mock('@universe/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/api')>()
  return {
    ...actual,
    // Stub only the per-request x-session-id lookup; web uses cookies so a null session
    // state is the realistic value. The gate itself stays fully real.
    provideSessionService: vi.fn(() => ({ getSessionState: async () => null })),
  }
})

const mockFetch = vi.fn()
global.fetch = mockFetch

import { TradingApi } from '@universe/api'
import { SharedQueryClient } from '@universe/api/src/clients/base/SharedQueryClient'
import { __resetSessionForTests, bootstrapSession } from '@universe/api/src/session/provideSession'
import { MaxChallengeRetriesError, type SessionInitializationService } from '@universe/sessions'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'

const QUOTE_PARAMS: TradingApi.QuoteRequest = {
  type: TradingApi.TradeType.EXACT_INPUT,
  amount: '1000000000000000000',
  tokenInChainId: 1 as TradingApi.ChainId,
  tokenOutChainId: 1 as TradingApi.ChainId,
  tokenIn: '0x0000000000000000000000000000000000000000',
  tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  swapper: '0x1234567890abcdef1234567890abcdef12345678',
}

/** An init service that is permanently stuck, counting real establishment attempts. */
function buildStuckInitService(): { initService: SessionInitializationService; initCycles: () => number } {
  let initCount = 0
  return {
    initService: {
      initialize: async (): Promise<never> => {
        initCount += 1
        // Exactly what a genuinely stuck session throws after exhausting challenge
        // retries. SessionError subclasses are terminal for the session-init query
        // (no React Query retry), so the query settles in `error`.
        throw new MaxChallengeRetriesError(3, 4)
      },
    },
    initCycles: () => initCount,
  }
}

function resetSingletonState(): void {
  __resetSessionForTests()
  // The session-init query lives on the process-wide SharedQueryClient; drop it so each
  // bootstrap starts from `idle` like a fresh app boot.
  SharedQueryClient.getQueryCache().clear()
}

/**
 * Bootstraps the real session singleton against a stuck session, then polls the REAL
 * `TradingApiClient.fetchQuote` `polls` times. Returns establishment-attempt count.
 */
async function pollQuoteAgainstStuckSession(polls: number): Promise<number> {
  resetSingletonState()
  const { initService, initCycles } = buildStuckInitService()
  bootstrapSession({ getService: () => initService })

  for (let i = 0; i < polls; i += 1) {
    // The first poll's establish rejects (init settles in `error`); later polls return
    // the 200 quote. We count init cycles, so swallow the transient rejection.
    await TradingApiClient.fetchQuote(QUOTE_PARAMS).catch(() => undefined)
  }
  return initCycles()
}

describe('TradingApiClient quote path — session gate wiring', () => {
  beforeEach(() => {
    // The quote itself is public and succeeds — matching the production storm, where
    // re-establishment pressure came purely from per-request ready(), never a 401.
    mockFetch.mockImplementation(async () => new Response(JSON.stringify({}), { status: 200 }))
  })

  afterEach(() => {
    resetSingletonState()
  })

  it('routes quotes through the session gate without re-running establishment per poll', async () => {
    const fewPolls = await pollQuoteAgainstStuckSession(8)
    const manyPolls = await pollQuoteAgainstStuckSession(24)

    // (a) The quote path IS gated: fetching quotes drove session establishment. If the
    // client were re-wired around `requireSessionFetch`/`tryProvideSession` (the #34154
    // regression), no establishment would ever run and this would be 0.
    expect(fewPolls).toBeGreaterThan(0)

    // (b) The storm invariant: establishment attempts are independent of poll count —
    // O(1), not O(M). No hand-picked threshold, just equality across two poll counts.
    expect(manyPolls).toBe(fewPolls)

    // Quotes still reach the network once the session settles — a stuck session degrades
    // to ungated-like behavior instead of blocking the (public) quote.
    expect(mockFetch).toHaveBeenCalled()
  })
})
