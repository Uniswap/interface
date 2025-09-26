import type { SessionRepository } from '@universe/sessions/src/session-repository/types'

export function createSessionRepository(
  // TODO: pass in generated client here as apiClient
): SessionRepository {
  const initSession: SessionRepository['initSession'] = async (_request) => {
    // Mock implementation - will be replaced with actual client call
    // return ctx.client.initSession(request)
    return {
      sessionId: `mock-session-${Date.now()}`,
      needChallenge: false,
      extra: {},
    }
  }

  const challenge: SessionRepository['challenge'] = async () => {
    // Mock implementation - will be replaced with actual client call
    // return ctx.client.challenge(request)
    return {
      challengeId: `challenge-${Date.now()}`,
      botDetectionType: 1, // Turnstile
      extra: {
        sitekey: 'mock-sitekey',
      },
    }
  }

  const upgradeSession: SessionRepository['upgradeSession'] = async (_request) => {
    // Mock implementation - will be replaced with actual client call
    // return ctx.client.upgradeSession(request)
    return {
      retry: false,
    }
  }

  const deleteSession: SessionRepository['deleteSession'] = async () => {
    // Mock implementation - will be replaced with actual client call
    // return ctx.client.deleteSession(request)
    return {}
  }

  return {
    initSession,
    challenge,
    upgradeSession,
    deleteSession,
  }
}
