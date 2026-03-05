/**
 * Base stub for hashcash core functions.
 * Platform-specific implementations override this file.
 *
 * - Web: core.web.ts (Web Crypto + batching)
 * - Native: core.native.ts (mobile uses Nitro modules)
 *
 * Shared types and platform-agnostic functions live in shared.ts.
 */

import { PlatformSplitStubError } from 'utilities/src/errors'

export type { HashcashChallenge, ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/shared'
// Re-export everything from shared — types, checkDifficulty, formatHashcashString
export { checkDifficulty, formatHashcashString } from '@universe/sessions/src/challenge-solvers/hashcash/shared'

import type { HashcashChallenge, ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/shared'

export async function computeHash(_params: { subject: string; nonce: string; counter: number }): Promise<Uint8Array> {
  throw new PlatformSplitStubError('computeHash')
}

export async function findProof(_params: {
  challenge: HashcashChallenge
  rangeStart?: number
  rangeSize?: number
  shouldStop?: () => boolean
  batchSize?: number
}): Promise<ProofResult | null> {
  throw new PlatformSplitStubError('findProof')
}

export async function verifyProof(_challenge: HashcashChallenge, _proofCounter: string): Promise<boolean> {
  throw new PlatformSplitStubError('verifyProof')
}
