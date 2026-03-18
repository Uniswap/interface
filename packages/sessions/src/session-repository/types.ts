import { ChallengeType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'

/**
 * Typed challenge data for Turnstile bot detection
 */
interface TurnstileChallengeData {
  siteKey: string
  action: string
}

/**
 * Typed challenge data for HashCash proof-of-work
 */
interface HashCashChallengeData {
  difficulty: number
  subject: string
  algorithm: string
  nonce: string
  maxProofLength: number
  verifier: string
}

/**
 * Typed challenge data for GitHub OAuth
 */
interface GitHubChallengeData {
  authorizeUrl: string
}

/**
 * Type-safe challenge data union (mirrors proto oneof ChallengeResponse.challenge_data)
 */
type TypedChallengeData =
  | { case: 'turnstile'; value: TurnstileChallengeData }
  | { case: 'hashcash'; value: HashCashChallengeData }
  | { case: 'github'; value: GitHubChallengeData }
  | { case: undefined; value?: undefined }

/**
 * Response from session initialization
 */
interface InitSessionResponse {
  /**
   * Session ID
   * - Web: undefined (in Set-Cookie header)
   * - Mobile/Extension: actual session ID string
   */
  sessionId?: string // optional string session_id
  deviceId?: string // string device_id

  /** Whether bot detection challenge is required */
  needChallenge: boolean // bool need_challenge

  /** @deprecated Extra information for bot detection (JSON data) — kept for backwards compatibility */
  extra: Record<string, string> // map<string, string> extra
}

/**
 * Request for a challenge
 * For bot detection: empty (server decides challenge type)
 * For OAuth: specify challengeType
 */
interface ChallengeRequest {
  /** Challenge type to request (optional - server decides if not specified) */
  challengeType?: ChallengeType
  /** Email or other identifier (required for email OTP challenges) */
  identifier?: string
}

/**
 * Challenge response
 * For bot detection: typed challenge data in challengeData
 * For OAuth: authorizeUrl in challengeData (GitHub) or extra (legacy)
 */
interface ChallengeResponse {
  /** Unique challenge identifier (used as OAuth state parameter) */
  challengeId: string // string challenge_id = 1

  /** Type of challenge */
  challengeType: ChallengeType // ChallengeType challenge_type = 2

  /** @deprecated Use challengeData instead. Kept for backwards compatibility. */
  extra: Record<string, string> // map<string, string> extra = 3 [deprecated]

  /** Type-safe challenge-specific data (replaces extra) */
  challengeData?: TypedChallengeData

  /** OAuth authorization URL extracted from challengeData or extra */
  authorizeUrl?: string
}

/**
 * Request to verify session with bot detection solution
 */
interface VerifySessionRequest {
  /** Solution token (Turnstile token or HashCash proof) */
  solution: string

  /** Challenge ID being solved */
  challengeId: string

  /** Type of challenge being solved */
  challengeType: ChallengeType
}

/**
 * User information from OAuth provider
 */
interface UserInfo {
  name?: string
  email?: string
}

/**
 * Typed failure reasons from the SessionService/Verify proto.
 * Values match the wire format: `REASON_${VerifyFailure_Reason[enum]}`.
 *
 * Use for exhaustive case matching in strategies and services:
 * ```ts
 * switch (result.failureReason) {
 *   case VerifyFailureReason.INVALID_CHALLENGE:
 *     return { action: 'error', message: result.failureMessage }
 * }
 * ```
 */
const VerifyFailureReason = {
  /** Default/unknown failure */
  UNSPECIFIED: 'REASON_UNSPECIFIED',
  /** Bad OTP code or bot detection solution */
  INVALID_SOLUTION: 'REASON_INVALID_SOLUTION',
  /** OAuth provider email needs verification */
  EMAIL_NOT_VERIFIED: 'REASON_EMAIL_NOT_VERIFIED',
  /** Challenge ID is invalid or expired — re-initiate a challenge */
  INVALID_CHALLENGE: 'REASON_IVALID_CHALLENGE', // backend proto typo preserved
  /** Email is linked to a different auth provider */
  PROVIDER_MISMATCH: 'REASON_PROVIDER_MISMATCH',
} as const

type VerifyFailureReason = (typeof VerifyFailureReason)[keyof typeof VerifyFailureReason]

/**
 * Response from session verification
 */
interface VerifySessionResponse {
  /** Whether to retry the challenge */
  retry: boolean // bool retry = 1

  /** Seconds to wait before retry (for rate limiting, e.g., email OTP) */
  waitSeconds?: number // from VerifyFailure.wait_seconds

  /** User information from successful OAuth verification */
  userInfo?: UserInfo // from VerifySuccess.user_info

  /** Typed failure reason code — use VerifyFailureReason for matching */
  failureReason?: VerifyFailureReason

  /** Human-readable failure message from the backend */
  failureMessage?: string
}

/**
 * Request to delete a session
 * Empty - session identified via cookie or header
 */

// biome-ignore lint/complexity/noBannedTypes: Empty per proto
type DeleteSessionRequest = {}

/**
 * Response from session deletion
 */

// biome-ignore lint/complexity/noBannedTypes: Empty per proto
type DeleteSessionResponse = {}

/**
 * Introspect request - Entry Gateway only
 * Frontend doesn't use this
 */
interface IntrospectRequest {
  /** Session ID to introspect */
  sessionId: string // string session_id = 1
}

/**
 * Introspect response - Entry Gateway only
 * Frontend doesn't use this
 */
interface IntrospectResponse {
  /** Wrapped/hashed session ID */
  wrappedId: string // string wrapped_id = 1

  /** Validation result */
  result: boolean // bool result = 2

  /** Trust score */
  score: number // int32 score = 4

  /** Persona identifier */
  personaId: string // string persona_id = 5
}

/**
 * Configuration for a challenge type (OAuth provider or bot detection)
 * Returned by getChallengeTypes to provide client-side SDK configuration
 */
interface ChallengeTypeConfig {
  /** Challenge type (e.g., GOOGLE, GITHUB, EMAIL, TURNSTILE) */
  type: ChallengeType

  /** Provider-specific configuration (e.g., clientId, scope for OAuth) */
  config: Record<string, string>
}

/**
 * Session Service API client interface
 * Wraps the protobuf-generated client
 */
interface SessionRepository {
  /**
   * Initialize a new session
   * - Headers: X-Device-ID (mobile/extension only)
   * - Response: session_id in body (mobile/ext) or Set-Cookie (web)
   * TODO: this is pretty implicit: when on web, we exclude the device ID header,
   * so then it implicitly returns a session ID via the Set-Cookie header
   *
   */
  initSession(): Promise<InitSessionResponse>

  /**
   * Request a bot detection challenge
   * - Headers: X-Session-ID (mobile/ext) or Cookie (web)
   */
  challenge(request: ChallengeRequest): Promise<ChallengeResponse>

  /**
   * Submit bot detection solution to verify session
   * - Headers: X-Session-ID (mobile/ext) or Cookie (web)
   */
  verifySession(request: VerifySessionRequest): Promise<VerifySessionResponse>

  /**
   * Delete the current session
   * - Headers: X-Session-ID (mobile/ext) or Cookie (web)
   */
  deleteSession(request: DeleteSessionRequest): Promise<DeleteSessionResponse>

  /**
   * Introspect session validity (Entry Gateway only)
   * Frontend should NOT use this - EGW internal only
   */
  introspect?(request: IntrospectRequest): Promise<IntrospectResponse>

  /**
   * Get available challenge types and their configuration
   * Returns OAuth provider configs (e.g., Google client ID) and bot detection configs
   */
  getChallengeTypes(): Promise<ChallengeTypeConfig[]>
}

/**
 * Typed failure reasons from the SessionService/Challenge proto.
 * Values match the wire format: `REASON_${ChallengeFailure_Reason[enum]}`.
 */
const ChallengeFailureReason = {
  /** Default/unknown failure */
  UNSPECIFIED: 'REASON_UNSPECIFIED',
  /** Session must pass bot detection first (score < 60) */
  BOT_DETECTION_REQUIRED: 'REASON_BOT_DETECTION_REQUIRED',
} as const

type ChallengeFailureReason = (typeof ChallengeFailureReason)[keyof typeof ChallengeFailureReason]

export { ChallengeFailureReason, VerifyFailureReason }

export type {
  SessionRepository,
  ChallengeRequest,
  ChallengeResponse,
  ChallengeTypeConfig,
  VerifySessionRequest,
  VerifySessionResponse,
  InitSessionResponse,
  UserInfo,
  TypedChallengeData,
  TurnstileChallengeData,
  HashCashChallengeData,
  GitHubChallengeData,
}
