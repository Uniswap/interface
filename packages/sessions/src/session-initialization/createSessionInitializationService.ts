import type { ChallengeSolverService } from '@universe/sessions/src/challenge-solvers/types'
import {
  MaxChallengeRetriesError,
  NoSolverAvailableError,
} from '@universe/sessions/src/session-initialization/sessionErrors'
import type { SessionService } from '@universe/sessions/src/session-service/types'

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
  sessionService: SessionService
  challengeSolverService: ChallengeSolverService
  maxChallengeRetries?: number
}): SessionInitializationService {
  async function handleChallengeFlow(attemptCount = 0): Promise<void> {
    const maxRetries = ctx.maxChallengeRetries ?? 3

    const challenge = await ctx.sessionService.requestChallenge()

    // get our solver for the challenge type
    const solver = ctx.challengeSolverService.getSolver(challenge.botDetectionType)
    if (!solver) {
      throw new NoSolverAvailableError(challenge.botDetectionType)
    }

    // Solve the challenge
    const solution = await solver.solve({
      challengeId: challenge.challengeId,
      botDetectionType: challenge.botDetectionType,
      extra: challenge.extra,
    })

    // Upgrade session with the solution
    const result = await ctx.sessionService.upgradeSession({
      solution,
      challengeId: challenge.challengeId,
    })

    if (!result.retry) {
      // Upgrade was successful, stop here
      return
    }

    // Handle server retry request
    if (attemptCount >= maxRetries) {
      throw new MaxChallengeRetriesError(maxRetries, attemptCount + 1)
    }

    await handleChallengeFlow(attemptCount + 1) // Recursive call with incremented count
  }

  async function initialize(): Promise<SessionInitResult> {
    // Step 1: Check for existing session
    const existingSession = await ctx.sessionService.getSessionState()

    if (existingSession?.sessionId) {
      return {
        sessionId: existingSession.sessionId,
        isNewSession: false,
      }
    }

    // Step 2: Initialize new session
    const initResponse = await ctx.sessionService.initSession()

    // Step 3: Handle challenge if required
    if (initResponse.needChallenge) {
      await handleChallengeFlow()
    }

    // Return the result
    return {
      sessionId: initResponse.sessionId || '',
      isNewSession: true,
    }
  }

  return { initialize }
}

export { createSessionInitializationService }
export type { SessionInitializationService, SessionInitResult }
