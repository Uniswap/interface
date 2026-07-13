import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { EarnVaultOption, OnchainItemListOptionType, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { selectVaultByShareToken } from 'uniswap/src/features/earn/hooks/useTokenDetailsVaultShareData'
import { hasEarnPosition } from 'uniswap/src/features/earn/utils'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { isAddressTokenSearchQuery } from 'uniswap/src/features/search/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'

/** Currency ids represented by a token search option (single- or multi-chain). */
function getSearchOptionCurrencyIds(option: SearchModalOption): string[] {
  switch (option.type) {
    case OnchainItemListOptionType.Token:
      return [option.currencyInfo.currencyId]
    case OnchainItemListOptionType.MultichainToken:
      return option.multichainResult.tokens.map((token) => token.currencyId)
    default:
      return []
  }
}

/**
 * Detects when an address search resolves to a vault share token (e.g. GTUSDCP) and surfaces it as an Earn
 * opportunity for the vault's underlying asset (e.g. USDC). Returns at most one option — address searches
 * resolve to a single vault share token.
 */
export function useEarnSearchResults({
  searchFilter,
  activeTab,
  tokenOptions,
}: {
  searchFilter: string | null
  activeTab: SearchTab
  tokenOptions: readonly SearchModalOption[]
}): EarnVaultOption[] {
  const isEarnEnabled = useFeatureFlag(FeatureFlags.Earn)
  const { isTestnetModeEnabled } = useEnabledChains()
  const account = useWallet().evmAccount?.address

  const enabled =
    isEarnEnabled &&
    !isTestnetModeEnabled &&
    isAddressTokenSearchQuery(searchFilter) &&
    (activeTab === SearchTab.All || activeTab === SearchTab.Tokens)

  const tokenCurrencyIds = useMemo(
    () => (enabled ? tokenOptions.flatMap(getSearchOptionCurrencyIds) : []),
    [enabled, tokenOptions],
  )

  const { hasLoadedPositions, positionsByVaultId, vaults } = useEarnVaults({
    account,
    enabled: enabled && tokenCurrencyIds.length > 0,
  })

  const vault = useMemo(
    () => (enabled ? selectVaultByShareToken({ tokenCurrencyIds, vaults }) : undefined),
    [enabled, tokenCurrencyIds, vaults],
  )

  const underlyingCurrencyInfo = useCurrencyInfo(vault?.displayCurrencyId)

  return useMemo(() => {
    if (!vault) {
      return []
    }

    const position = positionsByVaultId.get(vault.id)
    const hasPosition = hasLoadedPositions && hasEarnPosition(position)
    const positionValueUsd = hasPosition ? position?.depositedUsd : undefined

    return [
      {
        type: OnchainItemListOptionType.EarnVault,
        vault,
        underlyingCurrencyInfo,
        apyPercent: vault.apyPercent,
        positionValueUsd,
        position: hasPosition ? position : undefined,
      },
    ]
  }, [vault, positionsByVaultId, hasLoadedPositions, underlyingCurrencyInfo])
}
