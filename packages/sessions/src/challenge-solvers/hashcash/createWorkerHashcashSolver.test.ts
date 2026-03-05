import { ChallengeType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { createWorkerHashcashSolver } from '@universe/sessions/src/challenge-solvers/hashcash/createWorkerHashcashSolver'
import type { HashcashWorkerChannelFactory } from '@universe/sessions/src/challenge-solvers/hashcash/worker/types'
import type { ChallengeData } from '@universe/sessions/src/challenge-solvers/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('createWorkerHashcashSolver', () => {
  // Real backend example data
  const backendExample = {
    difficulty: 1,
    subject: 'Uniswap',
    algorithm: 'sha256' as const,
    nonce: 'Qlquffem7d8RrL6fmveE68XK0KxcoczdiVpFrV1qeUk=',
    max_proof_length: 10000,
  }

  // Mock channel factory for testing
  function createMockChannelFactory(
    findProofResult: { counter: string; hash: Uint8Array; attempts: number; timeMs: number } | null = {
      counter: '123',
      hash: new Uint8Array([0, 0, 1, 2, 3]),
      attempts: 124,
      timeMs: 50,
    },
  ): {
    factory: HashcashWorkerChannelFactory
    mocks: {
      findProof: ReturnType<typeof vi.fn>
      cancel: ReturnType<typeof vi.fn>
      terminate: ReturnType<typeof vi.fn>
    }
  } {
    const findProof = vi.fn().mockResolvedValue(findProofResult)
    const cancel = vi.fn().mockResolvedValue(undefined)
    const terminate = vi.fn()

    const factory: HashcashWorkerChannelFactory = () => ({
      api: { findProof, cancel },
      terminate,
    })

    return { factory, mocks: { findProof, cancel, terminate } }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully solves a valid challenge using worker', async () => {
    const { factory, mocks } = createMockChannelFactory()
    const solver = createWorkerHashcashSolver({ createChannel: factory })

    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {
        challengeData: JSON.stringify(backendExample),
      },
    }

    const solution = await solver.solve(challengeData)

    // Check format: "${subject}:${nonce}:${counter}"
    expect(solution).toBe(`Uniswap:${backendExample.nonce}:123`)

    // Verify worker was called correctly
    expect(mocks.findProof).toHaveBeenCalledOnce()
    expect(mocks.findProof).toHaveBeenCalledWith({
      challenge: expect.objectContaining({
        subject: 'Uniswap',
        difficulty: 1,
        nonce: backendExample.nonce,
      }),
      rangeStart: 0,
      rangeSize: 10000,
    })

    // Verify channel was terminated
    expect(mocks.terminate).toHaveBeenCalledOnce()
  })

  it('throws error when challengeData is missing', async () => {
    const { factory } = createMockChannelFactory()
    const solver = createWorkerHashcashSolver({ createChannel: factory })

    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {}, // Missing challengeData
    }

    await expect(solver.solve(challengeData)).rejects.toThrow('Missing challengeData in challenge extra field')
  })

  it('throws error when no proof is found', async () => {
    const { factory } = createMockChannelFactory(null)
    const solver = createWorkerHashcashSolver({ createChannel: factory })

    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {
        challengeData: JSON.stringify(backendExample),
      },
    }

    await expect(solver.solve(challengeData)).rejects.toThrow('Failed to find valid proof within allowed range')
  })

  it('terminates channel even when error occurs', async () => {
    const findProof = vi.fn().mockRejectedValue(new Error('Worker error'))
    const terminate = vi.fn()

    const factory: HashcashWorkerChannelFactory = () => ({
      api: { findProof, cancel: vi.fn() },
      terminate,
    })

    const solver = createWorkerHashcashSolver({ createChannel: factory })

    const challengeData: ChallengeData = {
      challengeId: 'test-challenge-123',
      challengeType: ChallengeType.HASHCASH,
      extra: {
        challengeData: JSON.stringify(backendExample),
      },
    }

    await expect(solver.solve(challengeData)).rejects.toThrow('Worker error')

    // Channel should still be terminated
    expect(terminate).toHaveBeenCalledOnce()
  })

  describe('cancellation', () => {
    it('cancels solving when AbortSignal is triggered', async () => {
      const controller = new AbortController()
      const { factory, mocks } = createMockChannelFactory()

      // Make findProof take a while and check abort during it
      mocks.findProof.mockImplementation(async () => {
        // Simulate work, then check if cancelled
        await new Promise((resolve) => setTimeout(resolve, 50))
        return null // Simulates cancelled result
      })

      const solver = createWorkerHashcashSolver({
        createChannel: factory,
        signal: controller.signal,
      })

      const challengeData: ChallengeData = {
        challengeId: 'test-challenge-123',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: JSON.stringify(backendExample),
        },
      }

      // Start solving and cancel after a short delay
      const solvePromise = solver.solve(challengeData)
      controller.abort()

      await expect(solvePromise).rejects.toThrow('Challenge solving was cancelled')

      // Verify cancel was called on the worker
      expect(mocks.cancel).toHaveBeenCalled()
    })

    it('throws immediately if already aborted', async () => {
      const controller = new AbortController()
      controller.abort() // Abort before starting

      const { factory, mocks } = createMockChannelFactory()

      const solver = createWorkerHashcashSolver({
        createChannel: factory,
        signal: controller.signal,
      })

      const challengeData: ChallengeData = {
        challengeId: 'test-challenge-123',
        challengeType: ChallengeType.HASHCASH,
        extra: {
          challengeData: JSON.stringify(backendExample),
        },
      }

      await expect(solver.solve(challengeData)).rejects.toThrow('Challenge solving was cancelled')

      // Worker should not be called if already aborted
      expect(mocks.findProof).not.toHaveBeenCalled()
    })
  })
})
