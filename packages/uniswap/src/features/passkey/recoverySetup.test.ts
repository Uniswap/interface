import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { storeEncryptedBlob } from 'uniswap/src/features/passkey/privyBlobStore'
import { encryptAndStoreRecovery } from 'uniswap/src/features/passkey/recoverySetup'

vi.mock('uniswap/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchOprfEvaluate: vi.fn(),
  },
}))

vi.mock('uniswap/src/features/passkey/privyBlobStore', () => ({
  storeEncryptedBlob: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/deriveArgon2', () => ({
  deriveArgon2: vi.fn(),
}))

vi.mock('uniswap/src/features/passkey/pinCrypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/passkey/pinCrypto')>()
  return {
    ...actual,
    blindPin: vi.fn(),
    finalizeOprf: vi.fn(),
  }
})

const { blindPin, finalizeOprf } = await import('uniswap/src/features/passkey/pinCrypto')
const { deriveArgon2 } = await import('uniswap/src/features/passkey/deriveArgon2')

describe('encryptAndStoreRecovery', () => {
  const params = {
    pin: '8294',
    email: 'test@example.com',
    accessToken: 'access-token',
    privyAppId: 'test-privy-app-id',
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('throws when OPRF evaluation fails', async () => {
    vi.mocked(blindPin).mockResolvedValue({
      blindedElement: 'blinded',
      blindState: {} as Parameters<typeof finalizeOprf>[0],
    })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({
      errorMessage: 'rate limited',
    } as never)

    await expect(encryptAndStoreRecovery(params)).rejects.toThrow()
  })

  it('returns publicKey, authMethodId, and encryptedKeyId on success', async () => {
    vi.mocked(blindPin).mockResolvedValue({
      blindedElement: 'blinded',
      blindState: {} as Parameters<typeof finalizeOprf>[0],
    })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({
      evaluatedElement: 'eval',
    } as never)
    vi.mocked(finalizeOprf).mockResolvedValue(crypto.getRandomValues(new Uint8Array(32)))
    vi.mocked(deriveArgon2).mockResolvedValue(crypto.getRandomValues(new Uint8Array(32)))
    vi.mocked(storeEncryptedBlob).mockResolvedValue({ keyId: 'encrypted-key-id' })

    const result = await encryptAndStoreRecovery(params)
    expect(result.publicKey).toBeDefined()
    expect(result.authMethodId).toBeDefined()
    expect(result.encryptedKeyId).toBe('encrypted-key-id')
  })

  it('forwards the access token to fetchOprfEvaluate', async () => {
    vi.mocked(blindPin).mockResolvedValue({
      blindedElement: 'blinded',
      blindState: {} as Parameters<typeof finalizeOprf>[0],
    })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({
      evaluatedElement: 'eval',
    } as never)
    vi.mocked(finalizeOprf).mockResolvedValue(crypto.getRandomValues(new Uint8Array(32)))
    vi.mocked(deriveArgon2).mockResolvedValue(crypto.getRandomValues(new Uint8Array(32)))
    vi.mocked(storeEncryptedBlob).mockResolvedValue({ keyId: 'encrypted-key-id' })

    await encryptAndStoreRecovery(params)
    expect(EmbeddedWalletApiClient.fetchOprfEvaluate).toHaveBeenCalledWith(
      expect.objectContaining({ blindedElement: 'blinded', authMethodId: expect.any(String) }),
      params.accessToken,
    )
  })

  it('calls onProgress with expected steps', async () => {
    const onProgress = vi.fn()
    vi.mocked(blindPin).mockResolvedValue({
      blindedElement: 'blinded',
      blindState: {} as Parameters<typeof finalizeOprf>[0],
    })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({
      evaluatedElement: 'eval',
    } as never)
    vi.mocked(finalizeOprf).mockResolvedValue(crypto.getRandomValues(new Uint8Array(32)))
    vi.mocked(deriveArgon2).mockResolvedValue(crypto.getRandomValues(new Uint8Array(32)))
    vi.mocked(storeEncryptedBlob).mockResolvedValue({ keyId: 'encrypted-key-id' })

    await encryptAndStoreRecovery({ ...params, onProgress })

    expect(onProgress).toHaveBeenCalledWith('generating_keys')
    expect(onProgress).toHaveBeenCalledWith('oprf')
    expect(onProgress).toHaveBeenCalledWith('deriving')
    expect(onProgress).toHaveBeenCalledWith('encrypting')
    expect(onProgress).toHaveBeenCalledWith('storing')
  })
})
