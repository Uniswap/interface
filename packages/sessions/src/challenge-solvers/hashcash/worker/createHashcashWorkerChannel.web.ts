/**
 * Web Worker channel factory for hashcash proof-of-work.
 *
 * Creates a Web Worker and establishes a BIDC channel for
 * bidirectional async communication.
 *
 * This is the web platform implementation used by both web app and extension.
 */

import type { ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import type {
  CreateHashcashWorkerChannelContext,
  FindProofParams,
  HashcashWorkerAPI,
  HashcashWorkerChannel,
} from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'
import { createChannel } from 'bidc'

// Singleton worker instance for reuse
let sharedWorker: Worker | null = null
let sharedChannel: ReturnType<typeof createChannel> | null = null
let referenceCount = 0
// Track pending operations to reject on terminate
const pendingOperations = new Set<(err: Error) => void>()

/**
 * Creates (or reuses) a channel to the hashcash worker.
 *
 * Uses a shared worker instance to avoid creation overhead.
 * The worker is only terminated when all channels are closed.
 *
 * @param ctx - Context containing getWorker function to create the Worker instance
 */
function createHashcashWorkerChannel(ctx: CreateHashcashWorkerChannelContext): HashcashWorkerChannel {
  // Create worker on first use
  if (!sharedWorker) {
    sharedWorker = ctx.getWorker()
    sharedChannel = createChannel(sharedWorker)
  }

  referenceCount++

  const channel = sharedChannel
  if (!channel) {
    throw new Error('Worker channel not initialized')
  }
  const { send } = channel

  const api: HashcashWorkerAPI = {
    findProof(params: FindProofParams): Promise<ProofResult | null> {
      return new Promise((resolve, reject) => {
        pendingOperations.add(reject)

        send({ type: 'findProof', params })
          .then((result: unknown) => {
            // Check if worker returned busy response
            // Worker returns { busy: true } when another operation is in progress
            if (result && typeof result === 'object' && 'busy' in result) {
              reject(new Error('Worker is busy - another findProof operation is in progress'))
            } else {
              resolve(result as ProofResult | null)
            }
          })
          .catch(reject)
          .finally(() => pendingOperations.delete(reject))
      })
    },

    async cancel(): Promise<void> {
      await send({ type: 'cancel' })
    },
  }

  return {
    api,
    terminate(): void {
      referenceCount--

      // Only terminate when no more references
      if (referenceCount <= 0 && sharedWorker) {
        // Reject any pending operations before terminating
        const error = new Error('Worker terminated while operation in progress')
        for (const reject of pendingOperations) {
          reject(error)
        }
        pendingOperations.clear()

        sharedWorker.terminate()
        sharedWorker = null
        sharedChannel = null
        referenceCount = 0
      }
    },
  }
}

export { createHashcashWorkerChannel }
