import type { ChallengeSolverService } from '@universe/sessions/src/challenge-solvers/types'
import {
  MaxChallengeRetriesError,
  NoSolverAvailableError,
} from '@universe/sessions/src/session-initialization/sessionErrors'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import type { Logger } from 'utilities/src/logger/logger'

interface SessionInitResult {
  sessionId: string
  isNewSession: boolean
}

interface SessionInitializationService {
  /**
   * Orchestrates the complete session initialization flow:
   * 1. Checks for existing session
   * 2. Creates new session if needed
   * 3. Handles challenge solving if required
   *
   * @throws Error if initialization fails
   */
  initialize(): Promise<SessionInitResult>
}

function createSessionInitializationService(ctx: {
  getSessionService: () => SessionService
  challengeSolverService: ChallengeSolverService
  getIsSessionUpgradeAutoEnabled?: () => boolean
  maxChallengeRetries?: number
  getLogger?: () => Logger
}): SessionInitializationService {
  async function handleChallengeFlow(attemptCount = 0): Promise<void> {
    const maxRetries = ctx.maxChallengeRetries ?? 3

    const challenge = await ctx.getSessionService().requestChallenge()

    // get our solver for the challenge type
    const solver = ctx.challengeSolverService.getSolver(challenge.challengeType)
    if (!solver) {
      const error = new NoSolverAvailableError(challenge.challengeType)
      ctx.getLogger?.().error(error, {
        tags: {
          file: 'createSessionInitializationService',
          function: 'createSessionInitializationService',
        },
        extra: {
          challengeType: challenge.challengeType,
        },
      })
      throw error
    }

    // Solve the challenge
    const solution = await solver.solve({
      challengeId: challenge.challengeId,
      challengeType: challenge.challengeType,
      extra: challenge.extra,
    })

    // Upgrade session with the solution
    const result = await ctx.getSessionService().upgradeSession({
      solution,
      challengeId: challenge.challengeId,
    })

    if (!result.retry) {
      // Upgrade was successful, stop here
      if (attemptCount > 0) {
        ctx
          .getLogger?.()
          .info(
            'createSessionInitializationService',
            'createSessionInitializationService',
            'Challenge upgrade succeeded after retry',
            {
              attemptCount: attemptCount + 1,
            },
          )
      }
      return
    }

    // Handle server retry request
    if (attemptCount >= maxRetries) {
      const error = new MaxChallengeRetriesError(maxRetries, attemptCount + 1)
      ctx.getLogger?.().error(error, {
        tags: {
          file: 'createSessionInitializationService',
          function: 'createSessionInitializationService',
        },
        extra: {
          maxRetries,
          actualAttempts: attemptCount + 1,
        },
      })
      throw error
    }

    ctx
      .getLogger?.()
      .info(
        'createSessionInitializationService',
        'createSessionInitializationService',
        'Challenge retry requested by server',
        {
          attemptCount: attemptCount + 1,
          maxRetries,
        },
      )

    await handleChallengeFlow(attemptCount + 1) // Recursive call with incremented count
  }

  async function initialize(): Promise<SessionInitResult> {
    try {
      ctx
        .getLogger?.()
        .info('createSessionInitializationService', 'createSessionInitializationService', 'Initializing session')
      // Step 1: Check for existing session
      const existingSession = await ctx.getSessionService().getSessionState()

      if (existingSession?.sessionId) {
        ctx
          .getLogger?.()
          .info('createSessionInitializationService', 'createSessionInitializationService', 'Existing session found', {
            sessionId: existingSession.sessionId,
          })
        return {
          sessionId: existingSession.sessionId,
          isNewSession: false,
        }
      }

      // Step 2: Initialize new session
      const initResponse = await ctx.getSessionService().initSession()
      ctx
        .getLogger?.()
        .info('createSessionInitializationService', 'createSessionInitializationService', 'New session initialized', {
          sessionId: initResponse.sessionId,
        })

      // Step 3: Handle challenge if required and enabled
      // Default behavior: disabled (opt-in) if callback is not provided
      const challengeRequiredButDisabled = initResponse.needChallenge && !ctx.getIsSessionUpgradeAutoEnabled?.()

      if (challengeRequiredButDisabled) {
        ctx
          .getLogger?.()
          .info(
            'createSessionInitializationService',
            'createSessionInitializationService',
            'Challenge required but disabled',
            {
              sessionId: initResponse.sessionId,
            },
          )
      }

      if (initResponse.needChallenge && ctx.getIsSessionUpgradeAutoEnabled?.()) {
        ctx
          .getLogger?.()
          .info('createSessionInitializationService', 'createSessionInitializationService', 'Handling challenge')
        await handleChallengeFlow()
      }

      const finalSessionId = initResponse.sessionId || ''
      ctx
        .getLogger?.()
        .info('createSessionInitializationService', 'createSessionInitializationService', 'Session initialized', {
          sessionId: finalSessionId,
          isNewSession: true,
          challengeCompleted: !challengeRequiredButDisabled,
        })

      return {
        sessionId: finalSessionId,
        isNewSession: true,
      }
    } catch (error) {
      ctx.getLogger?.().error(error, {
        tags: {
          file: 'createSessionInitializationService',
          function: 'createSessionInitializationService',
        },
      })
      throw error
    }
  }

  return { initialize }
}

export { createSessionInitializationService }
export type { SessionInitializationService, SessionInitResult }
