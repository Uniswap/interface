import {
  BotDetectionType,
  ChallengeResponse,
  DeleteSessionResponse,
  InitSessionResponse,
  VerifyResponse,
} from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createChallengeSolverService } from '@universe/sessions/src/challenge-solvers/createChallengeSolverService'
import type { ChallengeSolver } from '@universe/sessions/src/challenge-solvers/types'
import {
  createSessionInitializationService,
  type SessionInitializationService,
} from '@universe/sessions/src/session-initialization/createSessionInitializationService'
import { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
import { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import {
  createMockSessionClient,
  createTestTransport,
  InMemoryDeviceIdService,
  InMemorySessionStorage,
  type MockEndpoints,
} from '@universe/sessions/src/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Turnstile solver for integration tests
const mockTurnstileSolve = vi.fn()

describe('Challenge Flow Integration Tests', () => {
  let sessionStorage: InMemorySessionStorage
  let deviceIdService: InMemoryDeviceIdService
  let sessionService: SessionService
  let sessionInitializationService: SessionInitializationService
  let mockEndpoints: MockEndpoints

  beforeEach(() => {
    // Initialize in-memory storage
    sessionStorage = new InMemorySessionStorage()
    deviceIdService = new InMemoryDeviceIdService()

    // Set up mock endpoints with default responses
    mockEndpoints = {
      '/uniswap.platformservice.v1.SessionService/InitSession': async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: 'test-session-123',
          needChallenge: true,
          extra: {},
        })
      },
      '/uniswap.platformservice.v1.SessionService/Challenge': async (): Promise<ChallengeResponse> => {
        return new ChallengeResponse({
          challengeId: '02c241f3-8d45-4a88-842a-d364c30a6c44',
          botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
          extra: {
            challengeData: '{"siteKey":"0x4AAAAAABiAHneWOWZHzZtO","action":"session_verification"}',
          },
        })
      },
      '/uniswap.platformservice.v1.SessionService/Verify': async (): Promise<VerifyResponse> => {
        return new VerifyResponse({
          retry: false,
        })
      },
      '/uniswap.platformservice.v1.SessionService/DeleteSession': async (): Promise<DeleteSessionResponse> => {
        return new DeleteSessionResponse({})
      },
    } as unknown as MockEndpoints

    // Create test transport
    createTestTransport(mockEndpoints)

    // Create session client
    const sessionClient = createMockSessionClient(mockEndpoints, sessionStorage, deviceIdService)

    // Create repository
    const sessionRepository = createSessionRepository({
      client: sessionClient as any,
    })

    // Create session service
    sessionService = createSessionService({
      sessionStorage,
      deviceIdService,
      sessionRepository,
    })

    // Create challenge solver service with mock Turnstile solver
    const challengeSolverService = createChallengeSolverService()

    // Mock the Turnstile solver
    mockTurnstileSolve.mockResolvedValue('test-turnstile-solution-token')
    challengeSolverService.getSolver = (type: BotDetectionType): ChallengeSolver | null => {
      if (type === BotDetectionType.BOT_DETECTION_TURNSTILE) {
        return {
          solve: mockTurnstileSolve,
        }
      }
      return null
    }

    // Create session initialization service
    sessionInitializationService = createSessionInitializationService({
      sessionService,
      challengeSolverService,
    })
  })

  afterEach(async () => {
    // Clean up any stored data
    await sessionStorage.clear()
    await deviceIdService.removeDeviceId()

    // Reset mocks
    vi.clearAllMocks()
    mockTurnstileSolve.mockResolvedValue('test-turnstile-solution-token')
  })

  it('initializes a session with needChallenge: true and completes challenge flow', async () => {
    // Update mock to return needChallenge: true
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: '776973bd-bbc2-452b-9c35-1b72c475afbd',
          needChallenge: true,
          extra: {},
        })
      }

    // Track calls to verify flow
    const initCalls: Array<{ request: any; headers: Record<string, string> }> = []
    const challengeCalls: Array<{ request: any; headers: Record<string, string> }> = []
    const verifyCalls: Array<{ request: any; headers: Record<string, string> }> = []

    // Wrap handlers to track calls
    const originalInit = mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession']
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] = async (
      request,
      headers,
    ): Promise<InitSessionResponse> => {
      initCalls.push({ request, headers })
      return originalInit(request, headers)
    }

    const originalChallenge = mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge']
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge'] = async (
      request,
      headers,
    ): Promise<ChallengeResponse> => {
      challengeCalls.push({ request, headers })
      return originalChallenge(request, headers)
    }

    const originalVerify = mockEndpoints['/uniswap.platformservice.v1.SessionService/Verify']
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Verify'] = async (
      request,
      headers,
    ): Promise<VerifyResponse> => {
      verifyCalls.push({ request, headers })
      return originalVerify(request, headers)
    }

    // Execute the full initialization flow
    await sessionInitializationService.initialize()

    // Verify all API calls were made in the correct order
    expect(initCalls).toHaveLength(1)
    expect(challengeCalls).toHaveLength(1)
    expect(verifyCalls).toHaveLength(1)

    // Verify session was stored
    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('776973bd-bbc2-452b-9c35-1b72c475afbd')

    // Verify challenge request had session headers
    expect(challengeCalls[0].headers['X-Session-ID']).toBe('776973bd-bbc2-452b-9c35-1b72c475afbd')

    // Verify upgrade request had correct challenge ID and solution
    expect(verifyCalls[0].request).toMatchObject({
      challengeId: '02c241f3-8d45-4a88-842a-d364c30a6c44',
      solution: 'test-turnstile-solution-token',
    })
    expect(verifyCalls[0].headers['X-Session-ID']).toBe('776973bd-bbc2-452b-9c35-1b72c475afbd')
  })

  it('handles challenge flow with proper request/response data', async () => {
    // Set device ID
    await deviceIdService.setDeviceId('66629fec-ff9d-430b-8a31-d256b4128527')

    // Initialize session first
    await sessionService.initSession()

    // Request challenge
    const challengeResponse = await sessionService.requestChallenge()

    expect(challengeResponse).toEqual({
      challengeId: '02c241f3-8d45-4a88-842a-d364c30a6c44',
      botDetectionType: BotDetectionType.BOT_DETECTION_TURNSTILE,
      extra: {
        challengeData: '{"siteKey":"0x4AAAAAABiAHneWOWZHzZtO","action":"session_verification"}',
      },
    })

    // Verify mock solver is configured
    expect(mockTurnstileSolve).toHaveBeenCalledTimes(0)

    // Simulate solving the challenge and upgrading session
    const solution = 'test-turnstile-solution-token'
    const upgradeResponse = await sessionService.upgradeSession({
      solution,
      challengeId: challengeResponse.challengeId,
    })
    expect(upgradeResponse.retry).toBe(false)
  })

  it('reuses existing session without re-initialization', async () => {
    // When the check is re-enabled, this test should pass

    // Pre-populate storage with existing session
    await sessionStorage.set({ sessionId: 'existing-session-123' })
    await deviceIdService.setDeviceId('existing-device-123')

    // Track calls
    const initCalls: any[] = []
    const originalInit = mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession']
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] = async (
      request,
      headers,
    ): Promise<InitSessionResponse> => {
      initCalls.push({ request, headers })
      return originalInit(request, headers)
    }

    // Initialize should skip API call
    await sessionInitializationService.initialize()

    // Verify no initialization call was made
    expect(initCalls).toHaveLength(0)

    // Verify existing session is still in storage
    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('existing-session-123')
  })

  it('handles challenge retry when upgrade fails', async () => {
    // Set up to require challenge
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: 'retry-session-123',
          needChallenge: true,
          extra: {},
        })
      }

    // Make first verify attempt fail with retry
    let verifyAttempts = 0
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Verify'] = async (): Promise<VerifyResponse> => {
      verifyAttempts++
      if (verifyAttempts === 1) {
        return new VerifyResponse({ retry: true })
      }
      return new VerifyResponse({ retry: false })
    }

    // Track challenge calls
    const challengeCalls: any[] = []
    const originalChallenge = mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge']
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge'] = async (
      request,
      headers,
    ): Promise<ChallengeResponse> => {
      challengeCalls.push({ request, headers })
      return originalChallenge(request, headers)
    }

    // Execute flow
    await sessionInitializationService.initialize()

    // Should have made 2 challenge requests (initial + retry)
    expect(challengeCalls).toHaveLength(2)
    expect(verifyAttempts).toBe(2)

    // Session should be stored after successful retry
    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('retry-session-123')
  })

  it('respects maximum retry limit for challenges', async () => {
    // Set up to require challenge
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: 'max-retry-session',
          needChallenge: true,
          extra: {},
        })
      }

    // Always return retry: true
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Verify'] = async (): Promise<VerifyResponse> => {
      return new VerifyResponse({ retry: true })
    }

    // Track attempts
    const challengeCalls: any[] = []
    const verifyCalls: any[] = []

    const originalChallenge = mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge']
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge'] = async (
      request,
      headers,
    ): Promise<ChallengeResponse> => {
      challengeCalls.push({ request, headers })
      return originalChallenge(request, headers)
    }

    const originalVerify = mockEndpoints['/uniswap.platformservice.v1.SessionService/Verify']
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Verify'] = async (
      request,
      headers,
    ): Promise<VerifyResponse> => {
      verifyCalls.push({ request, headers })
      return originalVerify(request, headers)
    }

    // Should throw after max retries
    await expect(sessionInitializationService.initialize()).rejects.toThrow()

    // Should have attempted 4 times (1 initial + 3 retries)
    expect(challengeCalls).toHaveLength(4)
    expect(verifyCalls).toHaveLength(4)
  })

  it('handles device ID in headers for challenge requests', async () => {
    // Set device ID
    await deviceIdService.setDeviceId('test-device-456')
    await sessionService.initSession()

    // Track challenge request to verify headers
    let capturedHeaders: Record<string, string> = {}
    const originalChallenge = mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge']
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge'] = async (
      request,
      headers,
    ): Promise<ChallengeResponse> => {
      capturedHeaders = headers
      return originalChallenge(request, headers)
    }

    // Request challenge
    await sessionService.requestChallenge()

    // Verify device ID was included in headers
    expect(capturedHeaders['X-Device-ID']).toBe('test-device-456')
    expect(capturedHeaders['X-Session-ID']).toBe('test-session-123')
  })

  it('handles missing device ID gracefully', async () => {
    // Don't set device ID
    await sessionService.initSession()

    // Track challenge request to verify headers
    let capturedHeaders: Record<string, string> = {}
    const originalChallenge = mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge']
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge'] = async (
      request,
      headers,
    ): Promise<ChallengeResponse> => {
      capturedHeaders = headers
      return originalChallenge(request, headers)
    }

    // Request challenge
    await sessionService.requestChallenge()

    // Verify only session ID was included in headers
    expect(capturedHeaders['X-Device-ID']).toBeUndefined()
    expect(capturedHeaders['X-Session-ID']).toBe('test-session-123')
  })
})
