/**
 * Worker-backed hashcash solver.
 *
 * Offloads proof-of-work computation to a Web Worker to avoid
 * blocking the main thread.
 */
import { parseHashcashChallenge } from '@universe/sessions/src/challenge-solvers/createHashcashSolver'
import type { HashcashChallenge } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import type { HashcashWorkerChannelFactory } from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'
import type { ChallengeData, ChallengeSolver } from '@universe/sessions/src/challenge-solvers/types'

interface CreateWorkerHashcashSolverContext {
  /**
   * Factory function to create a worker channel.
   * Platform-specific (web, extension, native) implementations
   * are injected here.
   */
  createChannel: HashcashWorkerChannelFactory

  /**
   * Optional AbortSignal for external cancellation.
   * When aborted, cancels the in-progress proof search.
   */
  signal?: AbortSignal
}

/**
 * Creates a hashcash solver that runs proof-of-work in a worker.
 *
 * @example
 * ```ts
 * import { createHashcashWorkerChannel } from './worker/createHashcashWorkerChannel.web'
 *
 * const getWorker = () => new Worker(new URL('./hashcash.worker.ts', import.meta.url), { type: 'module' })
 *
 * const solver = createWorkerHashcashSolver({
 *   createChannel: () => createHashcashWorkerChannel({ getWorker })
 * })
 *
 * const solution = await solver.solve(challengeData)
 * ```
 */
function createWorkerHashcashSolver(ctx: CreateWorkerHashcashSolverContext): ChallengeSolver {
  async function solve(challengeData: ChallengeData): Promise<string> {
    let challenge: HashcashChallenge

    // Prefer typed challengeData over legacy extra field
    if (challengeData.challengeData?.case === 'hashcash') {
      const typed = challengeData.challengeData.value
      challenge = {
        difficulty: typed.difficulty,
        subject: typed.subject,
        algorithm: typed.algorithm as 'sha256',
        nonce: typed.nonce,
        max_proof_length: typed.maxProofLength,
        verifier: typed.verifier,
      }
    } else {
      const challengeDataStr = challengeData.extra?.['challengeData']
      if (!challengeDataStr) {
        throw new Error('Missing challengeData in challenge extra field')
      }
      challenge = parseHashcashChallenge(challengeDataStr)
    }

    // Create worker channel
    const channel = ctx.createChannel()

    // Handle external cancellation
    const abortHandler = (): void => {
      channel.api.cancel().catch(() => {
        // Ignore cancellation errors
      })
    }

    if (ctx.signal) {
      ctx.signal.addEventListener('abort', abortHandler)
    }

    try {
      // Check if already aborted
      if (ctx.signal?.aborted) {
        throw new Error('Challenge solving was cancelled')
      }

      // Find proof-of-work solution in worker
      const proof = await channel.api.findProof({
        challenge,
        rangeStart: 0,
        rangeSize: challenge.max_proof_length,
      })

      if (!proof) {
        // Could be cancelled or no solution found
        if (ctx.signal?.aborted) {
          throw new Error('Challenge solving was cancelled')
        }

        throw new Error(
          `Failed to find valid proof within allowed range (0-${challenge.max_proof_length}). ` +
            'Challenge may have expired or difficulty may be too high.',
        )
      }

      // Return the solution in the format expected by backend: "${subject}:${nonce}:${counter}"
      return `${challenge.subject}:${challenge.nonce}:${proof.counter}`
    } finally {
      // Clean up
      if (ctx.signal) {
        ctx.signal.removeEventListener('abort', abortHandler)
      }
      channel.terminate()
    }
  }

  return { solve }
}

export { createWorkerHashcashSolver }
export type { CreateWorkerHashcashSolverContext }
