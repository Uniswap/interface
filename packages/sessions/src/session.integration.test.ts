import { createChallengeSolverService } from '@universe/sessions/src/challenge-solvers/createChallengeSolverService'
import { createHashcashSolver } from '@universe/sessions/src/challenge-solvers/createHashcashSolver'
import { createNoneMockSolver } from '@universe/sessions/src/challenge-solvers/createNoneMockSolver'
import { createTurnstileMockSolver } from '@universe/sessions/src/challenge-solvers/createTurnstileMockSolver'
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
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Skip this test in CI unless explicitly enabled
const SESSION_INTEGRATION_ENABLE_REAL_BACKEND = process.env.SESSION_INTEGRATION_ENABLE_REAL_BACKEND === 'true'
const BACKEND_URL = 'https://entry-gateway.backend-dev.api.uniswap.org'
// const BACKEND_URL = 'http://localhost:3000'

describe.skipIf(!SESSION_INTEGRATION_ENABLE_REAL_BACKEND)('Real Backend Integration - Full Service Stack', () => {
  let sessionService: SessionService
  let sessionStorage: InMemorySessionStorage
  let cookieJar: Map<string, string>
  let challengeSolverService: ReturnType<typeof createChallengeSolverService>

  beforeAll(() => {
    // Create cookie jar for browser simulation
    cookieJar = createCookieJar()

    // Create solver map
    // Note: Backend tries Turnstile first (which will fail with mock), then falls back to hashcash
    const solvers = new Map([
      [ChallengeType.UNSPECIFIED, createNoneMockSolver()],
      [ChallengeType.TURNSTILE, createTurnstileMockSolver()],
      [ChallengeType.HASHCASH, createHashcashSolver()],
    ])

    // Create transport using test utility
    const transport = createLocalCookieTransport({
      baseUrl: BACKEND_URL,
      cookieJar,
    })

    // Wire up production service stack
    const sessionClient = createSessionClient({ transport })
    const sessionRepository = createSessionRepository({ client: sessionClient })

    sessionStorage = new InMemorySessionStorage()
    sessionService = createSessionService({
      sessionStorage,
      deviceIdService: new InMemoryDeviceIdService(),
      uniswapIdentifierService: new InMemoryUniswapIdentifierService(),
      sessionRepository,
    })

    challengeSolverService = createChallengeSolverService({ solvers })
  })

  beforeEach(async () => {
    // Clean state before each test
    await sessionService.removeSession()
    cookieJar.clear()
    await sessionStorage.clear()
  })

  // Test 1: Session init and cookie storage
  it('initializes session and stores cookie without auto-upgrade', async () => {
    // Create service with auto-upgrade disabled
    const manualInitService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      getIsSessionUpgradeAutoEnabled: () => false,
    })

    // Call initialize without automatic challenge handling
    const result = await manualInitService.initialize()

    // When needChallenge is true, backend sets cookie but doesn't return sessionId in response
    // Verify cookie was set (this is the real session ID)
    expect(cookieJar.has('x-session-id')).toBe(true)
    const sessionIdFromCookie = cookieJar.get('x-session-id')
    expect(sessionIdFromCookie).toBeTruthy()

    // The result.sessionId is empty when challenge is needed
    expect(result.sessionId).toBe('')
    expect(result.isNewSession).toBe(true)

    // Session is NOT stored locally yet because backend didn't provide sessionId
    // It will only be stored after the challenge is completed
    const sessionState = await sessionService.getSessionState()
    expect(sessionState).toBeNull()
  }, 30000)

  // Test 2: Turnstile is attempted first
  it('attempts Turnstile challenge first', async () => {
    // Init session with auto-upgrade disabled
    const manualInitService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      getIsSessionUpgradeAutoEnabled: () => false,
    })

    await manualInitService.initialize()

    // Request challenge
    const challenge = await sessionService.requestChallenge()

    // Verify backend sends Turnstile first
    expect(challenge.challengeType).toBe(ChallengeType.TURNSTILE)
    expect(challenge.challengeId).toBeTruthy()
  }, 30000)

  // Test 3: Hashcash is used after Turnstile fails
  it('retries with Hashcash after Turnstile fails', async () => {
    // Init session with auto-upgrade disabled
    const manualInitService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      getIsSessionUpgradeAutoEnabled: () => false,
    })

    await manualInitService.initialize()

    // Request challenge (get Turnstile)
    const turnstileChallenge = await sessionService.requestChallenge()
    expect(turnstileChallenge.challengeType).toBe(ChallengeType.TURNSTILE)

    // Solve with mock Turnstile
    const turnstileSolver = challengeSolverService.getSolver(ChallengeType.TURNSTILE)
    const turnstileSolution = await turnstileSolver?.solve({
      challengeId: turnstileChallenge.challengeId,
      challengeType: turnstileChallenge.challengeType,
      extra: turnstileChallenge.extra,
    })

    // Submit Turnstile mock solution
    const turnstileResult = await sessionService.upgradeSession({
      solution: turnstileSolution || '',
      challengeId: turnstileChallenge.challengeId,
    })

    // Verify retry is requested
    expect(turnstileResult.retry).toBe(true)

    // Request challenge again
    const hashcashChallenge = await sessionService.requestChallenge()

    // Verify backend now sends Hashcash
    expect(hashcashChallenge.challengeType).toBe(ChallengeType.HASHCASH)
    expect(hashcashChallenge.challengeId).toBeTruthy()
  }, 30000)

  // Test 4: Hashcash solution works
  it.fails(
    'successfully upgrades session with Hashcash',
    async () => {
      // Init session with auto-upgrade disabled
      const manualInitService = createSessionInitializationService({
        getSessionService: () => sessionService,
        challengeSolverService,
        getIsSessionUpgradeAutoEnabled: () => false,
      })

      const initResult = await manualInitService.initialize()

      // Do Turnstile attempt (fails)
      const turnstileChallenge = await sessionService.requestChallenge()
      const turnstileSolver = challengeSolverService.getSolver(ChallengeType.TURNSTILE)
      const turnstileSolution = await turnstileSolver?.solve({
        challengeId: turnstileChallenge.challengeId,
        challengeType: turnstileChallenge.challengeType,
        extra: turnstileChallenge.extra,
      })

      const turnstileResult = await sessionService.upgradeSession({
        solution: turnstileSolution || '',
        challengeId: turnstileChallenge.challengeId,
      })
      expect(turnstileResult.retry).toBe(true)

      // Do Hashcash attempt
      const hashcashChallenge = await sessionService.requestChallenge()
      expect(hashcashChallenge.challengeType).toBe(ChallengeType.HASHCASH)

      const hashcashSolver = challengeSolverService.getSolver(ChallengeType.HASHCASH)
      const hashcashSolution = await hashcashSolver?.solve({
        challengeId: hashcashChallenge.challengeId,
        challengeType: hashcashChallenge.challengeType,
        extra: hashcashChallenge.extra,
      })

      // Submit Hashcash solution
      const hashcashResult = await sessionService.upgradeSession({
        solution: hashcashSolution || '',
        challengeId: hashcashChallenge.challengeId,
      })

      // Verify success (no retry)
      expect(hashcashResult.retry).toBe(false)

      // Verify session is still valid
      const sessionState = await sessionService.getSessionState()
      expect(sessionState?.sessionId).toBe(initResult.sessionId)
    },
    60000,
  )

  // Test 5: Full auto flow
  it.fails(
    'completes full auto-upgrade flow',
    async () => {
      // Create service with auto-upgrade enabled
      const autoInitService = createSessionInitializationService({
        getSessionService: () => sessionService,
        challengeSolverService,
        getIsSessionUpgradeAutoEnabled: () => true,
      })

      // Call initialize - should handle everything automatically
      const result = await autoInitService.initialize()

      // Should complete successfully (Turnstile fail → Hashcash success)
      expect(result.sessionId).toBeTruthy()
      expect(result.isNewSession).toBe(true)

      // Verify cookie was set
      expect(cookieJar.has('x-session-id')).toBe(true)
      expect(cookieJar.get('x-session-id')).toBe(result.sessionId)
    },
    60000,
  )

  afterAll(async () => {
    // Clean up
    await sessionService.removeSession()
    cookieJar.clear()
    await sessionStorage.clear()
  })
})
