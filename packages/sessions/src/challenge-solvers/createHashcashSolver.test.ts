import { ChallengeType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createHashcashSolver } from '@universe/sessions/src/challenge-solvers/createHashcashSolver'
import type { ChallengeData } from '@universe/sessions/src/challenge-solvers/types'
import { describe, expect, it } from 'vitest'

describe('createHashcashSolver', () => {
  const solver = createHashcashSolver()

  // Real backend example data
  const backendExample = {
    difficulty: 1,
    expires_at: Date.now() + 60000, // 60 seconds from now
    subject: 'Uniswap',
    algorithm: 'sha256' as const,
    nonce: 'Qlquffem7d8RrL6fmveE68XK0KxcoczdiVpFrV1qeUk=',
    max_proof_length: 10000,
  }

  it('successfully solves a valid challenge', async () => {
    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {
        challengeData: JSON.stringify(backendExample),
      },
    }

    const solution = await solver.solve(challengeData)

    // Check format: "${subject}:${nonce}:${counter}"
    expect(solution).toMatch(/^Uniswap:[A-Za-z0-9+/=]+:\d+$/)
    expect(solution.startsWith('Uniswap:')).toBe(true)
    expect(solution).toContain(backendExample.nonce) // Should contain the base64 nonce

    // Verify the solution has all three parts
    const parts = solution.split(':')
    expect(parts.length).toBe(3)
    expect(parts[0]).toBe('Uniswap')
    expect(parts[1]).toBe(backendExample.nonce)
    expect(Number.parseInt(parts[2], 10)).toBeGreaterThanOrEqual(0)
  })

  it('throws error when challengeData is missing', async () => {
    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {}, // Missing challengeData
    }

    await expect(solver.solve(challengeData)).rejects.toThrow('Missing challengeData in challenge extra field')
  })

  it('throws error when challengeData is not valid JSON', async () => {
    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {
        challengeData: 'not-valid-json{',
      },
    }

    await expect(solver.solve(challengeData)).rejects.toThrow('Failed to parse challenge JSON')
  })

  it('throws error when required fields are missing', async () => {
    const invalidChallenge = {
      difficulty: 1,
      // Missing: nonce, subject, expires_at, algorithm
    }

    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {
        challengeData: JSON.stringify(invalidChallenge),
      },
    }

    // Zod will report all missing fields at once
    await expect(solver.solve(challengeData)).rejects.toThrow('Invalid challenge data')
  })

  it('throws error when algorithm is not sha256', async () => {
    const invalidChallenge = {
      ...backendExample,
      algorithm: 'sha512' as any, // Wrong algorithm
    }

    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {
        challengeData: JSON.stringify(invalidChallenge),
      },
    }

    // Zod will report the literal mismatch
    await expect(solver.solve(challengeData)).rejects.toThrow('Invalid challenge data: algorithm')
  })

  it('throws error when challenge has expired', async () => {
    const expiredChallenge = {
      ...backendExample,
      expires_at: Date.now() - 1000, // Already expired
    }

    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {
        challengeData: JSON.stringify(expiredChallenge),
      },
    }

    await expect(solver.solve(challengeData)).rejects.toThrow('Challenge has already expired')
  })

  it('handles high difficulty that cannot be solved', async () => {
    const impossibleChallenge = {
      ...backendExample,
      difficulty: 30, // Very high difficulty
      max_proof_length: 10, // Very small search space
    }

    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {
        challengeData: JSON.stringify(impossibleChallenge),
      },
    }

    await expect(solver.solve(challengeData)).rejects.toThrow('Failed to find valid proof within allowed range')
  })

  it('handles missing extra field gracefully', async () => {
    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      // No extra field at all
    }

    await expect(solver.solve(challengeData)).rejects.toThrow('Missing challengeData in challenge extra field')
  })
})
