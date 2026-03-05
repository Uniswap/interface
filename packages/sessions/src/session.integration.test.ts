import { createChallengeSolverService } from '@universe/sessions/src/challenge-solvers/createChallengeSolverService'
import { createHashcashSolver } from '@universe/sessions/src/challenge-solvers/createHashcashSolver'
import { createNoneMockSolver } from '@universe/sessions/src/challenge-solvers/createNoneMockSolver'
import { createTurnstileMockSolver } from '@universe/sessions/src/challenge-solvers/createTurnstileMockSolver'
import type { PerformanceTracker } from '@universe/sessions/src/performance/types'
import { createSessionInitializationService } from '@universe/sessions/src/session-initialization/createSessionInitializationService'
import { createSessionClient } from '@universe/sessions/src/session-repository/createSessionClient'
import { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
import { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import { ChallengeType } from '@universe/sessions/src/session-service/types'
import {
  InMemoryDeviceIdService,
  InMemorySessionStorage,
  InMemoryUniswapIdentifierService,
} from '@universe/sessions/src/test-utils'
import {
  createCookieJar,
  createLocalCookieTransport,
} from '@universe/sessions/src/test-utils/createLocalCookieTransport'
import { createLocalHeaderTransport } from '@universe/sessions/src/test-utils/createLocalHeaderTransport'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock performance tracker for testing
function createMockPerformanceTracker(): PerformanceTracker {
  let time = 0
  return {
    now: (): number => {
      time += 100
      return time
    },
  }
}

const BACKEND_URL = 'https://entry-gateway.backend-staging.api.uniswap.org'
// const BACKEND_URL = 'http://localhost:3000'

// =============================================================================
// Web Platform Tests (Turnstile + Hashcash)
// =============================================================================
// Web uses Turnstile (browser CAPTCHA) first, then falls back to Hashcash
describe('Real Backend Integration - Web (Turnstile + Hashcash)', () => {
  let sessionService: SessionService
  let sessionStorage: InMemorySessionStorage
  let cookieJar: Map<string, string>
  let challengeSolverService: ReturnType<typeof createChallengeSolverService>

  beforeAll(() => {
    sessionStorage = new InMemorySessionStorage()
    cookieJar = createCookieJar()

    // Web uses Turnstile first (which will fail with mock), then falls back to hashcash
    const solvers = new Map([
      [ChallengeType.UNSPECIFIED, createNoneMockSolver()],
      [ChallengeType.TURNSTILE, createTurnstileMockSolver()],
      [ChallengeType.HASHCASH, createHashcashSolver({ performanceTracker: createMockPerformanceTracker() })],
    ])

    const transport = createLocalCookieTransport({ baseUrl: BACKEND_URL, cookieJar })
    const sessionClient = createSessionClient({ transport })
    const sessionRepository = createSessionRepository({ client: sessionClient })

    sessionService = createSessionService({
      sessionStorage,
      deviceIdService: new InMemoryDeviceIdService(),
      uniswapIdentifierService: new InMemoryUniswapIdentifierService(),
      sessionRepository,
    })

    challengeSolverService = createChallengeSolverService({ solvers })
  })

  beforeEach(async () => {
    await sessionService.removeSession()
    cookieJar.clear()
    await sessionStorage.clear()
  })

  it('initializes session with cookie, empty response sessionId', async () => {
    const manualInitService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      performanceTracker: createMockPerformanceTracker(),
      getIsSessionUpgradeAutoEnabled: () => false,
    })

    const result = await manualInitService.initialize()

    // Web: Session ID is in the cookie, not in response body
    expect(cookieJar.has('x-session-id')).toBe(true)
    expect(cookieJar.get('x-session-id')).toBeTruthy()

    // Web platform: sessionId is null (stored in cookie, not response body)
    expect(result.sessionId).toBeNull()

    // Session is NOT stored locally yet because challenge is needed
    const sessionState = await sessionService.getSessionState()
    expect(sessionState).toBeNull()
  }, 30000)

  it('receives Turnstile challenge first', async () => {
    const manualInitService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      performanceTracker: createMockPerformanceTracker(),
      getIsSessionUpgradeAutoEnabled: () => false,
    })

    await manualInitService.initialize()

    const challenge = await sessionService.requestChallenge()

    // Web gets Turnstile first (browser-based CAPTCHA)
    expect(challenge.challengeType).toBe(ChallengeType.TURNSTILE)
    expect(challenge.challengeId).toBeTruthy()
  }, 30000)

  it('falls back to Hashcash after Turnstile fails', async () => {
    const manualInitService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      performanceTracker: createMockPerformanceTracker(),
      getIsSessionUpgradeAutoEnabled: () => false,
    })

    await manualInitService.initialize()

    // Get Turnstile challenge
    const turnstileChallenge = await sessionService.requestChallenge()
    expect(turnstileChallenge.challengeType).toBe(ChallengeType.TURNSTILE)

    // Solve with mock Turnstile (will fail)
    const turnstileSolver = challengeSolverService.getSolver(ChallengeType.TURNSTILE)
    const turnstileSolution = await turnstileSolver?.solve({
      challengeId: turnstileChallenge.challengeId,
      challengeType: turnstileChallenge.challengeType,
      extra: turnstileChallenge.extra,
    })

    // Submit Turnstile mock solution
    const turnstileResult = await sessionService.verifySession({
      solution: turnstileSolution || '',
      challengeId: turnstileChallenge.challengeId,
      challengeType: turnstileChallenge.challengeType,
    })

    // Turnstile failed, retry requested
    expect(turnstileResult.retry).toBe(true)

    // Request challenge again - now we get Hashcash
    const hashcashChallenge = await sessionService.requestChallenge()
    expect(hashcashChallenge.challengeType).toBe(ChallengeType.HASHCASH)
    expect(hashcashChallenge.challengeId).toBeTruthy()
  }, 30000)

  it('successfully upgrades session with Hashcash after Turnstile fails', { timeout: 60000, retry: 2 }, async () => {
    const manualInitService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      performanceTracker: createMockPerformanceTracker(),
      getIsSessionUpgradeAutoEnabled: () => false,
    })

    await manualInitService.initialize()

    // Turnstile attempt (fails)
    const turnstileChallenge = await sessionService.requestChallenge()
    const turnstileSolver = challengeSolverService.getSolver(ChallengeType.TURNSTILE)
    const turnstileSolution = await turnstileSolver?.solve({
      challengeId: turnstileChallenge.challengeId,
      challengeType: turnstileChallenge.challengeType,
      extra: turnstileChallenge.extra,
    })

    const turnstileResult = await sessionService.verifySession({
      solution: turnstileSolution || '',
      challengeId: turnstileChallenge.challengeId,
      challengeType: turnstileChallenge.challengeType,
    })
    expect(turnstileResult.retry).toBe(true)

    // Hashcash attempt
    const hashcashChallenge = await sessionService.requestChallenge()
    expect(hashcashChallenge.challengeType).toBe(ChallengeType.HASHCASH)

    const hashcashSolver = challengeSolverService.getSolver(ChallengeType.HASHCASH)
    const hashcashSolution = await hashcashSolver?.solve({
      challengeId: hashcashChallenge.challengeId,
      challengeType: hashcashChallenge.challengeType,
      extra: hashcashChallenge.extra,
    })

    const hashcashResult = await sessionService.verifySession({
      solution: hashcashSolution || '',
      challengeId: hashcashChallenge.challengeId,
      challengeType: hashcashChallenge.challengeType,
    })

    // Success!
    expect(hashcashResult.retry).toBe(false)
  })

  it('completes auto-upgrade flow (Turnstile fail → Hashcash success)', { timeout: 60000, retry: 2 }, async () => {
    const autoInitService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      performanceTracker: createMockPerformanceTracker(),
      getIsSessionUpgradeAutoEnabled: () => true,
    })

    const result = await autoInitService.initialize()

    // Web: Session ID is in cookie, not returned by initSession when challenge is needed
    // After challenge completion, the session is valid but sessionId in result may be empty
    // because initSession originally returned empty sessionId
    expect(cookieJar.has('x-session-id')).toBe(true)
    expect(cookieJar.get('x-session-id')).toBeTruthy()
  })

  it(
    'calls initSession on reinit - backend handles session reuse via cookie',
    { timeout: 60000, retry: 2 },
    async () => {
      const autoInitService = createSessionInitializationService({
        getSessionService: () => sessionService,
        challengeSolverService,
        performanceTracker: createMockPerformanceTracker(),
        getIsSessionUpgradeAutoEnabled: () => true,
      })

      await autoInitService.initialize()

      // Cookie should be set from first init
      expect(cookieJar.has('x-session-id')).toBe(true)
      const originalSessionId = cookieJar.get('x-session-id')

      // Simulate page refresh - call initialize again
      // Backend receives cookie and decides to reuse session
      const reinitService = createSessionInitializationService({
        getSessionService: () => sessionService,
        challengeSolverService,
        performanceTracker: createMockPerformanceTracker(),
        getIsSessionUpgradeAutoEnabled: () => true,
      })

      await reinitService.initialize()

      // Backend should reuse session - cookie remains the same
      expect(cookieJar.get('x-session-id')).toBe(originalSessionId)
    },
  )

  it('fires analytics callbacks during auto-upgrade flow', { timeout: 60000, retry: 2 }, async () => {
    const analytics = {
      onInitStarted: vi.fn(),
      onInitCompleted: vi.fn(),
      onChallengeReceived: vi.fn(),
      onVerifyCompleted: vi.fn(),
    }

    const autoInitService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      performanceTracker: createMockPerformanceTracker(),
      getIsSessionUpgradeAutoEnabled: () => true,
      analytics,
    })

    await autoInitService.initialize()

    // Verify analytics flow
    expect(analytics.onInitStarted).toHaveBeenCalledTimes(1)
    expect(analytics.onInitCompleted).toHaveBeenCalledWith(expect.objectContaining({ needChallenge: true }))
    expect(analytics.onChallengeReceived).toHaveBeenCalled()
    // Verification may be called multiple times due to retries
    expect(analytics.onVerifyCompleted).toHaveBeenCalled()
    // Last call should be success
    const lastVerificationCall = analytics.onVerifyCompleted.mock.calls.at(-1)?.[0]
    expect(lastVerificationCall?.success).toBe(true)
  })

  afterAll(async () => {
    await sessionService.removeSession()
    cookieJar.clear()
    await sessionStorage.clear()
  })
})

