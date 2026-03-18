import { BackoffStrategy, retryWithBackoff } from 'utilities/src/async/retryWithBackoff'

interface BestEffortInput<T> {
  fn: () => Promise<T>
  description: string
  log: (msg: string) => void
  retries?: number
}

/**
 * Executes a function with retries, returning null on failure instead of throwing.
 * Use for non-critical operations that shouldn't crash the main workflow.
 *
 * @example
 * await bestEffort({
 *   fn: () => github.addReviewers({ pr, reviewers }),
 *   description: `add reviewers to PR #${pr}`,
 *   log: ctx.log,
 * })
 */
export async function bestEffort<T>(input: BestEffortInput<T>): Promise<T | null> {
  const { fn, description, log, retries = 3 } = input

  try {
    return await retryWithBackoff({
      fn,
      config: {
        maxAttempts: retries,
        baseDelayMs: 1000,
        backoffStrategy: BackoffStrategy.None,
        onRetry: ({ attempt }) => {
          log(`[WARN] Retry ${attempt}/${retries} for: ${description}`)
        },
      },
    })
  } catch (error) {
    log(`[WARN] Failed to ${description}: ${error instanceof Error ? error.message : error}`)
    return null
  }
}
