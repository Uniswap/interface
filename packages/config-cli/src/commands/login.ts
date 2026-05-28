import { base64ToUint8, base64urlToBase64 } from '@universe/encoding'
import { Result } from 'better-result'
import { Cli } from 'incur'
import { sleep } from 'utilities/src/time/timing'
import { NetworkError, OktaError, unwrap } from '../errors'
import { openBrowser } from '../lib/browser'
import type { OktaClient, TokenResponse } from '../services/okta'
import { vars } from '../vars'

const SLOW_DOWN_BUMP_SECONDS = 5
const POLL_TIMEOUT_SECONDS = 180

export const login = Cli.create('login', {
  description: 'Authenticate via Okta Device Authorization Flow.',
  async run(c) {
    const { okta, keychain } = vars(c)

    const auth = await unwrap(okta.requestDeviceAuthorization())

    // Print code + URL before opening the browser so SSH/headless users can still copy them.
    console.log(`Opening browser to: ${auth.verification_uri}`)
    console.log(`Code: ${formatUserCode(auth.user_code)}`)
    console.log("If the browser didn't open, visit the URL above and enter the code manually.")
    openBrowser(auth.verification_uri_complete)

    const tokens = await unwrap(
      pollForToken({
        okta,
        deviceCode: auth.device_code,
        initialIntervalSeconds: auth.interval,
        expiresInSeconds: auth.expires_in,
      }),
    )

    const email = await unwrap(decodeEmailClaim(tokens.id_token))
    const expiry = Date.now() + tokens.expires_in * 1000

    await unwrap(
      keychain.saveTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiry,
        email,
      }),
    )

    return { email, expiresAt: new Date(expiry).toISOString() }
  },
})

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
        intervalSeconds += SLOW_DOWN_BUMP_SECONDS
        continue
      }
    }
    return Result.err(error)
  }

  return Result.err(
    new OktaError({
      code: 'expired_token',
      message: `Authentication not completed within ${timeoutSeconds}s — please try again`,
    }),
  )
}

// Insert a hyphen mid-code for copy accuracy: "ABCDEFGH" -> "ABCD-EFGH".
function formatUserCode(code: string): string {
  if (code.length <= 4) {
    return code
  }
  const mid = Math.ceil(code.length / 2)
  return `${code.slice(0, mid)}-${code.slice(mid)}`
}

// Decode the JWT payload to extract `email`. No signature verification needed —
// the token came over HTTPS from the Okta endpoint we just hit.
function decodeEmailClaim(idToken: string): Result<string, OktaError> {
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
