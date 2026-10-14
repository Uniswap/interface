import { areAddressesEqual, UniverseChainId } from '@universe/chains'
import {
  OnchainItemListOptionType,
  SearchModalListOption,
  SearchModalOption,
} from 'uniswap/src/components/lists/items/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { getRwaCollectionKey } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { isAddressTokenSearchQuery } from 'uniswap/src/features/search/utils'

/**
 * Resolves TDP network intent: recents override, then search network filter, then (only for **address** searches)
 * the row’s chain so symbol/name searches still open the aggregated multichain view. An address deployed on several
 * of the row's chains has no single matching chain, so it opens the aggregate view for the user to pick from.
 */
export function tdpChainFilterForTokenRow({
  searchChainFilter,
  rowChainId,
  explicitTdpChain,
  searchQuery,
  allowAggregate,
  addressMatchesMultipleChains,
}: {
  searchChainFilter: UniverseChainId | null
  rowChainId: number
  explicitTdpChain?: UniverseChainId
  searchQuery?: string
  allowAggregate?: boolean
  addressMatchesMultipleChains?: boolean
}): UniverseChainId | null | undefined {
  if (explicitTdpChain != null) {
    return explicitTdpChain
  }
  if (searchChainFilter != null) {
    return searchChainFilter
  }
  if (isAddressTokenSearchQuery(searchQuery) && !addressMatchesMultipleChains) {
    return isUniverseChainId(rowChainId) ? rowChainId : undefined
  }
  return allowAggregate ? null : undefined
}

/** True when the searched address is deployed on more than one of the row's chains (e.g. CREATE2 deployments). */
export function addressSearchMatchesMultipleChains({
  searchQuery,
  deployments,
}: {
  searchQuery?: string
  deployments: { chainId: number; address: string }[]
}): boolean {
  const query = searchQuery?.trim()
  if (!query) {
    return false
  }
  let matches = 0
  for (const { chainId, address } of deployments) {
    if (!isUniverseChainId(chainId)) {
      continue
    }
    if (areAddressesEqual({ addressInput1: { address, chainId }, addressInput2: { address: query, chainId } })) {
      matches++
      if (matches > 1) {
        return true
      }
    }
  }
  return false
}

export function toggleKeyInList(list: string[], itemKey: string): string[] {
  return list.includes(itemKey) ? list.filter((existing) => existing !== itemKey) : [...list, itemKey]
}

/** Only the recents section emits an array row, so one stable key suffices. */
export const RECENT_SEARCH_PILL_ROW_KEY = 'recent-search-pill-row'

/**
 * Row key for the search modal list. The pill row's key is stable rather than derived from its members: a member
 * key would remount the row (resetting its scroll offset) on every history write, while the changed members already
 * re-render it through props.
 */
export function searchModalListOptionKey(item: SearchModalListOption): string {
  return Array.isArray(item) ? RECENT_SEARCH_PILL_ROW_KEY : searchModalOptionKey(item)
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
    case OnchainItemListOptionType.MultichainToken: {
      // History dedupes on id + tdpChainFilter, so the same token can recur filtered and unfiltered.
      const chainSuffix = item.tdpChainFilter != null ? `-${item.tdpChainFilter}` : ''
      const multichainId = item.multichainResult.id
      if (multichainId.trim()) {
        return `multichain-${multichainId}${chainSuffix}`
      }
      return `multichain-fallback-${item.primaryCurrencyInfo.currency.chainId}-${item.primaryCurrencyInfo.currencyId}${chainSuffix}`
    }
    case OnchainItemListOptionType.RwaCollection:
      return getRwaCollectionKey({ rwa: item.rwa })
    case OnchainItemListOptionType.Category:
      return `category-${item.category.id}`
    case OnchainItemListOptionType.WalletByAddress:
      return `wallet-${item.address}`
    case OnchainItemListOptionType.ENSAddress:
      return `ens-${item.address}`
    case OnchainItemListOptionType.Unitag:
      return `unitag-${item.address}`
    case OnchainItemListOptionType.Auction:
      return `auction-${item.chainId}-${item.auctionAddress}`
  }
}
