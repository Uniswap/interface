/**
 * Creates a retryable function that attempts to execute a Promise-based function multiple times.
 * If the function fails, it will retry a specified number of times, with an increasing delay between each attempt.
 *
 * @typeParam T - The type of the Promise's resolved value.
 * @param fn - The Promise-based function that should be retried upon failure.
 * @param retries - The maximum number of retry attempts. Defaults to 3 if not specified.
 * @param delay - The initial delay between retry attempts in milliseconds. This delay doubles after each failed attempt. Defaults to 1000 if not specified.
 *
 * @returns A new function that returns a Promise, which resolves with the result of the original function if it succeeds within the specified number of retries, and rejects with the error from the last attempt otherwise.
 *
 * @example
 * ```ts
 * const fetchWithRetry = retry(fetchData, 5, 2000);
 * fetchWithRetry().then(data => console.log(data)).catch(error => console.error(error));
 * ```
 */
export function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): () => Promise<T> {
  return (): Promise<T> =>
    new Promise((resolve, reject) => {
      const attempt = async (attempts: number, currentDelay: number) => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          if (attempts === retries) {
            reject(error)
          } else {
            const exponentialBackoff = currentDelay * 2
            setTimeout(() => attempt(attempts + 1, exponentialBackoff), currentDelay)
          }
        }
      }

      attempt(1, delay)
    })
}
