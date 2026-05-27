import { Result } from 'better-result'
import { z } from 'incur'
import { chunkString } from 'utilities/src/primitives/string'
import { KeychainError } from '../errors'
import { switchOS } from '../lib/os'
import type { Storage } from '../lib/storage/types'

// `security` groups items by service name. Scoping to the Okta issuer leaves room for
// future tenants (e.g. a staging issuer) to coexist without clobbering each other.
export const KEYCHAIN_SERVICE = `uniswap:config-cli:okta`

export const KEYCHAIN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  EXPIRY: 'expiry',
  EMAIL: 'email',
} as const

// `security add-generic-password -w` (without an inline value) reads the password from
// stdin into a fixed 128-byte buffer inside readpassphrase(). Okta access tokens routinely
// exceed that limit (~900 chars), so we split them into chunks safely under the buffer
// cap and store each chunk under a suffixed key. 120 leaves a few bytes of headroom for
// the trailing newline plus null terminator.
export const ACCESS_TOKEN_CHUNK_SIZE = 120
export const ACCESS_TOKEN_COUNT_KEY = `${KEYCHAIN_KEYS.ACCESS_TOKEN}_count`
export const accessTokenChunkKey = (index: number): string => `${KEYCHAIN_KEYS.ACCESS_TOKEN}_${index}`

/**
 * Shape of tokens stored in the OS keychain. Used both to validate inputs to `saveTokens`
 * and outputs from `readTokens` — a single source of truth catches mismatches at either
 * end (e.g. partial writes, corrupted reads, schema drift after a future change).
 */
export const StoredTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiry: z.int().positive(),
  email: z.email().min(1),
})

export type StoredTokens = z.infer<typeof StoredTokensSchema>

export type KeychainService = ReturnType<typeof createKeychainService>

export function createKeychainService(storage: KeyStorage = getKeyStorage()) {
  return {
    async saveTokens(tokens: StoredTokens): Promise<Result<void, KeychainError>> {
      const parsed = StoredTokensSchema.safeParse(tokens)
      if (!parsed.success) {
        return Result.err(new KeychainError({ message: `Invalid tokens: ${parsed.error.message}` }))
      }
      const writes: Array<[key: string, value: string]> = [
        [KEYCHAIN_KEYS.ACCESS_TOKEN, parsed.data.accessToken],
        [KEYCHAIN_KEYS.REFRESH_TOKEN, parsed.data.refreshToken],
        [KEYCHAIN_KEYS.EXPIRY, String(parsed.data.expiry)],
        [KEYCHAIN_KEYS.EMAIL, parsed.data.email],
      ]
      for (const [key, value] of writes) {
        const result = await storage.set(key, value)
        if (result.isErr()) {
          return Result.err(result.error)
        }
      }
      return Result.ok(undefined)
    },

    async readTokens(): Promise<Result<StoredTokens, KeychainError>> {
      const accessToken = await storage.get(KEYCHAIN_KEYS.ACCESS_TOKEN)
      if (accessToken.isErr()) {
        return Result.err(accessToken.error)
      }
      const refreshToken = await storage.get(KEYCHAIN_KEYS.REFRESH_TOKEN)
      if (refreshToken.isErr()) {
        return Result.err(refreshToken.error)
      }
      const expiryStr = await storage.get(KEYCHAIN_KEYS.EXPIRY)
      if (expiryStr.isErr()) {
        return Result.err(expiryStr.error)
      }
      const email = await storage.get(KEYCHAIN_KEYS.EMAIL)
      if (email.isErr()) {
        return Result.err(email.error)
      }
      const parsed = StoredTokensSchema.safeParse({
        accessToken: accessToken.value,
        refreshToken: refreshToken.value,
        expiry: Number(expiryStr.value),
        email: email.value,
      })
      if (!parsed.success) {
        return Result.err(new KeychainError({ message: `Stored tokens are invalid: ${parsed.error.message}` }))
      }
      return Result.ok(parsed.data)
    },

    async clearTokens(): Promise<Result<void, KeychainError>> {
      for (const key of Object.values(KEYCHAIN_KEYS)) {
        const result = await storage.delete(key)
        if (result.isErr()) {
          return Result.err(result.error)
        }
      }
      return Result.ok(undefined)
    },
  }
}

