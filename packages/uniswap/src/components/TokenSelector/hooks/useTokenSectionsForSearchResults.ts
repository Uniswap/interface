import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { mergeSearchResultsWithBridgingTokens } from 'uniswap/src/components/TokenSelector/utils'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { GqlResult } from 'uniswap/src/data/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useSearchTokensGql } from 'uniswap/src/features/dataApi/searchTokensGql'
import { useSearchTokensRest } from 'uniswap/src/features/dataApi/searchTokensRest'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { isAddress } from 'utilities/src/addresses'

function mergeSafetyInfo(primary: CurrencyInfo, secondary: CurrencyInfo): CurrencyInfo['safetyInfo'] {
  const primarySafetyInfo = primary.safetyInfo
  const secondarySafetyInfo = secondary.safetyInfo

  if (!primarySafetyInfo) {
    return secondarySafetyInfo
  }

  if (primarySafetyInfo.tokenList === TokenList.NonDefault && secondarySafetyInfo?.tokenList === TokenList.Default) {
    return secondarySafetyInfo
  }

  return primarySafetyInfo
}

function mergeCurrencyInfo(primary: CurrencyInfo, secondary: CurrencyInfo): CurrencyInfo {
  const primaryHasDisplayMetadata = Boolean(primary.currency.name || primary.currency.symbol)
  const secondaryHasDisplayMetadata = Boolean(secondary.currency.name || secondary.currency.symbol)
  const base = !primaryHasDisplayMetadata && secondaryHasDisplayMetadata ? secondary : primary
  const fallback = base === primary ? secondary : primary

  return {
    ...base,
    logoUrl: base.logoUrl || fallback.logoUrl,
    safetyInfo: mergeSafetyInfo(base, fallback),
    isSpam: base.isSpam ?? fallback.isSpam,
    spamCode: base.spamCode ?? fallback.spamCode,
    isFromOtherNetwork: base.isFromOtherNetwork ?? fallback.isFromOtherNetwork,
  }
}

function getCurrencySearchResultKey(currencyInfo: CurrencyInfo): string {
  if (currencyInfo.currency.isToken) {
    return `${currencyInfo.currency.chainId}:${currencyInfo.currency.address.toLowerCase()}`
  }

  return currencyInfo.currencyId
}

export function mergeCurrencySearchResults(
  primary: CurrencyInfo[] | undefined,
  secondary: CurrencyInfo[] | undefined,
): CurrencyInfo[] | undefined {
  if (!primary?.length) {
    return secondary
  }
  if (!secondary?.length) {
    return primary
  }

  const merged = new Map<string, CurrencyInfo>()

  for (const currencyInfo of primary) {
    merged.set(getCurrencySearchResultKey(currencyInfo), currencyInfo)
  }

  for (const currencyInfo of secondary) {
    const key = getCurrencySearchResultKey(currencyInfo)
    const existing = merged.get(key)
    merged.set(key, existing ? mergeCurrencyInfo(existing, currencyInfo) : currencyInfo)
  }

  return Array.from(merged.values())
}

function hasExactAddressMatchOnChain({
  chainFilter,
  searchFilter,
  currencyInfos,
}: {
  chainFilter: UniverseChainId | null
  searchFilter: string | null
  currencyInfos: CurrencyInfo[] | undefined
}): boolean {
  if (!chainFilter || !isAddress(searchFilter) || !currencyInfos?.length) {
    return false
  }

  return currencyInfos.some(
    (currencyInfo) =>
      currencyInfo.currency.isToken &&
      currencyInfo.currency.chainId === chainFilter &&
      areAddressesEqual(currencyInfo.currency.address, searchFilter),
  )
}

function filterToExactAddressMatches({
  chainFilter,
  searchFilter,
  currencyInfos,
}: {
  chainFilter: UniverseChainId | null
  searchFilter: string | null
  currencyInfos: CurrencyInfo[] | undefined
}): CurrencyInfo[] | undefined {
  if (!chainFilter || !isAddress(searchFilter)) {
    return currencyInfos
  }

  return currencyInfos?.filter(
    (currencyInfo) =>
      currencyInfo.currency.isToken &&
      currencyInfo.currency.chainId === chainFilter &&
      areAddressesEqual(currencyInfo.currency.address, searchFilter),
  )
}

function mergeTokenSearchSources({
  primarySearchResultCurrencies,
  localSearchResultCurrencies,
  fallbackSearchResultCurrencies,
}: {
  primarySearchResultCurrencies: CurrencyInfo[] | undefined
  localSearchResultCurrencies: CurrencyInfo[] | undefined
  fallbackSearchResultCurrencies: CurrencyInfo[] | undefined
}): CurrencyInfo[] | undefined {
  return mergeCurrencySearchResults(
    mergeCurrencySearchResults(primarySearchResultCurrencies, localSearchResultCurrencies),
    fallbackSearchResultCurrencies,
  )
}

