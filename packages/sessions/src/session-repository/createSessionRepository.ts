import type { SessionServiceClient } from '@universe/sessions/src/session-repository/createSessionClient'
import type { SessionRepository } from '@universe/sessions/src/session-repository/types'

interface CreateSessionRepositoryDeps {
  client: SessionServiceClient
}

export function createSessionRepository(ctx: CreateSessionRepositoryDeps): SessionRepository {
  const { client } = ctx

  const initSession: SessionRepository['initSession'] = async () => {
    try {
      // The proto expects an empty body - deviceId should be sent via header by transport
      const response = await client.initSession({})

      return {
        sessionId: response.sessionId,
        needChallenge: response.needChallenge,
        extra: response.extra,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to initialize session: ${errorMessage}`, { cause: error })
    }
  }

  const challenge: SessionRepository['challenge'] = async () => {
    try {
      const response = await client.challenge({})

      // Map the protobuf response to our interface
      // The proto has 'challenge' field, we need to extract challenge details from it
      // TODO use schema to parse the response
      let challengeData = {} as any // eslint-disable-line @typescript-eslint/no-explicit-any
      if (response.challenge) {
        try {
          challengeData = JSON.parse(response.challenge)
        } catch (parseError) {
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError)
          throw new Error(`Failed to parse challenge JSON: ${errorMessage}`, { cause: parseError })
        }
      }

      return {
        challengeId: challengeData.challengeId || '',
        botDetectionType: challengeData.botDetectionType || 0,
        extra: challengeData.extra || {},
      }
    } catch (error) {
      throw new Error(`Failed to get challenge: ${error}`)
    }
  }

  const upgradeSession: SessionRepository['upgradeSession'] = async (request) => {
    try {
      await client.upgradeSession({
        solution: request.solution,
        // Note: The proto only has 'solution' field, no challengeId or walletAddress
      })

      // The response structure needs to be mapped from actual proto response
      return {
        retry: false, // Default since proto doesn't have this field
      }
    } catch (error) {
      throw new Error(`Failed to upgrade session: ${error}`)
    }
  }

  const deleteSession: SessionRepository['deleteSession'] = async () => {
    try {
      await client.deleteSession({})
      return {}
    } catch (error) {
      throw new Error(`Failed to delete session: ${error}`)
    }
  }

  return {
    initSession,
    challenge,
    upgradeSession,
    deleteSession,
  }
}
