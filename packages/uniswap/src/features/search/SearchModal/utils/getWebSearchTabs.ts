import { isSVMChain, type UniverseChainId } from '@universe/chains'
import { SearchTab, WEB_SEARCH_TABS } from 'uniswap/src/features/search/SearchModal/types'

/** Tabs for the web search modal; Solana has no pools or auctions, so those tabs are hidden when it is the chain filter. */
export function getWebSearchTabs({
  isAuctionSearchEnabled,
  chainFilter,
}: {
  isAuctionSearchEnabled: boolean
  chainFilter: UniverseChainId | null
}): SearchTab[] {
  const isSolanaFilter = chainFilter !== null && isSVMChain(chainFilter)
  return WEB_SEARCH_TABS.filter((tab) => {
    switch (tab) {
      case SearchTab.Pools:
        return !isSolanaFilter
      case SearchTab.Auctions:
        return isAuctionSearchEnabled && !isSolanaFilter
      default:
        return true
    }
  })
}
