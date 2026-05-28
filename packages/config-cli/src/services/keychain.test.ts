import { Result } from 'better-result'
import { describe, expect, it, vi } from 'vitest'
import { KeychainError } from '../errors'
import {
  ACCESS_TOKEN_CHUNK_SIZE,
  ACCESS_TOKEN_COUNT_KEY,
  accessTokenChunkKey,
  createKeychainService,
  deleteAccessTokenChunked,
  getAccessTokenChunked,
  KEYCHAIN_KEYS,
  setAccessTokenChunked,
  type KeyStorage,
  type StoredTokens,
} from './keychain'

const tokens: StoredTokens = {
  accessToken: 'access-123',
  refreshToken: 'refresh-456',
  expiry: 1_700_000_000_000,
  email: 'jane@uniswap.org',
}

const ok = (value = ''): Result<string, KeychainError> => Result.ok(value)
const okVoid = (): Result<void, KeychainError> => Result.ok(undefined)
const err = (message: string): Result<never, KeychainError> => Result.err(new KeychainError({ message }))

const makeStorage = (overrides: Partial<KeyStorage> = {}): KeyStorage => ({
  set: vi.fn(async () => okVoid()),
  get: vi.fn(async () => ok()),
  delete: vi.fn(async () => okVoid()),
  ...overrides,
})

describe('keychain.saveTokens', () => {
  it('writes all four items in order via storage.set', async () => {
    const storage = makeStorage()
    const result = await createKeychainService(storage).saveTokens(tokens)

    expect(result.isOk()).toBe(true)
    expect(storage.set).toHaveBeenCalledTimes(4)
    expect(storage.set).toHaveBeenNthCalledWith(1, KEYCHAIN_KEYS.ACCESS_TOKEN, tokens.accessToken)
    expect(storage.set).toHaveBeenNthCalledWith(2, KEYCHAIN_KEYS.REFRESH_TOKEN, tokens.refreshToken)
    expect(storage.set).toHaveBeenNthCalledWith(3, KEYCHAIN_KEYS.EXPIRY, String(tokens.expiry))
    expect(storage.set).toHaveBeenNthCalledWith(4, KEYCHAIN_KEYS.EMAIL, tokens.email)
  })

  it('stops at the first failure and returns the error', async () => {
    let callCount = 0
    const storage = makeStorage({
      set: vi.fn(async () => {
        callCount += 1
        return callCount === 2 ? err('nope') : okVoid()
      }),
    })

    const result = await createKeychainService(storage).saveTokens(tokens)

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe('nope')
    }
    expect(storage.set).toHaveBeenCalledTimes(2)
  })
})

describe('keychain.readTokens', () => {
  it('reads all four items and assembles StoredTokens', async () => {
    const responses = new Map<string, string>([
      [KEYCHAIN_KEYS.ACCESS_TOKEN, tokens.accessToken],
      [KEYCHAIN_KEYS.REFRESH_TOKEN, tokens.refreshToken],
      [KEYCHAIN_KEYS.EXPIRY, String(tokens.expiry)],
      [KEYCHAIN_KEYS.EMAIL, tokens.email],
    ])
    const storage = makeStorage({
      get: vi.fn(async (key: string) => ok(responses.get(key) ?? '')),
    })

    const result = await createKeychainService(storage).readTokens()

    expect(storage.get).toHaveBeenCalledTimes(4)
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual(tokens)
    }
  })

  it('returns the first read error and stops', async () => {
    let callCount = 0
    const storage = makeStorage({
      get: vi.fn(async () => {
        callCount += 1
        return callCount === 3 ? err('expiry missing') : ok('value')
      }),
    })

    const result = await createKeychainService(storage).readTokens()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe('expiry missing')
    }
    expect(storage.get).toHaveBeenCalledTimes(3)
  })
})

describe('keychain.clearTokens', () => {
  it('deletes every keychain key', async () => {
    const storage = makeStorage()
    const result = await createKeychainService(storage).clearTokens()

    expect(result.isOk()).toBe(true)
    expect(storage.delete).toHaveBeenCalledTimes(Object.keys(KEYCHAIN_KEYS).length)
    for (const key of Object.values(KEYCHAIN_KEYS)) {
      expect(storage.delete).toHaveBeenCalledWith(key)
    }
  })

  it('succeeds when the keychain has no matching keys (storage.delete is idempotent)', async () => {
    // Service relies on KeyStorage's contract that `delete` returns ok when the key isn't
    // present — see macosKeyStorage's "could not be found → ok" branch.
    const storage = makeStorage()
    const result = await createKeychainService(storage).clearTokens()

    expect(result.isOk()).toBe(true)
    expect(storage.delete).toHaveBeenCalledTimes(Object.keys(KEYCHAIN_KEYS).length)
  })

  it('propagates storage errors and stops at the first one', async () => {
    let callCount = 0
    const storage = makeStorage({
      delete: vi.fn(async () => {
        callCount += 1
        return callCount === 2 ? err('permission denied') : okVoid()
      }),
    })

    const result = await createKeychainService(storage).clearTokens()

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.message).toBe('permission denied')
    }
    expect(storage.delete).toHaveBeenCalledTimes(2)
  })
})

