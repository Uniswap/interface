import { createSessionInitializationService } from '@universe/sessions/src/session-initialization/createSessionInitializationService'
import { ChallengeType } from '@universe/sessions/src/session-service/types'
import {
  createMockChallengeSolverService,
  createMockSessionService,
  TestScenarios,
} from '@universe/sessions/src/test-utils/mocks'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('createSessionInitializationService', () => {
  let sessionService: ReturnType<typeof createMockSessionService>
  let challengeSolverService: ReturnType<typeof createMockChallengeSolverService>

  beforeEach(() => {
    sessionService = createMockSessionService()
    challengeSolverService = createMockChallengeSolverService()
  })

  describe('initialize()', () => {
    describe('when session already exists', () => {
      it('returns existing session without creating new one', async () => {
        // Setup
        TestScenarios.withExistingSession(sessionService, 'existing-123')

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior
        expect(result).toEqual({
          sessionId: 'existing-123',
          isNewSession: false,
        })

        // Verify no unnecessary calls were made
        expect(sessionService.initSession).not.toHaveBeenCalled()
        expect(sessionService.requestChallenge).not.toHaveBeenCalled()
        expect(sessionService.upgradeSession).not.toHaveBeenCalled()
      })
    })

    describe('when creating new session', () => {
      it('initializes session without challenge when not required', async () => {
        // Setup
        TestScenarios.withNoChallenge(sessionService)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior
        expect(result).toEqual({
          sessionId: 'new-session-111',
          isNewSession: true,
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
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior
        expect(result).toEqual({
          sessionId: 'new-session-222',
          isNewSession: true,
        })

        // Verify complete flow executed
        expect(sessionService.initSession).toHaveBeenCalled()
        expect(sessionService.requestChallenge).toHaveBeenCalled()
        expect(sessionService.upgradeSession).toHaveBeenCalled()

        // Verify solver was used
        expect(challengeSolverService.getSolver).toHaveBeenCalledWith(ChallengeType.TURNSTILE)
      })

      it('uses correct solver for challenge type', async () => {
        // Setup with Hashcash challenge
        TestScenarios.withChallengeRequired(sessionService, ChallengeType.HASHCASH)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
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
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute
        await service.initialize()

        // Verify solution was passed correctly
        expect(sessionService.upgradeSession).toHaveBeenCalledWith({
          solution: expectedSolution,
          challengeId: 'challenge-333',
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
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute
        const result = await service.initialize()

        // Verify success
        expect(result.isNewSession).toBe(true)

        // Verify retry happened (challenge requested twice)
        expect(sessionService.requestChallenge).toHaveBeenCalledTimes(2)
        expect(sessionService.upgradeSession).toHaveBeenCalledTimes(2)
      })

      it('fails after maximum retry attempts', async () => {
        // Setup - server always requests retry
        TestScenarios.withChallengeRequired(sessionService)
        vi.mocked(sessionService.upgradeSession).mockResolvedValue({ retry: true })

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
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
          getIsSessionUpgradeAutoEnabled: () => true,
          maxChallengeRetries: 3,
        })

        // Execute
        const result = await service.initialize()

        // Verify success
        expect(result.isNewSession).toBe(true)
        expect(sessionService.upgradeSession).toHaveBeenCalledTimes(3)
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
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute and verify
        await expect(service.initialize()).rejects.toThrow('No solver available for challenge type: 1')
      })

      it('propagates sessionService errors', async () => {
        // Setup
        const error = new Error('Network error')
        sessionService.getSessionState = vi.fn().mockRejectedValue(error)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
        })

        // Execute and verify
        await expect(service.initialize()).rejects.toThrow('Network error')
      })

      it('propagates solver errors', async () => {
        // Setup
        TestScenarios.withChallengeRequired(sessionService)
        const error = new Error('Solver failed')
        const failingSolver = {
          solve: vi.fn().mockRejectedValue(error),
        }
        challengeSolverService.getSolver = vi.fn().mockReturnValue(failingSolver)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          getIsSessionUpgradeAutoEnabled: () => true,
        })

        // Execute and verify
        await expect(service.initialize()).rejects.toThrow('Solver failed')
      })
    })

    describe('edge cases', () => {
      it('handles empty session ID from initSession', async () => {
        // Setup
        sessionService.getSessionState = vi.fn().mockResolvedValue(null)
        sessionService.initSession = vi.fn().mockResolvedValue({
          sessionId: undefined,
          needChallenge: false,
          extra: {},
        })

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior - should return empty string, not undefined
        expect(result.sessionId).toBe('')
        expect(result.isNewSession).toBe(true)
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
          getIsSessionUpgradeAutoEnabled: () => false,
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior - session initialized but challenge not handled
        expect(result).toEqual({
          sessionId: 'new-session-222',
          isNewSession: true,
        })

        // Verify challenge flow was NOT executed
        expect(sessionService.initSession).toHaveBeenCalled()
        expect(sessionService.requestChallenge).not.toHaveBeenCalled()
        expect(sessionService.upgradeSession).not.toHaveBeenCalled()
      })

      it('defaults to disabled when callback is not provided', async () => {
        // Setup
        TestScenarios.withChallengeRequired(sessionService)

        const service = createSessionInitializationService({
          getSessionService: () => sessionService,
          challengeSolverService,
          // No getIsSessionUpgradeAutoEnabled callback provided
        })

        // Execute
        const result = await service.initialize()

        // Verify behavior - defaults to disabled (opt-in)
        expect(result).toEqual({
          sessionId: 'new-session-222',
          isNewSession: true,
        })

        // Verify challenge flow was NOT executed (default disabled)
        expect(sessionService.initSession).toHaveBeenCalled()
        expect(sessionService.requestChallenge).not.toHaveBeenCalled()
        expect(sessionService.upgradeSession).not.toHaveBeenCalled()
      })
    })
  })
})
