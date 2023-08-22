function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitRandom(min: number, max: number): Promise<void> {
  return wait(min + Math.round(Math.random() * Math.max(0, max - min)))
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

export interface RetryOptions {
  n: number
  minWait: number
  maxWait: number
}

/**
 * Retries a function until its returned promise successfully resolves, up to n times.
 * @param fn function to retry
 * @param n how many times to retry
 * @param minWait min wait between retries in ms
 * @param maxWait max wait between retries in ms
 */
export function retry<T>(
  fn: () => Promise<T>,
  { n, minWait, maxWait }: RetryOptions
): { promise: Promise<T>; cancel: () => void } {
  let completed = false
  let rejectCancelled: (error: Error) => void
  // eslint-disable-next-line no-async-promise-executor
  const promise = new Promise<T>(async (resolve, reject) => {
    rejectCancelled = reject
    // eslint-disable-next-line no-constant-condition
    while (true) {
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
      await waitRandom(minWait, maxWait)
    }
  })
  return {
    promise,
    cancel: () => {
      if (completed) return
      completed = true
      rejectCancelled(new CanceledError())
    },
  }
}
