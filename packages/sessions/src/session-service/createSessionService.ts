import type { DeviceIdService } from '@universe/sessions/src/device-id/types'
import type { SessionRepository } from '@universe/sessions/src/session-repository/types'
import type {
  ChallengeRequest,
  ChallengeResponse,
  InitSessionResponse,
  SessionService,
  VerifySessionRequest,
  VerifySessionResponse,
} from '@universe/sessions/src/session-service/types'
import type { SessionStorage } from '@universe/sessions/src/session-storage/types'
import type { UniswapIdentifierService } from '@universe/sessions/src/uniswap-identifier/types'

/**
 * Creates a Session Service instance.
 * Orchestrates usage of the Session Repository (remote) and Session Storage (local).
 */
export function createSessionService(ctx: {
  sessionStorage: SessionStorage
  deviceIdService: DeviceIdService
  uniswapIdentifierService: UniswapIdentifierService
  sessionRepository: SessionRepository
}): SessionService {
  async function initSession(): Promise<InitSessionResponse> {
    const result = await ctx.sessionRepository.initSession()
    if (result.sessionId) {
      await ctx.sessionStorage.set({ sessionId: result.sessionId })
    }
    if (result.deviceId) {
      await ctx.deviceIdService.setDeviceId(result.deviceId)
    }
    if (result.extra['uniswapIdentifier']) {
      await ctx.uniswapIdentifierService.setUniswapIdentifier(result.extra['uniswapIdentifier'])
    }
    return result
  }

  async function requestChallenge(request?: ChallengeRequest): Promise<ChallengeResponse> {
    return ctx.sessionRepository.challenge(request ?? {})
  }

  async function verifySession(input: VerifySessionRequest): Promise<VerifySessionResponse> {
    return ctx.sessionRepository.verifySession(input)
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
    verifySession,
    removeSession,
    getSessionState,
  }
}
