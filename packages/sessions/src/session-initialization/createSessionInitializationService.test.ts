import type { PerformanceTracker } from '@universe/sessions/src/performance/types'
import { createSessionInitializationService } from '@universe/sessions/src/session-initialization/createSessionInitializationService'
import { ChallengeType } from '@universe/sessions/src/session-service/types'
import {
  createMockChallengeSolverService,
  createMockSessionService,
  TestScenarios,
} from '@universe/sessions/src/test-utils/mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('createSessionInitializationService', () => {
  let sessionService: ReturnType<typeof createMockSessionService>
  let challengeSolverService: ReturnType<typeof createMockChallengeSolverService>
  let mockPerformanceTracker: PerformanceTracker

  beforeEach(() => {
    sessionService = createMockSessionService()
    challengeSolverService = createMockChallengeSolverService()
    mockPerformanceTracker = createMockPerformanceTracker()
  })

  describe('initialize()', () => {
    describe('session initialization', () => {
      it('initializes session without challenge when not required', async () => {
        // Setup
        TestScenarios.withNoChallenge(sessionService)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior
        expect(result).toEqual({
          sessionId: 'new-session-111',
        })

        // Verify correct flow
        expect(sessionService.initSession).toHaveBeenCalled()
        expect(sessionService.requestChallenge).not.toHaveBeenCalled()
      })

      it('completes full challenge flow when required', async () => {
        // Setup
        TestScenarios.withChallengeRequired(sessionService, ChallengeType.TURNSTILE)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior
        expect(result).toEqual({
          sessionId: 'new-session-222',
        })

        // Verify complete flow executed
        expect(sessionService.initSession).toHaveBeenCalled()
        expect(sessionService.requestChallenge).toHaveBeenCalled()
        expect(sessionService.verifySession).toHaveBeenCalled()

        // Verify solver was used
        expect(challengeSolverService.getSolver).toHaveBeenCalledWith(ChallengeType.TURNSTILE)
      })

      it('uses correct solver for challenge type', async () => {
        // Setup with Hashcash challenge
        TestScenarios.withChallengeRequired(sessionService, ChallengeType.HASHCASH)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute
        await service.initialize()

        // Verify correct solver was requested
        expect(challengeSolverService.getSolver).toHaveBeenCalledWith(ChallengeType.HASHCASH)
      })

      it('passes solution to upgrade session', async () => {
        // Setup
        TestScenarios.withChallengeRequired(sessionService)
        const expectedSolution = 'test-solution-xyz'
        const mockSolver = {
          solve: vi.fn().mockResolvedValue(expectedSolution),
        }
        challengeSolverService.getSolver = vi.fn().mockReturnValue(mockSolver)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute
        await service.initialize()

        // Verify solution was passed correctly
        expect(sessionService.verifySession).toHaveBeenCalledWith({
          solution: expectedSolution,
          challengeId: 'challenge-333',
          challengeType: ChallengeType.TURNSTILE,
        })
      })
    })

    describe('when server requests retry', () => {
      it('retries challenge when server requests', async () => {
        // Setup
        TestScenarios.withChallengeRequired(sessionService)
        TestScenarios.withServerRetry(sessionService, 1) // Retry once then succeed

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute
        const result = await service.initialize()

        // Verify success
        expect(result.sessionId).toBe('new-session-222')

        // Verify retry happened (challenge requested twice)
        expect(sessionService.requestChallenge).toHaveBeenCalledTimes(2)
        expect(sessionService.verifySession).toHaveBeenCalledTimes(2)
      })

      it('fails after maximum retry attempts', async () => {
        // Setup - server always requests retry
        TestScenarios.withChallengeRequired(sessionService)
        vi.mocked(sessionService.verifySession).mockResolvedValue({ retry: true })

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
          maxChallengeRetries: 2,
        })

        // Execute and verify failure
        await expect(service.initialize()).rejects.toThrow(
          'Maximum challenge retry attempts (2) exceeded after 3 attempts',
        )

        // Verify correct number of attempts
        expect(sessionService.requestChallenge).toHaveBeenCalledTimes(3) // Initial + 2 retries
      })

      it('succeeds within retry limit', async () => {
        // Setup - succeed on 3rd attempt
        TestScenarios.withChallengeRequired(sessionService)
        TestScenarios.withServerRetry(sessionService, 2)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
          maxChallengeRetries: 3,
        })

        // Execute
        const result = await service.initialize()

        // Verify success
        expect(result.sessionId).toBe('new-session-222')
        expect(sessionService.verifySession).toHaveBeenCalledTimes(3)
      })
    })

    describe('error handling', () => {
      it('throws when no solver available for challenge type', async () => {
        // Setup
        TestScenarios.withChallengeRequired(sessionService)
        challengeSolverService.getSolver = vi.fn().mockReturnValue(null)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute and verify
        await expect(service.initialize()).rejects.toThrow('No solver available for challenge type: 1')
      })

      it('propagates sessionService errors', async () => {
        // Setup
        const error = new Error('Network error')
        sessionService.initSession = vi.fn().mockRejectedValue(error)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
        })

        // Execute and verify
        await expect(service.initialize()).rejects.toThrow('Network error')
      })

      it('submits empty solution when solver throws, triggering verify-retry fallback', async () => {
        // Setup: solver throws, but verifySession accepts empty solution (no retry)
        TestScenarios.withChallengeRequired(sessionService)
        const failingSolver = {
          solve: vi.fn().mockRejectedValue(new Error('Solver failed')),
        }
        challengeSolverService.getSolver = vi.fn().mockReturnValue(failingSolver)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute — should NOT throw; empty solution is submitted instead
        await service.initialize()

        // Verify empty solution was passed to verifySession
        expect(sessionService.verifySession).toHaveBeenCalledWith({
          solution: 'solver-failed',
          challengeId: 'challenge-333',
          challengeType: ChallengeType.TURNSTILE,
        })
      })

      it('solver throws → empty verify triggers retry → different challenge type succeeds', async () => {
        // Setup: solver throws on first challenge, verify says retry,
        // second challenge uses a different solver that succeeds
        TestScenarios.withChallengeRequired(sessionService)

        // First call: solver throws; second call: solver succeeds
        const failingSolver = { solve: vi.fn().mockRejectedValue(new Error('Turnstile domain error')) }
        const successSolver = { solve: vi.fn().mockResolvedValue('hashcash-proof') }
        challengeSolverService.getSolver = vi.fn().mockReturnValueOnce(failingSolver).mockReturnValueOnce(successSolver)

        // First verify: retry; second verify: success
        vi.mocked(sessionService.verifySession)
          .mockResolvedValueOnce({ retry: true })
          .mockResolvedValueOnce({ retry: false })

        // Second challenge returns HASHCASH
        vi.mocked(sessionService.requestChallenge)
          .mockResolvedValueOnce({
            challengeId: 'challenge-333',
            challengeType: ChallengeType.TURNSTILE,
            extra: {},
            challengeData: { case: 'turnstile', value: { siteKey: 'test-sitekey', action: 'verify' } },
          })
          .mockResolvedValueOnce({
            challengeId: 'challenge-444',
            challengeType: ChallengeType.HASHCASH,
            extra: {},
            challengeData: { case: undefined },
          })

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        await service.initialize()

        // Verify flow: empty solution first, then real solution
        expect(sessionService.verifySession).toHaveBeenCalledTimes(2)
        expect(sessionService.verifySession).toHaveBeenNthCalledWith(1, {
          solution: 'solver-failed',
          challengeId: 'challenge-333',
          challengeType: ChallengeType.TURNSTILE,
        })
        expect(sessionService.verifySession).toHaveBeenNthCalledWith(2, {
          solution: 'hashcash-proof',
          challengeId: 'challenge-444',
          challengeType: ChallengeType.HASHCASH,
        })
        expect(sessionService.requestChallenge).toHaveBeenCalledTimes(2)
      })

      it('solver keeps throwing + verify keeps returning retry → respects maxRetries', async () => {
        // Setup: solver always throws, verify always says retry → should exhaust retries
        TestScenarios.withChallengeRequired(sessionService)
        const failingSolver = { solve: vi.fn().mockRejectedValue(new Error('Solver always fails')) }
        challengeSolverService.getSolver = vi.fn().mockReturnValue(failingSolver)
        vi.mocked(sessionService.verifySession).mockResolvedValue({ retry: true })

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
          maxChallengeRetries: 2,
        })

        await expect(service.initialize()).rejects.toThrow(
          'Maximum challenge retry attempts (2) exceeded after 3 attempts',
        )

        // Initial + 2 retries = 3 attempts
        expect(sessionService.requestChallenge).toHaveBeenCalledTimes(3)
        expect(sessionService.verifySession).toHaveBeenCalledTimes(3)
      })
    })

    describe('analytics callbacks', () => {
      it('fires onInitStarted when initialization begins', async () => {
        const analytics = { onInitStarted: vi.fn() }
        TestScenarios.withNoChallenge(sessionService)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          analytics,
        })

        await service.initialize()

        expect(analytics.onInitStarted).toHaveBeenCalledTimes(1)
      })

      it('reports needChallenge: false when no challenge required', async () => {
        const analytics = { onInitCompleted: vi.fn() }
        TestScenarios.withNoChallenge(sessionService)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          analytics,
        })

        await service.initialize()

        expect(analytics.onInitCompleted).toHaveBeenCalledWith(expect.objectContaining({ needChallenge: false }))
      })

      it('reports needChallenge: true when challenge required', async () => {
        const analytics = { onInitCompleted: vi.fn() }
        TestScenarios.withChallengeRequired(sessionService)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          analytics,
        })

        await service.initialize()

        expect(analytics.onInitCompleted).toHaveBeenCalledWith(expect.objectContaining({ needChallenge: true }))
      })

      it('fires onChallengeReceived with challenge details', async () => {
        const analytics = { onChallengeReceived: vi.fn() }
        TestScenarios.withChallengeRequired(sessionService, ChallengeType.HASHCASH)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
          analytics,
        })

        await service.initialize()

        expect(analytics.onChallengeReceived).toHaveBeenCalledWith({
          challengeType: String(ChallengeType.HASHCASH),
          challengeId: 'challenge-333',
        })
      })

      it('fires onVerifyCompleted on successful verification', async () => {
        const analytics = { onVerifyCompleted: vi.fn() }
        TestScenarios.withChallengeRequired(sessionService)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
          analytics,
        })

        await service.initialize()

        expect(analytics.onVerifyCompleted).toHaveBeenCalledWith(
          expect.objectContaining({ success: true, attemptNumber: 1 }),
        )
      })

      it('tracks retry attempts through verification flow', async () => {
        const analytics = { onVerifyCompleted: vi.fn() }
        TestScenarios.withChallengeRequired(sessionService)
        TestScenarios.withServerRetry(sessionService, 2) // Fail twice, succeed on 3rd

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
          analytics,
        })

        await service.initialize()

        // Should have been called 3 times (2 failures + 1 success)
        expect(analytics.onVerifyCompleted).toHaveBeenCalledTimes(3)
        expect(analytics.onVerifyCompleted).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ success: false, attemptNumber: 1 }),
        )
        expect(analytics.onVerifyCompleted).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ success: false, attemptNumber: 2 }),
        )
        expect(analytics.onVerifyCompleted).toHaveBeenNthCalledWith(
          3,
          expect.objectContaining({ success: true, attemptNumber: 3 }),
        )
      })
    })

    describe('edge cases', () => {
      it('handles empty session ID from initSession', async () => {
        // Setup
        sessionService.initSession = vi.fn().mockResolvedValue({
          sessionId: undefined,
          needChallenge: false,
          extra: {},
        })

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior - should return null when sessionId is undefined
        expect(result.sessionId).toBeNull()
      })

      it('handles None bot detection type', async () => {
        // Setup
        TestScenarios.withChallengeRequired(sessionService, ChallengeType.UNSPECIFIED)
        const noneSolver = {
          solve: vi.fn().mockResolvedValue(''),
        }
        challengeSolverService.getSolver = vi
          .fn()
          .mockImplementation((type) => (type === ChallengeType.UNSPECIFIED ? noneSolver : null))

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute
        await service.initialize()

        // Verify None type was handled
        expect(challengeSolverService.getSolver).toHaveBeenCalledWith(ChallengeType.UNSPECIFIED)
        expect(noneSolver.solve).toHaveBeenCalled()
      })

      it('does not complete challenge flow when auto-upgrade is disabled', async () => {
        // Setup
        TestScenarios.withChallengeRequired(sessionService)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          getIsSessionUpgradeAutoEnabled: () => false,
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior - session initialized but challenge not handled
        // sessionId is returned regardless of challenge status (null if not provided by backend)
        expect(result).toEqual({
          sessionId: 'new-session-222',
        })

        // Verify challenge flow was NOT executed
        expect(sessionService.initSession).toHaveBeenCalled()
        expect(sessionService.requestChallenge).not.toHaveBeenCalled()
        expect(sessionService.verifySession).not.toHaveBeenCalled()
      })

      it('defaults to disabled when callback is not provided', async () => {
        // Setup
        TestScenarios.withChallengeRequired(sessionService)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          performanceTracker: mockPerformanceTracker,
          // No getIsSessionUpgradeAutoEnabled callback provided
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior - defaults to disabled (opt-in)
        // sessionId is returned regardless of challenge status
        expect(result).toEqual({
          sessionId: 'new-session-222',
        })

        // Verify challenge flow was NOT executed (default disabled)
        expect(sessionService.initSession).toHaveBeenCalled()
        expect(sessionService.requestChallenge).not.toHaveBeenCalled()
        expect(sessionService.verifySession).not.toHaveBeenCalled()
      })
    })
  })
})
