import type { PromiseClient } from '@connectrpc/connect'
import type { SessionService } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_connect'
import {
  ChallengeResponse,
  GetChallengeTypesResponse,
  InitSessionResponse,
  SignoutResponse,
} from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
import { describe, expect, it, type MockedFunction, vi } from 'vitest'

type MockedClient = {
  [K in keyof PromiseClient<typeof SessionService>]: MockedFunction<PromiseClient<typeof SessionService>[K]>
}

describe('createSessionRepository', () => {
  const createMockClient = (): MockedClient => ({
    initSession: vi.fn().mockResolvedValue({
      sessionId: 'test-session-123',
      needChallenge: false,
      extra: {},
    }),
    challenge: vi.fn().mockResolvedValue({
      challengeId: 'challenge-123',
      challengeType: 1,
      extra: { sitekey: 'test-key' },
    }),
    verify: vi.fn().mockResolvedValue({
      retry: false,
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
        needChallenge: false,
        extra: {},
      })
    })

    it('handles web sessions without session ID', async () => {
      const mockClient = createMockClient()
      mockClient.initSession.mockResolvedValue(
        new InitSessionResponse({
          sessionId: undefined,
          needChallenge: true,
          extra: { sitekey: 'turnstile-key' },
        }),
      )

      const repository = createSessionRepository({ client: mockClient })
      const result = await repository.initSession()

      // Web sessions don't return sessionId (managed by cookies)
      expect(result.sessionId).toBeUndefined()
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
      })
    })

    it('handles empty challenge response gracefully', async () => {
      const mockClient = createMockClient()
      mockClient.challenge.mockResolvedValue(new ChallengeResponse({ challengeId: undefined }))

      const repository = createSessionRepository({ client: mockClient })
      const result = await repository.challenge({})

      // Should return defaults when no challenge data
      expect(result).toEqual({
        challengeId: '',
        challengeType: 0,
        extra: {},
      })
    })

    it('provides meaningful error when challenge request fails', async () => {
      const mockClient = createMockClient()
      mockClient.challenge.mockRejectedValue(new Error('API error'))

      const repository = createSessionRepository({ client: mockClient })

      await expect(repository.challenge({})).rejects.toThrow('Failed to get challenge')
    })
  })

  describe('session upgrade behaviors', () => {
    it('submits bot detection solution', async () => {
      const mockClient = createMockClient()
      const repository = createSessionRepository({ client: mockClient as PromiseClient<typeof SessionService> })

      const result = await repository.upgradeSession({
        solution: 'solution-token',
        challengeId: 'challenge-123',
      })

      // Verify the client was called correctly
      expect(mockClient.verify).toHaveBeenCalledWith({
        solution: 'solution-token',
        challengeId: 'challenge-123',
      })

      // Should return retry status
      expect(result).toEqual({ retry: false })
    })

    it('handles upgrade with additional parameters', async () => {
      const mockClient = createMockClient()
      const repository = createSessionRepository({ client: mockClient as PromiseClient<typeof SessionService> })

      const result = await repository.upgradeSession({
        solution: 'solution-token',
        challengeId: 'challenge-123',
        walletAddress: '0x123', // Future-proofing for wallet trust
      })

      // Should succeed even with extra params
      expect(result).toEqual({ retry: false })
    })

    it('provides meaningful error when upgrade fails', async () => {
      const mockClient = createMockClient()
      mockClient.verify.mockRejectedValue(new Error('Invalid solution'))

      const repository = createSessionRepository({ client: mockClient })

      await expect(
        repository.upgradeSession({
          solution: 'bad-token',
          challengeId: 'challenge-123',
        }),
      ).rejects.toThrow('Failed to upgrade session')
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
      mockClient.deleteSession.mockRejectedValue(new Error('Server error'))

      const repository = createSessionRepository({ client: mockClient })

      await expect(repository.deleteSession({})).rejects.toThrow('Failed to delete session')
    })
  })
})
