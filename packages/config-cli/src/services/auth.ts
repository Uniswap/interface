import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Result } from 'better-result'
import type { AuthError, KeychainError, NetworkError, OktaError } from '../errors'
import { isCIEnv } from '../lib/env'
import { createLock, type Lock } from '../lib/lock/lock'
import { createFileStorage } from '../lib/storage/fileStorage'
import { createGithubOidcAuthService } from './githubAuth'
import { type KeychainService } from './keychain'
import { createOktaAuthService } from './oktaAuth'
import type { OktaClient } from './oktaClient'

const LOCK_TIMEOUT_MS = 30_000

const DEFAULT_LOCK_DIR = join(homedir(), '.config-cli')
const DEFAULT_LOCK_KEY = 'refresh.lock'

export interface LoginResult {
  email: string
  expiry: number
}

export interface AuthServiceDeps {
  keychain: KeychainService
  okta: OktaClient
  /** Override for tests. Defaults to a file lock at ~/.config-cli/refresh.lock. */
  lock?: Lock
  /** Override for tests. Defaults to detecting a CI environment via the `CI` env var. */
  isCIEnvFn?: () => boolean
}

export interface AuthService {
  login: () => Promise<Result<LoginResult, AuthError | KeychainError | NetworkError | OktaError>>
  getAccessToken: () => Promise<Result<string, AuthError | KeychainError | NetworkError | OktaError>>
}

export function createAuthService({
  keychain,
  okta,
  lock = defaultLock(),
  isCIEnvFn = isCIEnv,
}: AuthServiceDeps): AuthService {
  return isCIEnvFn() ? createGithubOidcAuthService() : createOktaAuthService({ keychain, okta, lock })
}

function defaultLock(): Lock {
  return createLock({
    storage: createFileStorage({ baseDir: DEFAULT_LOCK_DIR }),
    key: DEFAULT_LOCK_KEY,
    timeoutMs: LOCK_TIMEOUT_MS,
  })
}
