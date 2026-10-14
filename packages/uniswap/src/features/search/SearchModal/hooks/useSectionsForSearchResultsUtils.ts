import { SearchType } from '@uniswap/client-data-api/dist/data/v2/search_pb'
import { isWebApp } from '@universe/environment'
import type { CategoryOption, SearchModalListOption, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { NUMBER_OF_RESULTS_ALL_TAB } from 'uniswap/src/features/search/SearchModal/constants'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { noop } from 'utilities/src/react/noop'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

/** Result of the search modal section hooks, which aggregate several queries into derived sections. */
export type SearchModalSectionResult = DerivedQueryResult<OnchainItemSection<SearchModalListOption>[]>
export type SearchModalSections = OnchainItemSection<SearchModalOption>[] | undefined

export function isActiveSearchTab(activeTab: SearchTab, searchTab: SearchTab): boolean {
  return activeTab === searchTab || activeTab === SearchTab.All
}

/** The Wallets tab is served by ENS / Unitag lookups alone, so the SearchService request is skipped there. */
export function shouldSkipSearch({
  activeTab,
  searchFilter,
}: {
  activeTab: SearchTab
  searchFilter: string | null
}): boolean {
  return !searchFilter || activeTab === SearchTab.Wallets
}

/** Result types one SearchService request should cover on this surface; pools and auctions are web-only. */
export function getSearchTypes({
  auctionSearchEnabled,
  categorySearchEnabled,
}: {
  auctionSearchEnabled: boolean
  categorySearchEnabled: boolean
}): SearchType[] {
  const types = [SearchType.TOKEN]
  if (isWebApp) {
    types.push(SearchType.POOL)
    if (auctionSearchEnabled) {
      types.push(SearchType.AUCTION)
    }
  }
  if (categorySearchEnabled) {
    types.push(SearchType.CATEGORY)
  }
  return types
}

export function shouldShowWalletSearch(searchFilter: string | null, lowercasedDisabledTerms: string[]): boolean {
  return !searchFilter || !lowercasedDisabledTerms.includes(searchFilter.toLowerCase())
}

export function getWalletSearchQuery({
  activeTab,
  searchFilter,
}: {
  activeTab: SearchTab
  searchFilter: string | null
}): string {
  return isActiveSearchTab(activeTab, SearchTab.Wallets) ? (searchFilter ?? '') : ''
}

export function getIsPoolAddressSearch({
  searchFilter,
  searchResultPoolsLength,
}: {
  searchFilter: string | null
  searchResultPoolsLength: number | undefined
}): boolean {
  if (!searchFilter || searchResultPoolsLength !== 1) {
    return false
  }

  const trimmedSearchFilter = searchFilter.trim()
  const addressWithPrefix =
    trimmedSearchFilter.startsWith('0x') || trimmedSearchFilter.startsWith('0X')
      ? trimmedSearchFilter
      : `0x${trimmedSearchFilter}`

  return addressWithPrefix.length === 42
}

export function getOptionsForActiveTab({
  activeTab,
  options,
}: {
  activeTab: SearchTab
  options: SearchModalOption[]
}): SearchModalOption[] {
  return activeTab === SearchTab.All ? options.slice(0, NUMBER_OF_RESULTS_ALL_TAB) : options
}

/** All tab only: the sections cut to `NUMBER_OF_RESULTS_ALL_TAB` rows, i.e. the ones with more to show in their own tab. */
export function getTruncatedSectionKeys({
  activeTab,
  tokenOptionsLength,
  poolOptionsLength,
  auctionOptionsLength,
}: {
  activeTab: SearchTab
  tokenOptionsLength: number
  poolOptionsLength: number
  auctionOptionsLength: number
}): OnchainItemSectionName[] {
  if (activeTab !== SearchTab.All) {
    return []
  }
  const optionsLengthBySection: [OnchainItemSectionName, number][] = [
    [OnchainItemSectionName.Tokens, tokenOptionsLength],
    [OnchainItemSectionName.Pools, poolOptionsLength],
    [OnchainItemSectionName.Auctions, auctionOptionsLength],
  ]
  return optionsLengthBySection
    .filter(([, optionsLength]) => optionsLength > NUMBER_OF_RESULTS_ALL_TAB)
    .map(([sectionKey]) => sectionKey)
}

function isExactCategoryMatch(category: CategoryOption['category'], normalizedQuery: string): boolean {
  return (
    category.englishName.toLowerCase() === normalizedQuery ||
    category.name.toLowerCase() === normalizedQuery ||
    category.id === normalizedQuery
  )
}

/**
 * All tab only. Category rows lead the token section, but only for categories whose English name, localized
 * name, or id the query matches exactly. The BE also returns categories matched through member tokens (e.g. "USDC" → Stablecoins)
 * and partial name matches ("s" → Stocks, Stablecoins, ...); those are dropped since they make short
 * queries noisy. BE order is kept among the rows that remain.
 */
export function withCategoryOptions({
  activeTab,
  categoryOptions,
  options,
  searchFilter,
}: {
  activeTab: SearchTab
  categoryOptions: CategoryOption[]
  options: SearchModalOption[]
  searchFilter: string | null
}): SearchModalOption[] {
  if (activeTab !== SearchTab.All || !categoryOptions.length) {
    return options
  }
  const normalizedQuery = searchFilter?.trim().toLowerCase() ?? ''
  const exactMatches = categoryOptions.filter((option) => isExactCategoryMatch(option.category, normalizedQuery))
  return exactMatches.length ? [...exactMatches, ...options] : options
}

export function getTokenOptions({
  isPoolAddressSearch,
  multichainSearchOptions,
  tokenSearchResults,
  useMultichainPath,
}: {
  isPoolAddressSearch: boolean
  multichainSearchOptions: SearchModalOption[] | undefined
  tokenSearchResults: SearchModalOption[] | undefined
  useMultichainPath: boolean
}): SearchModalOption[] {
  if (isPoolAddressSearch) {
    return []
  }

  return useMultichainPath ? (multichainSearchOptions ?? []) : (tokenSearchResults ?? [])
}

export function getAuctionOptions({
  activeTab,
  auctionSearchEnabled,
  auctionSearchResults,
}: {
  activeTab: SearchTab
  auctionSearchEnabled: boolean
  auctionSearchResults: SearchModalOption[] | undefined
}): SearchModalOption[] {
  if (!auctionSearchEnabled) {
    return []
  }

  return getOptionsForActiveTab({ activeTab, options: auctionSearchResults ?? [] })
}

export function getTokenAndPoolSections({
  poolSearchResultsSection,
  shouldPrioritizePools,
  tokenSearchResultsSection,
}: {
  poolSearchResultsSection: SearchModalSections
  shouldPrioritizePools: boolean
  tokenSearchResultsSection: SearchModalSections
}): OnchainItemSection<SearchModalOption>[] {
  if (!isWebApp) {
    return [...(tokenSearchResultsSection ?? [])]
  }

  return shouldPrioritizePools
    ? [...(poolSearchResultsSection ?? []), ...(tokenSearchResultsSection ?? [])]
    : [...(tokenSearchResultsSection ?? []), ...(poolSearchResultsSection ?? [])]
}

export function getAllSections({
  auctionSearchResultsSection,
  earnSearchResultsSection,
  shouldPrioritizeWallets,
  shouldShowWallets,
  tokenAndPoolSections,
  walletSearchResultsSection,
}: {
  auctionSearchResultsSection: SearchModalSections
  earnSearchResultsSection: SearchModalSections
  shouldPrioritizeWallets: boolean
  shouldShowWallets: boolean
  tokenAndPoolSections: OnchainItemSection<SearchModalOption>[]
  walletSearchResultsSection: SearchModalSections
}): OnchainItemSection<SearchModalOption>[] {
  // Earn always leads when present (vault share token searched by address).
  const earnSections = earnSearchResultsSection ?? []

  if (!shouldShowWallets) {
    return [...earnSections, ...tokenAndPoolSections, ...(auctionSearchResultsSection ?? [])]
  }

  if (shouldPrioritizeWallets) {
    return [
      ...earnSections,
      ...(walletSearchResultsSection ?? []),
      ...tokenAndPoolSections,
      ...(auctionSearchResultsSection ?? []),
    ]
  }

  return [
    ...earnSections,
    ...tokenAndPoolSections,
    ...(walletSearchResultsSection ?? []),
    ...(auctionSearchResultsSection ?? []),
  ]
}

export type SearchResultsForActiveTabParams = {
  activeTab: SearchTab
  allSections: OnchainItemSection<SearchModalOption>[]
  auctionSearchEnabled: boolean
  auctionSearchResultsSection: OnchainItemSection<SearchModalOption>[] | undefined
  earnSearchResultsSection: OnchainItemSection<SearchModalOption>[] | undefined
  poolSearchOptionsLength: number
  poolSearchResultsLength: number | undefined
  poolSearchResultsSection: OnchainItemSection<SearchModalOption>[] | undefined
  refetch: SearchModalSectionResult['refetch']
  /** State of the single SearchService request that serves tokens, pools, auctions and categories. */
  searchError: SearchModalSectionResult['error']
  searchLoading: boolean
  tokenOptionsLength: number
  tokenSearchResultsSection: OnchainItemSection<SearchModalOption>[] | undefined
  walletSearchResultsLoading: boolean
  walletSearchResultsSection: OnchainItemSection<SearchModalOption>[] | undefined
}

export function getSearchResultsForActiveTab({
  activeTab,
  allSections,
  auctionSearchEnabled,
  auctionSearchResultsSection,
  earnSearchResultsSection,
  poolSearchOptionsLength,
  poolSearchResultsLength,
  poolSearchResultsSection,
  refetch,
  searchError,
  searchLoading,
  tokenOptionsLength,
  tokenSearchResultsSection,
  walletSearchResultsLoading,
  walletSearchResultsSection,
}: SearchResultsForActiveTabParams): SearchModalSectionResult {
  switch (activeTab) {
    case SearchTab.All:
      return {
        data: !searchLoading ? allSections : [],
        isLoading: searchLoading || walletSearchResultsLoading,
        error: (!tokenOptionsLength && searchError) || null,
        refetch,
      }
    case SearchTab.Tokens:
      return {
        data: [...(earnSearchResultsSection ?? []), ...(tokenSearchResultsSection ?? [])],
        isLoading: searchLoading,
        error: (!tokenOptionsLength && searchError) || null,
        refetch,
      }
    case SearchTab.Pools:
      return {
        data: poolSearchResultsSection ?? [],
        isLoading: searchLoading || (poolSearchOptionsLength === 0 && poolSearchResultsLength !== 0),
        error: (!poolSearchResultsSection && searchError) || null,
        refetch,
      }
    case SearchTab.Wallets:
      return {
        data: walletSearchResultsSection ?? [],
        isLoading: walletSearchResultsLoading,
        error: null,
        refetch: noop,
      }
    case SearchTab.Auctions:
      return {
        data: auctionSearchResultsSection ?? [],
        isLoading: auctionSearchEnabled && searchLoading,
        error: auctionSearchEnabled ? searchError : null,
        refetch,
      }
    default:
      return {
        data: [],
        isLoading: false,
        error: null,
        refetch: noop,
      }
  }
}
