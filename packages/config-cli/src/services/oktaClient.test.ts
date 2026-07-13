import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OKTA_CLIENT_ID, OKTA_DEVICE_AUTH_URL, OKTA_REVOKE_URL, OKTA_SCOPES, OKTA_TOKEN_URL } from '../consts'
import { OktaError } from '../errors'
import { createOktaClient, type DeviceAuthorization, type TokenResponse } from './oktaClient'

const mockFetch = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

// Pull the request body off the most recent fetch call as a plain {key: value} dict.
const lastRequestBody = (): Record<string, string> => {
  const init = mockFetch.mock.calls.at(-1)?.[1] as RequestInit | undefined
  return Object.fromEntries(new URLSearchParams(String(init?.body ?? '')))
}

const lastRequestUrl = (): string => String(mockFetch.mock.calls.at(-1)?.[0] ?? '')

const deviceAuth: DeviceAuthorization = {
  device_code: 'dev-code',
  user_code: 'ABCD-1234',
  verification_uri: 'https://login.uniswap.org/activate',
  verification_uri_complete: 'https://login.uniswap.org/activate?user_code=ABCD1234',
  expires_in: 600,
  interval: 5,
}

const tokens: TokenResponse = {
  access_token: 'at',
  refresh_token: 'rt',
  id_token: 'id',
  expires_in: 3600,
  token_type: 'Bearer',
  scope: 'openid profile email groups offline_access',
}

describe('okta.requestDeviceAuthorization', () => {
  it('POSTs to the device authorize endpoint with client_id + scope and parses the response', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, deviceAuth))
    const client = createOktaClient()

    const result = await client.requestDeviceAuthorization()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual(deviceAuth)
    }
    expect(lastRequestUrl()).toBe(OKTA_DEVICE_AUTH_URL)
    expect(mockFetch.mock.calls[0]?.[1]?.method).toBe('POST')
    expect(lastRequestBody()).toEqual({ client_id: OKTA_CLIENT_ID, scope: OKTA_SCOPES })
  })
})

describe('okta.exchangeDeviceCode', () => {
  it('POSTs to /token with the device-code grant and returns the parsed tokens', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, tokens))
    const client = createOktaClient()

    const result = await client.exchangeDeviceCode('dev-code')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual(tokens)
    }
    expect(lastRequestUrl()).toBe(OKTA_TOKEN_URL)
    expect(lastRequestBody()).toEqual({
      client_id: OKTA_CLIENT_ID,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      device_code: 'dev-code',
    })
  })

  it('maps an Okta error response to OktaError with the upstream code + description', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(400, { error: 'authorization_pending', error_description: 'still waiting' }),
    )
    const client = createOktaClient()

    const result = await client.exchangeDeviceCode('dev-code')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      const isOktaError = OktaError.is(result.error)
      expect(isOktaError).toBe(true)
      if (isOktaError) {
        expect(result.error.code).toBe('authorization_pending')
      }
      expect(result.error.message).toBe('still waiting')
    }
  })

  it('falls back to error code as the message when error_description is absent', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(400, { error: 'slow_down' }))
    const client = createOktaClient()

    const result = await client.exchangeDeviceCode('dev-code')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      const isOktaError = OktaError.is(result.error)
      expect(isOktaError).toBe(true)
      if (isOktaError) {
        expect(result.error.code).toBe('slow_down')
      }
      expect(result.error.message).toBe('slow_down')
    }
  })
})

describe('okta.refreshToken', () => {
  it('POSTs to /token with the refresh-token grant', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, tokens))
    const client = createOktaClient()

    const result = await client.refreshToken('rt-old')

    expect(result.isOk()).toBe(true)
    expect(lastRequestUrl()).toBe(OKTA_TOKEN_URL)
    expect(lastRequestBody()).toEqual({
      client_id: OKTA_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: 'rt-old',
    })
  })
})

describe('okta.revokeToken', () => {
  it('POSTs to /revoke and returns ok on a 200 with an empty body (per RFC 7009)', async () => {
    // Real Okta returns 200 with Content-Length: 0 on successful revocation. We MUST
    // not try to JSON-parse it — doing so was a regression that turned every successful
    // revoke into an `invalid_response` OktaError.
    mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }))
    const client = createOktaClient()

    const result = await client.revokeToken('the-token', 'refresh_token')

    expect(result.isOk()).toBe(true)
    expect(lastRequestUrl()).toBe(OKTA_REVOKE_URL)
    expect(lastRequestBody()).toEqual({
      client_id: OKTA_CLIENT_ID,
      token: 'the-token',
      token_type_hint: 'refresh_token',
    })
  })

  it('still parses an error body on a non-2xx revoke response', async () => {
    // Okta returns 401 if the client_id is wrong, with a JSON error body. We want the
    // structured OktaError, not a fall-through to invalid_response.
    mockFetch.mockResolvedValueOnce(jsonResponse(401, { error: 'invalid_client', error_description: 'Bad client' }))
    const client = createOktaClient()

    const result = await client.revokeToken('the-token', 'refresh_token')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      const isOktaError = OktaError.is(result.error)
      expect(isOktaError).toBe(true)
      if (isOktaError) {
        expect(result.error.code).toBe('invalid_client')
      }
      expect(result.error.message).toBe('Bad client')
    }
  })
})

describe('okta postForm error handling', () => {
  it('wraps a thrown fetch in NetworkError with the original message', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const client = createOktaClient()

    const result = await client.requestDeviceAuthorization()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('NetworkError')
      expect(result.error.message).toBe('ECONNREFUSED')
    }
  })

  it('returns OktaError(invalid_response) when the body is not JSON', async () => {
    mockFetch.mockResolvedValueOnce(new Response('<html>upstream error</html>', { status: 200 }))
    const client = createOktaClient()

    const result = await client.requestDeviceAuthorization()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      const isOktaError = OktaError.is(result.error)
      expect(isOktaError).toBe(true)
      if (isOktaError) {
        expect(result.error.code).toBe('invalid_response')
      }
    }
  })

  it('sends form-encoded bodies with the right Content-Type', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, deviceAuth))
    const client = createOktaClient()

    await client.requestDeviceAuthorization()

    const init = mockFetch.mock.calls[0]?.[1]
    const headers = init?.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(headers['Accept']).toBe('application/json')
    expect(typeof init?.body).toBe('string')
  })
})
