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
