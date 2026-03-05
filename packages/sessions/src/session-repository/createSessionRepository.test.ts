import type { PromiseClient } from '@connectrpc/connect'
import type { SessionService } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_connect'
import {
  ChallengeFailure,
  ChallengeFailure_Reason,
  ChallengeResponse,
  GetChallengeTypesResponse,
  InitSessionResponse,
  SignoutResponse,
} from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
import { ChallengeRejectedError } from '@universe/sessions/src/session-repository/errors'
import { ChallengeType } from '@universe/sessions/src/session-service/types'
import { describe, expect, it, type MockedFunction, vi } from 'vitest'

type MockedClient = {
  [K in keyof PromiseClient<typeof SessionService>]: MockedFunction<PromiseClient<typeof SessionService>[K]>
}

describe('createSessionRepository', () => {
  const createMockClient = (): MockedClient => ({
    initSession: vi.fn().mockResolvedValue({
      sessionId: 'test-session-123',
      deviceId: 'test-device-123',
      needChallenge: false,
      extra: {},
    }),
    challenge: vi.fn().mockResolvedValue({
      challengeId: 'challenge-123',
      challengeType: 1,
      extra: { sitekey: 'test-key' },
      challengeData: { case: undefined },
    }),
    verify: vi.fn().mockResolvedValue({
      retry: false,
      outcome: { case: 'success' as const, value: {} },
    }),
    updateSession: vi.fn().mockResolvedValue({}),
    deleteSession: vi.fn().mockResolvedValue({}),
    introspectSession: vi.fn().mockResolvedValue({}), // Required by proto but not used
    getChallengeTypes: vi.fn().mockResolvedValue(new GetChallengeTypesResponse({ challengeTypes: [] })),
    signout: vi.fn().mockResolvedValue(new SignoutResponse({})),
  })

  describe('session initialization behaviors', () => {
    it('initializes a session and returns session data', async () => {
      const mockClient = createMockClient()
      const repository = createSessionRepository({ client: mockClient as PromiseClient<typeof SessionService> })

      const result = await repository.initSession()

      expect(result).toEqual({
        sessionId: 'test-session-123',
        deviceId: 'test-device-123',
        needChallenge: false,
        extra: {},
      })
    })

    it('handles web sessions without session ID', async () => {
      const mockClient = createMockClient()
      mockClient.initSession.mockResolvedValue(
        new InitSessionResponse({
          sessionId: undefined,
          deviceId: undefined,
          needChallenge: true,
          extra: { sitekey: 'turnstile-key' },
        }),
      )

      const repository = createSessionRepository({ client: mockClient })
      const result = await repository.initSession()

      // Web sessions don't return sessionId or deviceId (managed by cookies)
      expect(result.sessionId).toBeUndefined()
      expect(result.deviceId).toBeUndefined()
      expect(result.needChallenge).toBe(true)
      expect(result.extra).toEqual({ sitekey: 'turnstile-key' })
    })

    it('provides meaningful error when initialization fails', async () => {
      const mockClient = createMockClient()
      mockClient.initSession.mockRejectedValue(new Error('Network error'))

      const repository = createSessionRepository({ client: mockClient })

      await expect(repository.initSession()).rejects.toThrow('Failed to initialize session')
    })
  })

  describe('bot detection behaviors', () => {
    it('retrieves challenge information for bot detection', async () => {
      const mockClient = createMockClient()
      const repository = createSessionRepository({ client: mockClient as PromiseClient<typeof SessionService> })

      const result = await repository.challenge({})

      expect(result).toEqual({
        challengeId: 'challenge-123',
        challengeType: 1,
        extra: { sitekey: 'test-key' },
        challengeData: { case: undefined },
        authorizeUrl: undefined,
      })
    })

    it('throws ChallengeRejectedError when response has failure field', async () => {
      const mockClient = createMockClient()
      mockClient.challenge.mockResolvedValue(
        new ChallengeResponse({
          failure: new ChallengeFailure({ reason: ChallengeFailure_Reason.UNSPECIFIED }),
        }),
      )

      const repository = createSessionRepository({ client: mockClient })

      await expect(repository.challenge({})).rejects.toThrow(ChallengeRejectedError)
      await expect(repository.challenge({})).rejects.toThrow('REASON_UNSPECIFIED')
    })

    it('throws ChallengeRejectedError with BOT_DETECTION_REQUIRED reason', async () => {
      const mockClient = createMockClient()
      mockClient.challenge.mockResolvedValue(
        new ChallengeResponse({
          failure: new ChallengeFailure({ reason: ChallengeFailure_Reason.BOT_DETECTION_REQUIRED }),
        }),
      )

      const repository = createSessionRepository({ client: mockClient })

      await expect(repository.challenge({})).rejects.toThrow(ChallengeRejectedError)
      await expect(repository.challenge({})).rejects.toThrow('REASON_BOT_DETECTION_REQUIRED')
    })

    it('does NOT throw ChallengeRejectedError when no failure field is present', async () => {
      const mockClient = createMockClient()
      mockClient.challenge.mockResolvedValue(new ChallengeResponse({ challengeId: 'some-id', challengeType: 0 }))

      const repository = createSessionRepository({ client: mockClient })
      const result = await repository.challenge({})

      expect(result.challengeId).toBe('some-id')
    })

    it('ChallengeRejectedError has typed reason and rawFailure fields', async () => {
      const mockClient = createMockClient()
      mockClient.challenge.mockResolvedValue(
        new ChallengeResponse({
          failure: new ChallengeFailure({ reason: ChallengeFailure_Reason.BOT_DETECTION_REQUIRED }),
        }),
      )

      const repository = createSessionRepository({ client: mockClient })

      try {
        await repository.challenge({})
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(ChallengeRejectedError)
        const rejected = error as ChallengeRejectedError
        expect(rejected.reason).toBe('REASON_BOT_DETECTION_REQUIRED')
        expect(rejected.rawFailure).toBeDefined()
        expect(rejected.name).toBe('ChallengeRejectedError')
      }
    })

    it('provides meaningful error when challenge request fails', async () => {
      const mockClient = createMockClient()
      mockClient.challenge.mockRejectedValue(new Error('API error'))

      const repository = createSessionRepository({ client: mockClient })

      await expect(repository.challenge({})).rejects.toThrow('Failed to get challenge')
    })
  })

  describe('session verify behaviors', () => {
    it('submits bot detection solution', async () => {
      const mockClient = createMockClient()
      const repository = createSessionRepository({ client: mockClient as PromiseClient<typeof SessionService> })

      const result = await repository.verifySession({
        solution: 'solution-token',
        challengeId: 'challenge-123',
        challengeType: ChallengeType.TURNSTILE,
      })

      // Verify the client was called correctly (challengeType maps to 'type' in the backend API)
      expect(mockClient.verify).toHaveBeenCalledWith({
        solution: 'solution-token',
        challengeId: 'challenge-123',
        type: ChallengeType.TURNSTILE,
      })

      // Should return retry status
      expect(result).toEqual({ retry: false })
    })

    it('handles verify with additional parameters', async () => {
      const mockClient = createMockClient()
      const repository = createSessionRepository({ client: mockClient as PromiseClient<typeof SessionService> })

      const result = await repository.verifySession({
        solution: 'solution-token',
        challengeId: 'challenge-123',
        challengeType: ChallengeType.TURNSTILE,
      })

      // Should succeed with required params
      expect(result).toEqual({ retry: false })
    })

    it('treats undefined outcome with retry=false as success (proto3 dropped empty VerifySuccess)', async () => {
      const mockClient = createMockClient()
      mockClient.verify.mockResolvedValue({
        retry: false,
        outcome: { case: undefined, value: undefined },
      })

      const repository = createSessionRepository({ client: mockClient })

      const result = await repository.verifySession({
        solution: 'solution-token',
        challengeId: 'challenge-123',
        challengeType: ChallengeType.TURNSTILE,
      })

      // Proto3 drops empty VerifySuccess — retry: false signals success
      expect(result.retry).toBe(false)
    })

    it('allows undefined outcome when retry is true (valid retry-only response)', async () => {
      const mockClient = createMockClient()
      mockClient.verify.mockResolvedValue({
        retry: true,
        outcome: { case: undefined, value: undefined },
      })

      const repository = createSessionRepository({ client: mockClient })

      const result = await repository.verifySession({
        solution: 'solution-token',
        challengeId: 'challenge-123',
        challengeType: ChallengeType.TURNSTILE,
      })

      expect(result.retry).toBe(true)
    })

    it('returns failure info from verify failure outcome', async () => {
      const mockClient = createMockClient()
      mockClient.verify.mockResolvedValue({
        retry: true,
        outcome: {
          case: 'failure' as const,
          value: {
            reason: 1, // INVALID_SOLUTION
            message: 'Bad code',
            waitSeconds: 30,
          },
        },
      })

      const repository = createSessionRepository({ client: mockClient })

      const result = await repository.verifySession({
        solution: 'bad-code',
        challengeId: 'challenge-123',
        challengeType: ChallengeType.TURNSTILE,
      })

      expect(result.retry).toBe(true)
      expect(result.failureReason).toBe('REASON_INVALID_SOLUTION')
      expect(result.failureMessage).toBe('Bad code')
      expect(result.waitSeconds).toBe(30)
    })

    it('provides meaningful error when verify fails', async () => {
      const mockClient = createMockClient()
      mockClient.verify.mockRejectedValue(new Error('Invalid solution'))

      const repository = createSessionRepository({ client: mockClient })

      await expect(
        repository.verifySession({
          solution: 'bad-token',
          challengeId: 'challenge-123',
          challengeType: ChallengeType.TURNSTILE,
        }),
      ).rejects.toThrow('Failed to verify session')
    })
  })

  describe('session cleanup behaviors', () => {
    it('deletes session successfully', async () => {
      const mockClient = createMockClient()
      const repository = createSessionRepository({ client: mockClient as PromiseClient<typeof SessionService> })

      const result = await repository.deleteSession({})

      expect(result).toEqual({})
    })

    it('provides meaningful error when deletion fails', async () => {
      const mockClient = createMockClient()
      mockClient.signout.mockRejectedValue(new Error('Server error'))

      const repository = createSessionRepository({ client: mockClient })

      await expect(repository.deleteSession({})).rejects.toThrow('Failed to delete session')
    })
  })
})