/**
 * Platform-agnostic key/value storage backed by the OS-native secrets store.
 * `set` is upsert (overwrites existing values). `delete` is idempotent.
 */
export type KeyStorage = Storage<KeychainError>

export function getKeyStorage(): KeyStorage {
  return switchOS({
    macos: () => macosKeyStorage,
    windows: () => windowsKeyStorage,
    linux: () => linuxKeyStorage,
  })
}

export const windowsKeyStorage: KeyStorage = notImplemented('Windows')
export const linuxKeyStorage: KeyStorage = notImplemented('Linux')

export const macosKeyStorage: KeyStorage = {
  set: async (key, value) => {
    if (key === KEYCHAIN_KEYS.ACCESS_TOKEN) {
      return setAccessTokenChunked(value, macosSingleStorage)
    }
    return macosSingleStorage.set(key, value)
  },
  get: async (key) => {
    if (key === KEYCHAIN_KEYS.ACCESS_TOKEN) {
      return getAccessTokenChunked(macosSingleStorage)
    }
    return macosSingleStorage.get(key)
  },
  delete: async (key) => {
    if (key === KEYCHAIN_KEYS.ACCESS_TOKEN) {
      return deleteAccessTokenChunked(macosSingleStorage)
    }
    return macosSingleStorage.delete(key)
  },
}

// `security` flags used below (per `man security`):
//   -s <service>   the service name to group items under (our KEYCHAIN_SERVICE)
//   -a <account>   the account name — our per-token key (access_token, refresh_token, ...)
//   -U             on `add-generic-password`: update the item if it already exists, instead of failing
//   -w             different meaning per subcommand (see inline comments)
//
// The access_token key gets transparent chunking — see the constants near the top of the file.
const macosSingleStorage: KeyStorage = {
  set: async (key, value) => {
    // `-w` with NO inline value: `security` reads the secret from stdin instead of argv.
    // Why stdin: `-w <value>` would expose the secret in `ps aux` / proc listings.
    // Sent twice because `security` prompts "password data" then "retype password".
    const result = await runSecurity(['add-generic-password', '-U', '-s', KEYCHAIN_SERVICE, '-a', key, '-w'], {
      stdin: `${value}\n${value}\n`,
    })
    return result.map(() => undefined)
  },
  get: async (key) => {
    // `-w` on `find-generic-password` is unrelated to the `set` usage — here it's a switch
    // that means "print ONLY the password value on stdout" (otherwise security dumps the
    // full keychain item metadata, which we'd have to parse).
    const result = await runSecurity(['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', key, '-w'])
    return result.map((stdout) => stdout.trimEnd())
  },
  delete: async (key) => {
    // `delete-generic-password` needs only the service + account to identify the item;
    // there's no `-w` because the password value isn't relevant to deletion.
    const result = await runSecurity(['delete-generic-password', '-s', KEYCHAIN_SERVICE, '-a', key])
    // Idempotency: treat "not found" as success — the key isn't present after this call either way.
    if (result.isErr() && /could not be found/i.test(result.error.message)) {
      return Result.ok(undefined)
    }
    return result.map(() => undefined)
  },
}

/**
 * Splits `value` into ≤chunk-size pieces stored under suffixed keys against the supplied
 * single-key storage. Exported for tests; production callers go through `macosKeyStorage`.
 *
 * Write order: chunks first, then any stale chunks from a longer prior save are deleted,
 * then the count is written LAST as the commit point. A failure before the final count
 * write leaves the previous (intact) value still readable.
 */
