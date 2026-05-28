import { exportSeedPhrase } from 'uniswap/src/features/passkey/hpkeExport'
import { vi } from 'vitest'

const mockExportEncryptedSeedPhrase = vi.fn()
vi.mock('uniswap/src/features/passkey/embeddedWallet', () => ({
  exportEncryptedSeedPhrase: (...args: unknown[]) => mockExportEncryptedSeedPhrase(...args),
}))

const mockFetchWalletSigninRequest = vi.fn()
vi.mock('uniswap/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchWalletSigninRequest: (...args: unknown[]) => mockFetchWalletSigninRequest(...args),
  },
}))

const mockCreateRecipientContext = vi.fn()
const mockOpen = vi.fn()

vi.mock('@hpke/core', () => ({
  CipherSuite: vi.fn(() => ({
    createRecipientContext: (...args: unknown[]) => mockCreateRecipientContext(...args),
  })),
  DhkemP256HkdfSha256: vi.fn(() => ({
    generateKeyPair: vi
      .fn()
      .mockResolvedValue({ publicKey: 'fake-crypto-pub' as unknown as CryptoKey, privateKey: 'fake-crypto-priv' }),
  })),
  HkdfSha256: vi.fn(() => ({})),
}))

vi.mock('@hpke/chacha20poly1305', () => ({
  Chacha20Poly1305: vi.fn(() => ({})),
}))

const FAKE_SPKI_BYTES = new Uint8Array(91) // 26-byte prefix + 65-byte point; content irrelevant for orchestration tests
FAKE_SPKI_BYTES[0] = 0x30
FAKE_SPKI_BYTES[1] = 0x59

const originalExportKey = globalThis.crypto.subtle.exportKey
beforeAll(() => {
  ;(globalThis.crypto.subtle as unknown as { exportKey: typeof originalExportKey }).exportKey = vi
    .fn()
    .mockResolvedValue(FAKE_SPKI_BYTES.buffer) as unknown as typeof originalExportKey
})
afterAll(() => {
  ;(globalThis.crypto.subtle as unknown as { exportKey: typeof originalExportKey }).exportKey = originalExportKey
})

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i)
  }
  return out
}

describe('exportSeedPhrase (hpkeExport.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateRecipientContext.mockResolvedValue({ open: (...args: unknown[]) => mockOpen(...args) })
    mockOpen.mockResolvedValue(new TextEncoder().encode('horse battery staple correct'))
  })

  it('forwards the SPKI public key as base64 and the walletId to exportEncryptedSeedPhrase', async () => {
    mockExportEncryptedSeedPhrase.mockResolvedValue({ ciphertext: btoa('ct'), encapsulatedKey: btoa('enc') })

    await exportSeedPhrase({ walletId: 'wallet-1' })

    expect(mockExportEncryptedSeedPhrase).toHaveBeenCalledTimes(1)
    const [args] = mockExportEncryptedSeedPhrase.mock.calls[0] as [{ encryptionKey: string; walletId: string }]
    expect(args.walletId).toBe('wallet-1')
    expect(base64ToBytes(args.encryptionKey).length).toBe(91)
  })

  it('decrypts ciphertext via the HPKE recipient context and returns UTF-8 plaintext', async () => {
    const ctBytes = new Uint8Array([1, 2, 3, 4, 5])
    const encBytes = new Uint8Array([10, 20, 30])
    const ctB64 = btoa(String.fromCharCode(...ctBytes))
    const encB64 = btoa(String.fromCharCode(...encBytes))
    mockExportEncryptedSeedPhrase.mockResolvedValue({ ciphertext: ctB64, encapsulatedKey: encB64 })

    const result = await exportSeedPhrase({ walletId: 'wallet-1' })

    expect(result).toBe('horse battery staple correct')
    expect(mockCreateRecipientContext).toHaveBeenCalledTimes(1)
    const ctxArg = mockCreateRecipientContext.mock.calls[0]?.[0] as { recipientKey: unknown; enc: Uint8Array }
    expect(ctxArg.enc).toEqual(encBytes)
    expect(mockOpen).toHaveBeenCalledWith(ctBytes)
  })

  it('resolves walletId via fetchWalletSigninRequest when only signinCredential is provided', async () => {
    mockFetchWalletSigninRequest.mockResolvedValue({ walletId: 'wallet-from-signin', walletAddress: '0xabc' })
    mockExportEncryptedSeedPhrase.mockResolvedValue({ ciphertext: btoa('ct'), encapsulatedKey: btoa('enc') })

    const result = await exportSeedPhrase({ signinCredential: 'signin-cred' })

    expect(result).toBe('horse battery staple correct')
    expect(mockFetchWalletSigninRequest).toHaveBeenCalledWith({ credential: 'signin-cred' })
    expect(mockExportEncryptedSeedPhrase).toHaveBeenCalledWith(
      expect.objectContaining({
        encryptionKey: expect.any(String),
        walletId: 'wallet-from-signin',
        getCredential: undefined,
        walletAddress: '0xabc',
      }),
    )
  })

  it('throws when neither walletId nor signinCredential is provided', async () => {
    await expect(exportSeedPhrase()).rejects.toThrow(
      'Either walletId or signinCredential is required for seed phrase export',
    )
    expect(mockExportEncryptedSeedPhrase).not.toHaveBeenCalled()
  })

  it('returns undefined when backend returns no result', async () => {
    mockExportEncryptedSeedPhrase.mockResolvedValue(undefined)
    expect(await exportSeedPhrase({ walletId: 'wallet-1' })).toBeUndefined()
    expect(mockCreateRecipientContext).not.toHaveBeenCalled()
  })

  it('returns undefined when encapsulatedKey is empty (legacy API shape)', async () => {
    mockExportEncryptedSeedPhrase.mockResolvedValue({ ciphertext: btoa('ct'), encapsulatedKey: '' })
    expect(await exportSeedPhrase({ walletId: 'wallet-1' })).toBeUndefined()
    expect(mockCreateRecipientContext).not.toHaveBeenCalled()
  })

  it('returns undefined when ciphertext is empty', async () => {
    mockExportEncryptedSeedPhrase.mockResolvedValue({ ciphertext: '', encapsulatedKey: btoa('enc') })
    expect(await exportSeedPhrase({ walletId: 'wallet-1' })).toBeUndefined()
    expect(mockCreateRecipientContext).not.toHaveBeenCalled()
  })

  it('delegates credential ceremony to a custom getCredential callback', async () => {
    mockExportEncryptedSeedPhrase.mockResolvedValue({ ciphertext: btoa('ct'), encapsulatedKey: btoa('enc') })
    const getCredential = vi.fn()

    await exportSeedPhrase({ walletId: 'wallet-1', getCredential })

    expect(mockExportEncryptedSeedPhrase).toHaveBeenCalledWith(
      expect.objectContaining({
        encryptionKey: expect.any(String),
        walletId: 'wallet-1',
        getCredential,
        walletAddress: undefined,
      }),
    )
  })
})
