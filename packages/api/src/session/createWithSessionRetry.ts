import { is401Error } from '@universe/api/src/clients/base/errors'

/**
 * Creates a function that will attempt to reinitialize the app session and retry the input function once, if the first invocation of the function fails.
 *
 * @deprecated New code should rely on the transport-layer session gate
 * (`requireSessionInterceptor` / `requireSessionFetch` from `@universe/sessions`)
 * wired via the `getSession` config on `createSessionTransport` and
 * `createFetchClient`. This per-call wrapper remains during the
 * `unirpc_session_gate_enabled` rollout and will be removed once the flag is
 * fully on; it's a no-op when the transport-layer gate is active (the gate
 * recovers the session and retries before the call reaches this wrapper).
 */
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
