import { getIsHashcashSolverEnabled, waitForStatsigReady } from '@universe/gating'
import type { ChallengeData, ChallengeSolver } from '@universe/sessions'

/**
 * Chooses between the real and mock hashcash solvers per challenge, once Statsig has loaded gate
 * values. Session init kicks off on first mount, typically before the Statsig fetch resolves; a flag
 * read at that point returns false and silently selects the mock solver, whose solutions the backend
 * rejects, leaving every session-gated request 401 until a retry happens to re-read the flag.
 * Deferring the read to solve time keeps InitSession unblocked while still honoring the kill switch.
 */
export function createStatsigGatedHashcashSolver({
  realSolver,
  mockSolver,
}: {
  realSolver: ChallengeSolver
  mockSolver: ChallengeSolver
}): ChallengeSolver {
  return {
    solve: async (challengeData: ChallengeData): Promise<string> => {
      await waitForStatsigReady()
      const solver = getIsHashcashSolverEnabled() ? realSolver : mockSolver
      return solver.solve(challengeData)
    },
  }
}
