import { base64ToUint8, base64urlToBase64 } from '@universe/encoding'
import { Result } from 'better-result'
import { sleep } from 'utilities/src/time/timing'
import { AuthError, KeychainError, NetworkError, OktaError } from '../errors'
import { openBrowser } from '../lib/browser'
import { type Lock } from '../lib/lock/lock'
import { type KeychainService, type StoredTokens } from './keychain'
import type { OktaClient, TokenResponse } from './oktaClient'

// Refresh-in-advance window. Absorbs clock skew between the CLI host and Okta so we
// never send a token within seconds of its actual expiry.
const SOFT_TTL_BUFFER_MS = 60_000

const POLL_DELAY_SECONDS = 5
const POLL_TIMEOUT_SECONDS = 90

export interface OktaAuthServiceDeps {
  keychain: KeychainService
  okta: OktaClient
  lock: Lock
}

export function createOktaAuthService({ keychain, okta, lock }: OktaAuthServiceDeps) {
  /**
   * Run the full Okta Device Authorization flow interactively: request a device code, open the
   * browser, poll until the user completes verification, then persist the tokens to the keychain.
   */
  const login = async () => {
    const authResult = await okta.requestDeviceAuthorization()
    if (authResult.isErr()) {
      return Result.err(authResult.error)
    }
    const auth = authResult.value

    // Print code + URL before opening the browser so SSH/headless users can still copy them.
    console.log(`Opening browser to: ${auth.verification_uri}`)
    console.log(`Code: ${formatUserCode(auth.user_code)}`)
    console.log("If the browser didn't open, visit the URL above and enter the code manually.")
    console.log(`Waiting for up to ${POLL_TIMEOUT_SECONDS} seconds`)
    openBrowser(auth.verification_uri_complete)

    const tokensResult = await pollForToken({
      okta,
      deviceCode: auth.device_code,
      initialIntervalSeconds: auth.interval,
      expiresInSeconds: auth.expires_in,
    })
    if (tokensResult.isErr()) {
      return Result.err(tokensResult.error)
    }
    const tokens = tokensResult.value

    const emailResult = decodeEmailClaim(tokens.id_token)
    if (emailResult.isErr()) {
      return Result.err(emailResult.error)
    }
    const email = emailResult.value
    const expiry = Date.now() + tokens.expires_in * 1000
    console.log('Okta login successful, saving to keychain')

    const keychainData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiry,
      email,
    }
    const saved = await keychain.saveTokens(keychainData)
    if (saved.isErr()) {
      return Result.err(saved.error)
    }

    console.log('Keychain update successfully')
    return Result.ok(keychainData)
  }

  const getAccessToken = async () => {
    // First check if we have stored tokens
    const stored = await keychain.readTokens()

    if (stored.isOk()) {
      if (isFresh(stored.value)) {
        // Stored token is ready to use, return it
        return Result.ok(stored.value.accessToken)
      }

      console.log('Stored token is stale, refreshing')
      const refreshResult = await withKeychainRecheckFallback({
        lock,
        keychain,
        fn: () => refreshToken({ keychain, okta }),
        errMessage: 'Token refresh timed out and no tokens were found',
      })

      if (refreshResult.isOk()) {
        return Result.ok(refreshResult.value.accessToken)
      } else {
        console.log('Token refresh failed, proceeding to Okta login')
      }
    }

    // If we don't have stored tokens, we need to login
    const loginResult = await withKeychainRecheckFallback({
      lock,
      keychain,
      fn: login,
      errMessage: 'Login timed out and no tokens were found',
    })

    if (loginResult.isOk()) {
      return Result.ok(loginResult.value.accessToken)
    } else {
      return Result.err(new AuthError({ message: `Okta login failed: ${loginResult.error.message}` }))
    }
  }

  return {
    login,
    getAccessToken,
  }
}

async function withKeychainRecheckFallback<T>({
  lock,
  keychain,
  fn,
  errMessage,
}: {
  lock: Lock
  keychain: KeychainService
  fn: () => Promise<T>
  errMessage: string
}) {
  const result = await lock.withLock(fn)

  // Lock was acquired, check result
  if (result.isOk()) {
    return result.value
  }

  // Lock timed out, check keychain for a token
  console.warn('Lock timeout, checking keychain again')
  const reread = await keychain.readTokens()
  if (reread.isOk() && isFresh(reread.value)) {
    return Result.ok(reread.value)
  } else {
    return Result.err(new AuthError({ message: errMessage }))
  }
}

