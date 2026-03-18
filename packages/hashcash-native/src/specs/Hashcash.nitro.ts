import type { HybridObject } from 'react-native-nitro-modules'

/**
 * Challenge parameters for hashcash proof-of-work
 */
export interface HashcashChallenge {
  /** Number of zero bytes required at start of hash */
  difficulty: number
  /** Subject string (e.g., "Uniswap") */
  subject: string
  /** Base64-encoded nonce from backend */
  nonce: string
  /** Maximum counter value to try */
  maxProofLength: number
}

/**
 * Result of a successful proof-of-work computation
 */
export interface HashcashProofResult {
  /** The counter value that produced a valid hash */
  counter: string
  /** Base64-encoded SHA256 hash */
  hashBase64: string
  /** Number of hash attempts made */
  attempts: number
  /** Time taken in milliseconds */
  timeMs: number
}

/**
 * Parameters for findProof
 */
export interface FindProofParams {
  challenge: HashcashChallenge
  rangeStart?: number
  rangeSize?: number
}

/**
 * Native hashcash proof-of-work solver.
 *
 * Computes SHA256 hashes to find a counter value that produces
 * a hash with the required number of leading zero bytes.
 */
export interface Hashcash
  extends HybridObject<{
    ios: 'swift'
    android: 'kotlin'
  }> {
  /**
   * Find a proof-of-work solution for the given challenge.
   *
   * @param params - Challenge parameters and optional range limits
   * @returns ProofResult if found, undefined if cancelled or no solution in range
   */
  findProof(params: FindProofParams): Promise<HashcashProofResult | undefined>

  /**
   * Cancel any in-progress proof search.
   * The current findProof call will return undefined.
   */
  cancel(): void
}
