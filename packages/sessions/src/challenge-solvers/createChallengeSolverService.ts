import { ChallengeType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createHashcashMockSolver } from '@universe/sessions/src/challenge-solvers/createHashcashMockSolver'
import { createNoneMockSolver } from '@universe/sessions/src/challenge-solvers/createNoneMockSolver'
import { createTurnstileMockSolver } from '@universe/sessions/src/challenge-solvers/createTurnstileMockSolver'
import type { ChallengeSolver, ChallengeSolverService } from '@universe/sessions/src/challenge-solvers/types'

interface CreateChallengeSolverServiceContext {
  /**
   * Optional custom solvers to override defaults
   * Allows injection of real implementations or custom mocks
   */
  solvers?: Map<ChallengeType, ChallengeSolver>
}

function createChallengeSolverService(ctx: CreateChallengeSolverServiceContext = {}): ChallengeSolverService {
  // Use injected solvers or fall back to default mocks
  const solvers = ctx.solvers ?? createDefaultSolvers()

  function getSolver(type: ChallengeType): ChallengeSolver | null {
    // Handle UNSPECIFIED type explicitly
    if (type === ChallengeType.UNSPECIFIED) {
      return {
        solve: async (): Promise<string> => {
          throw new Error('No solver available for challenge type: UNSPECIFIED')
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
function createDefaultSolvers(): Map<ChallengeType, ChallengeSolver> {
  return new Map<ChallengeType, ChallengeSolver>([
    [ChallengeType.UNSPECIFIED, createNoneMockSolver()],
    [ChallengeType.TURNSTILE, createTurnstileMockSolver()],
    [ChallengeType.HASHCASH, createHashcashMockSolver()],
  ])
}

export { createChallengeSolverService }
export type { CreateChallengeSolverServiceContext }
