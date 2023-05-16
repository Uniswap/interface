/**
 * Executes a Promise-based function multiple times with exponential backoff (doubling).
 * @returns the result of the original function's final attempt.
 *
 * @example
 * ```ts
 * const fetchWithRetry = retry(fetchData, 5, 2000);
 * fetchWithRetry.then(data => console.log(data)).catch(error => console.error(error));
 * ```
 */
export function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = async (attempts: number, currentDelay: number) => {
      try {
        const result = await fn()
        resolve(result)
      } catch (error) {
        if (attempts === retries) {
          reject(error)
        } else {
          const exponentialBackoffDelay = currentDelay * 2
          setTimeout(() => attempt(attempts + 1, exponentialBackoffDelay), currentDelay)
        }
      }
    }

    attempt(1, delay)
  })
}