describe('setAccessTokenChunked', () => {
  it('writes a single-chunk value as one chunk + count (count last)', async () => {
    const single = makeStorage({ get: vi.fn(async () => err('not found')) })

    await setAccessTokenChunked('short', single)

    expect(single.set).toHaveBeenNthCalledWith(1, accessTokenChunkKey(0), 'short')
    expect(single.set).toHaveBeenNthCalledWith(2, ACCESS_TOKEN_COUNT_KEY, '1')
  })

  it('splits a value larger than the chunk size into multiple chunks of the right sizes', async () => {
    const single = makeStorage({ get: vi.fn(async () => err('not found')) })
    // 250 chars → 120 + 120 + 10
    const value = 'x'.repeat(250)

    await setAccessTokenChunked(value, single)

    expect(single.set).toHaveBeenNthCalledWith(1, accessTokenChunkKey(0), 'x'.repeat(ACCESS_TOKEN_CHUNK_SIZE))
    expect(single.set).toHaveBeenNthCalledWith(2, accessTokenChunkKey(1), 'x'.repeat(ACCESS_TOKEN_CHUNK_SIZE))
    expect(single.set).toHaveBeenNthCalledWith(3, accessTokenChunkKey(2), 'x'.repeat(10))
    expect(single.set).toHaveBeenNthCalledWith(4, ACCESS_TOKEN_COUNT_KEY, '3')
  })

  it('deletes stale chunks when the new value has fewer chunks than before', async () => {
    const single = makeStorage({ get: vi.fn(async () => ok('5')) }) // previous count

    await setAccessTokenChunked('short', single) // 1 chunk now → 4 stale

    expect(single.delete).toHaveBeenCalledTimes(4)
    expect(single.delete).toHaveBeenNthCalledWith(1, accessTokenChunkKey(1))
    expect(single.delete).toHaveBeenNthCalledWith(4, accessTokenChunkKey(4))
  })

  it('does not write the count when a chunk write fails (no commit)', async () => {
    let writes = 0
    const single = makeStorage({
      get: vi.fn(async () => err('not found')),
      set: vi.fn(async () => {
        writes += 1
        return writes === 2 ? err('write failed') : okVoid()
      }),
    })

    const result = await setAccessTokenChunked('x'.repeat(250), single)

    expect(result.isErr()).toBe(true)
    expect(single.set).not.toHaveBeenCalledWith(ACCESS_TOKEN_COUNT_KEY, expect.any(String))
  })
})

describe('getAccessTokenChunked', () => {
  it('reads and concatenates chunks in index order', async () => {
    const data = new Map<string, string>([
      [ACCESS_TOKEN_COUNT_KEY, '3'],
      [accessTokenChunkKey(0), 'AAA'],
      [accessTokenChunkKey(1), 'BBB'],
      [accessTokenChunkKey(2), 'CCC'],
    ])
    const single = makeStorage({
      get: vi.fn(async (key: string) => (data.has(key) ? ok(data.get(key) ?? '') : err('missing'))),
    })

    const result = await getAccessTokenChunked(single)

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBe('AAABBBCCC')
    }
  })

  it('returns an error when a chunk is missing mid-assembly', async () => {
    const single = makeStorage({
      get: vi.fn(async (key: string) => {
        if (key === ACCESS_TOKEN_COUNT_KEY) {
          return ok('3')
        }
        if (key === accessTokenChunkKey(0)) {
          return ok('AAA')
        }
        return err('chunk missing')
      }),
    })

    const result = await getAccessTokenChunked(single)

    expect(result.isErr()).toBe(true)
  })
})

describe('deleteAccessTokenChunked', () => {
  it('deletes every chunk and the count key', async () => {
    const single = makeStorage({ get: vi.fn(async () => ok('3')) })

    await deleteAccessTokenChunked(single)

    expect(single.delete).toHaveBeenCalledTimes(4)
    expect(single.delete).toHaveBeenNthCalledWith(1, accessTokenChunkKey(0))
    expect(single.delete).toHaveBeenNthCalledWith(2, accessTokenChunkKey(1))
    expect(single.delete).toHaveBeenNthCalledWith(3, accessTokenChunkKey(2))
    expect(single.delete).toHaveBeenNthCalledWith(4, ACCESS_TOKEN_COUNT_KEY)
  })

  it('is idempotent when the count key is missing', async () => {
    const single = makeStorage({ get: vi.fn(async () => err('not found')) })

    const result = await deleteAccessTokenChunked(single)

    expect(result.isOk()).toBe(true)
    expect(single.delete).toHaveBeenCalledTimes(1)
    expect(single.delete).toHaveBeenCalledWith(ACCESS_TOKEN_COUNT_KEY)
  })
})