function getSearchSourceState({
  searchResultCurrenciesGql,
  searchTokensErrorGql,
  searchTokensLoadingGql,
  searchResultCurrenciesRest,
  searchTokensErrorRest,
  searchTokensLoadingRest,
}: {
  searchResultCurrenciesGql: CurrencyInfo[] | undefined
  searchTokensErrorGql: GqlResult<CurrencyInfo[]>['error']
  searchTokensLoadingGql: boolean
  searchResultCurrenciesRest: CurrencyInfo[] | undefined
  searchTokensErrorRest: GqlResult<CurrencyInfo[]>['error']
  searchTokensLoadingRest: boolean
}): {
  primarySearchResultCurrencies: CurrencyInfo[] | undefined
  fallbackSearchResultCurrencies: CurrencyInfo[] | undefined
  primarySearchTokensError: GqlResult<CurrencyInfo[]>['error']
  fallbackSearchTokensError: GqlResult<CurrencyInfo[]>['error']
  primarySearchTokensLoading: boolean
  fallbackSearchTokensLoading: boolean
} {
  return {
    primarySearchResultCurrencies: searchResultCurrenciesRest,
    fallbackSearchResultCurrencies: searchResultCurrenciesGql,
    primarySearchTokensError: searchTokensErrorRest,
    fallbackSearchTokensError: searchTokensErrorGql,
    primarySearchTokensLoading: searchTokensLoadingRest,
    fallbackSearchTokensLoading: searchTokensLoadingGql,
  }
}

function getTokenSectionsLoading({
  portfolioTokenOptionsLoading,
  portfolioBalancesByIdLoading,
  isBalancesOnlySearch,
  searchTokensLoading,
  bridgingTokenOptionsLoading,
}: {
  portfolioTokenOptionsLoading: boolean
  portfolioBalancesByIdLoading: boolean
  isBalancesOnlySearch: boolean
  searchTokensLoading: boolean
  bridgingTokenOptionsLoading: boolean
}): boolean {
  return (
    portfolioTokenOptionsLoading ||
    portfolioBalancesByIdLoading ||
    (!isBalancesOnlySearch && searchTokensLoading) ||
    bridgingTokenOptionsLoading
  )
}

function getTokenSectionsError({
  bridgingTokenOptions,
  bridgingTokenOptionsError,
  portfolioBalancesById,
  portfolioBalancesByIdError,
  portfolioTokenOptions,
  portfolioTokenOptionsError,
  isBalancesOnlySearch,
  searchResults,
  searchTokensError,
}: {
  bridgingTokenOptions: TokenOption[] | undefined
  bridgingTokenOptionsError: GqlResult<TokenOption[] | undefined>['error']
  portfolioBalancesById: ReturnType<typeof usePortfolioBalancesForAddressById>['data']
  portfolioBalancesByIdError: ReturnType<typeof usePortfolioBalancesForAddressById>['error']
  portfolioTokenOptions: TokenOption[] | undefined
  portfolioTokenOptionsError: GqlResult<TokenOption[] | undefined>['error']
  isBalancesOnlySearch: boolean
  searchResults: TokenOption[] | undefined
  searchTokensError: GqlResult<CurrencyInfo[]>['error']
}): GqlResult<OnchainItemSection<TokenOption>[]>['error'] {
  return (
    (!bridgingTokenOptions && bridgingTokenOptionsError) ||
    (!portfolioBalancesById && portfolioBalancesByIdError) ||
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!isBalancesOnlySearch && !searchResults && searchTokensError) ||
    undefined
  )
}

