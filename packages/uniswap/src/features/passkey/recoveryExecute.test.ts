import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { deriveArgon2 } from 'uniswap/src/features/passkey/deriveArgon2'
import { attemptPinDecryption, executeRecoveryExport } from 'uniswap/src/features/passkey/recoveryExecute'

vi.mock('uniswap/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchOprfEvaluate: vi.fn(),
    fetchReportDecryptionResult: vi.fn(),
    fetchExportSeedPhraseWithRecovery: vi.fn(),
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
  }
})

const { encryptAuthKey, generateAuthKeyPair, hashAuthMethodId, blindPin, finalizeOprf } =
  await import('uniswap/src/features/passkey/pinCrypto')

async function buildValidBlob(pin: string): Promise<{ blob: string; authPrivateKey: Uint8Array; salt1: Uint8Array }> {
  const salt1 = crypto.getRandomValues(new Uint8Array(16))
  const salt2 = crypto.getRandomValues(new Uint8Array(16))
  const fakeOprfOutput = crypto.getRandomValues(new Uint8Array(32))
  const { privateKey } = await generateAuthKeyPair()

  // Build final key the same way recoveryExecute does (HKDF over pinKey||oprfOutput)
  const { hkdf } = await import('@noble/hashes/hkdf.js')
  const { sha256 } = await import('@noble/hashes/sha2.js')
  const { AES_KEY_LENGTH, HKDF_INFO } = await import('uniswap/src/features/passkey/pinCrypto')

  // Simulate pinKey from argon2
  const pinKey = crypto.getRandomValues(new Uint8Array(32))
  const ikm = new Uint8Array(fakeOprfOutput.length + pinKey.length)
  ikm.set(fakeOprfOutput, 0)
  ikm.set(pinKey, fakeOprfOutput.length)
  const finalKey = hkdf(sha256, ikm, salt2, HKDF_INFO, AES_KEY_LENGTH)

  const blob = encryptAuthKey({ finalKey, authPrivateKey: privateKey, salt1, salt2 })
  return { blob, authPrivateKey: privateKey, salt1, pinKey, fakeOprfOutput, finalKey } as unknown as {
    blob: string
    authPrivateKey: Uint8Array
    salt1: Uint8Array
  }
}

describe('attemptPinDecryption', () => {
  const email = 'test@example.com'
  const accessToken = 'tok'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns rate_limited when OPRF evaluation returns error', async () => {
    vi.mocked(blindPin).mockResolvedValue({
      blindedElement: 'blinded',
      blindState: {
        finalizationData: {},
        client: {},
      } as unknown as import('uniswap/src/features/passkey/pinCrypto').OprfBlindState,
    })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({
      errorMessage: 'too many attempts',
    } as never)

    const result = await attemptPinDecryption({
      pin: '1234',
      email,
      accessToken,
      encryptedBlob: 'someblob',
    })
    expect(result).toMatchObject({ success: false, error: 'rate_limited', errorMessage: 'too many attempts' })
    expect(EmbeddedWalletApiClient.fetchOprfEvaluate).toHaveBeenCalledWith(
      expect.objectContaining({ blindedElement: 'blinded', authMethodId: hashAuthMethodId(email) }),
      accessToken,
    )
  })

  it('returns rate_limited without errorMessage when OPRF returns no evaluatedElement', async () => {
    vi.mocked(blindPin).mockResolvedValue({
      blindedElement: 'blinded',
      blindState: {
        finalizationData: {},
        client: {},
      } as unknown as import('uniswap/src/features/passkey/pinCrypto').OprfBlindState,
    })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({} as never)

    const result = await attemptPinDecryption({
      pin: '1234',
      email,
      accessToken,
      encryptedBlob: 'someblob',
    })
    expect(result).toMatchObject({ success: false, error: 'rate_limited' })
    if (!result.success) {
      expect(result.errorMessage).toBeUndefined()
    }
  })

  it('returns wrong_pin when GCM decryption fails and calls fetchReportDecryptionResult(false)', async () => {
    const { blob, pinKey, fakeOprfOutput } = (await buildValidBlob('1234')) as unknown as {
      blob: string
      pinKey: Uint8Array
      fakeOprfOutput: Uint8Array
    }

    vi.mocked(blindPin).mockResolvedValue({
      blindedElement: 'blinded',
      blindState: {} as unknown as import('uniswap/src/features/passkey/pinCrypto').OprfBlindState,
    })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({
      evaluatedElement: 'eval',
    } as never)
    vi.mocked(finalizeOprf).mockResolvedValue(fakeOprfOutput)
    // Return wrong pinKey so GCM fails
    vi.mocked(deriveArgon2).mockResolvedValue(crypto.getRandomValues(new Uint8Array(32)))
    vi.mocked(EmbeddedWalletApiClient.fetchReportDecryptionResult).mockResolvedValue({
      cooldownSeconds: 0,
      errorMessage: 'Wrong PIN',
    } as never)

    const result = await attemptPinDecryption({ pin: '9999', email, accessToken, encryptedBlob: blob })
    expect(result).toMatchObject({ success: false, error: 'wrong_pin' })
    expect(EmbeddedWalletApiClient.fetchReportDecryptionResult).toHaveBeenCalledWith(
      {
        success: false,
        authMethodId: hashAuthMethodId(email),
      },
      accessToken,
    )
  })

  it('wrong_pin with cooldown includes cooldownSeconds', async () => {
    const { blob, fakeOprfOutput } = (await buildValidBlob('1234')) as unknown as {
      blob: string
      fakeOprfOutput: Uint8Array
    }

    vi.mocked(blindPin).mockResolvedValue({
      blindedElement: 'blinded',
      blindState: {} as unknown as import('uniswap/src/features/passkey/pinCrypto').OprfBlindState,
    })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({ evaluatedElement: 'eval' } as never)
    vi.mocked(finalizeOprf).mockResolvedValue(fakeOprfOutput)
    vi.mocked(deriveArgon2).mockResolvedValue(crypto.getRandomValues(new Uint8Array(32)))
    vi.mocked(EmbeddedWalletApiClient.fetchReportDecryptionResult).mockResolvedValue({
      cooldownSeconds: 60,
      errorMessage: 'Too many attempts',
    } as never)

    const result = await attemptPinDecryption({ pin: '9999', email, accessToken, encryptedBlob: blob })
    expect(result).toMatchObject({ success: false, error: 'wrong_pin', cooldownSeconds: 60 })
  })

  it('Argon2 OOM error propagates instead of being treated as wrong_pin', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { blob, fakeOprfOutput } = (await buildValidBlob('1234')) as unknown as {
      blob: string
      fakeOprfOutput: Uint8Array
    }

    vi.mocked(blindPin).mockResolvedValue({
      blindedElement: 'blinded',
      blindState: {} as unknown as import('uniswap/src/features/passkey/pinCrypto').OprfBlindState,
    })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({ evaluatedElement: 'eval' } as never)
    vi.mocked(finalizeOprf).mockResolvedValue(fakeOprfOutput)
    vi.mocked(deriveArgon2).mockRejectedValue(new Error('Argon2 derivation failed — device may not have enough memory'))

    await expect(attemptPinDecryption({ pin: '1234', email, accessToken, encryptedBlob: blob })).rejects.toThrow(
      'Argon2 derivation failed',
    )
    expect(EmbeddedWalletApiClient.fetchReportDecryptionResult).not.toHaveBeenCalled()
  })

  it('fetchReportDecryptionResult failure does not burn extra attempt (still returns wrong_pin)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { blob, fakeOprfOutput } = (await buildValidBlob('1234')) as unknown as {
      blob: string
      fakeOprfOutput: Uint8Array
    }

    vi.mocked(blindPin).mockResolvedValue({
      blindedElement: 'blinded',
      blindState: {} as unknown as import('uniswap/src/features/passkey/pinCrypto').OprfBlindState,
    })
    vi.mocked(EmbeddedWalletApiClient.fetchOprfEvaluate).mockResolvedValue({ evaluatedElement: 'eval' } as never)
    vi.mocked(finalizeOprf).mockResolvedValue(fakeOprfOutput)
    vi.mocked(deriveArgon2).mockResolvedValue(crypto.getRandomValues(new Uint8Array(32)))
    vi.mocked(EmbeddedWalletApiClient.fetchReportDecryptionResult).mockRejectedValue(new Error('network'))

    // Should propagate, not silently eat the error — report failing is an unexpected error
    await expect(attemptPinDecryption({ pin: '9999', email, accessToken, encryptedBlob: blob })).rejects.toThrow()
    // Only called once (for the wrong PIN), not twice
    expect(EmbeddedWalletApiClient.fetchReportDecryptionResult).toHaveBeenCalledTimes(1)
  })
})

