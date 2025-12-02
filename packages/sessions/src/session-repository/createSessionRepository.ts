import type { SessionServiceClient } from '@universe/sessions/src/session-repository/createSessionClient'
import type { SessionRepository } from '@universe/sessions/src/session-repository/types'
import type { Logger } from 'utilities/src/logger/logger'

/**
 * Creates a session repository that handles communication with the session service.
 * This is the layer that makes actual API calls to the backend.
 */
function createSessionRepository(ctx: { client: SessionServiceClient; getLogger?: () => Logger }): SessionRepository {
  const initSession: SessionRepository['initSession'] = async () => {
    try {
      const response = await ctx.client.initSession({})

      return {
        sessionId: response.sessionId,
        needChallenge: response.needChallenge || false,
        extra: response.extra,
      }
    } catch (error) {
      ctx.getLogger?.().error(error, {
        tags: {
          file: 'createSessionRepository',
          function: 'createSessionRepository',
        },
        extra: {
          operation: 'initSession',
        },
      })
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to initialize session: ${errorMessage}`, { cause: error })
    }
  }

  const challenge: SessionRepository['challenge'] = async () => {
    try {
      const response = await ctx.client.challenge({})

      return {
        challengeId: response.challengeId || '',
        challengeType: response.challengeType || 0,
        extra: response.extra,
      }
    } catch (error) {
      ctx.getLogger?.().error(error, {
        tags: {
          file: 'createSessionRepository',
          function: 'createSessionRepository',
        },
        extra: {
          operation: 'challenge',
        },
      })
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to get challenge: ${errorMessage}`, { cause: error })
    }
  }

  const upgradeSession: SessionRepository['upgradeSession'] = async (request) => {
    try {
      const verifyResponse = await ctx.client.verify({
        solution: request.solution,
        challengeId: request.challengeId,
      })

      // The response structure needs to be mapped from actual proto response
      return {
        retry: verifyResponse.retry,
      }
    } catch (error) {
      ctx.getLogger?.().error(error, {
        tags: {
          file: 'createSessionRepository',
          function: 'createSessionRepository',
        },
        extra: {
          operation: 'upgradeSession',
          challengeId: request.challengeId,
        },
      })
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to upgrade session: ${errorMessage}`, { cause: error })
    }
  }

  const deleteSession: SessionRepository['deleteSession'] = async () => {
    try {
      await ctx.client.deleteSession({})
      return {}
    } catch (error) {
      ctx.getLogger?.().error(error, {
        tags: {
          file: 'createSessionRepository',
          function: 'createSessionRepository',
        },
        extra: {
          operation: 'deleteSession',
        },
      })
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to delete session: ${errorMessage}`, { cause: error })
    }
  }

  return {
    initSession,
    challenge,
    upgradeSession,
    deleteSession,
  }
}

export { createSessionRepository }
