import { ChallengeType } from '@uniswap/client-platform-service/dist/uniswap/platformservice/v1/sessionService_pb'

/**
 * Result from initiating an OAuth flow
 */
export interface OAuthInitiationResult {
  /** URL to redirect user to for OAuth provider authorization */
  authorizeUrl: string
  /** Challenge ID used as OAuth state parameter for CSRF protection */
  state: string
}

/**
 * Parameters extracted from OAuth callback URL
 */
export interface OAuthCallbackParams {
  /** Authorization code from OAuth provider */
  code: string | null
  /** State parameter (challenge ID) for CSRF validation */
  state: string | null
  /** OAuth error code if authorization failed */
  error: string | null
  /** Human-readable error description */
  errorDescription: string | null
}

/**
 * User information from OAuth provider
 */
export interface OAuthUserInfo {
  name?: string
  email?: string
}

/**
 * Result from verifying OAuth callback
 */
export interface OAuthVerificationResult {
  /** Whether verification succeeded */
  success: boolean
  /** Whether to retry the flow */
  retry: boolean
  /** Seconds to wait before retry (for rate limiting) */
  waitSeconds?: number
  /** User information from OAuth provider */
  userInfo?: OAuthUserInfo
  /** Failure reason from backend (e.g., 'REASON_PROVIDER_MISMATCH') */
  failureReason?: string
  /** Failure message with details (e.g., contains 'CHALLENGE_TYPE_GOOGLE') */
  failureMessage?: string
}

/**
 * OAuth initiation parameters
 */
export interface OAuthInitiateParams {
  /** Type of OAuth challenge (GITHUB, GOOGLE, SLACK, etc.) */
  challengeType: ChallengeType
  /** URL where OAuth provider should redirect after authorization */
  callbackUrl: string
}

/**
 * OAuth verification parameters
 */
export interface OAuthVerifyParams extends OAuthCallbackParams {
  /** Type of OAuth challenge being verified */
  challengeType: ChallengeType
}

/**
 * OAuth Service interface
 *
 * Handles OAuth redirect-based authentication flows.
 * Unlike ChallengeSolver (which solves challenges synchronously),
 * OAuth requires external user action and callback handling.
 *
 * Flow:
 * 1. initiate() - Get authorization URL and redirect user
 * 2. parseCallback() - Extract params from callback URL
 * 3. verify() - Submit authorization code to backend
 */
export interface OAuthService {
  /**
   * Initiate OAuth flow by requesting authorization URL from backend
   * @param params - Challenge type and callback URL
   * @returns Authorization URL to redirect user to
   */
  initiate(params: OAuthInitiateParams): Promise<OAuthInitiationResult>

  /**
   * Parse OAuth callback URL to extract parameters
   * @param url - Callback URL with query params from OAuth provider
   * @returns Extracted callback parameters
   */
  parseCallback(url: URL): OAuthCallbackParams

  /**
   * Verify OAuth callback by submitting authorization code to backend
   * @param params - Callback params plus challenge type
   * @returns Verification result
   */
  verify(params: OAuthVerifyParams): Promise<OAuthVerificationResult>
}
