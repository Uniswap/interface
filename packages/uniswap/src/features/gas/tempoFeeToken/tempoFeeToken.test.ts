import { UniverseChainId } from '@universe/chains'
import { OUSD_TEMPO, PATHUSD_TEMPO, USDC_E_TEMPO } from 'uniswap/src/constants/tokens'
import { fetchTempoFeeTokenPreference, getTempoFeeToken } from 'uniswap/src/features/gas/tempoFeeToken/tempoFeeToken'
import { viemClients } from 'uniswap/src/features/providers/viemClients'
import { Actions } from 'viem/tempo'

vi.mock('uniswap/src/features/providers/viemClients', () => ({
  viemClients: { getViemClient: vi.fn() },
}))

vi.mock('viem/tempo', () => ({
  Actions: { fee: { getUserToken: vi.fn() } },
}))

const mockGetViemClient = vi.mocked(viemClients.getViemClient, { partial: true })
const mockGetUserToken = vi.mocked(Actions.fee.getUserToken)

const OUSD_ADDRESS = '0x20c0000000000000000000006a37da5c996874be'
const OUSD_CHECKSUMMED = '0x20c0000000000000000000006a37DA5C996874BE'
const ACCOUNT = '0x889b6fb6af37bfaa257e1fcf2913afe0b42313cf'

describe('OUSD on Tempo', () => {
  it('is a 6-decimal TIP-20 at the OpenUSD address', () => {
    expect(OUSD_TEMPO.address.toLowerCase()).toBe(OUSD_ADDRESS)
    expect(OUSD_TEMPO.decimals).toBe(6)
    expect(OUSD_TEMPO.symbol).toBe('OUSD')
    expect(OUSD_TEMPO.chainId).toBe(UniverseChainId.Tempo)
  })
})

describe(fetchTempoFeeTokenPreference, () => {
  const tempoClient = { uid: 'tempo' }

  beforeEach(() => {
    mockGetUserToken.mockReset()
    mockGetViemClient.mockReset()
    mockGetViemClient.mockReturnValue(tempoClient)
  })

  it('reads the account fee token with getUserToken on the Tempo client', async () => {
    mockGetUserToken.mockResolvedValue({ address: OUSD_CHECKSUMMED, id: BigInt(1) })

    await fetchTempoFeeTokenPreference(ACCOUNT)

    expect(mockGetViemClient).toHaveBeenCalledWith(UniverseChainId.Tempo)
    expect(mockGetUserToken).toHaveBeenCalledWith(tempoClient, { account: ACCOUNT })
  })

  it('returns the stored fee token', async () => {
    mockGetUserToken.mockResolvedValue({ address: OUSD_CHECKSUMMED, id: BigInt(1) })
    await expect(fetchTempoFeeTokenPreference(ACCOUNT)).resolves.toBe(OUSD_CHECKSUMMED)
  })

  it('returns null when no fee token is stored', async () => {
    mockGetUserToken.mockResolvedValue(null)
    await expect(fetchTempoFeeTokenPreference(ACCOUNT)).resolves.toBeNull()
  })

  it('throws when no Tempo client is available', async () => {
    mockGetViemClient.mockImplementation(() => {
      throw new Error(`Viem client doesn't exist for chain ${UniverseChainId.Tempo}`)
    })
    await expect(fetchTempoFeeTokenPreference(ACCOUNT)).rejects.toThrow("Viem client doesn't exist")
  })

  it('propagates RPC failures', async () => {
    mockGetUserToken.mockRejectedValue(new Error('rpc down'))
    await expect(fetchTempoFeeTokenPreference(ACCOUNT)).rejects.toThrow('rpc down')
  })
})

describe(getTempoFeeToken, () => {
  it('resolves a known Tempo token regardless of address casing', () => {
    expect(getTempoFeeToken(OUSD_CHECKSUMMED)).toBe(OUSD_TEMPO)
    expect(getTempoFeeToken(PATHUSD_TEMPO.address)).toBe(PATHUSD_TEMPO)
    expect(getTempoFeeToken(USDC_E_TEMPO.address)).toBe(USDC_E_TEMPO)
  })

  it('treats an unknown fee token as a 6-decimal TIP-20', () => {
    const unknown = getTempoFeeToken('0x20c0000000000000000000001111111111111111')
    expect(unknown.chainId).toBe(UniverseChainId.Tempo)
    expect(unknown.decimals).toBe(6)
    expect(unknown.address.toLowerCase()).toBe('0x20c0000000000000000000001111111111111111')
  })
})
