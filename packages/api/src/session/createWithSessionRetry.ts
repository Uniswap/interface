import { is401Error } from '@universe/api'

/** Creates a function that will attempt to reinitialize the app session and retry the input function once, if the first invocation of the function fails. */
export function createWithSessionRetry(ctx: {
  reinitializeSession: () => Promise<void>
  onReinitializationFailed?: () => void
}) {
  return async function withSessionRetry<T>(fn: () => Promise<T>): Promise<T> {
    // Attempt 1
    try {
      return await fn()
    } catch (error) {
      // After first 401, reinitialize session and do not throw
      if (is401Error(error)) {
        await ctx.reinitializeSession()
      } else {
        throw error
      }
    }

    // Attempt 2
    try {
      return await fn()
    } catch (errorAfterReinitialization) {
      if (is401Error(errorAfterReinitialization)) {
        // Handle any side effects of reinitialization failure
        ctx.onReinitializationFailed?.()
      }
      // Always throw error after reinitialization failure
      throw errorAfterReinitialization
    }
  }
}
