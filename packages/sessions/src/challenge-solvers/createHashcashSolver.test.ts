import { ChallengeType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createHashcashSolver } from '@universe/sessions/src/challenge-solvers/createHashcashSolver'
import type { HashcashWorkerChannel } from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'
import type { ChallengeData } from '@universe/sessions/src/challenge-solvers/types'
import type { PerformanceTracker } from '@universe/sessions/src/performance/types'
import { describe, expect, it, vi } from 'vitest'

// Mock performance tracker for testing
function createMockPerformanceTracker(): PerformanceTracker {
  let time = 0
  return {
    now: (): number => {
      time += 100
      return time
    },
  }
}

describe('createHashcashSolver', () => {
  const mockPerformanceTracker = createMockPerformanceTracker()
  const solver = createHashcashSolver({ performanceTracker: mockPerformanceTracker })

  // Real backend example data
  const backendExample = {
    difficulty: 1,
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
      // Missing: nonce, subject, algorithm
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

  describe('analytics callback', () => {
    it('reports success with difficulty and iteration count', async () => {
      const onSolveCompleted = vi.fn()
      const solverWithAnalytics = createHashcashSolver({
        performanceTracker: createMockPerformanceTracker(),
        onSolveCompleted,
      })

      const challengeData: ChallengeData = {
        challengeId: 'test-challenge-123',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: JSON.stringify(backendExample),
        },
      }

      await solverWithAnalytics.solve(challengeData)

      expect(onSolveCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          difficulty: 1,
          usedWorker: false,
        }),
      )
      expect(onSolveCompleted.mock.calls[0][0].iterationCount).toBeGreaterThan(0)
      expect(onSolveCompleted.mock.calls[0][0].durationMs).toBeGreaterThanOrEqual(0)
    })

    it('reports failure with validation error type', async () => {
      const onSolveCompleted = vi.fn()
      const solverWithAnalytics = createHashcashSolver({
        performanceTracker: createMockPerformanceTracker(),
        onSolveCompleted,
      })

      const challengeData: ChallengeData = {
        challengeId: 'test-challenge-123',
        challengeType: ChallengeType.HASHCASH,
        extra: {}, // Missing challengeData
      }

      await expect(solverWithAnalytics.solve(challengeData)).rejects.toThrow()

      expect(onSolveCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorType: 'validation',
          usedWorker: false,
        }),
      )
    })

    it('reports failure when proof cannot be found', async () => {
      const onSolveCompleted = vi.fn()
      const solverWithAnalytics = createHashcashSolver({
        performanceTracker: createMockPerformanceTracker(),
        onSolveCompleted,
      })

      const impossibleChallenge = {
        ...backendExample,
        difficulty: 30,
        max_proof_length: 10,
      }

      const challengeData: ChallengeData = {
        challengeId: 'test-challenge-123',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: JSON.stringify(impossibleChallenge),
        },
      }

      await expect(solverWithAnalytics.solve(challengeData)).rejects.toThrow()

      expect(onSolveCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorType: 'no_proof',
          difficulty: 30,
        }),
      )
    })

    it('reports usedWorker: true when worker is provided', async () => {
      const onSolveCompleted = vi.fn()
      const mockWorkerChannel: HashcashWorkerChannel = {
        api: {
          findProof: vi.fn().mockResolvedValue({ counter: 42, hash: new Uint8Array([0]), attempts: 100 }),
          cancel: vi.fn(),
        },
        terminate: vi.fn(),
      }

      const solverWithWorker = createHashcashSolver({
        performanceTracker: createMockPerformanceTracker(),
        getWorkerChannel: () => mockWorkerChannel,
        onSolveCompleted,
      })

      const challengeData: ChallengeData = {
        challengeId: 'test-challenge-123',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: JSON.stringify(backendExample),
        },
      }

      await solverWithWorker.solve(challengeData)

      expect(onSolveCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          usedWorker: true,
        }),
      )
    })
  })

  describe('with worker channel', () => {
    it('uses worker channel when provided', async () => {
      const mockFindProof = vi.fn().mockResolvedValue({ counter: 42, hash: new Uint8Array([0]) })
      const mockTerminate = vi.fn()

      const mockWorkerChannel: HashcashWorkerChannel = {
        api: {
          findProof: mockFindProof,
          cancel: vi.fn(),
        },
        terminate: mockTerminate,
      }

      const solverWithWorker = createHashcashSolver({
        performanceTracker: createMockPerformanceTracker(),
        getWorkerChannel: () => mockWorkerChannel,
      })

      const challengeData: ChallengeData = {
        challengeId: 'test-challenge-123',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: JSON.stringify(backendExample),
        },
      }

      const solution = await solverWithWorker.solve(challengeData)

      expect(mockFindProof).toHaveBeenCalledWith({
        challenge: backendExample,
        rangeStart: 0,
        rangeSize: backendExample.max_proof_length,
      })
      expect(mockTerminate).toHaveBeenCalled()
      expect(solution).toBe(`Uniswap:${backendExample.nonce}:42`)
    })

    it('terminates worker channel even on error', async () => {
      const mockTerminate = vi.fn()

      const mockWorkerChannel: HashcashWorkerChannel = {
        api: {
          findProof: vi.fn().mockRejectedValue(new Error('Worker error')),
          cancel: vi.fn(),
        },
        terminate: mockTerminate,
      }

      const solverWithWorker = createHashcashSolver({
        performanceTracker: createMockPerformanceTracker(),
        getWorkerChannel: () => mockWorkerChannel,
      })

      const challengeData: ChallengeData = {
        challengeId: 'test-challenge-123',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: JSON.stringify(backendExample),
        },
      }

      await expect(solverWithWorker.solve(challengeData)).rejects.toThrow('Worker error')
      expect(mockTerminate).toHaveBeenCalled()
    })

    it('throws error when worker returns null', async () => {
      const mockTerminate = vi.fn()

      const mockWorkerChannel: HashcashWorkerChannel = {
        api: {
          findProof: vi.fn().mockResolvedValue(null),
          cancel: vi.fn(),
        },
        terminate: mockTerminate,
      }

      const solverWithWorker = createHashcashSolver({
        performanceTracker: createMockPerformanceTracker(),
        getWorkerChannel: () => mockWorkerChannel,
      })

      const challengeData: ChallengeData = {
        challengeId: 'test-challenge-123',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: JSON.stringify(backendExample),
        },
      }

      await expect(solverWithWorker.solve(challengeData)).rejects.toThrow('Failed to find valid proof')
      expect(mockTerminate).toHaveBeenCalled()
    })

    it('throws error when worker is busy with another operation', async () => {
      const mockTerminate = vi.fn()

      const mockWorkerChannel: HashcashWorkerChannel = {
        api: {
          findProof: vi
            .fn()
            .mockRejectedValue(new Error('Worker is busy - another findProof operation is in progress')),
          cancel: vi.fn(),
        },
        terminate: mockTerminate,
      }

      const solverWithWorker = createHashcashSolver({
        performanceTracker: createMockPerformanceTracker(),
        getWorkerChannel: () => mockWorkerChannel,
      })

      const challengeData: ChallengeData = {
        challengeId: 'test-challenge-123',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: JSON.stringify(backendExample),
        },
      }

      await expect(solverWithWorker.solve(challengeData)).rejects.toThrow('Worker is busy')
      expect(mockTerminate).toHaveBeenCalled()
    })
  })
})
