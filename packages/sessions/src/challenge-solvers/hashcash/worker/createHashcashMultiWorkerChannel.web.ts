/**
 * Multi-worker channel factory for parallel hashcash proof-of-work.
 *
 * Spawns multiple Web Workers to search different counter ranges in parallel.
 * Uses Promise.race() - first worker to find a valid proof wins.
 *
 * This provides significant speedup on multi-core systems:
 * - 4 workers ~= 4x speedup
 * - 8 workers ~= 8x speedup (diminishing returns beyond core count)
 */

import type { ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import type {
  FindProofParams,
  HashcashWorkerAPI,
  HashcashWorkerChannel,
} from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'
import { createChannel } from 'bidc'

/**
 * Configuration for multi-worker hashcash channel.
 */
interface MultiWorkerConfig {
  /**
   * Number of workers to spawn.
   * Defaults to navigator.hardwareConcurrency or 4.
   */
  workerCount?: number

  /**
   * Factory function to create a Worker instance.
   */
  getWorker: () => Worker
}

/**
 * Internal worker state for tracking individual workers.
 */
interface WorkerState {
  worker: Worker
  channel: ReturnType<typeof createChannel>
  cancelled: boolean
}

/**
 * Creates a multi-worker channel for parallel hashcash proof-of-work.
 *
 * @example
 * ```ts
 * const channel = createHashcashMultiWorkerChannel({
 *   workerCount: 4,
 *   getWorker: () => new Worker(
 *     new URL('./hashcash.worker.ts', import.meta.url),
 *     { type: 'module' }
 *   ),
 * })
 *
 * const proof = await channel.api.findProof({ challenge })
 * channel.terminate()
 * ```
 */
function createHashcashMultiWorkerChannel(config: MultiWorkerConfig): HashcashWorkerChannel {
  const workerCount = config.workerCount ?? (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4)
  const workers: WorkerState[] = []

  // Track if we've been terminated
  let terminated = false

  // Initialize workers lazily on first findProof call
  const initWorkers = (): void => {
    if (workers.length > 0 || terminated) {
      return
    }

    for (let i = 0; i < workerCount; i++) {
      const worker = config.getWorker()
      const channel = createChannel(worker)
      workers.push({ worker, channel, cancelled: false })
    }
  }

  const api: HashcashWorkerAPI = {
    async findProof(params: FindProofParams): Promise<ProofResult | null> {
      if (terminated) {
        throw new Error('Multi-worker channel has been terminated')
      }

      initWorkers()

      // Reset cancelled state for all workers at start of new search
      workers.forEach((state) => {
        state.cancelled = false
      })

      const { challenge, rangeStart = 0, rangeSize = challenge.max_proof_length } = params
      const rangeEnd = rangeStart + rangeSize

      // Divide range across workers
      const rangePerWorker = Math.ceil(rangeSize / workerCount)

      // Track completion state
      let foundResult: ProofResult | null = null
      let completedCount = 0

      // Pre-calculate expected worker count before starting any workers.
      // This avoids a subtle dependency on JS event loop microtask ordering:
      // if we counted inline, a fast-completing worker's .then() could
      // theoretically race with the loop incrementing the started count.
      let expectedCount = 0
      workers.forEach((state, index) => {
        if (state.cancelled || terminated) {
          return
        }
        const workerRangeStart = rangeStart + index * rangePerWorker
        const workerRangeEnd = Math.min(workerRangeStart + rangePerWorker, rangeEnd)
        if (workerRangeEnd - workerRangeStart > 0) {
          expectedCount++
        }
      })

      if (expectedCount === 0) {
        return null
      }

      return new Promise((resolve) => {
        // Start all workers in parallel
        workers.forEach((state, index) => {
          if (terminated) {
            return
          }

          const workerRangeStart = rangeStart + index * rangePerWorker
          const workerRangeEnd = Math.min(workerRangeStart + rangePerWorker, rangeEnd)
          const workerRangeSize = workerRangeEnd - workerRangeStart

          if (workerRangeSize <= 0) {
            return
          }

          // Start worker search (don't await - let them race)
          state.channel
            .send({
              type: 'findProof',
              params: {
                challenge,
                rangeStart: workerRangeStart,
                rangeSize: workerRangeSize,
              },
            })
            .then((result: unknown) => {
              // Check if worker returned busy response
              if (result && typeof result === 'object' && 'busy' in result) {
                return null
              }
              return result as ProofResult | null
            })
            .then((result) => {
              completedCount++

              // First worker to find a valid proof wins
              if (result && !foundResult && !terminated) {
                foundResult = result
                // Cancel all other workers immediately
                api.cancel().catch(() => {})
                resolve(result)
              } else if (completedCount === expectedCount && !foundResult) {
                // All expected workers done, no result found
                resolve(null)
              }
            })
            .catch(() => {
              completedCount++
              if (completedCount === expectedCount && !foundResult) {
                resolve(null)
              }
            })
        })
      })
    },

    async cancel(): Promise<void> {
      // Cancel all workers - fire and forget for speed
      workers.forEach((state) => {
        if (!state.cancelled) {
          state.cancelled = true
          state.channel.send({ type: 'cancel' }).catch(() => {
            // Ignore cancel errors
          })
        }
      })
    },
  }

  return {
    api,
    terminate(): void {
      terminated = true

      // Terminate all workers
      for (const state of workers) {
        state.cancelled = true
        state.channel.cleanup()
        state.worker.terminate()
      }

      workers.length = 0
    },
  }
}

export { createHashcashMultiWorkerChannel }
export type { MultiWorkerConfig }
