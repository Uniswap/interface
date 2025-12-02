/**
 * Base class for session-related errors that should not trigger retries at higher levels.
 */
export abstract class SessionError extends Error {
  constructor(message: string, name: string) {
    super(message)
    this.name = name
  }
}

/**
 * Error thrown when maximum challenge retry attempts are exceeded.
 * This error should not trigger additional retries at higher levels.
 */
export class MaxChallengeRetriesError extends SessionError {
  constructor(maxRetries: number, actualAttempts: number) {
    super(
      `Maximum challenge retry attempts (${maxRetries}) exceeded after ${actualAttempts} attempts`,
      'MaxChallengeRetriesError',
    )
  }
}

/**
 * Error thrown when no solver is available for a challenge type.
 * This error should not trigger additional retries at higher levels.
 */
export class NoSolverAvailableError extends SessionError {
  constructor(botDetectionType: number) {
    super(`No solver available for bot detection type: ${botDetectionType}`, 'NoSolverAvailableError')
  }
}
