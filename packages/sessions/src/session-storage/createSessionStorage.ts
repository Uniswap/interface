import { SessionStorage } from '@universe/sessions/src/session-storage/types'

function createSessionStorage(ctx: {
  getSessionId: () => Promise<string | null>
  setSessionId: (sessionId: string) => Promise<void>
  clearSessionId: () => Promise<void>
}): SessionStorage {
  const get: SessionStorage['get'] = async () => {
    const stored = await ctx.getSessionId()
    return stored ? { sessionId: stored } : null
  }
  const set: SessionStorage['set'] = async (sessionState) => {
    await ctx.setSessionId(sessionState.sessionId)
  }
  const clear: SessionStorage['clear'] = async () => {
    await ctx.clearSessionId()
  }
  return {
    get,
    set,
    clear,
  }
}

export { createSessionStorage }
