import type { ChallengeData, ChallengeSolver } from '@universe/sessions/src/challenge-solvers/types'
import { sleep } from 'utilities/src/time/timing'

/**
 * Creates a mock Hashcash proof-of-work solver for development/testing
 *
 * In production, this would:
 * - Extract difficulty/bits from challengeData.extra
 * - Iterate through nonces to find hash with required leading zeros
 * - Return actual proof-of-work solution
 *
 * Hashcash format: version:bits:date:resource::nonce:base64
 */
function createHashcashMockSolver(): ChallengeSolver {
  async function solve(challengeData: ChallengeData): Promise<string> {
    // Extract difficulty from extra data
    const difficulty = challengeData.extra?.bits || '20'

    // Simulate proof-of-work computation time
    // Real implementation would iterate through nonces
    const iterations = parseInt(difficulty) / 4
    for (let i = 0; i < iterations; i++) {
      await sleep(100) // Simulate work
    }

    // Generate mock hashcash solution
    const nonce = Math.random().toString(36).substring(2, 15)
    const mockHash = btoa(`${challengeData.challengeId}${nonce}`).slice(0, 27)
    const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '')
    const resource = challengeData.challengeId.slice(0, 16)

    // Return in hashcash format
    return `1:${difficulty}:${timestamp}:${resource}::${nonce}:${mockHash}`
  }

  return { solve }
}

export { createHashcashMockSolver }