describe('executeRecoveryExport', () => {
  const authMethodId = 'auth-method-1'
  const encryptionKey = 'enc-key-1'
  const accessToken = 'tok'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  function validPayload(): string {
    // Server sends a base64url JSON payload. Shape: `{ method, url, body, headers, version }`.
    const body = JSON.stringify({ method: 'POST', url: '/export', body: {}, headers: {}, version: 1 })
    return btoa(body).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  it('reads exportSigningPayload (camelCase) and returns the exported ciphertext', async () => {
    const authPrivateKey = (await (await import('uniswap/src/features/passkey/pinCrypto')).generateAuthKeyPair())
      .privateKey
    vi.mocked(EmbeddedWalletApiClient.fetchReportDecryptionResult).mockResolvedValue({
      exportSigningPayload: validPayload(),
    } as never)
    vi.mocked(EmbeddedWalletApiClient.fetchExportSeedPhraseWithRecovery).mockResolvedValue({
      ciphertext: 'ct',
      encapsulatedKey: 'ek',
    } as never)
    const generateAuthorizationSignature = vi.fn().mockResolvedValue({ signature: 'recovery-sig' })

    const result = await executeRecoveryExport({
      authPrivateKey,
      authMethodId,
      encryptionKey,
      accessToken,
      generateAuthorizationSignature,
    })

    expect(result).toEqual({ ciphertext: 'ct', encapsulatedKey: 'ek' })
    expect(EmbeddedWalletApiClient.fetchReportDecryptionResult).toHaveBeenCalledWith(
      {
        success: true,
        authMethodId,
        encryptionKey,
      },
      accessToken,
    )
    expect(generateAuthorizationSignature).toHaveBeenCalled()
    expect(EmbeddedWalletApiClient.fetchExportSeedPhraseWithRecovery).toHaveBeenCalledWith(
      expect.objectContaining({
        authMethodId,
        encryptionKey,
        authKeySignature: expect.any(String),
        recoveryAuthSignature: 'recovery-sig',
      }),
    )
  })

  it('throws when the server omits the export signing payload', async () => {
    const authPrivateKey = (await (await import('uniswap/src/features/passkey/pinCrypto')).generateAuthKeyPair())
      .privateKey
    vi.mocked(EmbeddedWalletApiClient.fetchReportDecryptionResult).mockResolvedValue({} as never)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(
      executeRecoveryExport({
        authPrivateKey,
        authMethodId,
        encryptionKey,
        accessToken,
        generateAuthorizationSignature: vi.fn(),
      }),
    ).rejects.toThrow(/export signing payload/i)
  })
})
