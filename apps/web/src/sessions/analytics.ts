import type { HashcashSolveAnalytics, SessionInitAnalytics, TurnstileSolveAnalytics } from '@universe/sessions'
import { SessionsEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

/**
 * Sanitizes error messages before sending to analytics.
 * Removes potentially sensitive information like file paths and stack traces.
 */
function sanitizeErrorMessage(message: string | undefined): string | undefined {
  if (!message) {
    return undefined
  }

  let sanitized = message
    // Remove file paths (Unix and Windows)
    .replace(/\/[\w./-]+/g, '[path]')
    .replace(/[A-Za-z]:\\[\w.-]+/g, '[path]')
    // Remove stack traces (lines starting with "at ")
    .replace(/\s+at\s+.+/g, '')
    // Trim whitespace
    .trim()

  // Truncate to reasonable length
  if (sanitized.length > 200) {
    sanitized = sanitized.slice(0, 200) + '...'
  }

  return sanitized
}

/**
 * Analytics callbacks for session initialization lifecycle.
 * Wires up the SessionInitAnalytics contract to Amplitude events.
 */
export const sessionInitAnalytics: SessionInitAnalytics = {
  onInitStarted: () => sendAnalyticsEvent(SessionsEventName.SessionInitStarted),
  onInitCompleted: (data) =>
    sendAnalyticsEvent(SessionsEventName.SessionInitCompleted, {
      need_challenge: data.needChallenge,
      duration_ms: data.durationMs,
    }),
  onChallengeReceived: (data) =>
    sendAnalyticsEvent(SessionsEventName.ChallengeReceived, {
      challenge_type: data.challengeType,
      // PII reviewed: challengeId is a server-generated random identifier not linked to user identity
      challenge_id: data.challengeId,
    }),
  onVerifyCompleted: (data) =>
    sendAnalyticsEvent(SessionsEventName.VerifyCompleted, {
      success: data.success,
      attempt_number: data.attemptNumber,
      total_duration_ms: data.totalDurationMs,
    }),
}

/**
 * Analytics callback for Turnstile challenge solver.
 */
export const onTurnstileSolveCompleted = (data: TurnstileSolveAnalytics): void => {
  sendAnalyticsEvent(SessionsEventName.TurnstileSolveCompleted, {
    duration_ms: data.durationMs,
    success: data.success,
    error_type: data.errorType,
    error_message: sanitizeErrorMessage(data.errorMessage),
  })
}

/**
 * Analytics callback for Hashcash challenge solver.
 */
export const onHashcashSolveCompleted = (data: HashcashSolveAnalytics): void => {
  sendAnalyticsEvent(SessionsEventName.HashcashSolveCompleted, {
    duration_ms: data.durationMs,
    success: data.success,
    error_type: data.errorType,
    error_message: sanitizeErrorMessage(data.errorMessage),
    difficulty: data.difficulty,
    iteration_count: data.iterationCount,
    used_worker: data.usedWorker,
  })
}
