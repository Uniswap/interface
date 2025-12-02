import { ChallengeType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import { SessionState } from '@universe/sessions/src/session-storage/types'

interface InitSessionResponse {
  sessionId?: string
  needChallenge: boolean
  extra: Record<string, string>
}

interface ChallengeResponse {
  challengeId: string
  challengeType: ChallengeType
  extra: Record<string, string>
}

interface UpgradeSessionRequest {
  solution: string
  challengeId: string
  // walletAddress?: string
}

interface UpgradeSessionResponse {
  retry: boolean
}

/**
 * Interface used by clients to interact with Sessions.
 * For business logic and dependencies, see {@link createSessionService}
 */
interface SessionService {
  initSession: () => Promise<InitSessionResponse>
  requestChallenge: () => Promise<ChallengeResponse>
  upgradeSession: (input: UpgradeSessionRequest) => Promise<UpgradeSessionResponse>
  removeSession: () => Promise<void>
  getSessionState: () => Promise<SessionState | null>
}

export type { SessionService, InitSessionResponse, ChallengeResponse, UpgradeSessionRequest, UpgradeSessionResponse }
export { ChallengeType }
