import {
  ChallengeResponse,
  ChallengeType,
  DeleteSessionResponse,
  GetChallengeTypesResponse,
  InitSessionResponse,
  IntrospectSessionResponse,
  SignoutResponse,
  UpdateSessionResponse,
  VerifyResponse,
} from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
import { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import {
  createMockSessionClient,
  InMemoryDeviceIdService,
  InMemorySessionStorage,
  InMemoryUniswapIdentifierService,
  type MockEndpoints,
} from '@universe/sessions/src/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('Session Lifecycle Integration Tests', () => {
  let sessionStorage: InMemorySessionStorage
  let deviceIdService: InMemoryDeviceIdService
  let uniswapIdentifierService: InMemoryUniswapIdentifierService
  let sessionService: SessionService
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
          needChallenge: false,
          extra: {},
        })
      },
      '/uniswap.platformservice.v1.SessionService/Challenge': async (): Promise<ChallengeResponse> => {
        return new ChallengeResponse({
          challengeId: 'challenge-123',
          challengeType: ChallengeType.TURNSTILE,
          extra: { sitekey: 'test-key' },
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
      '/uniswap.platformservice.v1.SessionService/IntrospectSession': async (): Promise<IntrospectSessionResponse> => {
        return new IntrospectSessionResponse({})
      },
      '/uniswap.platformservice.v1.SessionService/UpdateSession': async (): Promise<UpdateSessionResponse> => {
        return new UpdateSessionResponse({})
      },
      '/uniswap.platformservice.v1.SessionService/GetChallengeTypes': async (): Promise<GetChallengeTypesResponse> => {
        return new GetChallengeTypesResponse({ challengeTypes: [] })
      },
      '/uniswap.platformservice.v1.SessionService/Signout': async (): Promise<SignoutResponse> => {
        return new SignoutResponse({})
      },
    }

    // Create session client with test transport
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
  })

  afterEach(async () => {
    // Clean up any stored data
    await sessionStorage.clear()
    await deviceIdService.removeDeviceId()
  })

  it('initializes and stores a session', async () => {
    const response = await sessionService.initSession()

    expect(response).toEqual({
      sessionId: 'test-session-123',
      needChallenge: false,
      extra: {},
    })

    // Verify session was stored
    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('test-session-123')
  })

  it('handles session initialization without challenge requirement', async () => {
    // Override default to return needChallenge: false
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: 'simple-session-123',
          needChallenge: false,
          extra: {},
        })
      }

    await deviceIdService.setDeviceId('simple-device-123')

    // Initialize
    const response = await sessionService.initSession()

    // Verify response
    expect(response.sessionId).toBe('simple-session-123')
    expect(response.needChallenge).toBe(false)

    // Session should be stored
    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('simple-session-123')
  })

  it('properly clears session on deletion', async () => {
    // Initialize a session first
    await sessionService.initSession()

    // Verify session exists
    let storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('test-session-123')

    // Delete session
    await sessionService.removeSession()

    // Verify session is cleared
    storedSession = await sessionStorage.get()
    expect(storedSession).toBeNull()
  })

  it('stores session ID when provided (mobile/extension behavior)', async () => {
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: 'mobile-session-123',
          needChallenge: false,
          extra: {},
        })
      }

    const response = await sessionService.initSession()

    expect(response.sessionId).toBe('mobile-session-123')

    // Session should be stored
    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('mobile-session-123')
  })

  it('handles web sessions without storing session ID when undefined', async () => {
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: undefined,
          needChallenge: true,
          extra: { sitekey: 'turnstile-key' },
        })
      }

    const response = await sessionService.initSession()

    expect(response.sessionId).toBeUndefined()
    expect(response.needChallenge).toBe(true)

    // Session should not be stored
    const storedSession = await sessionStorage.get()
    expect(storedSession).toBeNull()
  })

  it('retrieves existing session state', async () => {
    // Initialize a session
    await sessionService.initSession()

    // Get session state
    const sessionState = await sessionService.getSessionState()

    expect(sessionState).toEqual({
      sessionId: 'test-session-123',
    })
  })

  it('returns null when no session exists', async () => {
    // Don't initialize any session
    const sessionState = await sessionService.getSessionState()

    expect(sessionState).toBeNull()
  })

  it('handles multiple initialization attempts', async () => {
    // First initialization
    await sessionService.initSession()

    const firstSession = await sessionStorage.get()
    expect(firstSession?.sessionId).toBe('test-session-123')

    // Update mock to return different session
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: 'new-session-789',
          needChallenge: false,
          extra: {},
        })
      }

    // Second initialization should replace the first
    await sessionService.initSession()

    const secondSession = await sessionStorage.get()
    expect(secondSession?.sessionId).toBe('new-session-789')
  })

  it('sets and retrieves device ID through init response', async () => {
    mockEndpoints['/uniswap.platformservice.v1.SessionService/InitSession'] =
      async (): Promise<InitSessionResponse> => {
        return new InitSessionResponse({
          sessionId: 'device-test-session',
          needChallenge: false,
          extra: { device_id: 'new-device-123' },
        })
      }

    await sessionService.initSession()

    // Device ID should be stored
    const deviceId = await deviceIdService.getDeviceId()
    expect(deviceId).toBe('new-device-123')
  })

  it('preserves existing device ID when not provided in response', async () => {
    // Set device ID first
    await deviceIdService.setDeviceId('existing-device-456')

    // Init without device_id in response
    await sessionService.initSession()

    // Device ID should remain unchanged
    const deviceId = await deviceIdService.getDeviceId()
    expect(deviceId).toBe('existing-device-456')
  })
})
