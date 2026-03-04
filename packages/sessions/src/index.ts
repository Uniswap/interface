/** biome-ignore-all assist/source/organizeImports: we want to manually group exports by category */

/**
 * @universe/sessions
 *
 * This is the ONLY public entry point for the Sessions package.
 * All exports must be explicitly listed here.
 * Deep imports are forbidden and will be blocked by ESLint.
 */

// Device ID
export { createDeviceIdService } from '@universe/sessions/src/device-id/createDeviceIdService'
export type { DeviceIdService } from '@universe/sessions/src/device-id/types'
// Uniswap Identifier
export { createUniswapIdentifierService } from '@universe/sessions/src/uniswap-identifier/createUniswapIdentifierService'
export { uniswapIdentifierQuery } from '@universe/sessions/src/uniswap-identifier/uniswapIdentifierQuery'
export type { UniswapIdentifierService } from '@universe/sessions/src/uniswap-identifier/types'
// Session Repository
export { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
export { ChallengeRejectedError } from '@universe/sessions/src/session-repository/errors'
export { ChallengeFailureReason, VerifyFailureReason } from '@universe/sessions/src/session-repository/types'
export type {
  SessionRepository,
  ChallengeTypeConfig,
  TypedChallengeData,
  TurnstileChallengeData,
  HashCashChallengeData,
  GitHubChallengeData,
} from '@universe/sessions/src/session-repository/types'

// Session Service
export { createNoopSessionService } from '@universe/sessions/src/session-service/createNoopSessionService'
export { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
export type {
  SessionService,
  InitSessionResponse,
  ChallengeRequest,
  ChallengeResponse,
  VerifySessionRequest,
  VerifySessionResponse,
} from '@universe/sessions/src/session-service/types'

// Session Storage
export { createSessionStorage } from '@universe/sessions/src/session-storage/createSessionStorage'
export type { SessionStorage, SessionState } from '@universe/sessions/src/session-storage/types'

// Session Client
export { createSessionClient } from '@universe/sessions/src/session-repository/createSessionClient'
export type { SessionServiceClient } from '@universe/sessions/src/session-repository/createSessionClient'

// Session Initialization
export { createSessionInitializationService } from '@universe/sessions/src/session-initialization/createSessionInitializationService'
export {
  SessionError,
  MaxChallengeRetriesError,
  NoSolverAvailableError,
} from '@universe/sessions/src/session-initialization/sessionErrors'
export type {
  SessionInitializationService,
  SessionInitOptions,
  SessionInitResult,
  SessionInitAnalytics,
} from '@universe/sessions/src/session-initialization/createSessionInitializationService'

// Challenge Solvers
export { createChallengeSolverService } from '@universe/sessions/src/challenge-solvers/createChallengeSolverService'
export { createTurnstileMockSolver } from '@universe/sessions/src/challenge-solvers/createTurnstileMockSolver'
export { createHashcashMockSolver } from '@universe/sessions/src/challenge-solvers/createHashcashMockSolver'
export { createNoneMockSolver } from '@universe/sessions/src/challenge-solvers/createNoneMockSolver'
export { createTurnstileSolver } from '@universe/sessions/src/challenge-solvers/createTurnstileSolver'
export { createHashcashSolver } from '@universe/sessions/src/challenge-solvers/createHashcashSolver'
export { createWorkerHashcashSolver } from '@universe/sessions/src/challenge-solvers/hashcash/createWorkerHashcashSolver'
export {
  TurnstileScriptLoadError,
  TurnstileApiNotAvailableError,
  TurnstileTimeoutError,
  TurnstileError,
  TurnstileTokenExpiredError,
} from '@universe/sessions/src/challenge-solvers/turnstileErrors'
export type {
  ChallengeSolver,
  ChallengeSolverService,
  ChallengeData,
  TurnstileScriptOptions,
} from '@universe/sessions/src/challenge-solvers/types'
export type {
  CreateTurnstileSolverContext,
  TurnstileSolveAnalytics,
} from '@universe/sessions/src/challenge-solvers/createTurnstileSolver'
export type {
  CreateHashcashWorkerChannelContext,
  HashcashWorkerChannel,
  HashcashWorkerChannelFactory,
} from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'
export { createHashcashWorkerChannel } from '@universe/sessions/src/challenge-solvers/hashcash/worker/createHashcashWorkerChannel'
export { createHashcashMultiWorkerChannel } from '@universe/sessions/src/challenge-solvers/hashcash/worker/createHashcashMultiWorkerChannel'
export type { MultiWorkerConfig } from '@universe/sessions/src/challenge-solvers/hashcash/worker/createHashcashMultiWorkerChannel'
export type { CreateWorkerHashcashSolverContext } from '@universe/sessions/src/challenge-solvers/hashcash/createWorkerHashcashSolver'
export type {
  CreateHashcashSolverContext,
  HashcashSolveAnalytics,
} from '@universe/sessions/src/challenge-solvers/createHashcashSolver'

export { ChallengeType } from '@universe/sessions/src/session-service/types'

// OAuth Service
export { createOAuthService } from '@universe/sessions/src/oauth-service/createOAuthService'
export type { CreateOAuthServiceContext } from '@universe/sessions/src/oauth-service/createOAuthService'
export type {
  OAuthService,
  OAuthInitiationResult,
  OAuthCallbackParams,
  OAuthVerificationResult,
  OAuthInitiateParams,
  OAuthVerifyParams,
  OAuthUserInfo,
} from '@universe/sessions/src/oauth-service/types'

// Performance Tracking
export type { PerformanceTracker } from '@universe/sessions/src/performance/types'
export {
  createPerformanceTracker,
  PERFORMANCE_TRACKING_DISABLED,
} from '@universe/sessions/src/performance/createPerformanceTracker'
export type { CreatePerformanceTrackerContext } from '@universe/sessions/src/performance/createPerformanceTracker'
export { createNoopPerformanceTracker } from '@universe/sessions/src/performance/createNoopPerformanceTracker'

// Test utilities (for integration testing)
export {
  InMemorySessionStorage,
  InMemoryDeviceIdService,
  InMemoryUniswapIdentifierService,
} from '@universe/sessions/src/test-utils'
export {
  createCookieJar,
  createLocalCookieTransport,
} from '@universe/sessions/src/test-utils/createLocalCookieTransport'
