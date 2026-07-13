import { Currency } from '@uniswap/sdk-core'
import { OnchainItemListOptionType, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { getRwaCollectionKey } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { isAddressTokenSearchQuery } from 'uniswap/src/features/search/utils'

/**
 * Resolves TDP network intent: recents override, then search network filter, then (only for **address** searches)
 * the row’s chain so symbol/name searches still open the aggregated multichain view.
 */
export function tdpChainFilterForTokenRow({
  searchChainFilter,
  rowCurrency,
  explicitTdpChain,
  searchQuery,
  allowAggregate,
}: {
  searchChainFilter: UniverseChainId | null
  rowCurrency: Currency
  explicitTdpChain?: UniverseChainId
  searchQuery?: string
  allowAggregate?: boolean
}): UniverseChainId | null | undefined {
  if (explicitTdpChain != null) {
    return explicitTdpChain
  }
  if (searchChainFilter != null) {
    return searchChainFilter
  }
  if (isAddressTokenSearchQuery(searchQuery)) {
    return isUniverseChainId(rowCurrency.chainId) ? rowCurrency.chainId : undefined
  }
  return allowAggregate ? null : undefined
}

export function toggleKeyInList(list: string[], itemKey: string): string[] {
  return list.includes(itemKey) ? list.filter((existing) => existing !== itemKey) : [...list, itemKey]
}

// oxlint-disable-next-line typescript/consistent-return
export function searchModalOptionKey(item: SearchModalOption): string {
  switch (item.type) {
    case OnchainItemListOptionType.Pool:
      return `pool-${item.chainId}-${item.poolId}-${item.protocolVersion}-${item.hookAddress}-${item.feeTier}`
    case OnchainItemListOptionType.Token:
      return `token-${item.currencyInfo.currency.chainId}-${item.currencyInfo.currencyId}`
    case OnchainItemListOptionType.EarnVault:
      return `earn-vault-${item.vault.id}`
    case OnchainItemListOptionType.MultichainToken:
      return `multichain-${item.multichainResult.id}`
    case OnchainItemListOptionType.RwaCollection:
      return getRwaCollectionKey({ rwa: item.rwa })
    case OnchainItemListOptionType.WalletByAddress:
      return `wallet-${item.address}`
    case OnchainItemListOptionType.ENSAddress:
      return `ens-${item.address}`
    case OnchainItemListOptionType.Unitag:
      return `unitag-${item.address}`
  }
}
