import {
  getHashcashSearchRangeSize,
  type HashcashChallenge,
} from '@universe/sessions/src/challenge-solvers/hashcash/shared'
import { describe, expect, it } from 'vitest'

describe('getHashcashSearchRangeSize', () => {
  const challenge: HashcashChallenge = {
    difficulty: 1,
    subject: 'Uniswap',
    algorithm: 'sha256',
    nonce: 'UAgVoVTmjO6Ye7NbwiqTUD3GscDQ0+es6Bnbat0MZ7Q=',
    max_proof_length: 1000,
  }

  it('searches past max_proof_length counters when the backend limit is a string length', () => {
    expect(getHashcashSearchRangeSize(challenge)).toBe(8192)
  })

  it('scales the budget with difficulty', () => {
    expect(getHashcashSearchRangeSize({ ...challenge, difficulty: 2 })).toBe(2_097_152)
  })

  it('stops at counters whose solution would exceed max_proof_length', () => {
    expect(getHashcashSearchRangeSize({ ...challenge, max_proof_length: 55 })).toBe(100)
  })

  it('returns 0 when even the prefix exceeds max_proof_length', () => {
    expect(getHashcashSearchRangeSize({ ...challenge, max_proof_length: 53 })).toBe(0)
    expect(getHashcashSearchRangeSize({ ...challenge, max_proof_length: 10 })).toBe(0)
  })

  it('never exceeds the largest exactly-representable counter', () => {
    expect(getHashcashSearchRangeSize({ ...challenge, difficulty: 7 })).toBe(Number.MAX_SAFE_INTEGER)
  })
})
