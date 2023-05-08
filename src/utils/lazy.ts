// Custom importWithRetry function with an exponential backoff strategy
export function importWithRetry(path: string, retries = 3, delay = 1000): Promise<any> {
  const fn = () => import(path)

  return new Promise((resolve, reject) => {
    const retry = async (attempts: number, currentDelay: number) => {
      try {
        const result = await fn()
        resolve(result)
      } catch (error) {
        if (attempts === retries) {
          reject(error)
        } else {
          setTimeout(() => retry(attempts + 1, currentDelay * 2), currentDelay)
        }
      }
    }

    retry(1, delay)
  })
}
