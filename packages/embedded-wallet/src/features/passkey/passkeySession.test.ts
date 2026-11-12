import { Action } from '@uniswap/client-privy-embedded-wallet/dist/uniswap/privy-embedded-wallet/v1/service_pb'
import { EmbeddedWalletApiClient } from '@universe/embedded-wallet/src/data/rest/embeddedWallet/requests'
import { authenticatePasskey } from '@universe/embedded-wallet/src/features/passkey/passkey'
import { authenticateWithPasskey } from '@universe/embedded-wallet/src/features/passkey/passkeySession'
import { logger } from 'utilities/src/logger/logger'

vi.mock('@universe/embedded-wallet/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchChallengeRequest: vi.fn(),
  },
}))

vi.mock('@universe/embedded-wallet/src/features/passkey/passkey', () => ({
  authenticatePasskey: vi.fn(),
}))

vi.mock('@universe/embedded-wallet/src/features/passkey/deviceSession', () => ({
  loadNeckMetadata: vi.fn().mockReturnValue(null),
}))

describe(authenticateWithPasskey, () => {
  beforeEach(() => {
    vi.mocked(EmbeddedWalletApiClient.fetchChallengeRequest).mockResolvedValue({
      challengeOptions: '{"challenge":"abc"}',
    } as Awaited<ReturnType<typeof EmbeddedWalletApiClient.fetchChallengeRequest>>)
    vi.spyOn(logger, 'debug').mockImplementation(() => undefined)
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rethrows a dismissed web prompt but logs it only at debug', async () => {
    const error = new DOMException('The operation either timed out or was not allowed.', 'NotAllowedError')
    vi.mocked(authenticatePasskey).mockRejectedValue(error)

    await expect(authenticateWithPasskey(Action.WALLET_SIGNIN)).rejects.toBe(error)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('rethrows a cancelled native prompt but logs it only at debug', async () => {
    const rejection = { error: 'UserCancelled', message: 'The user cancelled the request.' }
    vi.mocked(authenticatePasskey).mockRejectedValue(rejection)

    await expect(authenticateWithPasskey(Action.WALLET_SIGNIN)).rejects.toBe(rejection)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('still resolves undefined on AbortError', async () => {
    // simplewebauthn's WebAuthnError keeps the DOMException name
    vi.mocked(authenticatePasskey).mockRejectedValue(
      Object.assign(new Error('Authentication ceremony was sent an abort signal'), { name: 'AbortError' }),
    )

    await expect(authenticateWithPasskey(Action.WALLET_SIGNIN)).resolves.toBeUndefined()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs a real failure at error and rethrows it', async () => {
    const error = new Error('boom')
    vi.mocked(authenticatePasskey).mockRejectedValue(error)

    await expect(authenticateWithPasskey(Action.WALLET_SIGNIN, { walletId: 'wallet-1' })).rejects.toBe(error)
    expect(logger.error).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: { file: 'passkeySession.ts', function: 'authenticateWithPasskey' },
        extra: expect.objectContaining({ walletId: 'wallet-1', errName: 'Error', errMessage: 'boom' }),
      }),
    )
  })
})
