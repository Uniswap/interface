import type { DeviceIdService } from '@universe/sessions/src/device-id/types'
import type { SessionRepository } from '@universe/sessions/src/session-repository/types'
import type { SessionService } from '@universe/sessions/src/session-service/types'
import type { SessionStorage } from '@universe/sessions/src/session-storage/types'

export function createSessionService(ctx: {
  deviceIdService: DeviceIdService
  sessionStorage: SessionStorage
  sessionRepository: SessionRepository
}): SessionService {
  async function initSession(): Promise<void> {
    const deviceId = await ctx.deviceIdService.getDeviceId()
    const result = await ctx.sessionRepository.initSession({ deviceId })
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
