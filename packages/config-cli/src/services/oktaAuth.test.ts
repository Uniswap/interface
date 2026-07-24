import { Result } from 'better-result'
import { ONE_HOUR_MS } from 'utilities/src/time/time'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KeychainError, NetworkError, OktaError } from '../errors'
import { openBrowser } from '../lib/browser'
import type { Lock } from '../lib/lock/lock'
import type { KeychainService, StoredTokens } from './keychain'
import { createOktaAuthService, decodeEmailClaim, formatUserCode } from './oktaAuth'
import type { OktaClient, TokenResponse } from './oktaClient'

vi.mock('utilities/src/time/timing', () => ({ sleep: vi.fn(async () => undefined) }))
vi.mock('../lib/browser', () => ({ openBrowser: vi.fn() }))

const tokens = (overrides: Partial<StoredTokens> = {}): StoredTokens => ({
  accessToken: 'at-old',
  refreshToken: 'rt-old',
  expiry: Date.now() + ONE_HOUR_MS,
  email: 'jane@uniswap.org',
  ...overrides,
})

const tokenResponse = (overrides: Partial<TokenResponse> = {}): TokenResponse => ({
  access_token: 'at-new',
  refresh_token: 'rt-new',
  id_token: 'id-new',
  expires_in: 3600,
  token_type: 'Bearer',
  scope: 'openid profile email groups offline_access',
  ...overrides,
})

const idTokenWithEmail = 'header.eyJlbWFpbCI6ImphbmVAdW5pc3dhcC5vcmcifQ.signature'
const idTokenWithoutEmail = 'header.eyJzdWIiOiIwMHUxMjMifQ.signature'

const makeKeychain = (overrides: Partial<KeychainService> = {}): KeychainService => ({
  saveTokens: vi.fn(async () => Result.ok(undefined)),
  readTokens: vi.fn(async () => Result.ok(tokens())),
  clearTokens: vi.fn(async () => Result.ok(undefined)),
  ...overrides,
})

const makeOkta = (overrides: Partial<OktaClient> = {}): OktaClient => ({
  requestDeviceAuthorization: vi.fn(),
  exchangeDeviceCode: vi.fn(),
  refreshToken: vi.fn(async () => Result.ok(tokenResponse())),
  revokeToken: vi.fn(),
  ...overrides,
})

const passthroughLock: Lock = {
  withLock: async (fn) => Result.ok(await fn()),
}

function mockSuccessfulDeviceFlow(): Partial<OktaClient> {
  return {
    requestDeviceAuthorization: vi.fn(async () =>
      Result.ok({
        device_code: 'dev-code',
        user_code: 'ABCDEFGH',
        verification_uri: 'https://login.uniswap.org/activate',
        verification_uri_complete: 'https://login.uniswap.org/activate?user_code=ABCDEFGH',
        expires_in: 600,
        interval: 5,
      }),
    ),
    exchangeDeviceCode: vi.fn(async () => Result.ok(tokenResponse({ id_token: idTokenWithEmail }))),
  }
}

let okta: OktaClient
let keychain: KeychainService

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  okta = makeOkta()
  keychain = makeKeychain()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('formatUserCode', () => {
  it('inserts a hyphen in the middle of longer codes', () => {
    expect(formatUserCode('ABCDEFGH')).toBe('ABCD-EFGH')
  })

  it('returns short codes unchanged', () => {
    expect(formatUserCode('ABCD')).toBe('ABCD')
  })
})

describe('decodeEmailClaim', () => {
  it('returns the email claim from a valid id_token payload', () => {
    const result = decodeEmailClaim(idTokenWithEmail)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('jane@uniswap.org')
    }
  })

  it('returns OktaError when the id_token payload is missing email', () => {
    const result = decodeEmailClaim(idTokenWithoutEmail)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('OktaError')
      expect(result.error.message).toBe('id_token is missing email claim')
    }
  })
})

describe('oktaAuth.login', () => {
  it('runs the device authorization flow, saves tokens, and returns stored token metadata', async () => {
    okta = makeOkta(mockSuccessfulDeviceFlow())
    const auth = createOktaAuthService({ keychain, okta, lock: passthroughLock })

    const result = await auth.login()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.email).toBe('jane@uniswap.org')
      expect(result.value.accessToken).toBe('at-new')
      expect(result.value.expiry).toEqual(expect.any(Number))
    }
    expect(openBrowser).toHaveBeenCalledWith('https://login.uniswap.org/activate?user_code=ABCDEFGH')
    expect(okta.exchangeDeviceCode).toHaveBeenCalledWith('dev-code')
    expect(keychain.saveTokens).toHaveBeenCalledWith({
      accessToken: 'at-new',
      refreshToken: 'rt-new',
      expiry: expect.any(Number),
      email: 'jane@uniswap.org',
    })
  })

  it('returns OktaError when the id_token cannot be decoded', async () => {
    okta = makeOkta({
      ...mockSuccessfulDeviceFlow(),
      exchangeDeviceCode: vi.fn(async () => Result.ok(tokenResponse({ id_token: 'not-a-jwt' }))),
    })
    const auth = createOktaAuthService({ keychain, okta, lock: passthroughLock })

    const result = await auth.login()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('OktaError')
      if (result.error._tag === 'OktaError') {
        expect(result.error.code).toBe('invalid_id_token')
      }
    }
    expect(keychain.saveTokens).not.toHaveBeenCalled()
  })
})

