import type { ChallengeData, ChallengeSolver } from '@universe/sessions/src/challenge-solvers/types'
import { sleep } from 'utilities/src/time/timing'

/**
 * Creates a mock Turnstile challenge solver for development/testing
 *
 * In production, this would integrate with Cloudflare Turnstile:
 * - Load Turnstile script
 * - Render widget with sitekey from challengeData.extra
 * - Return actual token from Turnstile API
 */
function createTurnstileMockSolver(): ChallengeSolver {
  async function solve(challengeData: ChallengeData): Promise<string> {
    // Simulate widget render delay
    await sleep(300)

    // Simulate challenge solving time (random between 200-500ms)
    const solvingTime = 200 + Math.random() * 300
    await sleep(solvingTime)

    // Return mock Turnstile token
    const timestamp = Date.now()
    const challengeIdPrefix = challengeData.challengeId.slice(0, 8)
    return `mock_turnstile_token_${timestamp}_${challengeIdPrefix}`
  }

  return { solve }
}

export { createTurnstileMockSolver }
