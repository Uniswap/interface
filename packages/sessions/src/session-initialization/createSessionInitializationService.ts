import type { ChallengeSolverService } from '@universe/sessions/src/challenge-solvers/types'
import type { PerformanceTracker } from '@universe/sessions/src/performance/types'
import {
  MaxChallengeRetriesError,
  NoSolverAvailableError,
} from '@universe/sessions/src/session-initialization/sessionErrors'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import type { Logger } from 'utilities/src/logger/logger'

interface SessionInitResult {
  sessionId: string | null
}

/**
 * Callbacks for session initialization lifecycle events.
 * Each callback is optional and focused on one event.
 */
export interface SessionInitAnalytics {
  /** Called when session initialization starts */
  onInitStarted?: () => void
  /** Called when session initialization completes (before challenge flow) */
  onInitCompleted?: (data: { needChallenge: boolean; durationMs: number }) => void
  /** Called when a challenge is received from the backend */
  onChallengeReceived?: (data: { challengeType: string; challengeId: string }) => void
  /** Called when session verification completes (success or retry) */
  onVerifyCompleted?: (data: { success: boolean; attemptNumber: number; totalDurationMs: number }) => void
}

interface SessionInitOptions {
  /**
   * If provided, skips the initSession() RPC call and uses this value directly.
   * Useful when the caller already knows the answer (e.g. from a prior init call).
   */
  needChallenge?: boolean
}

interface SessionInitializationService {
  /**
   * Orchestrates the complete session initialization flow:
   * 1. Calls initSession (backend decides whether to create new or reuse existing)
   * 2. Handles challenge solving if required
   *
   * Pass `options.needChallenge` to skip step 1 when the answer is already known.
   *
   * @throws Error if initialization fails
   */
  initialize(options?: SessionInitOptions): Promise<SessionInitResult>
}

function createSessionInitializationService(ctx: {
  getSessionService: () => SessionService
  challengeSolverService: ChallengeSolverService
  /**
   * Required: Performance tracker for timing measurements.
   * Must be injected - no implicit dependency on globalThis.performance.
   */
  performanceTracker: PerformanceTracker
  getIsSessionUpgradeAutoEnabled?: () => boolean
  maxChallengeRetries?: number
  getLogger?: () => Logger
  /** Analytics callbacks for tracking session initialization lifecycle */
  analytics?: SessionInitAnalytics
}): SessionInitializationService {
  const log = ctx.getLogger?.()

  async function handleChallengeFlow(attemptCount = 0, flowStartTime?: number): Promise<void> {
    const startTime = flowStartTime ?? ctx.performanceTracker.now()
    const maxRetries = ctx.maxChallengeRetries ?? 3

    const challenge = await ctx.getSessionService().requestChallenge()

    log?.debug('createSessionInitializationService', 'handleChallengeFlow', 'Requesting challenge', {
      challenge,
    })

    // Report challenge received (only on first attempt)
    if (attemptCount === 0) {
      const data = { challengeType: String(challenge.challengeType), challengeId: challenge.challengeId }
      ctx.analytics?.onChallengeReceived?.(data)
      log?.info('sessions', 'challengeReceived', 'Challenge received', data)
    }

    // get our solver for the challenge type
    const solver = ctx.challengeSolverService.getSolver(challenge.challengeType)
    if (!solver) {
      throw new NoSolverAvailableError(challenge.challengeType)
    }

    // Solve the challenge — if the solver throws (e.g. Turnstile domain mismatch on
    // Vercel previews), submit a placeholder solution so verifySession can reject it
    // and the retry loop can request a different challenge type (typically Hashcash).
    // Note: we use a non-empty placeholder because proto3 omits empty strings from the
    // wire, which means the backend wouldn't see the solution field at all.
    let solution: string
    try {
      solution = await solver.solve({
        challengeId: challenge.challengeId,
        challengeType: challenge.challengeType,
        extra: challenge.extra,
        challengeData: challenge.challengeData,
      })
    } catch (solverError) {
      log?.warn(
        'createSessionInitializationService',
        'handleChallengeFlow',
        'Solver failed, submitting placeholder solution to trigger fallback',
        { error: solverError, challengeType: challenge.challengeType },
      )
      solution = 'solver-failed'
    }

    log?.debug('createSessionInitializationService', 'handleChallengeFlow', 'Solved challenge', { solution })

    // Verify session with the solution
    const result = await ctx.getSessionService().verifySession({
      solution,
      challengeId: challenge.challengeId,
      challengeType: challenge.challengeType,
    })

    const verifyData = {
      success: !result.retry,
      attemptNumber: attemptCount + 1,
      totalDurationMs: ctx.performanceTracker.now() - startTime,
    }
    ctx.analytics?.onVerifyCompleted?.(verifyData)
    log?.info('sessions', 'verifyCompleted', 'Verify completed', verifyData)

    if (!result.retry) {
      return
    }

    // Handle server retry request
    if (attemptCount >= maxRetries) {
      throw new MaxChallengeRetriesError(maxRetries, attemptCount + 1)
    }

    await handleChallengeFlow(attemptCount + 1, startTime) // Recursive call with incremented count
  }

  async function initialize(options?: SessionInitOptions): Promise<SessionInitResult> {
    const initStartTime = ctx.performanceTracker.now()

    let needChallenge: boolean
    let sessionId: string | undefined

    if (options?.needChallenge !== undefined) {
      // Caller already knows — skip the initSession() RPC
      needChallenge = options.needChallenge
      sessionId = undefined

      const data = { needChallenge, durationMs: 0 }
      ctx.analytics?.onInitCompleted?.(data)
      log?.info('sessions', 'initCompleted', 'Session init completed', data)
    } else {
      // Discover from backend
      ctx.analytics?.onInitStarted?.()
      log?.info('sessions', 'initStarted', 'Session init started')

      const initResponse = await ctx.getSessionService().initSession()
      needChallenge = initResponse.needChallenge
      sessionId = initResponse.sessionId

      const data = { needChallenge, durationMs: ctx.performanceTracker.now() - initStartTime }
      ctx.analytics?.onInitCompleted?.(data)
      log?.info('sessions', 'initCompleted', 'Session init completed', data)
    }

    // Handle challenge if required and enabled
    if (needChallenge && ctx.getIsSessionUpgradeAutoEnabled?.()) {
      await handleChallengeFlow()
    }

    // sessionId is null for web (stored in cookie), real ID for non-web platforms
    return {
      sessionId: sessionId ?? null,
    }
  }

  return { initialize }
}

export { createSessionInitializationService }
export type { SessionInitializationService, SessionInitOptions, SessionInitResult }
