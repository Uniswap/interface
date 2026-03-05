/**
 * Hashcash Web Worker
 *
 * Runs proof-of-work computation off the main thread using Web Crypto.
 * Uses BIDC for bidirectional async communication.
 */

import type { ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import { findProof } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import type { FindProofParams } from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'
import type { SerializableValue } from 'bidc'
import { createChannel } from 'bidc'

/**
 * Message types sent from main thread to worker
 * These are plain objects at runtime, compatible with SerializableValue
 */
type WorkerMessage = { type: 'findProof'; params: FindProofParams } | { type: 'cancel' }

/**
 * Response type returned from worker to main thread.
 * Matches ProofResult structure but explicitly typed for serialization.
 */
type WorkerResponse = ProofResult | null

/**
 * Operation state for single-operation-at-a-time enforcement.
 *
 * This worker is designed for single-operation-at-a-time usage. Concurrent findProof
 * calls will be rejected with an error. This ensures clean cancellation semantics
 * where cancel() only affects the one in-progress operation.
 */
let operationInProgress = false
let cancelled = false

// Create BIDC channel - in worker context, connects to parent
const { receive } = createChannel()

/**
 * Response type for busy state - signals to caller that worker is occupied.
 * The channel layer converts this to an appropriate error.
 */
type WorkerBusyResponse = { busy: true }

/**
 * Async message handler for incoming requests from main thread.
 * BIDC supports async handlers - it awaits the Promise before sending response.
 */
const messageHandler = async (data: WorkerMessage): Promise<WorkerResponse | WorkerBusyResponse> => {
  switch (data.type) {
    case 'findProof': {
      // Enforce single-operation-at-a-time
      if (operationInProgress) {
        return { busy: true }
      }

      operationInProgress = true
      // Reset cancellation flag for new search
      cancelled = false

      try {
        // findProof is now async (uses Web Crypto)
        const result = await findProof({
          challenge: data.params.challenge,
          rangeStart: data.params.rangeStart,
          rangeSize: data.params.rangeSize,
          // Check cancellation flag during iteration
          shouldStop: () => cancelled,
        })

        // Return ProofResult directly - BIDC handles serialization of Uint8Array
        return result
      } finally {
        operationInProgress = false
      }
    }

    case 'cancel': {
      cancelled = true
      return null
    }

    default:
      return null
  }
}

// Register async message handler with BIDC
// BIDC supports async handlers - the response Promise is awaited before sending
// eslint-disable-next-line @typescript-eslint/no-floating-promises
receive(messageHandler as (data: SerializableValue) => Promise<SerializableValue>)
