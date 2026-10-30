import { createPrivyBlobStore } from '@universe/embedded-wallet/src/features/passkey/privyBlobStore.shared'
import { vi } from 'vitest'

vi.mock('uniswap/src/constants/urls', () => ({
  getUniswapServiceUrls: () => ({
    privyEncryptedAuthorizationKeysUrl: 'https://privy.test/encrypted_authorization_keys',
  }),
}))

const fetchMock = vi.fn()

const store = createPrivyBlobStore({
  fileTag: 'privyBlobStore.shared.test.ts',
  buildHeaders: ({ accessToken, privyAppId, privyClientId }) => ({
    Authorization: `Bearer ${accessToken}`,
    'privy-app-id': privyAppId,
    'privy-client-id': privyClientId,
  }),
})

const ids = { accessToken: 'token', privyAppId: 'app-1', privyClientId: 'client-1' }
const expectedHeaders = { Authorization: 'Bearer token', 'privy-app-id': 'app-1', 'privy-client-id': 'client-1' }

function lastFetch(): { url: string; init: { method: string; headers: Record<string, string> } } {
  const call = fetchMock.mock.calls[0]
  if (!call) {
    throw new Error('fetch was not called')
  }
  return { url: call[0] as string, init: call[1] as { method: string; headers: Record<string, string> } }
}

describe('createPrivyBlobStore', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'key-1', ciphertext: 'blob' }) })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stores with the bearer, app id and client id from the caller', async () => {
    const result = await store.storeEncryptedBlob({ ...ids, blob: 'blob' })

    expect(result).toEqual({ keyId: 'key-1' })
    expect(lastFetch().init.method).toBe('POST')
    expect(lastFetch().init.headers).toEqual(expectedHeaders)
  })

  it('fetches by key id with the same headers', async () => {
    const result = await store.fetchEncryptedBlob({ ...ids, keyId: 'key-1' })

    expect(result).toBe('blob')
    expect(lastFetch().url).toBe('https://privy.test/encrypted_authorization_keys/key-1')
    expect(lastFetch().init.headers).toEqual(expectedHeaders)
  })
})
