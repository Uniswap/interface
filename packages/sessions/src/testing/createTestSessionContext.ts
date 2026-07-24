import { createChallengeSolverService } from '@universe/sessions/src/challenge-solvers/createChallengeSolverService'
import { createHashcashSolver } from '@universe/sessions/src/challenge-solvers/createHashcashSolver'
import { createNoneMockSolver } from '@universe/sessions/src/challenge-solvers/createNoneMockSolver'
import { createTurnstileMockSolver } from '@universe/sessions/src/challenge-solvers/createTurnstileMockSolver'
import type { PerformanceTracker } from '@universe/sessions/src/performance/types'
import { createSessionInitializationService } from '@universe/sessions/src/session-initialization/createSessionInitializationService'
import { createSessionClient } from '@universe/sessions/src/session-repository/createSessionClient'
import { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
import { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
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
import { createLocalHeaderTransport } from '@universe/sessions/src/test-utils/createLocalHeaderTransport'
import type {
  CreateTestSessionContextOptions,
  TestSessionContext,
  TestSessionPlatform,
} from '@universe/sessions/src/testing/types'

// TODO(entry-gateway-urls): duplicated from the canonical definition in
// packages/api/src/clients/base/entryGatewayUrls.ts — @universe/api depends on
// @universe/sessions, so importing it here would create a package cycle. Keep in sync.
const DEFAULT_BACKEND_URL = 'https://entry-gateway.backend-staging.api.uniswap.org'

const PLATFORM_TO_REQUEST_SOURCE = {
  web: 'uniswap-web',
  ios: 'uniswap-ios',
  android: 'uniswap-android',
  extension: 'uniswap-extension',
} as const satisfies Record<TestSessionPlatform, string>

function createMockPerformanceTracker(): PerformanceTracker {
  let time = 0
  return {
    now: (): number => {
      time += 100
      return time
    },
  }
}

/**
 * Creates a fully authenticated session context for integration testing.
 *
 * Handles the entire session lifecycle: storage setup, transport creation,
 * challenge solving (hashcash), and session verification. Returns a context
 * with everything needed to make authenticated requests against the backend.
 *
 * @example
 * ```ts
 * const ctx = await createTestSessionContext({ platform: 'extension' })
 * const headers = await ctx.getSessionHeaders()
 * // Use headers in fetch/ethers/viem calls
 * ```
 */
export async function createTestSessionContext(options?: CreateTestSessionContextOptions): Promise<TestSessionContext> {
  const platform = options?.platform ?? 'extension'
  const backendUrl = options?.backendUrl ?? DEFAULT_BACKEND_URL
  const autoUpgrade = options?.autoUpgrade ?? true

  const requestSource = PLATFORM_TO_REQUEST_SOURCE[platform]

  const sessionStorage = options?.sessionStorage ?? new InMemorySessionStorage()
  const deviceIdService = options?.deviceIdService ?? new InMemoryDeviceIdService()
  const uniswapIdentifierService = options?.uniswapIdentifierService ?? new InMemoryUniswapIdentifierService()

  // Create transport based on platform
  let cookieJar: Map<string, string> | null = null

  const transport =
    platform === 'web'
      ? (() => {
          cookieJar = createCookieJar()
          return createLocalCookieTransport({ baseUrl: backendUrl, cookieJar })
        })()
      : createLocalHeaderTransport({
          baseUrl: backendUrl,
          requestSource: requestSource as 'uniswap-ios' | 'uniswap-android' | 'uniswap-extension',
          getSessionId: async () => (await sessionStorage.get())?.sessionId ?? null,
          getDeviceId: async () => deviceIdService.getDeviceId(),
        })

  // Create session infrastructure
  const sessionClient = createSessionClient({ transport })
  const sessionRepository = createSessionRepository({ client: sessionClient })
  const sessionService = createSessionService({
    sessionStorage,
    deviceIdService,
    uniswapIdentifierService,
    sessionRepository,
  })

  // Create challenge solvers
  const performanceTracker = createMockPerformanceTracker()
  const solvers = new Map([
    [ChallengeType.HASHCASH, createHashcashSolver({ performanceTracker })],
    ...(platform === 'web' ? [[ChallengeType.TURNSTILE, createTurnstileMockSolver()] as const] : []),
    [ChallengeType.UNSPECIFIED, createNoneMockSolver()],
  ])
  const challengeSolverService = createChallengeSolverService({ solvers })

  // Initialize session
  const sessionInitService = createSessionInitializationService({
    getSessionService: () => sessionService,
    challengeSolverService,
    performanceTracker,
    getIsSessionUpgradeAutoEnabled: () => autoUpgrade,
  })

  await sessionInitService.initialize()

  return {
    sessionService,
    sessionStorage,
    deviceIdService,
    uniswapIdentifierService,
    transport,
    backendUrl,
    platform,
    cookieJar,

    getSessionHeaders: async () => {
      const sessionId = (await sessionStorage.get())?.sessionId
      const deviceId = await deviceIdService.getDeviceId()
      const headers: Record<string, string> = {
        'x-request-source': requestSource,
      }
      if (sessionId) {
        headers['X-Session-ID'] = sessionId
      }
      if (deviceId) {
        headers['X-Device-ID'] = deviceId
      }
      return headers
    },

    cleanup: async () => {
      await sessionService.removeSession()
      await sessionStorage.clear()
      await deviceIdService.removeDeviceId()
      await uniswapIdentifierService.removeUniswapIdentifier()
      cookieJar?.clear()
    },
  }
}
