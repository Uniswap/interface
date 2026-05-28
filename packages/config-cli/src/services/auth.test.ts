import { Result } from 'better-result'
import { ONE_HOUR_MS } from 'utilities/src/time/time'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { KeychainError, NetworkError, OktaError } from '../errors'
import type { Lock } from '../lib/lock/lock'
import { createAuthService } from './auth'
import type { KeychainService, StoredTokens } from './keychain'
import type { OktaClient, TokenResponse } from './okta'

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

// Default test lock: passes through to fn without serialization. Tests that exercise
// lock-specific behavior (timeout, contention) supply their own.
const passthroughLock: Lock = {
  withLock: async (fn) => Result.ok(await fn()),
}

let okta: OktaClient
let keychain: KeychainService

beforeEach(() => {
  okta = makeOkta()
  keychain = makeKeychain()
})

describe('auth.getValidAccessToken — happy paths', () => {
  it('returns the stored access token without refreshing when fresh', async () => {
    const auth = createAuthService({ keychain, okta, lock: passthroughLock })

    const result = await auth.getValidAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-old')
    }
    expect(okta.refreshToken).not.toHaveBeenCalled()
  })

  it('refreshes when the access token is within the soft-TTL buffer', async () => {
    // expiry only 10s away → inside the 60s buffer → counts as stale
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() + 10_000 }))) })

    const auth = createAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getValidAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-new')
    }
    expect(okta.refreshToken).toHaveBeenCalledWith('rt-old')
  })

  it('persists rotated tokens to the keychain before returning the new access token', async () => {
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() - 1000 }))) })
    const auth = createAuthService({ keychain, okta, lock: passthroughLock })

    await auth.getValidAccessToken()

    expect(keychain.saveTokens).toHaveBeenCalledWith({
      accessToken: 'at-new',
      refreshToken: 'rt-new',
      expiry: expect.any(Number),
      email: 'jane@uniswap.org',
    })
  })
})

describe('auth.getValidAccessToken — concurrent refresh handling', () => {
  it('re-reads the keychain inside the lock and skips refresh if another process already refreshed', async () => {
    // First read: stale token. Second read (inside the lock): fresh, simulating another
    // process refreshing while we were waiting on the file lock.
    let readCount = 0
    keychain = makeKeychain({
      readTokens: vi.fn(async () => {
        readCount += 1
        return readCount === 1
          ? Result.ok(tokens({ expiry: Date.now() - 1000 }))
          : Result.ok(tokens({ accessToken: 'at-refreshed-by-peer', expiry: Date.now() + ONE_HOUR_MS }))
      }),
    })

    const auth = createAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getValidAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-refreshed-by-peer')
    }
    expect(okta.refreshToken).not.toHaveBeenCalled()
    expect(keychain.saveTokens).not.toHaveBeenCalled()
  })
})

describe('auth.getValidAccessToken — error paths', () => {
  it('returns AuthError when the keychain has no tokens', async () => {
    keychain = makeKeychain({
      readTokens: vi.fn(async () => Result.err(new KeychainError({ message: 'item could not be found' }))),
    })

    const auth = createAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getValidAccessToken()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('AuthError')
      expect(result.error.message).toContain('Not logged in')
    }
    expect(okta.refreshToken).not.toHaveBeenCalled()
  })

  it('translates invalid_grant on refresh into AuthError("Session expired")', async () => {
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() - 1000 }))) })
    okta = makeOkta({
      refreshToken: vi.fn(async () => Result.err(new OktaError({ code: 'invalid_grant', message: 'expired' }))),
    })

    const auth = createAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getValidAccessToken()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('AuthError')
      expect(result.error.message).toContain('Session expired')
    }
  })

  it('propagates non-invalid_grant OktaErrors unchanged', async () => {
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() - 1000 }))) })
    okta = makeOkta({
      refreshToken: vi.fn(async () => Result.err(new OktaError({ code: 'server_error', message: 'okta down' }))),
    })

    const auth = createAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getValidAccessToken()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('OktaError')
    }
  })

  it('propagates a keychain saveTokens failure after a successful refresh', async () => {
    keychain = makeKeychain({
      readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() - 1000 }))),
      saveTokens: vi.fn(async () => Result.err(new KeychainError({ message: 'disk full' }))),
    })

    const auth = createAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getValidAccessToken()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('KeychainError')
      expect(result.error.message).toBe('disk full')
    }
  })

  it('returns LockError when the lock cannot be acquired AND no peer refresh occurred', async () => {
    // Both reads (initial + post-timeout fallback) return the same stale token.
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() - 1000 }))) })
    const failingLock: Lock = {
      withLock: async () => Result.err({ _tag: 'LockError', message: 'timeout' } as never),
    }

    const auth = createAuthService({ keychain, okta, lock: failingLock })
    const result = await auth.getValidAccessToken()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('LockError')
    }
    expect(okta.refreshToken).not.toHaveBeenCalled()
  })

  it('falls back to the keychain after a lock timeout if a peer process refreshed during the wait', async () => {
    // Initial read: stale (triggers the refresh path). Post-timeout re-read: fresh,
    // simulating a peer that refreshed while we were blocked on the lock.
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

    const auth = createAuthService({ keychain, okta, lock: failingLock })
    const result = await auth.getValidAccessToken()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-peer-refreshed')
    }
    expect(okta.refreshToken).not.toHaveBeenCalled()
  })
})

describe('auth.getValidAccessToken — network error', () => {
  it('propagates NetworkError without retrying', async () => {
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() - 1000 }))) })
    okta = makeOkta({
      refreshToken: vi.fn(async () => Result.err(new NetworkError({ message: 'offline' }))),
    })

    const auth = createAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.getValidAccessToken()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('NetworkError')
    }
    expect(okta.refreshToken).toHaveBeenCalledTimes(1)
  })
})

describe('auth.forceRefresh', () => {
  it('refreshes even when the stored token is locally fresh (for the 401-from-API case)', async () => {
    // Stored token is far from expiring per the soft-TTL check, so getValidAccessToken
    // would NOT refresh. forceRefresh must refresh anyway.
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() + ONE_HOUR_MS }))) })

    const auth = createAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.forceRefresh()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('at-new')
    }
    expect(okta.refreshToken).toHaveBeenCalledWith('rt-old')
    expect(keychain.saveTokens).toHaveBeenCalled()
  })

  it('returns AuthError("Session expired") on invalid_grant', async () => {
    keychain = makeKeychain({ readTokens: vi.fn(async () => Result.ok(tokens({ expiry: Date.now() + ONE_HOUR_MS }))) })
    okta = makeOkta({
      refreshToken: vi.fn(async () => Result.err(new OktaError({ code: 'invalid_grant', message: 'expired' }))),
    })

    const auth = createAuthService({ keychain, okta, lock: passthroughLock })
    const result = await auth.forceRefresh()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error._tag).toBe('AuthError')
      expect(result.error.message).toContain('Session expired')
    }
  })
})
