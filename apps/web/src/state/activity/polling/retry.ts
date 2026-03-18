import { RetryOptions } from 'uniswap/src/features/chains/types'

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Thrown if the function is canceled before resolving. */
export class CanceledError extends Error {
  name = 'CanceledError'
  message = 'Retryable was canceled'
}

/** May be thrown to force a retry. */
export class RetryableError extends Error {
  name = 'RetryableError'
}

/**
 * Retries a function until its returned promise successfully resolves, up to n times.
 * Uses three-tier exponential backoff
 * @param fn function to retry
 * @param n how many times to retry
 * @param minWait min wait between retries in ms (base delay)
 * @param medWait medium wait between retries in ms (intermediate delay)
 * @param maxWait max wait between retries in ms (caps the exponential backoff)
 */
export function retry<T>(
  fn: () => Promise<T>,
  { n, minWait, medWait, maxWait }: RetryOptions,
): { promise: Promise<T>; cancel: () => void } {
  const totalAttempts = n
  let completed = false
  let rejectCancelled: (error: Error) => void
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: We need to use async/await in the executor
  const promise = new Promise<T>(async (resolve, reject) => {
    let currentAttempt = 0
    rejectCancelled = reject
    // eslint-disable-next-line no-constant-condition
    while (true) {
      currentAttempt++
      let result: T
      try {
        result = await fn()
        if (!completed) {
          resolve(result)
          completed = true
        }
        break
      } catch (error) {
        if (completed) {
          break
        }
        if (n <= 0 || !(error instanceof RetryableError)) {
          reject(error)
          completed = true
          break
        }
        n--
      }

      let baseDelay: number

      // polls initial 1/3 of the time with minWait, then 1/3 of the time with medWait, then the rest with exponential backoff from medWait, capped at maxWait
      if (totalAttempts < 3 || currentAttempt <= Math.ceil(totalAttempts / 3)) {
        baseDelay = minWait
      } else if (currentAttempt <= Math.ceil((totalAttempts / 3) * 2)) {
        baseDelay = medWait
      } else {
        const backoffStartAttempt = Math.ceil((totalAttempts / 3) * 2)
        const exponentialDelay = medWait * Math.pow(2, currentAttempt - backoffStartAttempt)
        baseDelay = Math.min(exponentialDelay, maxWait)
      }

      // Adds jitter to prevent thundering herd
      const jitter = baseDelay * 0.25 * (Math.random() - 0.5)
      const finalDelay = Math.max(0, baseDelay + jitter)

      await wait(finalDelay)
    }
  })
  return {
    promise,
    cancel: () => {
      if (completed) {
        return
      }
      completed = true
      rejectCancelled(new CanceledError())
    },
  }
}
