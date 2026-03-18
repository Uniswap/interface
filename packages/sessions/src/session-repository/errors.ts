import { SessionError } from '@universe/sessions/src/session-initialization/sessionErrors'

/**
 * Error thrown when the Entry Gateway rejects a challenge request.
 *
 * Since v0.0.14, the proto `ChallengeResponse` includes a typed `failure?: ChallengeFailure`
 * field with `ChallengeFailure_Reason` (e.g., `BOT_DETECTION_REQUIRED`). This error is
 * thrown when that field is present, carrying the typed reason for callers to handle.
 */
export class ChallengeRejectedError extends SessionError {
  /** The failure reason string (may not be in our proto types yet) */
  readonly reason: string

  /** The full raw failure object for debugging */
  readonly rawFailure: unknown

  constructor(reason: string, rawFailure?: unknown) {
    super(`Challenge rejected by Entry Gateway: ${reason}`, 'ChallengeRejectedError')
    this.reason = reason
    this.rawFailure = rawFailure
  }
}
