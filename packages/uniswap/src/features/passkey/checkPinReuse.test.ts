import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { checkPinReuse } from 'uniswap/src/features/passkey/checkPinReuse'
import { decryptAuthKey } from 'uniswap/src/features/passkey/pinCrypto'

vi.mock('uniswap/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchOprfEvaluate: vi.fn(),
    fetchReportDecryptionResult: vi.fn(),
  },
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
    parseBlob: vi.fn(),
    combineAndDeriveKey: vi.fn(),
    decryptAuthKey: vi.fn(),
  }
})

const { blindPin, finalizeOprf, parseBlob, combineAndDeriveKey } =
  await import('uniswap/src/features/passkey/pinCrypto')
const { deriveArgon2 } = await import('uniswap/src/features/passkey/deriveArgon2')

const params = { pin: '4321', email: 'user@example.com', accessToken: 'token', encryptedBlob: 'blob' }

function primeOprfSuccess(): void {
  vi.mocked(blindPin).mockResolvedValue({ blindedElement: 'b', blindState: {} as never })
  vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({ evaluatedElement: 'e' } as never)
  vi.mocked(finalizeOprf).mockResolvedValue(new Uint8Array(32))
  vi.mocked(deriveArgon2).mockResolvedValue(new Uint8Array(32))
  vi.mocked(combineAndDeriveKey).mockReturnValue(new Uint8Array(32))
  vi.mocked(parseBlob).mockReturnValue({
    salt1: new Uint8Array(16),
    salt2: new Uint8Array(16),
    iv: new Uint8Array(12),
    ciphertextWithTag: new Uint8Array(48),
  })
}

describe('checkPinReuse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true when the candidate PIN decrypts the old blob (reused)', async () => {
    primeOprfSuccess()
    vi.mocked(decryptAuthKey).mockReturnValue(new Uint8Array(32))
    expect(await checkPinReuse(params)).toBe(true)
  })

  it('returns false when decryption fails (different PIN)', async () => {
    primeOprfSuccess()
    vi.mocked(decryptAuthKey).mockImplementation(() => {
      throw new Error('GCM tag mismatch')
    })
    expect(await checkPinReuse(params)).toBe(false)
  })

  it('fails open (false) and never reports to the backend when OPRF is rejected', async () => {
    vi.mocked(blindPin).mockResolvedValue({ blindedElement: 'b', blindState: {} as never })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({ errorMessage: 'rate limited' } as never)
    expect(await checkPinReuse(params)).toBe(false)
    expect(EmbeddedWalletApiClient.fetchReportDecryptionResult).not.toHaveBeenCalled()
  })
})
