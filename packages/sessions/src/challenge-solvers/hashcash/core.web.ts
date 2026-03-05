/**
 * Web-optimized hashcash core implementation.
 *
 * Uses Web Crypto API via @noble/hashes/webcrypto.js for hardware-accelerated
 * SHA-256 hashing. Includes batching to amortize async overhead.
 *
 * This is the web platform implementation - mobile uses native Nitro modules.
 */
import { sha256 } from '@noble/hashes/webcrypto.js'

export type { HashcashChallenge, ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/shared'
// Re-export shared types and platform-agnostic functions
export { checkDifficulty, formatHashcashString } from '@universe/sessions/src/challenge-solvers/hashcash/shared'

import type { HashcashChallenge, ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/shared'
import { checkDifficulty } from '@universe/sessions/src/challenge-solvers/hashcash/shared'

// Pre-allocated TextEncoder for memory efficiency (avoids creating new instance per hash)
const encoder = new TextEncoder()

// Default batch size for async hashing
// Tuned to balance async overhead vs responsiveness to cancellation
const DEFAULT_BATCH_SIZE = 256

/**
 * Compute SHA-256 hash using Web Crypto API.
 * Async for hardware acceleration.
 */
export async function computeHash(params: { subject: string; nonce: string; counter: number }): Promise<Uint8Array> {
  const { subject, nonce, counter } = params

  // Backend expects: "${subject}:${nonce}:${counter}"
  const solutionString = `${subject}:${nonce}:${counter}`

  // Hash using Web Crypto (hardware-accelerated)
  const inputBytes = encoder.encode(solutionString)
  return sha256(inputBytes)
}

/**
 * Find a proof-of-work solution using batched Web Crypto hashing.
 *
 * Processes hashes in batches to amortize async overhead while remaining
 * responsive to cancellation requests.
 */
export async function findProof(params: {
  challenge: HashcashChallenge
  rangeStart?: number
  rangeSize?: number
  shouldStop?: () => boolean
  batchSize?: number
}): Promise<ProofResult | null> {
  const {
    challenge,
    rangeStart = 0,
    rangeSize = challenge.max_proof_length || 1_000_000,
    shouldStop,
    batchSize = DEFAULT_BATCH_SIZE,
  } = params

  const startTime = Date.now()
  const rangeEnd = rangeStart + rangeSize
  const { subject, nonce, difficulty } = challenge

  for (let batchStart = rangeStart; batchStart < rangeEnd; batchStart += batchSize) {
    // Check for cancellation at batch boundaries
    if (shouldStop?.()) {
      return null
    }

    // Determine actual batch end (don't exceed range)
    const batchEnd = Math.min(batchStart + batchSize, rangeEnd)
    const currentBatchSize = batchEnd - batchStart

    // Generate counter values for this batch
    const counters: number[] = new Array(currentBatchSize)
    for (let i = 0; i < currentBatchSize; i++) {
      counters[i] = batchStart + i
    }

    // Hash all counters in this batch in parallel
    const hashes = await Promise.all(counters.map((counter) => computeHash({ subject, nonce, counter })))

    // Check each hash for valid proof
    for (let i = 0; i < hashes.length; i++) {
      const hash = hashes[i]
      const counter = counters[i]
      // Safety check (shouldn't happen since arrays are same size)
      if (!hash || counter === undefined) {
        continue
      }
      if (checkDifficulty(hash, difficulty)) {
        return {
          counter: counter.toString(),
          hash,
          attempts: counter - rangeStart + 1,
          timeMs: Date.now() - startTime,
        }
      }
    }
  }

  return null
}

/**
 * Verify a proof solution.
 * Async because it uses Web Crypto.
 */
export async function verifyProof(challenge: HashcashChallenge, proofCounter: string): Promise<boolean> {
  const counter = parseInt(proofCounter)

  if (isNaN(counter)) {
    return false
  }

  const hash = await computeHash({
    subject: challenge.subject,
    nonce: challenge.nonce,
    counter,
  })
  return checkDifficulty(hash, challenge.difficulty)
}
