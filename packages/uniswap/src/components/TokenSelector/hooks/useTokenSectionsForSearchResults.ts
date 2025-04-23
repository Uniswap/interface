import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { TokenOptionSection, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import {
  formatSearchResults,
  mergeSearchResultsWithBridgingTokens,
  useTokenOptionsSection,
} from 'uniswap/src/components/TokenSelector/utils'
import { TokenOption } from 'uniswap/src/components/lists/types'
import { GqlResult } from 'uniswap/src/data/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export function useTokenSectionsForSearchResults(
  address: string | undefined,
  chainFilter: UniverseChainId | null,
  searchFilter: string | null,
  isBalancesOnlySearch: boolean,
  input: TradeableAsset | undefined,
): GqlResult<TokenSection<TokenOption>[]> {
  const { t } = useTranslation()

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
    data: searchResultCurrencies,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useSearchTokens(searchFilter, chainFilter, /*skip*/ isBalancesOnlySearch)

  const [selectedNetworkResults, otherNetworksSearchResults] = useMemo((): [CurrencyInfo[], CurrencyInfo[]] => {
    if (!searchResultCurrencies) {
      return [[], []]
    }

    const selected = searchResultCurrencies.filter((currency) => !currency.isFromOtherNetwork)
    const other = searchResultCurrencies.filter((currency) => currency.isFromOtherNetwork)

    return [selected, other]
  }, [searchResultCurrencies])

  const searchResults = useMemo(() => {
    return formatSearchResults(selectedNetworkResults, portfolioBalancesById)
  }, [selectedNetworkResults, portfolioBalancesById])

  // Format other networks search results if they exist
  const otherNetworksResults = useMemo(() => {
    return formatSearchResults(otherNetworksSearchResults, portfolioBalancesById)
  }, [otherNetworksSearchResults, portfolioBalancesById])

  const loading =
    portfolioTokenOptionsLoading ||
    portfolioBalancesByIdLoading ||
    (!isBalancesOnlySearch && searchTokensLoading) ||
    bridgingTokenOptionsLoading

  const searchResultsSections = useTokenOptionsSection({
    sectionKey: TokenOptionSection.SearchResults,
    // Use local search when only searching balances
    tokenOptions: isBalancesOnlySearch ? portfolioTokenOptions : searchResults,
  })

  // Create section for other chains search results if they exist
  const otherNetworksSection = useTokenOptionsSection({
    sectionKey: TokenOptionSection.OtherChainsTokens,
    tokenOptions: otherNetworksResults,
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
