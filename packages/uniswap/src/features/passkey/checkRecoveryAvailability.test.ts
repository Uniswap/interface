import { EmbeddedWalletApiClient } from 'uniswap/src/data/rest/embeddedWallet/requests'
import { checkRecoveryAvailability } from 'uniswap/src/features/passkey/checkRecoveryAvailability'
import { hashAuthMethodId } from 'uniswap/src/features/passkey/pinCrypto'

vi.mock('uniswap/src/data/rest/embeddedWallet/requests', () => ({
  EmbeddedWalletApiClient: {
    fetchCheckRecoveryAvailability: vi.fn(),
  },
}))

describe('checkRecoveryAvailability', () => {
  const identifier = 'user@example.com'
  const accessToken = 'access-token'

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns { available: true } when the server reports availability', async () => {
    vi.mocked(EmbeddedWalletApiClient.fetchCheckRecoveryAvailability).mockResolvedValue({ available: true } as never)
    const result = await checkRecoveryAvailability({ identifier, accessToken })
    expect(result).toEqual({ available: true })
    expect(EmbeddedWalletApiClient.fetchCheckRecoveryAvailability).toHaveBeenCalledWith(
      { authMethodId: hashAuthMethodId(identifier) },
      accessToken,
    )
  })

  it('returns { available: false } when the server reports the factor is in use', async () => {
    vi.mocked(EmbeddedWalletApiClient.fetchCheckRecoveryAvailability).mockResolvedValue({ available: false } as never)
    const result = await checkRecoveryAvailability({ identifier, accessToken })
    expect(result).toEqual({ available: false })
  })

  it('propagates server errors to the caller', async () => {
    const error = new Error('Token does not match auth method')
    vi.mocked(EmbeddedWalletApiClient.fetchCheckRecoveryAvailability).mockRejectedValue(error)
    await expect(checkRecoveryAvailability({ identifier, accessToken })).rejects.toThrow(
      'Token does not match auth method',
    )
  })
})
