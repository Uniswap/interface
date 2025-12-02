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
export type { UniswapIdentifierService } from '@universe/sessions/src/uniswap-identifier/types'
// Session Repository
export { createSessionRepository } from '@universe/sessions/src/session-repository/createSessionRepository'
export type { SessionRepository } from '@universe/sessions/src/session-repository/types'

// Session Service
export { createNoopSessionService } from '@universe/sessions/src/session-service/createNoopSessionService'
export { createSessionService } from '@universe/sessions/src/session-service/createSessionService'
export type {
  SessionService,
  InitSessionResponse,
  ChallengeResponse,
  UpgradeSessionRequest,
  UpgradeSessionResponse,
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
  SessionInitResult,
} from '@universe/sessions/src/session-initialization/createSessionInitializationService'

// Challenge Solvers
export { createChallengeSolverService } from '@universe/sessions/src/challenge-solvers/createChallengeSolverService'
export { createTurnstileMockSolver } from '@universe/sessions/src/challenge-solvers/createTurnstileMockSolver'
export { createHashcashMockSolver } from '@universe/sessions/src/challenge-solvers/createHashcashMockSolver'
export { createNoneMockSolver } from '@universe/sessions/src/challenge-solvers/createNoneMockSolver'
export { createTurnstileSolver } from '@universe/sessions/src/challenge-solvers/createTurnstileSolver'
export { createHashcashSolver } from '@universe/sessions/src/challenge-solvers/createHashcashSolver'
export type {
  ChallengeSolver,
  ChallengeSolverService,
  ChallengeData,
} from '@universe/sessions/src/challenge-solvers/types'

export { ChallengeType } from '@universe/sessions/src/session-service/types'