export async function setAccessTokenChunked(value: string, single: KeyStorage): Promise<Result<void, KeychainError>> {
  const chunks = chunkString(value, ACCESS_TOKEN_CHUNK_SIZE)

  const prevCountResult = await single.get(ACCESS_TOKEN_COUNT_KEY)
  const prevCount = prevCountResult.isOk() ? Number(prevCountResult.value) : 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i] ?? ''
    const writeResult = await single.set(accessTokenChunkKey(i), chunk)
    if (writeResult.isErr()) {
      return writeResult
    }
  }

  for (let i = chunks.length; i < prevCount; i++) {
    const deleteResult = await single.delete(accessTokenChunkKey(i))
    if (deleteResult.isErr()) {
      return deleteResult
    }
  }

  return single.set(ACCESS_TOKEN_COUNT_KEY, String(chunks.length))
}

/**
 * Reads chunks from the single-key storage and reassembles the original value.
 * Exported for tests; production callers go through `macosKeyStorage`.
 */
export async function getAccessTokenChunked(single: KeyStorage): Promise<Result<string, KeychainError>> {
  const countResult = await single.get(ACCESS_TOKEN_COUNT_KEY)
  if (countResult.isErr()) {
    return Result.err(countResult.error)
  }
  const count = Number(countResult.value)
  if (!Number.isInteger(count) || count <= 0) {
    return Result.err(new KeychainError({ message: `Invalid access token chunk count: ${countResult.value}` }))
  }

  const chunks: string[] = []
  for (let i = 0; i < count; i++) {
    const chunkResult = await single.get(accessTokenChunkKey(i))
    if (chunkResult.isErr()) {
      return Result.err(chunkResult.error)
    }
    chunks.push(chunkResult.value)
  }
  return Result.ok(chunks.join(''))
}

/**
 * Deletes all chunks plus the count entry. Missing count is treated as no-chunks-to-delete.
 * Exported for tests; production callers go through `macosKeyStorage`.
 */
export async function deleteAccessTokenChunked(single: KeyStorage): Promise<Result<void, KeychainError>> {
  const countResult = await single.get(ACCESS_TOKEN_COUNT_KEY)
  const count = countResult.isOk() ? Number(countResult.value) : 0

  for (let i = 0; i < count; i++) {
    const deleteResult = await single.delete(accessTokenChunkKey(i))
    if (deleteResult.isErr()) {
      return deleteResult
    }
  }
  return single.delete(ACCESS_TOKEN_COUNT_KEY)
}

type RunSecurityOptions = {
  /** Bytes to feed into `security`'s stdin — used to pass secrets without putting them on argv. */
  stdin?: string
}

async function runSecurity(args: string[], { stdin }: RunSecurityOptions = {}): Promise<Result<string, KeychainError>> {
  // stdout/stderr piped so we can surface error text. stdin is either fed bytes (when we're
  // passing a secret out-of-band of argv) or closed entirely.
  // `detached: true` runs setsid() before exec — required on macOS so that `security`'s
  // internal `readpassphrase()` can't open /dev/tty to prompt directly, and is forced to
  // fall back to reading the password from stdin instead.
  const proc = Bun.spawn(['security', ...args], {
    stdin: stdin === undefined ? 'ignore' : new TextEncoder().encode(stdin),
    stdout: 'pipe',
    stderr: 'pipe',
    detached: true,
  })
  const exitCode = await proc.exited
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()

  if (exitCode !== 0) {
    // Some failure modes (e.g. item-not-found) emit a useful message on stderr; others
    // (e.g. user-cancelled auth prompt) exit non-zero with empty stderr — fall back to
    // the exit code so the caller still gets something to log.
    return Result.err(new KeychainError({ message: stderr.trim() || `security exited with code ${exitCode}` }))
  }
  return Result.ok(stdout)
}

function notImplemented(platform: string): KeyStorage {
  // Each method must honor the KeyStorage contract: return a Result, never throw. A throwing
  // stub would surface as an unhandled promise rejection in callers that `await` the method.
  const fail = async (): Promise<Result<never, KeychainError>> =>
    Result.err(new KeychainError({ message: `Keychain support for ${platform} is not yet implemented` }))
  return { set: fail, get: fail, delete: fail }
}
