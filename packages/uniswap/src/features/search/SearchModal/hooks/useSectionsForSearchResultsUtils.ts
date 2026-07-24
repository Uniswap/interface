import type { GqlResult } from '@universe/api'
import { isWebApp } from '@universe/environment'
import type { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { NUMBER_OF_RESULTS_ALL_TAB } from 'uniswap/src/features/search/SearchModal/constants'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { noop } from 'utilities/src/react/noop'

export type SearchModalSectionResult = GqlResult<OnchainItemSection<SearchModalOption>[]>
export type SearchModalSections = OnchainItemSection<SearchModalOption>[] | undefined

export function isActiveSearchTab(activeTab: SearchTab, searchTab: SearchTab): boolean {
  return activeTab === searchTab || activeTab === SearchTab.All
}

export function shouldSkipSearch({
  activeTab,
  enabled = true,
  searchFilter,
  searchTab,
}: {
  activeTab: SearchTab
  enabled?: boolean
  searchFilter: string | null
  searchTab: SearchTab
}): boolean {
  return !enabled || !searchFilter || !isActiveSearchTab(activeTab, searchTab)
}

export function shouldSkipFlatTokenSearch({
  skipTokenSearch,
  useMultichainPath,
}: {
  skipTokenSearch: boolean
  useMultichainPath: boolean
}): boolean {
  return skipTokenSearch || useMultichainPath
}

export function shouldSkipMultichainTokenSearch({
  skipTokenSearch,
  useMultichainPath,
}: {
  skipTokenSearch: boolean
  useMultichainPath: boolean
}): boolean {
  return skipTokenSearch || !useMultichainPath
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

export type TokenSearchState = {
  refetchSearchTokens: SearchModalSectionResult['refetch']
  searchTokensError: SearchModalSectionResult['error']
  searchTokensLoading: boolean
}

export function getTokenSearchState({
  flatSearchTokensError,
  flatSearchTokensLoading,
  multichainTokensError,
  multichainTokensLoading,
  refetchFlatSearchTokens,
  refetchMultichainTokens,
  useMultichainPath,
}: {
  flatSearchTokensError: SearchModalSectionResult['error']
  flatSearchTokensLoading: boolean
  multichainTokensError: SearchModalSectionResult['error']
  multichainTokensLoading: boolean
  refetchFlatSearchTokens: SearchModalSectionResult['refetch']
  refetchMultichainTokens: SearchModalSectionResult['refetch']
  useMultichainPath: boolean
}): TokenSearchState {
  return useMultichainPath
    ? {
        searchTokensError: multichainTokensError,
        searchTokensLoading: multichainTokensLoading,
        refetchSearchTokens: refetchMultichainTokens,
      }
    : {
        searchTokensError: flatSearchTokensError,
        searchTokensLoading: flatSearchTokensLoading,
        refetchSearchTokens: refetchFlatSearchTokens,
      }
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

export function refetchAuctionsIfEnabled({
  auctionSearchEnabled,
  refetchSearchAuctions,
}: {
  auctionSearchEnabled: boolean
  refetchSearchAuctions: SearchModalSectionResult['refetch']
}): void {
  if (auctionSearchEnabled) {
    refetchSearchAuctions?.()
  }
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
  refetchAll: SearchModalSectionResult['refetch']
  refetchSearchAuctions: SearchModalSectionResult['refetch']
  refetchSearchPools: SearchModalSectionResult['refetch']
  refetchSearchTokens: SearchModalSectionResult['refetch']
  searchAuctionsError: SearchModalSectionResult['error']
  searchAuctionsLoading: boolean
  searchPoolsError: SearchModalSectionResult['error']
  searchPoolsLoading: boolean
  searchTokensError: SearchModalSectionResult['error']
  searchTokensLoading: boolean
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
  refetchAll,
  refetchSearchAuctions,
  refetchSearchPools,
  refetchSearchTokens,
  searchAuctionsError,
  searchAuctionsLoading,
  searchPoolsError,
  searchPoolsLoading,
  searchTokensError,
  searchTokensLoading,
  tokenOptionsLength,
  tokenSearchResultsSection,
  walletSearchResultsLoading,
  walletSearchResultsSection,
}: SearchResultsForActiveTabParams): SearchModalSectionResult {
  switch (activeTab) {
    case SearchTab.All:
      return {
        data: !searchTokensLoading ? allSections : [],
        loading: searchTokensLoading || walletSearchResultsLoading,
        error: (!tokenOptionsLength && searchTokensError) || undefined,
        refetch: refetchAll,
      }
    case SearchTab.Tokens:
      return {
        data: [...(earnSearchResultsSection ?? []), ...(tokenSearchResultsSection ?? [])],
        loading: searchTokensLoading,
        error: (!tokenOptionsLength && searchTokensError) || undefined,
        refetch: refetchSearchTokens,
      }
    case SearchTab.Pools:
      return {
        data: poolSearchResultsSection ?? [],
        loading: searchPoolsLoading || (poolSearchOptionsLength === 0 && poolSearchResultsLength !== 0),
        error: (!poolSearchResultsSection && searchPoolsError) || undefined,
        refetch: refetchSearchPools,
      }
    case SearchTab.Wallets:
      return {
        data: walletSearchResultsSection ?? [],
        loading: walletSearchResultsLoading,
        refetch: noop,
      }
    case SearchTab.Auctions:
      return {
        data: auctionSearchResultsSection ?? [],
        loading: auctionSearchEnabled && searchAuctionsLoading,
        error: auctionSearchEnabled ? (searchAuctionsError ?? undefined) : undefined,
        refetch: refetchSearchAuctions,
      }
    default:
      return {
        data: [],
        loading: false,
        error: undefined,
        refetch: noop,
      }
  }
}
