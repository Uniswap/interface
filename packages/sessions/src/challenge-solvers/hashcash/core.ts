import { sha256 } from '@noble/hashes/sha2.js'
import { base64 } from '@scure/base'

export interface HashcashChallenge {
  difficulty: number
  expires_at: number
  subject: string
  algorithm: 'sha256'
  nonce: string // base64 from backend
  max_proof_length: number
  verifier?: string
}

export interface ProofResult {
  counter: string
  hash: Uint8Array
  attempts: number
  timeMs: number
}

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

export function computeHash(params: { subject: string; nonce: string; counter: number }): Uint8Array {
  const { subject, nonce, counter } = params

  // Backend expects: "${subject}:${nonce}:${counter}"
  // Use the nonce string directly as provided by the backend
  const solutionString = `${subject}:${nonce}:${counter}`

  // Hash the solution string
  const inputBytes = new TextEncoder().encode(solutionString)
  return sha256(inputBytes)
}

export function findProof(params: {
  challenge: HashcashChallenge
  rangeStart?: number
  rangeSize?: number
  shouldStop?: () => boolean
}): ProofResult | null {
  const { challenge, rangeStart = 0, rangeSize = challenge.max_proof_length || 1_000_000, shouldStop } = params
  const startTime = Date.now()
  const rangeEnd = rangeStart + rangeSize

  for (let counter = rangeStart; counter < rangeEnd; counter++) {
    // Allow external cancellation check
    if (counter % 1000 === 0) {
      if (shouldStop?.()) {
        return null
      }

      // Check expiration
      if (Date.now() >= challenge.expires_at) {
        return null
      }
    }

    // Compute hash for this counter
    const hash = computeHash({
      subject: challenge.subject,
      nonce: challenge.nonce, // Use nonce string directly
      counter,
    })

    // Check if it meets difficulty
    if (checkDifficulty(hash, challenge.difficulty)) {
      return {
        counter: counter.toString(),
        hash,
        attempts: counter - rangeStart + 1,
        timeMs: Date.now() - startTime,
      }
    }
  }

  return null
}

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

export function verifyProof(challenge: HashcashChallenge, proofCounter: string): boolean {
  const counter = parseInt(proofCounter)

  if (isNaN(counter)) {
    return false
  }

  const hash = computeHash({
    subject: challenge.subject,
    nonce: challenge.nonce, // Use nonce string directly
    counter,
  })
  return checkDifficulty(hash, challenge.difficulty)
}
