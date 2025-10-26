/**
 * Bot detection types from protobuf enum
 */
enum BotDetectionType {
  None = 0,
  Turnstile = 1,
  Hashcash = 2,
}

/**
 * Response from session initialization
 */
interface InitSessionResponse {
  /**
   * Session ID
   * - Web: undefined (in Set-Cookie header)
   * - Mobile/Extension: actual session ID string
   */
  sessionId?: string // optional string session_id = 1

  /** Whether bot detection challenge is required */
  needChallenge: boolean // bool need_challenge = 2

  /** Extra information for bot detection (JSON data) */
  extra: Record<string, string> // map<string, string> extra = 3
}

/**
 * Request for a bot detection challenge
 * Empty - session identified via cookie or header
 */

// biome-ignore lint/complexity/noBannedTypes: Empty per proto
type ChallengeRequest = {}

/**
 * Bot detection challenge response
 */
interface ChallengeResponse {
  /** Unique challenge identifier */
  challengeId: string // string challenge_id = 1

  /** Type of bot detection to use */
  botDetectionType: BotDetectionType // BotDetectionType bot_detection_type = 2

  /** Extra data for challenge (e.g., Turnstile sitekey, HashCash params) */
  extra: Record<string, string> // map<string, string> extra = 3
}

/**
 * Request to upgrade session with bot detection solution
 */
interface UpgradeSessionRequest {
  /** Solution token (Turnstile token or HashCash proof) */
  solution: string // string solution = 1

  /** Challenge ID being solved */
  challengeId: string // string challenge_id = 2

  /** Wallet address for additional trust (future) */
  walletAddress?: string // string wallet_address = 3 (future addition)
}

/**
 * Response from session upgrade attempt
 */
interface UpgradeSessionResponse {
  /** Whether to retry the challenge */
  retry: boolean // bool retry = 1
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
   * Submit bot detection solution to upgrade session
   * - Headers: X-Session-ID (mobile/ext) or Cookie (web)
   */
  upgradeSession(request: UpgradeSessionRequest): Promise<UpgradeSessionResponse>

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
}

export type { SessionRepository }
