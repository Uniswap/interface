/**
 * Native stub for hashcash core functions.
 *
 * Mobile does not use this file - it uses native Nitro modules
 * (hashcash-native package) which bypass the JS hashcash implementation entirely.
 *
 * @see packages/hashcash-native for the native implementation
 */

import { NotImplementedError } from 'utilities/src/errors'

export type { HashcashChallenge, ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/shared'
// Re-export shared types and platform-agnostic functions
export { checkDifficulty, formatHashcashString } from '@universe/sessions/src/challenge-solvers/hashcash/shared'

import type { HashcashChallenge, ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/shared'

export async function computeHash(_params: { subject: string; nonce: string; counter: number }): Promise<Uint8Array> {
  throw new NotImplementedError('computeHash - mobile uses native Nitro modules')
}

export async function findProof(_params: {
  challenge: HashcashChallenge
  rangeStart?: number
  rangeSize?: number
  shouldStop?: () => boolean
  batchSize?: number
}): Promise<ProofResult | null> {
  throw new NotImplementedError('findProof - mobile uses native Nitro modules')
}

export async function verifyProof(_challenge: HashcashChallenge, _proofCounter: string): Promise<boolean> {
  throw new NotImplementedError('verifyProof - mobile uses native Nitro modules')
}
