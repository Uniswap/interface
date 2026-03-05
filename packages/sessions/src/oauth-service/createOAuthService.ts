import type {
  OAuthCallbackParams,
  OAuthInitiateParams,
  OAuthInitiationResult,
  OAuthService,
  OAuthVerificationResult,
  OAuthVerifyParams,
} from '@universe/sessions/src/oauth-service/types'
import type { SessionRepository } from '@universe/sessions/src/session-repository/types'

/**
 * Context (dependencies) for creating an OAuthService
 */
export interface CreateOAuthServiceContext {
  /** Session repository for backend communication */
  sessionRepository: SessionRepository
}

/**
 * Creates an OAuth Service instance.
 *
 * Handles OAuth redirect-based authentication flows by wrapping
 * the session repository's challenge/verify methods.
 *
 * Unlike ChallengeSolver (synchronous solve), OAuth requires:
 * - External redirect to OAuth provider
 * - User action (authorization)
 * - Callback with authorization code
 *
 * @example
 * ```typescript
 * const oauthService = createOAuthService({ sessionRepository })
 *
 * // 1. Initiate - get URL and redirect user
 * const { authorizeUrl } = await oauthService.initiate({
 *   challengeType: ChallengeType.GITHUB,
 *   callbackUrl: 'https://app.com/auth/callback/github',
 * })
 * redirect(authorizeUrl)
 *
 * // 2. In callback route - parse and verify
 * const params = oauthService.parseCallback(new URL(request.url))
 * const result = await oauthService.verify({
 *   ...params,
 *   challengeType: ChallengeType.GITHUB,
 * })
 * // result.userInfo contains { name?, email? } from OAuth provider
 * redirect('/')
 * ```
 */
export function createOAuthService(ctx: CreateOAuthServiceContext): OAuthService {
  /**
   * Initiate OAuth flow by requesting authorization URL
   * Note: Callback URL is now configured server-side per OAuth provider
   */
  async function initiate(params: OAuthInitiateParams): Promise<OAuthInitiationResult> {
    const response = await ctx.sessionRepository.challenge({
      challengeType: params.challengeType,
      // Note: callbackUrl is no longer sent to backend - configured server-side
    })

    if (!response.authorizeUrl) {
      throw new Error('No authorization URL returned from challenge')
    }

    return {
      authorizeUrl: response.authorizeUrl,
      state: response.challengeId,
    }
  }

  /**
   * Parse OAuth callback URL to extract parameters
   */
  function parseCallback(url: URL): OAuthCallbackParams {
    return {
      code: url.searchParams.get('code'),
      state: url.searchParams.get('state'),
      error: url.searchParams.get('error'),
      errorDescription: url.searchParams.get('error_description'),
    }
  }

  /**
   * Verify OAuth callback by submitting authorization code
   */
  async function verify(params: OAuthVerifyParams): Promise<OAuthVerificationResult> {
    // Handle OAuth error from provider
    if (params.error) {
      return {
        success: false,
        retry: false,
      }
    }

    // Validate required params
    if (!params.code || !params.state) {
      return {
        success: false,
        retry: false,
      }
    }

    const result = await ctx.sessionRepository.verifySession({
      solution: params.code,
      challengeId: params.state,
      challengeType: params.challengeType,
    })

    return {
      success: !result.retry && !result.failureReason,
      retry: result.retry,
      waitSeconds: result.waitSeconds,
      userInfo: result.userInfo,
      failureReason: result.failureReason,
      failureMessage: result.failureMessage,
    }
  }

  return {
    initiate,
    parseCallback,
    verify,
  }
}
