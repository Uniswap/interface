import type { SessionRepository } from '@universe/sessions/src/session-repository/types'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import type { SessionStorage } from '@universe/sessions/src/session-storage/types'

export function createSessionService(ctx: {
  sessionStorage: SessionStorage
  sessionRepository: SessionRepository
}): SessionService {
  async function initSession(): Promise<void> {
    const result = await ctx.sessionRepository.initSession()
    if (result.sessionId) {
      await ctx.sessionStorage.set({ sessionId: result.sessionId })
    }
  }

  async function removeSession(): Promise<void> {
    await ctx.sessionStorage.clear()
  }

  async function getSessionState(): Promise<{ sessionId: string } | null> {
    return ctx.sessionStorage.get()
  }

  return {
    initSession,
    removeSession,
    getSessionState,
  }
}