// =============================================================================
// Non-Web Platform Tests (Hashcash only)
// =============================================================================
// iOS, Android, and Extension skip Turnstile and go straight to Hashcash
type NonWebPlatform = 'ios' | 'android' | 'extension'
type NonWebRequestSource = 'uniswap-ios' | 'uniswap-android' | 'uniswap-extension'

interface NonWebPlatformConfig {
  platform: NonWebPlatform
  requestSource: NonWebRequestSource
}

const NON_WEB_PLATFORMS: NonWebPlatformConfig[] = [
  { platform: 'ios', requestSource: 'uniswap-ios' },
  { platform: 'android', requestSource: 'uniswap-android' },
  { platform: 'extension', requestSource: 'uniswap-extension' },
]

describe.each(NON_WEB_PLATFORMS)(
  'Real Backend Integration - $platform (Hashcash only)',
  ({ platform: _platform, requestSource }) => {
    let sessionService: SessionService
    let sessionStorage: InMemorySessionStorage
    let deviceIdService: InMemoryDeviceIdService
    let uniswapIdentifierService: InMemoryUniswapIdentifierService
    let challengeSolverService: ReturnType<typeof createChallengeSolverService>

    beforeAll(() => {
      sessionStorage = new InMemorySessionStorage()
      deviceIdService = new InMemoryDeviceIdService()
      uniswapIdentifierService = new InMemoryUniswapIdentifierService()

      // Non-web platforms only use Hashcash (no Turnstile)
      const solvers = new Map([
        [ChallengeType.UNSPECIFIED, createNoneMockSolver()],
        [ChallengeType.HASHCASH, createHashcashSolver({ performanceTracker: createMockPerformanceTracker() })],
      ])

      const transport = createLocalHeaderTransport({
        baseUrl: BACKEND_URL,
        requestSource,
        getSessionId: async () => (await sessionStorage.get())?.sessionId ?? null,
        getDeviceId: async () => deviceIdService.getDeviceId(),
      })

      const sessionClient = createSessionClient({ transport })
      const sessionRepository = createSessionRepository({ client: sessionClient })

      sessionService = createSessionService({
        sessionStorage,
        deviceIdService,
        uniswapIdentifierService,
        sessionRepository,
      })

      challengeSolverService = createChallengeSolverService({ solvers })
    })

    beforeEach(async () => {
      await sessionService.removeSession()
      await sessionStorage.clear()
      await deviceIdService.removeDeviceId()
      await uniswapIdentifierService.removeUniswapIdentifier()
    })

    it('initializes session with session ID and device ID stored locally', async () => {
      const manualInitService = createSessionInitializationService({
        getSessionService: () => sessionService,
        challengeSolverService,
        performanceTracker: createMockPerformanceTracker(),
        getIsSessionUpgradeAutoEnabled: () => false,
      })

      const result = await manualInitService.initialize()

      // Non-web: Backend returns session ID in response, which gets stored locally
      // sessionId is returned regardless of challenge status
      expect(result.sessionId).toBeTruthy()

      // Session IS stored locally (unlike web which uses cookies)
      const sessionState = await sessionService.getSessionState()
      expect(sessionState?.sessionId).toBe(result.sessionId)

      // Device ID should also be returned and stored
      const storedDeviceId = await deviceIdService.getDeviceId()
      expect(storedDeviceId).toBeTruthy()
    }, 30000)

    it('receives Hashcash challenge directly (no Turnstile)', async () => {
      const manualInitService = createSessionInitializationService({
        getSessionService: () => sessionService,
        challengeSolverService,
        performanceTracker: createMockPerformanceTracker(),
        getIsSessionUpgradeAutoEnabled: () => false,
      })

      await manualInitService.initialize()

      const challenge = await sessionService.requestChallenge()

      // Non-web gets Hashcash directly (Turnstile is browser-only)
      expect(challenge.challengeType).toBe(ChallengeType.HASHCASH)
      expect(challenge.challengeId).toBeTruthy()
    }, 30000)

    it('successfully upgrades session with Hashcash', { timeout: 60000, retry: 2 }, async () => {
      const manualInitService = createSessionInitializationService({
        getSessionService: () => sessionService,
        challengeSolverService,
        performanceTracker: createMockPerformanceTracker(),
        getIsSessionUpgradeAutoEnabled: () => false,
      })

      await manualInitService.initialize()

      // Get Hashcash challenge directly
      const hashcashChallenge = await sessionService.requestChallenge()
      expect(hashcashChallenge.challengeType).toBe(ChallengeType.HASHCASH)

      const hashcashSolver = challengeSolverService.getSolver(ChallengeType.HASHCASH)
      const hashcashSolution = await hashcashSolver?.solve({
        challengeId: hashcashChallenge.challengeId,
        challengeType: hashcashChallenge.challengeType,
        extra: hashcashChallenge.extra,
      })

      const hashcashResult = await sessionService.verifySession({
        solution: hashcashSolution || '',
        challengeId: hashcashChallenge.challengeId,
        challengeType: hashcashChallenge.challengeType,
      })

      // Success!
      expect(hashcashResult.retry).toBe(false)
    })

    it('completes auto-upgrade flow', { timeout: 60000, retry: 2 }, async () => {
      const autoInitService = createSessionInitializationService({
        getSessionService: () => sessionService,
        challengeSolverService,
        performanceTracker: createMockPerformanceTracker(),
        getIsSessionUpgradeAutoEnabled: () => true,
      })

      const result = await autoInitService.initialize()

      expect(result.sessionId).toBeTruthy()

      const sessionState = await sessionService.getSessionState()
      expect(sessionState?.sessionId).toBe(result.sessionId)
    })

    it(
      'calls initSession on reinit - backend handles session reuse via X-Session-ID header',
      { timeout: 60000, retry: 2 },
      async () => {
        // First: Complete auto-upgrade flow
        const autoInitService = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: createMockPerformanceTracker(),
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        const firstResult = await autoInitService.initialize()
        expect(firstResult.sessionId).toBeTruthy()
        const originalSessionId = firstResult.sessionId

        // Simulate app refresh - call initialize again
        // Backend receives X-Session-ID header and decides to reuse session
        const reinitService = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: createMockPerformanceTracker(),
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        const secondResult = await reinitService.initialize()

        // Backend should reuse session - session ID remains the same
        expect(secondResult.sessionId).toBe(originalSessionId)
      },
    )

    afterAll(async () => {
      await sessionService.removeSession()
      await sessionStorage.clear()
      await deviceIdService.removeDeviceId()
      await uniswapIdentifierService.removeUniswapIdentifier()
    })
  },
)