describe('oktaAuth.getAccessToken', () => {
  it('returns the stored access token without refreshing when fresh', async () => {
    const auth = createOktaAuthService({ keychain, okta, lock: passthroughLock })

    const result = await auth.getAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-old')
    }
    expect(okta.refreshToken).not.toHaveBeenCalled()
  })

  it('refreshes when the access token is within the soft-TTL buffer', async () => {
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() + 10_000 }))) })

    const auth = createOktaAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-new')
    }
    expect(okta.refreshToken).toHaveBeenCalledWith('rt-old')
  })

  it('persists rotated tokens to the keychain before returning the new access token', async () => {
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() - 1000 }))) })
    const auth = createOktaAuthService({ keychain, okta, lock: passthroughLock })

    await auth.getAccessToken()

    expect(keychain.saveTokens).toHaveBeenCalledWith({
      accessToken: 'at-new',
      refreshToken: 'rt-new',
      expiry: expect.any(Number),
      email: 'jane@uniswap.org',
    })
  })

  it('re-reads the keychain inside the lock and skips refresh if another process already refreshed', async () => {
    let readCount = 0
    keychain = makeKeychain({
      readTokens: vi.fn(async () => {
        readCount += 1
        return readCount === 1
          ? Result.ok(tokens({ expiry: Date.now() - 1000 }))
          : Result.ok(tokens({ accessToken: 'at-refreshed-by-peer', expiry: Date.now() + ONE_HOUR_MS }))
      }),
    })

    const auth = createOktaAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-refreshed-by-peer')
    }
    expect(okta.refreshToken).not.toHaveBeenCalled()
    expect(keychain.saveTokens).not.toHaveBeenCalled()
  })

  it('runs login when the keychain has no tokens', async () => {
    keychain = makeKeychain({
      readTokens: vi.fn(async () => Result.err(new KeychainError({ message: 'item could not be found' }))),
    })
    okta = makeOkta(mockSuccessfulDeviceFlow())

    const auth = createOktaAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-new')
    }
    expect(okta.requestDeviceAuthorization).toHaveBeenCalled()
  })

  it('runs login when refresh returns invalid_grant', async () => {
    let readCount = 0
    keychain = makeKeychain({
      readTokens: vi.fn(async () => {
        readCount += 1
        return readCount <= 2
          ? Result.ok(tokens({ expiry: Date.now() - 1000 }))
          : Result.err(new KeychainError({ message: 'pre-login read should not be used' }))
      }),
    })
    okta = makeOkta({
      ...mockSuccessfulDeviceFlow(),
      refreshToken: vi.fn(async () => Result.err(new OktaError({ code: 'invalid_grant', message: 'expired' }))),
    })

    const auth = createOktaAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-new')
    }
    expect(okta.requestDeviceAuthorization).toHaveBeenCalled()
  })

  it('propagates a keychain saveTokens failure after a successful refresh', async () => {
    keychain = makeKeychain({
      readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() - 1000 }))),
      saveTokens: vi.fn(async () => Result.err(new KeychainError({ message: 'disk full' }))),
    })
    okta = makeOkta(mockSuccessfulDeviceFlow())

    const auth = createOktaAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getAccessToken()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('AuthError')
      expect(result.error.message).toContain('Okta login failed: disk full')
    }
  })

  it('returns AuthError when the lock times out and no peer refresh occurred', async () => {
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() - 1000 }))) })
    const failingLock: Lock = {
      withLock: async () => Result.err({ _tag: 'LockError', message: 'timeout' } as never),
    }

    const auth = createOktaAuthService({ keychain, okta, lock: failingLock })
    const result = await auth.getAccessToken()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('AuthError')
      expect(result.error.message).toContain('Okta login failed: Login timed out and no tokens were found')
    }
    expect(okta.refreshToken).not.toHaveBeenCalled()
  })

  it('falls back to the keychain after a lock timeout if a peer process refreshed during the wait', async () => {
    let readCount = 0
    keychain = makeKeychain({
      readTokens: vi.fn(async () => {
        readCount += 1
        return readCount === 1
          ? Result.ok(tokens({ expiry: Date.now() - 1000 }))
          : Result.ok(tokens({ accessToken: 'at-peer-refreshed', expiry: Date.now() + ONE_HOUR_MS }))
      }),
    })
    const failingLock: Lock = {
      withLock: async () => Result.err({ _tag: 'LockError', message: 'timeout' } as never),
    }

    const auth = createOktaAuthService({ keychain, okta, lock: failingLock })
    const result = await auth.getAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-peer-refreshed')
    }
    expect(okta.refreshToken).not.toHaveBeenCalled()
  })

  it('runs login when refresh returns NetworkError', async () => {
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() - 1000 }))) })
    okta = makeOkta({
      ...mockSuccessfulDeviceFlow(),
      refreshToken: vi.fn(async () => Result.err(new NetworkError({ message: 'offline' }))),
    })

    const auth = createOktaAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-new')
    }
    expect(okta.refreshToken).toHaveBeenCalledTimes(1)
    expect(okta.requestDeviceAuthorization).toHaveBeenCalled()
  })
})
