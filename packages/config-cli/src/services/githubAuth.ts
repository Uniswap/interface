import * as core from '@actions/core'
import { Result } from 'better-result'
import { errorToString } from 'utilities/src/errors'
import { AuthError, NetworkError } from '../errors'
import type { LoginResult } from './auth'

// The OIDC `aud` claim the Config Service validates GitHub-issued tokens against.
const OIDC_AUDIENCE = 'https://uniswap.org'

/**
 * CI auth backed by GitHub Actions OIDC. Inside a workflow job granted `permissions: id-token: write`,
 * GitHub injects ACTIONS_ID_TOKEN_REQUEST_URL / ACTIONS_ID_TOKEN_REQUEST_TOKEN into the environment;
 * `@actions/core`'s `getIDToken` reads those and mints a short-lived JWT for the requested audience.
 */
export function createGithubOidcAuthService() {
  const getAccessToken = async (): Promise<Result<string, AuthError | NetworkError>> => {
    // getIDToken throws an opaque error when these are absent; check first for an actionable message.
    if (!process.env['ACTIONS_ID_TOKEN_REQUEST_URL'] || !process.env['ACTIONS_ID_TOKEN_REQUEST_TOKEN']) {
      return Result.err(
        new AuthError({
          message: 'GitHub OIDC is unavailable — the Github Action workflow must grant `permissions: id-token: write`',
        }),
      )
    }

    try {
      console.log('Minting GitHub OIDC token')
      const token = await core.getIDToken(OIDC_AUDIENCE)
      console.log('GitHub OIDC token minted')
      return Result.ok(token)
    } catch (cause) {
      return Result.err(new NetworkError({ message: `Failed to obtain GitHub OIDC token: ${errorToString(cause)}` }))
    }
  }

  // Only exists to satisfy the AuthService interface (the interactive `login` command needs it on the
  // Okta path). It is never reached for config commands in CI — those mint tokens via getAccessToken.
  const login = async (): Promise<Result<LoginResult, AuthError>> =>
    Result.err(
      new AuthError({
        message: 'Interactive login is not applicable in CI — GitHub OIDC tokens are minted on demand',
      }),
    )

  return {
    login,
    getAccessToken,
  }
}
