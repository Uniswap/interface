import { GqlResult } from '@universe/api'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useCurrencyInfosToTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { mergeSearchResultsWithBridgingTokens } from 'uniswap/src/components/TokenSelector/utils'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export function useTokenSectionsForSearchResults({
  evmAddress,
  svmAddress,
  chainFilter,
  searchFilter,
  isBalancesOnlySearch,
  input,
}: {
  evmAddress?: string
  svmAddress?: string
  chainFilter: UniverseChainId | null
  searchFilter: string | null
  isBalancesOnlySearch: boolean
  input?: TradeableAsset
}): GqlResult<OnchainItemSection<TokenOption>[]> {
  const { t } = useTranslation()

  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: refetchPortfolioBalances,
    loading: portfolioBalancesByIdLoading,
  } = usePortfolioBalancesForAddressById({ evmAddress, svmAddress })

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions({ evmAddress, svmAddress, chainFilter, searchFilter: searchFilter ?? undefined })

  // Bridging tokens are only shown if input is provided
  const {
    data: bridgingTokenOptions,
    error: bridgingTokenOptionsError,
    refetch: refetchBridgingTokenOptions,
    loading: bridgingTokenOptionsLoading,
  } = useBridgingTokensOptions({ oppositeSelectedToken: input, evmAddress, svmAddress, chainFilter })

  // Only call search endpoint if isBalancesOnlySearch is false
  const {
    data: searchResultCurrencies,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useSearchTokens({
    searchQuery: searchFilter,
    chainFilter,
    skip: isBalancesOnlySearch,
    hideWSOL: true, // Hide WSOL in token selector
  })

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

  const loading =
    portfolioTokenOptionsLoading ||
    portfolioBalancesByIdLoading ||
    (!isBalancesOnlySearch && searchTokensLoading) ||
    bridgingTokenOptionsLoading

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
    const sections =
      mergeSearchResultsWithBridgingTokens({
        searchResults: searchResultsSections,
        bridgingTokens: bridgingTokenOptions,
        sectionHeaderString: searchResultsSectionHeader,
      }) ?? []

    // Add other networks section if it exists
    if (otherNetworksSection?.length) {
      sections.push(...otherNetworksSection)
    }

    return sections
  }, [searchResultsSections, bridgingTokenOptions, searchResultsSectionHeader, otherNetworksSection])

  const error =
    (!bridgingTokenOptions && bridgingTokenOptionsError) ||
    (!portfolioBalancesById && portfolioBalancesByIdError) ||
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!isBalancesOnlySearch && !searchResults && searchTokensError)

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
