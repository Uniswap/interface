import { Result } from 'better-result'
import { OKTA_CLIENT_ID, OKTA_DEVICE_AUTH_URL, OKTA_REVOKE_URL, OKTA_SCOPES, OKTA_TOKEN_URL } from '../consts'
import { NetworkError, OktaError } from '../errors'

export type DeviceAuthorization = {
  device_code: string
  user_code: string
  verification_uri: string
  verification_uri_complete: string
  expires_in: number
  interval: number
}

export type TokenResponse = {
  access_token: string
  refresh_token: string
  id_token: string
  expires_in: number
  token_type: 'Bearer'
  scope: string
}

export type OktaClient = ReturnType<typeof createOktaClient>

export function createOktaClient() {
  return {
    requestDeviceAuthorization: () =>
      postForm<DeviceAuthorization>({
        url: OKTA_DEVICE_AUTH_URL,
        body: { client_id: OKTA_CLIENT_ID, scope: OKTA_SCOPES },
      }),

    exchangeDeviceCode: (deviceCode: string) =>
      postForm<TokenResponse>({
        url: OKTA_TOKEN_URL,
        body: {
          client_id: OKTA_CLIENT_ID,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: deviceCode,
        },
      }),

    refreshToken: (refreshToken: string) =>
      postForm<TokenResponse>({
        url: OKTA_TOKEN_URL,
        body: {
          client_id: OKTA_CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
      }),

    revokeToken: async (
      token: string,
      hint: 'access_token' | 'refresh_token',
    ): Promise<Result<void, NetworkError | OktaError>> => {
      // RFC 7009: /revoke returns 200 with an empty body on success — skip body parsing.
      const result = await postForm<unknown>({
        url: OKTA_REVOKE_URL,
        body: { client_id: OKTA_CLIENT_ID, token, token_type_hint: hint },
        skipBody: true,
      })
      return result.map(() => undefined)
    },
  }
}

type OktaErrorResponse = { error: string; error_description?: string }

async function postForm<T>({
  url,
  body,
  skipBody = false,
}: {
  url: string
  body: Record<string, string>
  /**
   * Skip body parsing on 2xx
   * Used for endpoints that return an empty on success (e.g. /revoke per RFC 7009)
   */
  skipBody?: boolean
}): Promise<Result<T, NetworkError | OktaError>> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams(body).toString(),
    })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    return Result.err(new NetworkError({ message }))
  }

  if (skipBody && response.ok) {
    return Result.ok(undefined as T)
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    return Result.err(new OktaError({ code: 'invalid_response', message: `Non-JSON response from ${url}` }))
  }

  if (!response.ok) {
    const err = json as Partial<OktaErrorResponse>
    return Result.err(
      new OktaError({
        code: err.error ?? 'unknown_error',
        message: err.error_description ?? err.error ?? 'Unknown error',
      }),
    )
  }

  return Result.ok(json as T)
}
