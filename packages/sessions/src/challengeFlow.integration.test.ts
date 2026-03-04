import {
  ChallengeResponse,
  ChallengeType,
  DeleteSessionResponse,
  GetChallengeTypesResponse,
  InitSessionResponse,
  SignoutResponse,
  VerifyResponse,
  VerifySuccess,
} from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createChallengeSolverService } from '@universe/sessions/src/challenge-solvers/createChallengeSolverService'
import type { ChallengeSolver } from '@universe/sessions/src/challenge-solvers/types'
import type { PerformanceTracker } from '@universe/sessions/src/performance/types'
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
  InMemoryUniswapIdentifierService,
  type MockEndpoints,
} from '@universe/sessions/src/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Helper: create a VerifyResponse with a success outcome (proto3 validation requires outcome.case)
function createSuccessVerifyResponse(): VerifyResponse {
  const response = new VerifyResponse({ retry: false })
  response.outcome = { case: 'success', value: new VerifySuccess({}) }
  return response
}

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

// Mock Turnstile solver for integration tests
const mockTurnstileSolve = vi.fn()

describe('Challenge Flow Integration Tests', () => {
  let sessionStorage: InMemorySessionStorage
  let deviceIdService: InMemoryDeviceIdService
  let uniswapIdentifierService: InMemoryUniswapIdentifierService
  let sessionService: SessionService
  let sessionInitializationService: SessionInitializationService
  let mockEndpoints: MockEndpoints

  beforeEach(() => {
    // Initialize in-memory storage
    sessionStorage = new InMemorySessionStorage()
    deviceIdService = new InMemoryDeviceIdService()
    uniswapIdentifierService = new InMemoryUniswapIdentifierService()

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
          challengeType: ChallengeType.TURNSTILE,
          extra: {
            challengeData: '{"siteKey":"0x4AAAAAABiAHneWOWZHzZtO","action":"session_verification"}',
          },
        })
      },
      '/uniswap.platformservice.v1.SessionService/Verify': async (): Promise<VerifyResponse> => {
        return createSuccessVerifyResponse()
      },
      '/uniswap.platformservice.v1.SessionService/DeleteSession': async (): Promise<DeleteSessionResponse> => {
        return new DeleteSessionResponse({})
      },
      '/uniswap.platformservice.v1.SessionService/GetChallengeTypes': async (): Promise<GetChallengeTypesResponse> => {
        return new GetChallengeTypesResponse({ challengeTypes: [] })
      },
      '/uniswap.platformservice.v1.SessionService/Signout': async (): Promise<SignoutResponse> => {
        return new SignoutResponse({})
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
      uniswapIdentifierService,
      sessionRepository,
    })

    // Create challenge solver service with mock Turnstile solver
    const challengeSolverService = createChallengeSolverService()

    // Mock the Turnstile solver
    mockTurnstileSolve.mockResolvedValue('test-turnstile-solution-token')
    challengeSolverService.getSolver = (type: ChallengeType): ChallengeSolver | null => {
      if (type === ChallengeType.TURNSTILE) {
        return {
          solve: mockTurnstileSolve,
        }
      }
      return null
    }

    // Create session initialization service
    sessionInitializationService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      performanceTracker: createMockPerformanceTracker(),
      getIsSessionUpgradeAutoEnabled: () => true,
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
      challengeType: ChallengeType.TURNSTILE,
      extra: {
        challengeData: '{"siteKey":"0x4AAAAAABiAHneWOWZHzZtO","action":"session_verification"}',
      },
      challengeData: { case: undefined },
      authorizeUrl: undefined,
    })

    // Verify mock solver is configured
    expect(mockTurnstileSolve).toHaveBeenCalledTimes(0)

    // Simulate solving the challenge and upgrading session
    const solution = 'test-turnstile-solution-token'
    const upgradeResponse = await sessionService.verifySession({
      solution,
      challengeId: challengeResponse.challengeId,
      challengeType: challengeResponse.challengeType,
    })
    expect(upgradeResponse.retry).toBe(false)
  })

  it('always calls initSession even with existing session - backend handles reuse', async () => {
    // Pre-populate storage with existing session
    await sessionStorage.set({ sessionId: 'existing-session-123' })
    await deviceIdService.setDeviceId('existing-device-123')

    // Track calls
    let initCallCount = 0
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        initCallCount++
        // Backend returns the same session ID (simulating session reuse)
        return new InitSessionResponse({
          sessionId: 'existing-session-123',
          needChallenge: false,
          extra: {},
        })
      }

    // Initialize should call API - backend decides whether to reuse session
    // (in production, existing session ID is sent via X-Session-ID header)
    await sessionInitializationService.initialize()

    // Verify initialization call was made (previously this was skipped)
    expect(initCallCount).toBe(1)

    // Verify session in storage matches what backend returned
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
      return createSuccessVerifyResponse()
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

  it('submits empty solution when solver throws, allowing verify-retry fallback', async () => {
    // Set up to require challenge
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: 'error-session-123',
          needChallenge: true,
          extra: {},
        })
      }

    // Make Turnstile solver throw (e.g. domain not approved on Vercel preview)
    mockTurnstileSolve.mockRejectedValue(new Error('Turnstile error: domain not allowed'))

    // Verify endpoint accepts empty solution (no retry needed for this test)
    const verifyCalls: Array<{ request: any }> = []
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Verify'] = async (request): Promise<VerifyResponse> => {
      verifyCalls.push({ request })
      return createSuccessVerifyResponse()
    }

    const challengeSolverService = createChallengeSolverService()
    challengeSolverService.getSolver = (type: ChallengeType): ChallengeSolver | null => {
      if (type === ChallengeType.TURNSTILE) {
        return { solve: mockTurnstileSolve }
      }
      return null
    }

    const initService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      performanceTracker: createMockPerformanceTracker(),
      getIsSessionUpgradeAutoEnabled: () => true,
    })

    // Should NOT throw — empty solution is submitted instead
    await initService.initialize()

    // Solver was called once and threw
    expect(mockTurnstileSolve).toHaveBeenCalledTimes(1)
    // Verify was called with empty solution
    expect(verifyCalls).toHaveLength(1)
    expect(verifyCalls[0].request.solution).toBe('solver-failed')
  })

  it('Turnstile solver fails → empty verify → retry → Hashcash succeeds end-to-end', async () => {
    // Set up to require challenge
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: 'fallback-e2e-session',
          needChallenge: true,
          extra: {},
        })
      }

    // First challenge returns Turnstile, second returns Hashcash
    let challengeRequestCount = 0
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge'] = async (): Promise<ChallengeResponse> => {
      challengeRequestCount++
      if (challengeRequestCount === 1) {
        return new ChallengeResponse({
          challengeId: 'turnstile-challenge-id',
          challengeType: ChallengeType.TURNSTILE,
          extra: {
            challengeData: '{"siteKey":"0x4AAAAAABiAHneWOWZHzZtO","action":"session_verification"}',
          },
        })
      }
      return new ChallengeResponse({
        challengeId: 'hashcash-challenge-id',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: '{"difficulty":10}',
        },
      })
    }

    // First verify rejects empty solution, second succeeds
    let verifyCount = 0
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Verify'] = async (): Promise<VerifyResponse> => {
      verifyCount++
      if (verifyCount === 1) {
        return new VerifyResponse({ retry: true })
      }
      return createSuccessVerifyResponse()
    }

    // Turnstile solver throws (domain mismatch), Hashcash solver succeeds
    mockTurnstileSolve.mockRejectedValue(new Error('Turnstile error 110200: domain not allowed'))
    const mockHashcashSolve = vi.fn().mockResolvedValue('hashcash-solution-token')

    const challengeSolverService = createChallengeSolverService()
    challengeSolverService.getSolver = (type: ChallengeType): ChallengeSolver | null => {
      if (type === ChallengeType.TURNSTILE) {
        return { solve: mockTurnstileSolve }
      }
      if (type === ChallengeType.HASHCASH) {
        return { solve: mockHashcashSolve }
      }
      return null
    }

    const initService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      performanceTracker: createMockPerformanceTracker(),
      getIsSessionUpgradeAutoEnabled: () => true,
    })

    // Full flow: Turnstile throws → empty verify → retry → Hashcash succeeds
    await initService.initialize()

    // Turnstile solver was called once (and threw)
    expect(mockTurnstileSolve).toHaveBeenCalledTimes(1)
    // Hashcash solver was called once (and succeeded)
    expect(mockHashcashSolve).toHaveBeenCalledTimes(1)
    // Two challenge requests: Turnstile then Hashcash
    expect(challengeRequestCount).toBe(2)
    // Two verify calls: first rejected empty solution, second accepted Hashcash
    expect(verifyCount).toBe(2)

    // Session should be stored
    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('fallback-e2e-session')
  })

  it('falls back to Hashcash via verify-retry when mock Turnstile token is rejected', async () => {
    // Set up to require challenge
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: 'fallback-session-123',
          needChallenge: true,
          extra: {},
        })
      }

    // First challenge returns Turnstile, second returns Hashcash
    // (backend switches after failed verification)
    let challengeRequestCount = 0
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Challenge'] = async (): Promise<ChallengeResponse> => {
      challengeRequestCount++
      if (challengeRequestCount === 1) {
        return new ChallengeResponse({
          challengeId: 'turnstile-challenge-id',
          challengeType: ChallengeType.TURNSTILE,
          extra: {
            challengeData: '{"siteKey":"0x4AAAAAABiAHneWOWZHzZtO","action":"session_verification"}',
          },
        })
      }
      return new ChallengeResponse({
        challengeId: 'hashcash-challenge-id',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: '{"difficulty":10}',
        },
      })
    }

    // First verify rejects mock token, second succeeds
    let verifyCount = 0
    mockEndpoints['/uniswap.platformservice.v1.SessionService/Verify'] = async (): Promise<VerifyResponse> => {
      verifyCount++
      if (verifyCount === 1) {
        return new VerifyResponse({ retry: true })
      }
      return createSuccessVerifyResponse()
    }

    // Mock Turnstile returns a fake token (doesn't throw), Hashcash succeeds
    const mockHashcashSolve = vi.fn().mockResolvedValue('hashcash-solution-token')
    mockTurnstileSolve.mockResolvedValue('mock-turnstile-token')

    const challengeSolverService = createChallengeSolverService()
    challengeSolverService.getSolver = (type: ChallengeType): ChallengeSolver | null => {
      if (type === ChallengeType.TURNSTILE) {
        return { solve: mockTurnstileSolve }
      }
      if (type === ChallengeType.HASHCASH) {
        return { solve: mockHashcashSolve }
      }
      return null
    }

    const initService = createSessionInitializationService({
      getSessionService: () => sessionService,
      challengeSolverService,
      performanceTracker: createMockPerformanceTracker(),
      getIsSessionUpgradeAutoEnabled: () => true,
    })

    // Flow: mock Turnstile token → verify rejects → retry → backend sends Hashcash → succeeds
    await initService.initialize()

    // Mock Turnstile was called (returned fake token)
    expect(mockTurnstileSolve).toHaveBeenCalledTimes(1)
    // Hashcash was used as fallback after verify rejected mock token
    expect(mockHashcashSolve).toHaveBeenCalledTimes(1)
    // Two challenge requests (Turnstile, then Hashcash after failed verify)
    expect(challengeRequestCount).toBe(2)
    // Two verify calls (first rejected mock token, second accepted Hashcash)
    expect(verifyCount).toBe(2)

    // Session should be stored
    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('fallback-session-123')
  })
})
