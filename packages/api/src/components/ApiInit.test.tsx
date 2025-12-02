import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { ApiInit } from '@universe/api/src/components/ApiInit'
import {
  createChallengeSolverService,
  createDeviceIdService,
  createSessionInitializationService,
  createSessionRepository,
  createSessionService,
  createSessionStorage,
  type DeviceIdService,
  type SessionInitializationService,
  type SessionService,
  type SessionStorage,
} from '@universe/sessions'
import React from 'react'
import { sleep } from 'utilities/src/time/timing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock platform detection - we're testing as extension by default
vi.mock('utilities/src/platform', () => ({
  isWeb: false,
  isExtension: true,
  isInterface: false,
}))

// Mock the session service enabled flag
vi.mock('@universe/api/src/getIsSessionServiceEnabled', () => ({
  getIsSessionServiceEnabled: vi.fn(() => true),
}))

describe('ApiInit Integration', () => {
  // Services and mocked boundaries
  let queryClient: QueryClient
  let mockStorage: Map<string, any>
  let mockApiClient: {
    initSession: ReturnType<typeof vi.fn>
    challenge: ReturnType<typeof vi.fn>
    verify: ReturnType<typeof vi.fn>
    upgradeSession: ReturnType<typeof vi.fn>
  }
  let sessionStorage: SessionStorage
  let deviceIdService: DeviceIdService
  let sessionService: SessionService
  let initService: SessionInitializationService

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock only the boundaries (storage and network)
    mockStorage = new Map()
    mockApiClient = {
      initSession: vi.fn().mockResolvedValue({
        sessionId: 'test-session-123',
        needChallenge: false,
        extra: {},
      }),
      challenge: vi.fn().mockResolvedValue({
        challengeId: 'challenge-456',
        botDetectionType: 'Turnstile',
        extra: { sitekey: 'mock-sitekey' },
      }),
      verify: vi.fn().mockResolvedValue({
        retry: false,
      }),
      upgradeSession: vi.fn().mockResolvedValue({
        retry: false,
      }),
    }

    // Create REAL service instances with mocked boundaries
    sessionStorage = createSessionStorage({
      getSessionId: async () => mockStorage.get('sessionId') || null,
      setSessionId: async (id) => {
        mockStorage.set('sessionId', id)
      },
      clearSessionId: async () => {
        mockStorage.delete('sessionId')
      },
    })

    deviceIdService = createDeviceIdService({
      getDeviceId: async () => mockStorage.get('deviceId') || '',
      setDeviceId: async (id) => {
        mockStorage.set('deviceId', id)
      },
      removeDeviceId: async () => {
        mockStorage.delete('deviceId')
      },
    })

    const sessionRepository = createSessionRepository({
      client: mockApiClient as any,
    })

    sessionService = createSessionService({
      sessionStorage,
      deviceIdService,
      sessionRepository,
    })

    const challengeSolverService = createChallengeSolverService()
    // Add a mock solver for Turnstile
    challengeSolverService.getSolver = vi.fn().mockReturnValue({
      solve: vi.fn().mockResolvedValue('mock-solution'),
    })

    initService = createSessionInitializationService({
      sessionService,
      challengeSolverService,
    })

    // Fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes session and makes it available for API requests', async () => {
    // Act: Render the component
    render(
      <QueryClientProvider client={queryClient}>
        <ApiInit sessionInitService={initService} />
      </QueryClientProvider>,
    )

    // Assert: Session was initialized
    await waitFor(() => {
      expect(mockApiClient.initSession).toHaveBeenCalled()
    })

    // Wait a bit for async storage operations to complete
    await sleep(50)

    // Assert: Session is now stored and retrievable
    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('test-session-123')

    // Verify storage was actually set
    expect(mockStorage.get('sessionId')).toBe('test-session-123')
  })

  it('completes challenge flow when required by server', async () => {
    // Setup: Server requires challenge
    mockApiClient.initSession.mockResolvedValue({
      sessionId: 'challenge-session',
      needChallenge: true,
      extra: {},
    })

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <ApiInit sessionInitService={initService} />
      </QueryClientProvider>,
    )

    // Assert: Full flow completes
    await waitFor(() => {
      expect(mockApiClient.initSession).toHaveBeenCalled()
      expect(mockApiClient.challenge).toHaveBeenCalled()
      expect(mockApiClient.verify).toHaveBeenCalled()
    })

    // Assert: Session is stored after challenge
    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('challenge-session')
  })

  it('uses existing session without re-initialization', async () => {
    // Setup: Pre-populate storage with existing session
    await sessionStorage.set({ sessionId: 'existing-session' })

    // Mock the service to simulate finding existing session
    sessionService.getSessionState = vi.fn().mockResolvedValue({
      sessionId: 'existing-session',
    })

    // Act
    render(
      <QueryClientProvider client={queryClient}>
        <ApiInit sessionInitService={initService} />
      </QueryClientProvider>,
    )

    // Wait for initialization check
    await waitFor(() => {
      expect(sessionService.getSessionState).toHaveBeenCalled()
    })

    // Assert: API init was NOT called since session exists
    expect(mockApiClient.initSession).not.toHaveBeenCalled()
  })

  it('retries initialization on transient failures', async () => {
    // Use fake timers to speed up retry delays
    vi.useFakeTimers()

    let attemptCount = 0

    // Mock the initialize method of the initService directly
    // This will properly trigger React Query's retry logic
    initService.initialize = vi.fn().mockImplementation(async () => {
      attemptCount++
      if (attemptCount < 3) {
        throw new Error('Network error')
      }
      // Mock successful initialization after retries
      await sessionStorage.set({ sessionId: 'retry-success' })
      return { sessionId: 'retry-success', needChallenge: false, extra: {} }
    })

    // Use query client with no default retries - component controls retry
    const retryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Let component control retries
        },
      },
    })

    // Act
    render(
      <QueryClientProvider client={retryClient}>
        <ApiInit sessionInitService={initService} />
      </QueryClientProvider>,
    )

    // Fast-forward through the retry delays
    await vi.waitFor(
      async () => {
        // Advance timers to trigger retries
        await vi.advanceTimersByTimeAsync(1000) // First retry after 1000ms
        await vi.advanceTimersByTimeAsync(2000) // Second retry after 2000ms
        expect(initService.initialize).toHaveBeenCalledTimes(3)
      },
      { timeout: 500 }, // Much faster with fake timers
    )

    const storedSession = await sessionStorage.get()
    expect(storedSession?.sessionId).toBe('retry-success')

    // Restore real timers
    vi.useRealTimers()
  })

  it('prevents duplicate initialization on re-renders', async () => {
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ApiInit sessionInitService={initService} />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(mockApiClient.initSession).toHaveBeenCalledTimes(1)
    })

    // Re-render multiple times
    rerender(
      <QueryClientProvider client={queryClient}>
        <ApiInit sessionInitService={initService} />
      </QueryClientProvider>,
    )

    rerender(
      <QueryClientProvider client={queryClient}>
        <ApiInit sessionInitService={initService} />
      </QueryClientProvider>,
    )

    // Wait to ensure no additional calls
    await sleep(100)

    // Assert: Still only initialized once due to React Query caching
    expect(mockApiClient.initSession).toHaveBeenCalledTimes(1)
  })

  it('should not initialize session when feature flag is disabled', async () => {
    // Mock the feature flag as disabled
    const { getIsSessionServiceEnabled } = await import('@universe/api/src/getIsSessionServiceEnabled')
    vi.mocked(getIsSessionServiceEnabled).mockReturnValue(false)

    render(
      <QueryClientProvider client={queryClient}>
        <ApiInit sessionInitService={initService} />
      </QueryClientProvider>,
    )

    // Wait to ensure no calls are made
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Assert: No session initialization should occur
    expect(mockApiClient.initSession).not.toHaveBeenCalled()
    expect(mockApiClient.challenge).not.toHaveBeenCalled()
    expect(mockApiClient.upgradeSession).not.toHaveBeenCalled()
  })
})
