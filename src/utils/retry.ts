/**
 * Creates a retryable function that attempts to execute a Promise-based function multiple times.
 * If the function fails, it will retry a specified number of times, with an increasing delay between each attempt.
 *
 * @param {() => Promise<T>} fn - The Promise-based function that should be retried upon failure.
 * @param {number} [retries=3] - The maximum number of retry attempts. Defaults to 3 if not specified.
 * @param {number} [delay=1000] - The initial delay between retry attempts in milliseconds. This delay doubles after each failed attempt. Defaults to 1000 if not specified.
 *
 * @returns {() => Promise<T>} A new function that returns a Promise, which resolves with the result of the original function if it succeeds within the specified number of retries, and rejects with the error from the last attempt otherwise.
 *
 * @template T - The type of the Promise's resolved value.
 *
 * @example
 * const fetchWithRetry = retry(fetchData, 5, 2000)
 * fetchWithRetry().then(data => console.log(data)).catch(error => console.error(error))
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
            setTimeout(() => attempt(attempts + 1, currentDelay * 2), currentDelay)
          }
        }
      }

      attempt(1, delay)
    })
}
