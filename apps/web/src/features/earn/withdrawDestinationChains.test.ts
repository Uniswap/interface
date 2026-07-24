import { getDynamicConfigValue } from '@universe/gating'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { buildCurrencyId, buildWrappedNativeCurrencyIdWithThrow } from 'uniswap/src/utils/currencyId'
import {
  getSelectedWithdrawDestinationChainId,
  getWithdrawDestinationChainIds,
} from '~/features/earn/withdrawDestinationChains'

beforeEach(() => {
  // The global gating mock returns undefined; mirror the real contract of falling back to defaultValue
  vi.mocked(getDynamicConfigValue).mockImplementation(({ defaultValue }) => defaultValue)
})

function createStablecoinVault(symbol: 'USDC' | 'USDT'): { chainId: UniverseChainId; currencyId: string } {
  const token = getChainInfo(UniverseChainId.Mainnet).tokens[symbol]
  if (!token) {
    throw new Error('Expected stablecoin fixtures to be configured')
  }
  return {
    chainId: UniverseChainId.Mainnet,
    currencyId: buildCurrencyId(UniverseChainId.Mainnet, token.address),
  }
}

const WRAPPED_NATIVE_VAULT = {
  chainId: UniverseChainId.Mainnet,
  currencyId: buildWrappedNativeCurrencyIdWithThrow(UniverseChainId.Mainnet),
}

describe(getWithdrawDestinationChainIds, () => {
  it('returns only mainnet chains when testnet mode is disabled', () => {
    const chainIds = getWithdrawDestinationChainIds({
      isTestnetModeEnabled: false,
      vault: createStablecoinVault('USDC'),
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
      vault: WRAPPED_NATIVE_VAULT,
    })

    expect(chainIds).toEqual([UniverseChainId.Sepolia, UniverseChainId.UnichainSepolia])
    expect(chainIds.every(isTestnetChain)).toBe(true)
  })

  it('offers backend-supported destination tokens for the vault underlying', () => {
    const usdtChainIds = getWithdrawDestinationChainIds({
      isTestnetModeEnabled: false,
      vault: createStablecoinVault('USDT'),
    })
    expect(usdtChainIds).toContain(UniverseChainId.Mainnet)
    expect(usdtChainIds).toContain(UniverseChainId.Base)
    expect(usdtChainIds).toContain(UniverseChainId.Unichain)
    expect(usdtChainIds).toContain(UniverseChainId.Zksync)
    expect(usdtChainIds).not.toContain(UniverseChainId.Blast)

    const usdcChainIds = getWithdrawDestinationChainIds({
      isTestnetModeEnabled: false,
      vault: createStablecoinVault('USDC'),
    })
    expect(usdcChainIds).toContain(UniverseChainId.Unichain)
  })

  it('does not restore Mainnet when a USDT vault has no testnet destination', () => {
    const chainIds = getWithdrawDestinationChainIds({
      isTestnetModeEnabled: true,
      vault: createStablecoinVault('USDT'),
    })

    expect(chainIds).toEqual([])
    expect(
      getSelectedWithdrawDestinationChainId({
        initialChainId: UniverseChainId.Mainnet,
        selectedChainId: UniverseChainId.Mainnet,
        withdrawDestinationChainIds: chainIds,
      }),
    ).toBeUndefined()
  })
})

describe(getSelectedWithdrawDestinationChainId, () => {
  const withdrawDestinationChainIds = [UniverseChainId.Mainnet, UniverseChainId.Base]

  it('preserves a valid selected chain', () => {
    expect(
      getSelectedWithdrawDestinationChainId({
        initialChainId: UniverseChainId.Mainnet,
        selectedChainId: UniverseChainId.Base,
        withdrawDestinationChainIds,
      }),
    ).toBe(UniverseChainId.Base)
  })

  it('falls back to a valid initial chain', () => {
    expect(
      getSelectedWithdrawDestinationChainId({
        initialChainId: UniverseChainId.Mainnet,
        selectedChainId: UniverseChainId.Unichain,
        withdrawDestinationChainIds,
      }),
    ).toBe(UniverseChainId.Mainnet)
  })

  it('falls back to the first eligible chain', () => {
    expect(
      getSelectedWithdrawDestinationChainId({
        initialChainId: UniverseChainId.Unichain,
        selectedChainId: UniverseChainId.Unichain,
        withdrawDestinationChainIds,
      }),
    ).toBe(UniverseChainId.Mainnet)
  })
})
