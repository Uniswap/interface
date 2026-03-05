import { ChallengeType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'
import type { TypedChallengeData } from '@universe/sessions/src/session-repository/types'
import { SessionState } from '@universe/sessions/src/session-storage/types'

interface InitSessionResponse {
  sessionId?: string
  needChallenge: boolean
  /** @deprecated Kept for backwards compatibility */
  extra: Record<string, string>
}

interface ChallengeRequest {
  challengeType?: ChallengeType
  redirectUrl?: string
}

interface ChallengeResponse {
  challengeId: string
  challengeType: ChallengeType
  /** @deprecated Use challengeData instead */
  extra: Record<string, string>
  /** Type-safe challenge-specific data (replaces extra) */
  challengeData?: TypedChallengeData
  authorizeUrl?: string
}

interface VerifySessionRequest {
  solution: string
  challengeId: string
  challengeType: ChallengeType
}

interface VerifySessionResponse {
  retry: boolean
  waitSeconds?: number
  redirectUrl?: string
}

/**
 * Interface used by clients to interact with Sessions.
 * For business logic and dependencies, see {@link createSessionService}
 */
interface SessionService {
  initSession: () => Promise<InitSessionResponse>
  requestChallenge: (request?: ChallengeRequest) => Promise<ChallengeResponse>
  verifySession: (input: VerifySessionRequest) => Promise<VerifySessionResponse>
  removeSession: () => Promise<void>
  getSessionState: () => Promise<SessionState | null>
}

export type {
  SessionService,
  InitSessionResponse,
  ChallengeRequest,
  ChallengeResponse,
  VerifySessionRequest,
  VerifySessionResponse,
}
export { ChallengeType }
