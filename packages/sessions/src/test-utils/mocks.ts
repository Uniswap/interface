import type { ChallengeSolver, ChallengeSolverService } from '@universe/sessions/src/challenge-solvers/types'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import { BotDetectionType } from '@universe/sessions/src/session-service/types'
import { vi } from 'vitest'

/**
 * Creates a mock SessionService with sensible defaults
 * All methods are vi.fn() mocks that can be overridden
 */
export function createMockSessionService(overrides: Partial<SessionService> = {}): SessionService {
  return {
    getSessionState: vi.fn().mockResolvedValue(null),
    initSession: vi.fn().mockResolvedValue({
      sessionId: 'mock-session-123',
      needChallenge: false,
      extra: {},
    }),
    requestChallenge: vi.fn().mockResolvedValue({
      challengeId: 'mock-challenge-456',
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: { sitekey: 'mock-sitekey' },
    }),
    upgradeSession: vi.fn().mockResolvedValue({
      retry: false,
    }),
    removeSession: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

/**
 * Creates a mock ChallengeSolver
 */
export function createMockChallengeSolver(
  solveFn: () => Promise<string> = async (): Promise<string> => 'mock-solution',
): ChallengeSolver {
  return {
    solve: vi.fn().mockImplementation(solveFn),
  }
}

/**
 * Creates a mock ChallengeSolverService
 */
export function createMockChallengeSolverService(
  solvers: Map<BotDetectionType, ChallengeSolver> = new Map(),
): ChallengeSolverService {
  // Default solvers if not provided
  if (solvers.size === 0) {
    solvers.set(
      BotDetectionType.BOT_DETECTION_TURNSTILE,
      createMockChallengeSolver(async () => 'mock-turnstile-token'),
    )
    solvers.set(
      BotDetectionType.BOT_DETECTION_HASHCASH,
      createMockChallengeSolver(async () => 'mock-hashcash-proof'),
    )
  }

  return {
    getSolver: vi.fn().mockImplementation((type: BotDetectionType) => solvers.get(type) || null),
  }
}

/**
 * Test scenario helpers for common setups
 */
export const TestScenarios = {
  /**
   * Setup for when a session already exists
   */
  withExistingSession(service: SessionService, sessionId = 'existing-session-789'): void {
    vi.mocked(service.getSessionState).mockResolvedValue({ sessionId })
  },

  /**
   * Setup for when initialization requires no challenge
   */
  withNoChallenge(service: SessionService): void {
    vi.mocked(service.getSessionState).mockResolvedValue(null)
    vi.mocked(service.initSession).mockResolvedValue({
      sessionId: 'new-session-111',
      needChallenge: false,
      extra: {},
    })
  },

  /**
   * Setup for when initialization requires a challenge
   */
  withChallengeRequired(service: SessionService, challengeType = BotDetectionType.BOT_DETECTION_TURNSTILE): void {
    vi.mocked(service.getSessionState).mockResolvedValue(null)
    vi.mocked(service.initSession).mockResolvedValue({
      sessionId: 'new-session-222',
      needChallenge: true,
      extra: {},
    })
    vi.mocked(service.requestChallenge).mockResolvedValue({
      challengeId: 'challenge-333',
      botDetectionType: challengeType,
      extra: { sitekey: 'test-sitekey' },
    })
    vi.mocked(service.upgradeSession).mockResolvedValue({
      retry: false,
    })
  },

  /**
   * Setup for when server requests challenge retry
   */
  withServerRetry(service: SessionService, retriesBeforeSuccess = 1): void {
    let attemptCount = 0
    vi.mocked(service.upgradeSession).mockImplementation(async () => {
      attemptCount++
      return {
        retry: attemptCount <= retriesBeforeSuccess,
      }
    })
  },
}
