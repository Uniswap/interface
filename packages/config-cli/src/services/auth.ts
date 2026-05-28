import { homedir } from 'node:os'
import { join } from 'node:path'
import { Result } from 'better-result'
import { AuthError, KeychainError, LockError, NetworkError, OktaError } from '../errors'
import { createLock, type Lock } from '../lib/lock/lock'
import { createFileStorage } from '../lib/storage/fileStorage'
import { type KeychainService, type StoredTokens } from './keychain'
import type { OktaClient } from './okta'

// Refresh-in-advance window. Absorbs clock skew between the CLI host and Okta so we
// never send a token within seconds of its actual expiry.
const SOFT_TTL_BUFFER_MS = 60_000

const LOCK_TIMEOUT_MS = 30_000

const DEFAULT_LOCK_DIR = join(homedir(), '.config-cli')
const DEFAULT_LOCK_KEY = 'refresh.lock'

export type AuthServiceDeps = {
  keychain: KeychainService
  okta: OktaClient
  /** Override for tests. Defaults to a file lock at ~/.config-cli/refresh.lock. */
  lock?: Lock
}

export type AuthService = ReturnType<typeof createAuthService>

export function createAuthService({ keychain, okta, lock = defaultLock() }: AuthServiceDeps) {
  return {
    /** Returns a non-expired access token, refreshing under the lock if needed. */
    async getValidAccessToken(): Promise<
      Result<string, AuthError | KeychainError | OktaError | NetworkError | LockError>
    > {
      const stored = await keychain.readTokens()
      if (stored.isErr()) {
        return Result.err(new AuthError({ message: 'Not logged in — run `login` to authenticate' }))
      }
      if (isFresh(stored.value)) {
        return Result.ok(stored.value.accessToken)
      }
      return lockAndRefresh({ keychain, okta, lock, force: false })
    },

    /**
     * Force a refresh regardless of the TTL check
     */
    async forceRefresh(): Promise<Result<string, AuthError | KeychainError | OktaError | NetworkError | LockError>> {
      return lockAndRefresh({ keychain, okta, lock, force: true })
    },
  }
}

function defaultLock(): Lock {
  return createLock({
    storage: createFileStorage({ baseDir: DEFAULT_LOCK_DIR }),
    key: DEFAULT_LOCK_KEY,
    timeoutMs: LOCK_TIMEOUT_MS,
  })
}

function isFresh(tokens: StoredTokens): boolean {
  return Date.now() < tokens.expiry - SOFT_TTL_BUFFER_MS
}

async function lockAndRefresh({
  keychain,
  okta,
  lock,
  force,
}: {
  keychain: KeychainService
  okta: OktaClient
  lock: Lock
  force: boolean
}): Promise<Result<string, AuthError | KeychainError | OktaError | NetworkError | LockError>> {
  // withLock wraps the inner Result in its own Result — unwrap one layer.
  const refreshed = await lock.withLock(() => refreshUnderLock({ keychain, okta, force }))
  if (refreshed.isOk()) {
    return refreshed.value
  }
  // On lock timeout, a peer process was likely refreshing during our wait — re-read once
  // and return the fresh token if available.
  const reread = await keychain.readTokens()
  if (reread.isOk() && isFresh(reread.value)) {
    return Result.ok(reread.value.accessToken)
  }
  return Result.err(refreshed.error)
}

async function refreshUnderLock({
  keychain,
  okta,
  force,
}: {
  keychain: KeychainService
  okta: OktaClient
  force: boolean
}): Promise<Result<string, AuthError | KeychainError | OktaError | NetworkError>> {
  const reread = await keychain.readTokens()
  if (reread.isErr()) {
    return Result.err(new AuthError({ message: 'Tokens disappeared while waiting for refresh lock' }))
  }
  if (!force && isFresh(reread.value)) {
    return Result.ok(reread.value.accessToken)
  }

  const exchange = await okta.refreshToken(reread.value.refreshToken)
  if (exchange.isErr()) {
    // invalid_grant = refresh token dead (7d inactivity or chain broken). Caller should re-login.
    if (exchange.error._tag === 'OktaError' && exchange.error.code === 'invalid_grant') {
      return Result.err(new AuthError({ message: 'Session expired — run `login` to authenticate again' }))
    }
    return Result.err(exchange.error)
  }

  const { access_token, refresh_token, expires_in } = exchange.value
  const newExpiry = Date.now() + expires_in * 1000

  // Persist rotated tokens BEFORE returning. Otherwise we'd hand back an access token
  // whose refresh_token is already gone on Okta's side — locking ourselves out of future refreshes.
  const saved = await keychain.saveTokens({
    accessToken: access_token,
    refreshToken: refresh_token,
    expiry: newExpiry,
    email: reread.value.email,
  })
  if (saved.isErr()) {
    return Result.err(saved.error)
  }

  return Result.ok(access_token)
}
