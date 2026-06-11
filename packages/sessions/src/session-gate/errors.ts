export class SessionReadyTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Session not ready within ${timeoutMs}ms`)
    this.name = 'SessionReadyTimeoutError'
  }
}

/**
 * Thrown by `provideSession()` before `bootstrapSession()` has been called.
 * Caught and converted to `null` by `tryProvideSession()` / `getSessionGate()`
 * to distinguish "not bootstrapped yet" from other singleton errors.
 */
export class SessionNotBootstrappedError extends Error {
  constructor() {
    super('provideSession() called before bootstrapSession()')
    this.name = 'SessionNotBootstrappedError'
  }
}

export class SessionRecoveryFailedError extends Error {
  public readonly originalError!: unknown
  public readonly recoveryError!: unknown
  constructor(originalError: unknown, recoveryError: unknown) {
    super(
      `Session recovery failed after 401: ${
        recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
      }`,
    )
    this.name = 'SessionRecoveryFailedError'
    this.cause = recoveryError
    // Non-enumerable so the raw auth payloads don't leak through default
    // serialization (JSON.stringify, error tracking integrations, etc).
    // Programmatic access via `err.originalError` / `err.recoveryError` still works.
    Object.defineProperty(this, 'originalError', { value: originalError, enumerable: false })
    Object.defineProperty(this, 'recoveryError', { value: recoveryError, enumerable: false })
  }
}
