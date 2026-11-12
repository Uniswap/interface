import { EmbeddedWalletApiClient } from '@universe/embedded-wallet/src/data/rest/embeddedWallet/requests'
import { generateDeviceKeyPair } from '@universe/embedded-wallet/src/features/passkey/deviceSession'
import { createNewEmbeddedWallet } from '@universe/embedded-wallet/src/features/passkey/embeddedWallet'
import { registerPasskey } from '@universe/embedded-wallet/src/features/passkey/passkey'
import { logger } from 'utilities/src/logger/logger'

vi.mock('@universe/embedded-wallet/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchChallengeRequest: vi.fn(),
    fetchCreateWalletRequest: vi.fn(),
  },
}))

vi.mock('@universe/embedded-wallet/src/features/passkey/passkey', () => ({
  authenticatePasskey: vi.fn(),
  registerPasskey: vi.fn(),
}))

vi.mock('@universe/embedded-wallet/src/features/passkey/deviceSession', () => ({
  generateDeviceKeyPair: vi.fn(),
  storeNeckSigningKey: vi.fn(),
  storeNeckMetadata: vi.fn(),
}))

vi.mock('@universe/embedded-wallet/src/features/passkey/passkeySession', () => ({
  authenticateWithPasskey: vi.fn(),
}))

function abortError(message: string): Error {
  return Object.assign(new Error(message), { name: 'AbortError' })
}

describe(createNewEmbeddedWallet, () => {
  beforeEach(() => {
    vi.mocked(generateDeviceKeyPair).mockResolvedValue({
      privateKey: {} as CryptoKey,
      publicKeyBase64: 'device-public-key',
    })
    vi.mocked(EmbeddedWalletApiClient.fetchChallengeRequest).mockResolvedValue({
      challengeOptions: '{"challenge":"abc"}',
    } as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
    vi.spyOn(logger, 'debug').mockImplementation(() => undefined)
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs a cancelled registration prompt only at debug', async () => {
    const error = abortError('Registration ceremony was sent an abort signal')
    vi.mocked(registerPasskey).mockRejectedValue(error)

    await expect(createNewEmbeddedWallet('unitag')).rejects.toBe(error)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs an aborted challenge fetch at error', async () => {
    const error = abortError('The operation was aborted.')
    vi.mocked(EmbeddedWalletApiClient.fetchChallengeRequest).mockRejectedValue(error)

    await expect(createNewEmbeddedWallet('unitag')).rejects.toBe(error)
    expect(registerPasskey).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: { file: 'embeddedWallet.ts', function: 'createNewEmbeddedWallet' },
        extra: expect.objectContaining({ errName: 'AbortError' }),
      }),
    )
  })
})
