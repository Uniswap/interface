import { getDynamicConfigValue } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import {
  getWithdrawDestinationBalanceUsd,
  getWithdrawDestinationChainIds,
} from '~/features/earn/withdrawDestinationChains'

beforeEach(() => {
  // The global gating mock returns undefined; mirror the real contract of falling back to defaultValue
  vi.mocked(getDynamicConfigValue).mockImplementation(({ defaultValue }) => defaultValue)
})

describe(getWithdrawDestinationChainIds, () => {
  it('returns only mainnet chains when testnet mode is disabled', () => {
    const chainIds = getWithdrawDestinationChainIds({ isTestnetModeEnabled: false })

    expect(chainIds).toContain(UniverseChainId.Mainnet)
    expect(chainIds).toContain(UniverseChainId.Base)
    expect(chainIds).not.toContain(UniverseChainId.Sepolia)
    expect(chainIds).not.toContain(UniverseChainId.UnichainSepolia)
    expect(chainIds.every((chainId) => !isTestnetChain(chainId))).toBe(true)
  })

  it('returns only testnet chains when testnet mode is enabled', () => {
    const chainIds = getWithdrawDestinationChainIds({ isTestnetModeEnabled: true })

    expect(chainIds).toEqual([UniverseChainId.Sepolia, UniverseChainId.UnichainSepolia])
    expect(chainIds.every(isTestnetChain)).toBe(true)
  })
})

describe(getWithdrawDestinationBalanceUsd, () => {
  it('returns the selected destination chain balance from tiered network options', () => {
    expect(
      getWithdrawDestinationBalanceUsd({
        chainId: UniverseChainId.Base,
        tieredNetworkOptions: {
          withBalances: [
            { chainId: UniverseChainId.Mainnet, label: 'Ethereum', balanceUSD: 14.39 },
            { chainId: UniverseChainId.Base, label: 'Base', balanceUSD: 5.11 },
          ],
          otherNetworks: [{ chainId: UniverseChainId.ArbitrumOne, label: 'Arbitrum', balanceUSD: 0 }],
        },
      }),
    ).toBe(5.11)
  })

  it('returns undefined when the selected destination chain is not present', () => {
    expect(
      getWithdrawDestinationBalanceUsd({
        chainId: UniverseChainId.Optimism,
        tieredNetworkOptions: {
          withBalances: [],
          otherNetworks: [{ chainId: UniverseChainId.ArbitrumOne, label: 'Arbitrum', balanceUSD: 0 }],
        },
      }),
    ).toBeUndefined()
  })
})
