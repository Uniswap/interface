import { getFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEnabledChains } from 'uniswap/src/features/chains/utils'
import { getCapabilitiesCore } from 'wallet/src/features/batchedTransactions/utils'
import type { Capability } from 'wallet/src/features/dappRequests/types'
import { getEmbeddedWalletCapabilities } from '~/connection/getCapabilities'

vi.mock('wallet/src/features/batchedTransactions/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wallet/src/features/batchedTransactions/utils')>()),
  getCapabilitiesCore: vi.fn(),
}))
vi.mock('uniswap/src/features/chains/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/chains/utils')>()),
  getEnabledChains: vi.fn(),
}))
vi.mock('uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds')>()),
  getFeatureFlaggedChainIds: vi.fn(() => []),
}))

const ADDRESS = '0x1111111111111111111111111111111111111111'
const CAPABILITIES: Record<string, Capability> = { '0x1': { atomic: { status: 'ready' } } }

describe('getEmbeddedWalletCapabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCapabilitiesCore).mockResolvedValue(CAPABILITIES)
    vi.mocked(getEnabledChains).mockReturnValue({
      chains: [UniverseChainId.Mainnet, UniverseChainId.Base],
    } as unknown as ReturnType<typeof getEnabledChains>)
  })

  it('forwards caller-requested chain ids (decoded from hex) to getCapabilitiesCore with implicit consent', async () => {
    const result = await getEmbeddedWalletCapabilities({ address: ADDRESS, requestedChainIds: ['0x1', '0xa'] })

    expect(getCapabilitiesCore).toHaveBeenCalledWith({
      address: ADDRESS,
      chainIds: [1, 10],
      hasSmartWalletConsent: true,
    })
    expect(getEnabledChains).not.toHaveBeenCalled()
    expect(result).toBe(CAPABILITIES)
  })

  it('filters out invalid hex chain ids before decoding', async () => {
    await getEmbeddedWalletCapabilities({ address: ADDRESS, requestedChainIds: ['0x1', 'not-hex', '0x89'] })

    expect(getCapabilitiesCore).toHaveBeenCalledWith({
      address: ADDRESS,
      chainIds: [1, 137],
      hasSmartWalletConsent: true,
    })
  })

  it('falls back to enabled production (non-testnet) chains when none are requested', async () => {
    await getEmbeddedWalletCapabilities({ address: ADDRESS })

    expect(getEnabledChains).toHaveBeenCalledWith(expect.objectContaining({ isTestnetModeEnabled: false }))
    expect(getCapabilitiesCore).toHaveBeenCalledWith({
      address: ADDRESS,
      chainIds: [UniverseChainId.Mainnet, UniverseChainId.Base],
      hasSmartWalletConsent: true,
    })
  })

  it('falls back to enabled chains when requestedChainIds is empty', async () => {
    await getEmbeddedWalletCapabilities({ address: ADDRESS, requestedChainIds: [] })
    expect(getEnabledChains).toHaveBeenCalled()
  })

  it('falls back to enabled chains when all requested chain ids are invalid hex', async () => {
    await getEmbeddedWalletCapabilities({ address: ADDRESS, requestedChainIds: ['nope', '123'] })
    expect(getEnabledChains).toHaveBeenCalled()
  })
})
