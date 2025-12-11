import { BackoffStrategy, retryWithBackoff } from 'utilities/src/async/retryWithBackoff'
import { sleep } from 'utilities/src/time/timing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('utilities/src/time/timing', () => ({
  sleep: vi.fn().mockResolvedValue(true),
}))

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should succeed on the first attempt without retrying', async () => {
    const mockFn = vi.fn().mockResolvedValue('success')
    const config = {
      maxAttempts: 3,
      baseDelayMs: 100,
    }
    const result = await retryWithBackoff({
      fn: mockFn,
      config,
    })

    expect(result).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('should fail on the first attempt without retrying', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('test'))
    const config = {
      maxAttempts: 1,
    }
    await expect(
      retryWithBackoff({
        fn: mockFn,
        config,
      }),
    ).rejects.toThrowError('Exhausted all attempts')
    expect(mockFn).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it.each([
    {
      maxAttempts: 4,
      baseDelayMs: 100,
      backoffStrategy: BackoffStrategy.None,
      expectedDelayMs: [100, 100, 100],
    },
    {
      maxAttempts: 4,
      baseDelayMs: 100,
      backoffStrategy: BackoffStrategy.Linear,
      expectedDelayMs: [100, 200, 300],
    },
    {
      maxAttempts: 4,
      baseDelayMs: 100,
      backoffStrategy: BackoffStrategy.Exponential,
      expectedDelayMs: [100, 200, 400],
    },
    {
      maxAttempts: 5,
      baseDelayMs: 50,
      backoffStrategy: BackoffStrategy.None,
      expectedDelayMs: [50, 50, 50, 50],
    },
    {
      maxAttempts: 5,
      baseDelayMs: 50,
      backoffStrategy: BackoffStrategy.Linear,
      expectedDelayMs: [50, 100, 150, 200],
    },
    {
      maxAttempts: 5,
      baseDelayMs: 50,
      backoffStrategy: BackoffStrategy.Exponential,
      expectedDelayMs: [50, 100, 200, 400],
    },
  ])(
    'should succeed on the $maxAttempts attempt with $backoffStrategy backoff strategy after $baseDelayMs base delay',
    async ({ backoffStrategy, expectedDelayMs, maxAttempts, baseDelayMs }) => {
      let attemptCount = 0
      const mockFn = vi.fn().mockImplementation(async () => {
        attemptCount++
        if (attemptCount < maxAttempts) {
          throw new Error(`Attempt ${attemptCount} failed`)
        }
        return 'success'
      })
      const config = {
        maxAttempts,
        baseDelayMs,
        backoffStrategy,
      }

      const result = await retryWithBackoff({
        fn: mockFn,
        config,
      })

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(maxAttempts)
      expect(sleep).toHaveBeenCalledTimes(maxAttempts - 1)

      expectedDelayMs.forEach((delayMs, index) => {
        expect(sleep).toHaveBeenNthCalledWith(index + 1, delayMs)
      })
    },
  )
})
