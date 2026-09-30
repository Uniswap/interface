import { renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { USDC_MAINNET, WBTC } from 'uniswap/src/constants/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getSearchEarnApyPercent,
  useSearchEarnApy,
} from 'uniswap/src/features/search/SearchModal/hooks/useSearchEarnApy'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import type { MockedFunction } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('uniswap/src/features/earn/hooks/useEarnVaults', () => ({ useEarnVaults: vi.fn() }))
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({ useEnabledChains: vi.fn() }))

const mockUseEarnVaults = useEarnVaults as MockedFunction<typeof useEarnVaults>
const mockUseEnabledChains = useEnabledChains as MockedFunction<typeof useEnabledChains>

const USDC_ID = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)
const USDT_ID = buildCurrencyId(UniverseChainId.Mainnet, '0xdAC17F958D2ee523a2206206994597C13D831ec7')
const WBTC_ID = buildCurrencyId(UniverseChainId.Mainnet, WBTC.address)
const BASE_USDC_ID = buildCurrencyId(UniverseChainId.Base, USDC_MAINNET.address)

function vault(
  overrides: Partial<EarnVaultInfo> & Pick<EarnVaultInfo, 'id' | 'currencyId' | 'apyPercent'>,
): EarnVaultInfo {
  return {
    displayCurrencyId: overrides.currencyId,
    vaultAddress: overrides.id,
    chainId: UniverseChainId.Mainnet,
    exposureCurrencyIds: [],
    exposures: [],
    totalDepositsUsd: 0,
    liquidityUsd: 0,
    curator: { name: 'Gauntlet' },
    ...overrides,
  }
}

const USDC_VAULT = vault({ id: 'usdc-vault', currencyId: USDC_ID, apyPercent: 4.21 })
const USDC_VAULT_LOWER = vault({ id: 'usdc-vault-2', currencyId: USDC_ID, apyPercent: 3.1 })
const USDT_VAULT = vault({ id: 'usdt-vault', currencyId: USDT_ID, apyPercent: 5.5 })
const VAULTS = [USDC_VAULT_LOWER, USDC_VAULT, USDT_VAULT]

describe(getSearchEarnApyPercent, () => {
  it('returns the highest APY among vaults for the token', () => {
    expect(getSearchEarnApyPercent({ currencyIds: [USDC_ID], vaults: VAULTS })).toBe(4.21)
  })

  it("matches any of a multichain row's currency ids", () => {
    expect(getSearchEarnApyPercent({ currencyIds: [BASE_USDC_ID, USDC_ID], vaults: VAULTS })).toBe(4.21)
  })

  it('returns undefined when no vault accepts the token', () => {
    expect(getSearchEarnApyPercent({ currencyIds: [WBTC_ID], vaults: VAULTS })).toBeUndefined()
    expect(getSearchEarnApyPercent({ currencyIds: [BASE_USDC_ID], vaults: VAULTS })).toBeUndefined()
  })

  it('matches the vault display currency for wrapped-native vaults', () => {
    const wethVault = vault({
      id: 'weth-vault',
      currencyId: buildCurrencyId(UniverseChainId.Mainnet, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
      displayCurrencyId: buildNativeCurrencyId(UniverseChainId.Mainnet),
      apyPercent: 2,
    })
    expect(
      getSearchEarnApyPercent({ currencyIds: [buildNativeCurrencyId(UniverseChainId.Mainnet)], vaults: [wethVault] }),
    ).toBe(2)
  })
})

describe(useSearchEarnApy, () => {
  beforeEach(() => {
    mockUseEnabledChains.mockReturnValue({ isTestnetModeEnabled: false } as ReturnType<typeof useEnabledChains>)
    mockUseEarnVaults.mockReturnValue({ vaults: VAULTS } as unknown as ReturnType<typeof useEarnVaults>)
  })

  it('resolves the APY per row when enabled', () => {
    const { result } = renderHook(() => useSearchEarnApy({ enabled: true }))
    expect(result.current([USDC_ID])).toBe(4.21)
    expect(result.current([WBTC_ID])).toBeUndefined()
    expect(mockUseEarnVaults).toHaveBeenCalledWith({ enabled: true })
  })

  it('skips the vaults query and returns nothing when disabled', () => {
    const { result } = renderHook(() => useSearchEarnApy({ enabled: false }))
    expect(result.current([USDC_ID])).toBeUndefined()
    expect(mockUseEarnVaults).toHaveBeenCalledWith({ enabled: false })
  })

  it('skips the vaults query in testnet mode', () => {
    mockUseEnabledChains.mockReturnValue({ isTestnetModeEnabled: true } as ReturnType<typeof useEnabledChains>)
    renderHook(() => useSearchEarnApy({ enabled: true }))
    expect(mockUseEarnVaults).toHaveBeenCalledWith({ enabled: false })
  })
})
