/**
 * Shared types and platform-agnostic utilities for hashcash.
 *
 * This file contains code that has zero platform dependencies and is
 * imported by all platform variants (core.ts, core.web.ts, core.native.ts).
 *
 * NOTE: This file intentionally does NOT follow the platform-split naming
 * convention (no .web.ts/.native.ts variants) so it can be safely imported
 * from platform-specific files without circular resolution.
 */

import { base64 } from '@scure/base'

export interface HashcashChallenge {
  difficulty: number
  subject: string
  algorithm: 'sha256'
  nonce: string
  max_proof_length: number
  verifier?: string
}

export interface ProofResult {
  counter: string
  hash: Uint8Array
  attempts: number
  timeMs: number
}

/**
 * Check if a hash meets the required difficulty.
 * Difficulty is the number of leading zero bytes required.
 */
export function checkDifficulty(hash: Uint8Array, difficulty: number): boolean {
  // Backend uses difficulty as number of zero BYTES, not bits
  // difficulty=1 means first byte must be 0
  // difficulty=2 means first two bytes must be 0, etc.

  // Check if hash has enough bytes
  if (hash.length < difficulty) {
    return false
  }

  // Check that the first 'difficulty' bytes are all zero
  for (let i = 0; i < difficulty; i++) {
    if (hash[i] !== 0) {
      return false
    }
  }

  return true
}

/**
 * Format a proof into hashcash string format for submission.
 * Format: version:bits:date:resource:extension:counter:hash
 */
export function formatHashcashString(challenge: HashcashChallenge, proof: ProofResult): string {
  const version = '1'
  const bits = challenge.difficulty.toString()
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const resource = challenge.subject.slice(0, 16)
  const extension = ''
  const counter = proof.counter

  // Encode the proof hash as base64 (truncated)
  const hashB64 = base64.encode(proof.hash).slice(0, 27)

  return `${version}:${bits}:${date}:${resource}:${extension}:${counter}:${hashB64}`
}
