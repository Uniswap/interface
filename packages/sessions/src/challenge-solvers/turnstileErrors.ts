import { SessionError } from '@universe/sessions/src/session-initialization/sessionErrors'

/**
 * Error thrown when Turnstile script fails to load
 */
export class TurnstileScriptLoadError extends SessionError {
  constructor(message: string, cause?: unknown) {
    super(`Turnstile script load error: ${message}`, 'TurnstileScriptLoadError')
    if (cause) {
      this.cause = cause
    }
  }
}

/**
 * Error thrown when Turnstile API is not available
 */
export class TurnstileApiNotAvailableError extends SessionError {
  constructor() {
    super('Turnstile API not available', 'TurnstileApiNotAvailableError')
  }
}

/**
 * Error thrown when Turnstile challenge times out
 */
export class TurnstileTimeoutError extends SessionError {
  constructor(timeoutMs: number) {
    super(`Turnstile challenge timed out after ${timeoutMs}ms`, 'TurnstileTimeoutError')
  }
}

/**
 * Error thrown when Turnstile returns an error
 */
export class TurnstileError extends SessionError {
  constructor(errorCode: string) {
    super(`Turnstile error: ${errorCode}`, 'TurnstileError')
  }
}

/**
 * Error thrown when Turnstile token expires
 */
export class TurnstileTokenExpiredError extends SessionError {
  constructor() {
    super('Turnstile token expired', 'TurnstileTokenExpiredError')
  }
}