export function useTokenSectionsForSearchResults(
  address: string | undefined,
  chainFilter: UniverseChainId | null,
  searchFilter: string | null,
  isBalancesOnlySearch: boolean,
  input: TradeableAsset | undefined,
): GqlResult<OnchainItemSection<TokenOption>[]> {
  const { t } = useTranslation()
  const searchLocalTokenSelectorResults = useUniswapContextSelector((ctx) => ctx.searchLocalTokenSelectorResults)

  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: refetchPortfolioBalances,
    loading: portfolioBalancesByIdLoading,
  } = usePortfolioBalancesForAddressById(address)

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions(address, chainFilter, searchFilter ?? undefined)

  // Bridging tokens are only shown if input is provided
  const {
    data: bridgingTokenOptions,
    error: bridgingTokenOptionsError,
    refetch: refetchBridgingTokenOptions,
    loading: bridgingTokenOptionsLoading,
  } = useBridgingTokensOptions({ oppositeSelectedToken: input, walletAddress: address, chainFilter })

  // Only call search endpoint if isBalancesOnlySearch is false
  const {
    data: searchResultCurrenciesGql,
    error: searchTokensErrorGql,
    refetch: refetchSearchTokensGql,
    loading: searchTokensLoadingGql,
  } = useSearchTokensGql(searchFilter, chainFilter, /*skip*/ isBalancesOnlySearch)

  const {
    data: searchResultCurrenciesRest,
    error: searchTokensErrorRest,
    refetch: refetchSearchTokensRest,
    loading: searchTokensLoadingRest,
  } = useSearchTokensRest({
    searchQuery: searchFilter,
    chainFilter,
    skip: isBalancesOnlySearch,
  })

  const {
    primarySearchResultCurrencies,
    fallbackSearchResultCurrencies,
    primarySearchTokensError,
    fallbackSearchTokensError,
    primarySearchTokensLoading,
    fallbackSearchTokensLoading,
  } = getSearchSourceState({
    searchResultCurrenciesGql,
    searchTokensErrorGql,
    searchTokensLoadingGql,
    searchResultCurrenciesRest,
    searchTokensErrorRest,
    searchTokensLoadingRest,
  })
  const localSearchResultCurrencies = useMemo(
    () => searchLocalTokenSelectorResults?.({ chainFilter, searchFilter }),
    [chainFilter, searchFilter, searchLocalTokenSelectorResults],
  )
  const hasExactLocalAddressMatchOnSelectedChain = useMemo(
    () =>
      hasExactAddressMatchOnChain({
        chainFilter,
        searchFilter,
        currencyInfos: localSearchResultCurrencies,
      }),
    [chainFilter, localSearchResultCurrencies, searchFilter],
  )

  const searchResultCurrencies = useMemo(() => {
    const mergedSearchResults = mergeTokenSearchSources({
      primarySearchResultCurrencies,
      localSearchResultCurrencies,
      fallbackSearchResultCurrencies,
    })

    if (!hasExactLocalAddressMatchOnSelectedChain || !chainFilter || !isAddress(searchFilter)) {
      return mergedSearchResults
    }

    return filterToExactAddressMatches({
      chainFilter,
      searchFilter,
      currencyInfos: localSearchResultCurrencies,
    })
  }, [
    chainFilter,
    fallbackSearchResultCurrencies,
    hasExactLocalAddressMatchOnSelectedChain,
    localSearchResultCurrencies,
    primarySearchResultCurrencies,
    searchFilter,
  ])

  const searchTokensError = primarySearchTokensError ?? fallbackSearchTokensError

  const refetchSearchTokens = useCallback(() => {
    refetchSearchTokensRest?.()
    refetchSearchTokensGql?.()
  }, [refetchSearchTokensGql, refetchSearchTokensRest])

  const searchTokensLoading =
    primarySearchTokensLoading || (fallbackSearchTokensLoading && !primarySearchResultCurrencies?.length)

  const [selectedNetworkResults, otherNetworksSearchResults] = useMemo((): [CurrencyInfo[], CurrencyInfo[]] => {
    if (!searchResultCurrencies) {
      return [[], []]
    }

    const selected = searchResultCurrencies.filter((currency) => !currency.isFromOtherNetwork)
    const other = searchResultCurrencies.filter((currency) => currency.isFromOtherNetwork)

    return [selected, other]
  }, [searchResultCurrencies])

  const searchResults = useCurrencyInfosToTokenOptions({
    currencyInfos: selectedNetworkResults,
    portfolioBalancesById,
  })

  // Format other networks search results if they exist
  const otherNetworksResults = useCurrencyInfosToTokenOptions({
    currencyInfos: otherNetworksSearchResults,
    portfolioBalancesById,
  })

  const loading = getTokenSectionsLoading({
    portfolioTokenOptionsLoading,
    portfolioBalancesByIdLoading,
    isBalancesOnlySearch,
    searchTokensLoading,
    bridgingTokenOptionsLoading,
  })

  const searchResultsSections = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.SearchResults,
    // Use local search when only searching balances
    options: isBalancesOnlySearch ? portfolioTokenOptions : searchResults,
  })

  // Create section for other chains search results if they exist
  const otherNetworksSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.OtherChainsTokens,
    options: otherNetworksResults,
  })

  // If there are bridging options, we need to extract them from the search results and then prepend them as a new section above.
  // The remaining non-bridging search results will be shown in a section with a different name
  const networkName = chainFilter ? getChainLabel(chainFilter) : undefined
  const searchResultsSectionHeader = networkName
    ? t('tokens.selector.section.otherSearchResults', { network: networkName })
    : undefined

  const allSections = useMemo(() => {
    // Start with existing sections (bridging tokens + search results)
    let sections =
      mergeSearchResultsWithBridgingTokens(searchResultsSections, bridgingTokenOptions, searchResultsSectionHeader) ??
      []

    // Add other networks section if it exists
    if (otherNetworksSection?.length) {
      sections = [...sections, ...otherNetworksSection]
    }

    return sections
  }, [searchResultsSections, bridgingTokenOptions, searchResultsSectionHeader, otherNetworksSection])

  const error = getTokenSectionsError({
    bridgingTokenOptions,
    bridgingTokenOptionsError,
    portfolioBalancesById,
    portfolioBalancesByIdError,
    portfolioTokenOptions,
    portfolioTokenOptionsError,
    isBalancesOnlySearch,
    searchResults,
    searchTokensError,
  })

  const refetchAll = useCallback(() => {
    refetchPortfolioBalances?.()
    refetchSearchTokens?.()
    refetchPortfolioTokenOptions?.()
    refetchBridgingTokenOptions?.()
  }, [refetchBridgingTokenOptions, refetchPortfolioBalances, refetchPortfolioTokenOptions, refetchSearchTokens])

  return useMemo(
    () => ({
      data: allSections,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }),
    [error, loading, refetchAll, allSections],
  )
}
