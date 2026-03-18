import { logger } from 'utilities/src/logger/logger'
import { sleep } from 'utilities/src/time/timing'

/** Backoff strategy for retries. */
export enum BackoffStrategy {
  /** No backoff: always use the base delay. */
  None = 'none',
  /** Linear backoff: use the base delay multiplied by the attempt. */
  Linear = 'linear',
  /** Exponential backoff: use the base delay multiplied by 2^(attempt-1). */
  Exponential = 'exponential',
}

export type RetryConfig = {
  /** Max number of attempts INCLUDING the first one. Defaults to 3. */
  maxAttempts: number
  /** Base delay between attempts in ms (default: 1s). */
  baseDelayMs?: number
  backoffStrategy?: BackoffStrategy
  /** Optional max cap for delay. */
  maxDelayMs?: number
  /**
   * Predicate to decide if an error is retryable.
   * Return false to bail out immediately.
   */
  shouldRetry?: (error: unknown) => boolean
  /**
   * Called on every retry attempt (after a failure, before the sleep).
   */
  onRetry?: (params: { error: unknown; attempt: number; nextDelayMs: number }) => void
}

function computeDelay(
  attempt: number,
  {
    baseDelayMs = 1000,
    backoffStrategy = BackoffStrategy.Linear,
    maxDelayMs,
  }: Pick<RetryConfig, 'baseDelayMs' | 'backoffStrategy' | 'maxDelayMs'>,
): number {
  let delay = baseDelayMs

  if (backoffStrategy === BackoffStrategy.Linear) {
    delay = baseDelayMs * attempt
  } else if (backoffStrategy === BackoffStrategy.Exponential) {
    delay = baseDelayMs * Math.pow(2, attempt - 1)
  }

  if (maxDelayMs !== undefined) {
    delay = Math.min(delay, maxDelayMs)
  }

  return delay
}

/**
 * Retries a function until it succeeds or the maximum number of attempts is reached.
 *
 * @param fn - The function to retry.
 * @param config - The retry configuration.
 * @returns The result of the function.
 */
export async function retryWithBackoff<T>(params: { fn: () => Promise<T>; config: RetryConfig }): Promise<T> {
  const { fn, config } = params
  const { maxAttempts = 3, baseDelayMs, backoffStrategy, maxDelayMs, shouldRetry, onRetry } = config

  if (maxAttempts <= 0) {
    throw new Error('retryWithBackoff: maxAttempts must be >= 1')
  }

  let attempt = 0
  while (attempt < maxAttempts) {
    attempt += 1
    try {
      return await fn()
    } catch (error) {
      const retryable = shouldRetry ? shouldRetry(error) : true

      if (!retryable) {
        const e = new Error('Conditions not met to retry', { cause: error })
        logger.error(e, {
          tags: {
            file: 'retryWithBackoff',
            function: 'retryWithBackoff',
          },
        })
        throw e
      }

      if (attempt >= maxAttempts) {
        const e = new Error('Exhausted all attempts', { cause: error })
        logger.error(e, {
          tags: {
            file: 'retryWithBackoff',
            function: 'retryWithBackoff',
          },
        })
        throw e
      }

      const nextDelayMs = computeDelay(attempt, {
        baseDelayMs,
        backoffStrategy,
        maxDelayMs,
      })

      onRetry?.({ error, attempt, nextDelayMs })

      await sleep(nextDelayMs)
    }
  }
  // Type-satisfier.
  throw new Error('retryWithBackoff: exhausted attempts without returning or throwing')
}
