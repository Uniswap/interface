function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function waitRandom(min: number, max: number): Promise<void> {
  return wait(min + Math.round(Math.random() * (max - min)))
}

/**
 * Retries the function that returns the promise until the promise successfully resolves up to n retries
 * @param fn function to retry
 * @param n how many times to retry
 * @param minWait min wait between retries in ms
 * @param maxWait max wait between retries in ms
 */
export function retry<T>(
  fn: () => Promise<T>,
  { n = 3, minWait = 500, maxWait = 1000 }: { n?: number; minWait?: number; maxWait?: number } = {}
): Promise<T> {
  return fn().catch(error => {
    if (n === 0) throw error
    return waitRandom(minWait, maxWait).then(() => retry(fn, { n: n - 1, minWait, maxWait }))
  })
}
