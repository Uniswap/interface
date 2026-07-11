import { GqlResult } from '@universe/api'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import {
  currencyInfosToTokenOptions,
  useCurrencyInfosToTokenOptions,
} from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { mergeSearchResultsWithBridgingTokens } from 'uniswap/src/components/TokenSelector/utils'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useOnchainTokenSearchResults } from 'uniswap/src/features/dataApi/onchainTokenFallback'
import { useMultichainSearchTokens } from 'uniswap/src/features/dataApi/searchTokens'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { isWSOL } from 'uniswap/src/utils/isWSOL'

export function useTokenSectionsForSearchResults({
  addresses,
  chainFilter,
  searchFilter,
  isBalancesOnlySearch,
  input,
}: {
  addresses: AddressGroup
  chainFilter: UniverseChainId | null
  searchFilter: string | null
  isBalancesOnlySearch: boolean
  input?: TradeableAsset
}): GqlResult<OnchainItemSection<TokenOption>[]> {
  const { t } = useTranslation()

  const portfolioData = usePortfolioBalancesForAddressById(addresses)
  const {
    data: portfolioBalancesById,
    error: portfolioBalancesByIdError,
    refetch: refetchPortfolioBalances,
    loading: portfolioBalancesByIdLoading,
  } = portfolioData

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions({ chainFilter, searchFilter: searchFilter ?? undefined, portfolioData })

  // Bridging tokens are only shown if input is provided
  const {
    data: bridgingTokenOptions,
    error: bridgingTokenOptionsError,
    refetch: refetchBridgingTokenOptions,
    loading: bridgingTokenOptionsLoading,
  } = useBridgingTokensOptions({ oppositeSelectedToken: input, chainFilter, portfolioData })

  // Only call search endpoint if isBalancesOnlySearch is false
  const {
    data: searchResultsMultichain,
    error: searchTokensError,
    refetch: refetchSearchTokens,
    loading: searchTokensLoading,
  } = useMultichainSearchTokens({
    searchQuery: searchFilter,
    chainFilter,
    skip: isBalancesOnlySearch,
  })

  const searchResultCurrencies = useMemo(
    () => searchResultsMultichain?.flatMap((r) => r.tokens).filter((c) => !isWSOL(c.currency)),
    [searchResultsMultichain],
  )

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

  // HookSwap graceful address-paste fallback:
  // The hosted Uniswap SearchService can't serve HookSwap's custom chains (e.g. Robinhood 4663), so a
  // pasted token address errors there. When the hosted search failed OR returned nothing AND the query
  // is a valid address on the (concrete) selected chain, resolve the ERC-20 directly on-chain so the
  // token is still selectable/importable. Gated to only run when actually needed (address + failure/empty)
  // so we don't hit the RPC on every keystroke. No backend/deploy required.
  const hostedSearchFailedOrEmpty =
    !isBalancesOnlySearch &&
    (Boolean(searchTokensError) || (!searchTokensLoading && (searchResults?.length ?? 0) === 0))

  const {
    data: onchainFallbackToken,
    loading: onchainFallbackLoading,
    refetch: refetchOnchainFallback,
  } = useOnchainTokenSearchResults({
    searchQuery: searchFilter,
    chainFilter,
    skip: !hostedSearchFailedOrEmpty,
  })

  const onchainFallbackOptions = useMemo(
    () => (onchainFallbackToken ? currencyInfosToTokenOptions([onchainFallbackToken]) : undefined),
    [onchainFallbackToken],
  )

  const loading =
    portfolioTokenOptionsLoading ||
    portfolioBalancesByIdLoading ||
    (!isBalancesOnlySearch && searchTokensLoading) ||
    onchainFallbackLoading ||
    bridgingTokenOptionsLoading

  // Prefer hosted search results; fall back to the on-chain-resolved token when hosted returned nothing.
  const effectiveSearchResults = searchResults?.length ? searchResults : onchainFallbackOptions

  const searchResultsSections = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.SearchResults,
    // Use local search when only searching balances
    options: isBalancesOnlySearch ? portfolioTokenOptions : effectiveSearchResults,
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

  // HookSwap: when the token selector is scoped to a single concrete chain, a hosted-search backend
  // failure is expected + non-actionable (the hosted API doesn't serve HookSwap's custom chains, and
  // "Retry" won't help). Degrade to an honest empty/"no results" state instead of the scary error card;
  // if the query is an address, the on-chain fallback above surfaces the token. When there is no chain
  // filter (cross-chain search over enabled chains), keep the original error behavior.
  const suppressSearchError = Boolean(chainFilter) || Boolean(onchainFallbackToken)

  const error =
    (!bridgingTokenOptions && bridgingTokenOptionsError) ||
    (!portfolioBalancesById && portfolioBalancesByIdError) ||
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!isBalancesOnlySearch && !searchResults && !suppressSearchError && searchTokensError)

  const refetchAll = useCallback(() => {
    refetchPortfolioBalances?.()
    refetchSearchTokens?.()
    refetchPortfolioTokenOptions?.()
    refetchBridgingTokenOptions?.()
    refetchOnchainFallback?.()
  }, [
    refetchBridgingTokenOptions,
    refetchPortfolioBalances,
    refetchPortfolioTokenOptions,
    refetchSearchTokens,
    refetchOnchainFallback,
  ])

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
