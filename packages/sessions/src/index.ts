/**
 * @universe/sessions
 *
 * This is the ONLY public entry point for the Sessions package.
 * All exports must be explicitly listed here.
 * Deep imports are forbidden and will be blocked by lint.
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
  UserInfo,
} from '@universe/sessions/src/session-repository/types'
// The session-repository request/response types share names with the session-service
// variants exported below, so they are exported under `SessionRepository`-prefixed aliases.
export type {
  ChallengeRequest as SessionRepositoryChallengeRequest,
  ChallengeResponse as SessionRepositoryChallengeResponse,
  InitSessionResponse as SessionRepositoryInitSessionResponse,
  VerifySessionRequest as SessionRepositoryVerifySessionRequest,
  VerifySessionResponse as SessionRepositoryVerifySessionResponse,
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
export {
  SESSION_INIT_QUERY_KEY,
  sessionInitQuery,
} from '@universe/sessions/src/session-initialization/sessionInitQuery'
export type { SessionInitQueryOptions } from '@universe/sessions/src/session-initialization/sessionInitQuery'

// Session Gate
export { createSession } from '@universe/sessions/src/session-gate/createSession'
export { singleflight } from '@universe/sessions/src/session-gate/singleflight'
export { SessionGateSource } from '@universe/sessions/src/session-gate/sources'
export { gated } from '@universe/sessions/src/session-gate/createGate'
export {
  isConnectUnauthorized,
  isFetchUnauthorized,
  isSessionAuthFailureStatus,
} from '@universe/sessions/src/session-gate/classifyError'
export { requireSessionInterceptor } from '@universe/sessions/src/session-gate/requireSessionInterceptor'
export { requireSessionFetch } from '@universe/sessions/src/session-gate/requireSessionFetch'
export { withSession } from '@universe/sessions/src/session-gate/withSession'
export {
  SessionReadyTimeoutError,
  SessionRecoveryFailedError,
  SessionNotBootstrappedError,
} from '@universe/sessions/src/session-gate/errors'
export type { Session, SessionAdapter, SessionGateState } from '@universe/sessions/src/session-gate/types'

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
  FindProofParams,
  HashcashWorkerAPI,
  HashcashWorkerChannel,
  HashcashWorkerChannelFactory,
} from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'
export type { HashcashChallenge, ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/shared'
// Resolves platform-specifically (core.web.ts / core.native.ts) at the consumer's bundler,
// exactly like a direct import of the core module would.
export { findProof } from '@universe/sessions/src/challenge-solvers/hashcash/core'
export {
  createHashcashWorkerChannel,
  HashcashWorkerBootError,
} from '@universe/sessions/src/challenge-solvers/hashcash/worker/createHashcashWorkerChannel'
// Note: Web Worker factory is intentionally NOT exported from here — consumers must
// create the Worker instance themselves via a `new Worker(new URL(..., import.meta.url))`
// expression in their own source tree. Vite's worker URL transformation only fires when
// the pattern lives in the app code, not in a workspace package.
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
  createMockSessionClient,
  defineMockEndpoints,
  InMemorySessionStorage,
  InMemoryDeviceIdService,
  InMemoryUniswapIdentifierService,
} from '@universe/sessions/src/test-utils'
export {
  createCookieJar,
  createLocalCookieTransport,
} from '@universe/sessions/src/test-utils/createLocalCookieTransport'
export { createLocalHeaderTransport } from '@universe/sessions/src/test-utils/createLocalHeaderTransport'

// Composable test session factory
export { createTestSessionContext } from '@universe/sessions/src/testing'
export type {
  TestSessionContext,
  TestSessionPlatform,
  CreateTestSessionContextOptions,
} from '@universe/sessions/src/testing'
