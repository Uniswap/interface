/**
 * Web Worker channel factory for hashcash proof-of-work.
 *
 * Creates a Web Worker and establishes a BIDC channel for
 * bidirectional async communication.
 *
 * This is the web platform implementation used by both web app and extension.
 */

import type { ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import { HashcashWorkerBootError } from '@universe/sessions/src/challenge-solvers/hashcash/worker/hashcashWorkerErrors'
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
// Track pending operations to reject on terminate or worker error
const pendingOperations = new Set<(err: Error) => void>()

function resetSharedWorker(): void {
  if (sharedWorker) {
    try {
      sharedWorker.terminate()
    } catch {
      // Worker may already be dead; ignore.
    }
  }
  sharedWorker = null
  sharedChannel = null
  referenceCount = 0
}

function rejectAllPending(error: Error): void {
  for (const reject of pendingOperations) {
    reject(error)
  }
  pendingOperations.clear()
}

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

    // Surface worker failures (e.g. `importScripts` NetworkError on boot) as
    // rejections of every pending operation. Without this hook, `send()`
    // would sit waiting for a response that never arrives. Also poison the
    // shared-worker cache so the next caller gets a fresh worker instead of
    // reusing the dead one.
    const handleWorkerError = (event: Event): void => {
      const message = typeof (event as ErrorEvent).message === 'string' ? (event as ErrorEvent).message : ''
      const error = new HashcashWorkerBootError(message || 'Hashcash worker failed', event)
      ctx.onWorkerError?.(error)
      rejectAllPending(error)
      resetSharedWorker()
    }

    sharedWorker.addEventListener('error', handleWorkerError)
    sharedWorker.addEventListener('messageerror', handleWorkerError)
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
        rejectAllPending(new Error('Worker terminated while operation in progress'))
        resetSharedWorker()
      }
    },
  }
}

export { createHashcashWorkerChannel, HashcashWorkerBootError }
