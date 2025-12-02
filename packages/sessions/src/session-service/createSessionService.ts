import type { DeviceIdService } from '@universe/sessions/src/device-id/types'
import type { SessionRepository } from '@universe/sessions/src/session-repository/types'
import type {
  ChallengeResponse,
  InitSessionResponse,
  SessionService,
  UpgradeSessionRequest,
  UpgradeSessionResponse,
} from '@universe/sessions/src/session-service/types'
import type { SessionStorage } from '@universe/sessions/src/session-storage/types'

/**
 * Creates a Session Service instance.
 * Orchestrates usage of the Session Repository (remote) and Session Storage (local).
 */
export function createSessionService(ctx: {
  sessionStorage: SessionStorage
  deviceIdService: DeviceIdService
  sessionRepository: SessionRepository
}): SessionService {
  async function initSession(): Promise<InitSessionResponse> {
    const result = await ctx.sessionRepository.initSession()
    if (result.sessionId) {
      await ctx.sessionStorage.set({ sessionId: result.sessionId })
    }
    if (result.extra.device_id) {
      await ctx.deviceIdService.setDeviceId(result.extra.device_id)
    }
    return result
  }

  async function requestChallenge(): Promise<ChallengeResponse> {
    return ctx.sessionRepository.challenge({})
  }

  async function upgradeSession(input: UpgradeSessionRequest): Promise<UpgradeSessionResponse> {
    return ctx.sessionRepository.upgradeSession(input)
  }

  async function removeSession(): Promise<void> {
    await ctx.sessionStorage.clear()
  }

  async function getSessionState(): Promise<{ sessionId: string } | null> {
    return ctx.sessionStorage.get()
  }

  return {
    initSession,
    requestChallenge,
    upgradeSession,
    removeSession,
    getSessionState,
  }
}
