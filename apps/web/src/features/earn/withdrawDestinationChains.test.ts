import { getDynamicConfigValue } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { getWithdrawDestinationChainIds } from '~/features/earn/withdrawDestinationChains'

beforeEach(() => {
  // The global gating mock returns undefined; mirror the real contract of falling back to defaultValue
  vi.mocked(getDynamicConfigValue).mockImplementation(({ defaultValue }) => defaultValue)
})

describe(getWithdrawDestinationChainIds, () => {
  it('returns only mainnet chains when testnet mode is disabled', () => {
    const chainIds = getWithdrawDestinationChainIds({
      isTestnetModeEnabled: false,
    })

    expect(chainIds).toContain(UniverseChainId.Mainnet)
    expect(chainIds).toContain(UniverseChainId.Base)
    expect(chainIds).not.toContain(UniverseChainId.Sepolia)
    expect(chainIds).not.toContain(UniverseChainId.UnichainSepolia)
    expect(chainIds.every((chainId) => !isTestnetChain(chainId))).toBe(true)
  })

  it('returns only testnet chains when testnet mode is enabled', () => {
    const chainIds = getWithdrawDestinationChainIds({
      isTestnetModeEnabled: true,
    })

    expect(chainIds).toEqual([UniverseChainId.Sepolia, UniverseChainId.UnichainSepolia])
    expect(chainIds.every(isTestnetChain)).toBe(true)
  })
})