function isFresh(tokens: StoredTokens): boolean {
  return Date.now() < tokens.expiry - SOFT_TTL_BUFFER_MS
}

async function refreshToken({
  keychain,
  okta,
}: {
  keychain: KeychainService
  okta: OktaClient
}): Promise<Result<StoredTokens, AuthError | KeychainError | OktaError | NetworkError>> {
  // Check stored tokens again in case they were updated by another process while waiting for the lock
  const current = await keychain.readTokens()
  if (current.isErr()) {
    return Result.err(new AuthError({ message: 'Tokens disappeared while waiting for refresh lock' }))
  }
  if (isFresh(current.value)) {
    // Stored tokens are still fresh, return them
    return Result.ok(current.value)
  }

  const exchange = await okta.refreshToken(current.value.refreshToken)
  if (exchange.isErr()) {
    // invalid_grant = refresh token dead (7d inactivity or chain broken). Caller should re-login.
    if (exchange.error._tag === 'OktaError' && exchange.error.code === 'invalid_grant') {
      return Result.err(new AuthError({ message: 'Session expired' }))
    }
    return Result.err(exchange.error)
  }

  const { access_token, refresh_token, expires_in } = exchange.value
  const newExpiry = Date.now() + expires_in * 1000

  const keychainData = {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiry: newExpiry,
    email: current.value.email,
  }
  const saved = await keychain.saveTokens(keychainData)
  if (saved.isErr()) {
    return Result.err(saved.error)
  }

  return Result.ok(keychainData)
}

type PollOptions = {
  okta: OktaClient
  deviceCode: string
  initialIntervalSeconds: number
  expiresInSeconds: number
}

// RFC 8628 polling loop: wait `interval` and attempt to exchange the device code.
async function pollForToken({
  okta,
  deviceCode,
  initialIntervalSeconds,
  expiresInSeconds,
}: PollOptions): Promise<Result<TokenResponse, NetworkError | OktaError>> {
  const timeoutSeconds = Math.min(expiresInSeconds, POLL_TIMEOUT_SECONDS)
  const deadlineMs = Date.now() + timeoutSeconds * 1000
  let intervalSeconds = initialIntervalSeconds

  while (Date.now() < deadlineMs) {
    await sleep(intervalSeconds * 1000)
    const result = await okta.exchangeDeviceCode(deviceCode)
    if (result.isOk()) {
      return result
    }
    const error = result.error
    if (error._tag === 'OktaError') {
      if (error.code === 'authorization_pending') {
        continue
      }
      if (error.code === 'slow_down') {
        intervalSeconds += POLL_DELAY_SECONDS
        continue
      }
    }
    return Result.err(error)
  }

  return Result.err(
    new OktaError({
      code: 'expired_token',
      message: `Authentication not completed within ${timeoutSeconds}s`,
    }),
  )
}

// Insert a hyphen mid-code for copy accuracy: "ABCDEFGH" -> "ABCD-EFGH".
export function formatUserCode(code: string): string {
  if (code.length <= 4) {
    return code
  }
  const mid = Math.ceil(code.length / 2)
  return `${code.slice(0, mid)}-${code.slice(mid)}`
}

// Decode the JWT payload to extract `email`. No signature verification needed —
// the token came over HTTPS from the Okta endpoint we just hit.
export function decodeEmailClaim(idToken: string): Result<string, OktaError> {
  const parts = idToken.split('.')
  const payloadB64 = parts[1]
  if (parts.length < 2 || !payloadB64) {
    return Result.err(new OktaError({ code: 'invalid_id_token', message: 'Invalid id_token format' }))
  }
  let claims: { email?: string }
  try {
    claims = JSON.parse(new TextDecoder().decode(base64ToUint8(base64urlToBase64(payloadB64)))) as {
      email?: string
    }
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return Result.err(new OktaError({ code: 'invalid_id_token', message: `Could not decode id_token: ${message}` }))
  }
  if (!claims.email) {
    return Result.err(new OktaError({ code: 'invalid_id_token', message: 'id_token is missing email claim' }))
  }
  return Result.ok(claims.email)
}
