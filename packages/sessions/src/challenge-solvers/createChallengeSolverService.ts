import { BotDetectionType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createHashcashMockSolver } from '@universe/sessions/src/challenge-solvers/createHashcashMockSolver'
import { createNoneMockSolver } from '@universe/sessions/src/challenge-solvers/createNoneMockSolver'
import { createTurnstileMockSolver } from '@universe/sessions/src/challenge-solvers/createTurnstileMockSolver'
import type { ChallengeSolver, ChallengeSolverService } from '@universe/sessions/src/challenge-solvers/types'

interface CreateChallengeSolverServiceContext {
  /**
   * Optional custom solvers to override defaults
   * Allows injection of real implementations or custom mocks
   */
  solvers?: Map<BotDetectionType, ChallengeSolver>
}

function createChallengeSolverService(ctx: CreateChallengeSolverServiceContext = {}): ChallengeSolverService {
  // Use injected solvers or fall back to default mocks
  const solvers = ctx.solvers ?? createDefaultSolvers()

  function getSolver(type: BotDetectionType): ChallengeSolver | null {
    // Handle None type explicitly
    if (type === BotDetectionType.BOT_DETECTION_NONE) {
      return {
        solve: async (): Promise<string> => {
          throw new Error('No solver available for bot detection type: None')
        },
      }
    }

    return solvers.get(type) ?? null
  }

  return { getSolver }
}

/**
 * Creates the default set of mock solvers for development/testing
 */
function createDefaultSolvers(): Map<BotDetectionType, ChallengeSolver> {
  return new Map<BotDetectionType, ChallengeSolver>([
    [BotDetectionType.BOT_DETECTION_NONE, createNoneMockSolver()],
    [BotDetectionType.BOT_DETECTION_TURNSTILE, createTurnstileMockSolver()],
    [BotDetectionType.BOT_DETECTION_HASHCASH, createHashcashMockSolver()],
  ])
}

export { createChallengeSolverService }
export type { CreateChallengeSolverServiceContext }
