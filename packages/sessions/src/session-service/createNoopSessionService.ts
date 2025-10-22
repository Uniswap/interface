import type { SessionService } from '@universe/sessions/src/session-service/types'

function createNoopSessionService(): SessionService {
  const initSession: SessionService['initSession'] = async () => {}
  const removeSession: SessionService['removeSession'] = async () => {}
  const getSessionState: SessionService['getSessionState'] = async () => null

  return {
    initSession,
    removeSession,
    getSessionState,
  }
}

export { createNoopSessionService }
