/**
 * Native Worker Channel Factory
 *
 * Creates a HashcashWorkerChannel using the native hashcash Nitro module.
 * The native implementation uses platform-specific optimizations:
 * - iOS: CommonCrypto for SHA256
 * - Android: java.security.MessageDigest
 *
 * Both run computations on background threads to avoid blocking the UI.
 */

import { base64 } from '@scure/base'
import { HashcashNative } from '@universe/hashcash-native'
import type { ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/core'
import type {
  FindProofParams,
  HashcashWorkerAPI,
  HashcashWorkerChannel,
} from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'

/**
 * Creates a channel to the native hashcash solver.
 *
 * Unlike web workers or worklets, the native module is a singleton
 * that persists throughout the app lifecycle. The terminate() method
 * is a no-op since we don't need to clean up the native module.
 */
function createHashcashWorkerChannel(): HashcashWorkerChannel {
  const api: HashcashWorkerAPI = {
    async findProof(params: FindProofParams): Promise<ProofResult | null> {
      const result = await HashcashNative.findProof({
        challenge: {
          difficulty: params.challenge.difficulty,
          subject: params.challenge.subject,
          nonce: params.challenge.nonce,
          maxProofLength: params.challenge.max_proof_length,
        },
        rangeStart: params.rangeStart,
        rangeSize: params.rangeSize,
      })

      if (!result) {
        return null
      }

      // Convert base64 hash back to Uint8Array for compatibility
      return {
        counter: result.counter,
        hash: base64.decode(result.hashBase64),
        attempts: result.attempts,
        timeMs: result.timeMs,
      }
    },

    async cancel(): Promise<void> {
      HashcashNative.cancel()
    },
  }

  return {
    api,
    terminate(): void {
      // No-op - native module persists throughout app lifecycle
    },
  }
}

export { createHashcashWorkerChannel }
