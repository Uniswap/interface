/* eslint-disable complexity */
import { memo, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { useFavoriteTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useFavoriteTokensOptions'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { useStockTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useStockTokensOptions'
import { useTrendingTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensOptions'
import { OnSelectCurrency, TokenSectionsHookProps } from 'uniswap/src/components/TokenSelector/types'
import { isSwapListLoading } from 'uniswap/src/components/TokenSelector/utils'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isMobileApp } from 'utilities/src/platform'

function useTokenSectionsForSwapInput({
  activeAccountAddress,
  chainFilter,
  oppositeSelectedToken: output,
}: TokenSectionsHookProps): GqlResult<OnchainItemSection<TokenSelectorOption>[]> {
  const { isTestnetModeEnabled } = useEnabledChains()
  const { pathname } = useLocation()
  const isStockRoute = pathname === '/stock'

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions(activeAccountAddress, chainFilter)

  const {
    data: stockTokenOptions,
    error: stockTokenOptionsError,
    refetch: refetchStockTokenOptions,
    loading: stockTokenOptionsLoading,
  } = useStockTokensOptions(activeAccountAddress, chainFilter)

  const {
    data: trendingTokenOptions,
    error: trendingTokenOptionsError,
    refetch: refetchTrendingTokenOptions,
    loading: trendingTokenOptionsLoading,
  } = useTrendingTokensOptions(activeAccountAddress, chainFilter)

  const {
    data: favoriteTokenOptions,
    error: favoriteTokenOptionsError,
    refetch: refetchFavoriteTokenOptions,
    loading: favoriteTokenOptionsLoading,
  } = useFavoriteTokensOptions(activeAccountAddress, chainFilter)

  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
  } = useCommonTokensOptionsWithFallback(
    activeAccountAddress,
    // When chainFilter is null (user selected "All Networks"), pass null to show all chains
    // Initial state should have chainFilter set to defaultChainId from useFilterCallbacks
    chainFilter,
  )

  const {
    data: bridgingTokenOptions,
    error: bridgingTokenOptionsError,
    refetch: refetchBridgingTokenOptions,
    loading: bridgingTokenOptionsLoading,
    shouldNest: shouldNestBridgingTokens,
  } = useBridgingTokensOptions({ oppositeSelectedToken: output, walletAddress: activeAccountAddress, chainFilter })

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!trendingTokenOptions && trendingTokenOptionsError) ||
    (!favoriteTokenOptions && favoriteTokenOptionsError) ||
    (!commonTokenOptions && commonTokenOptionsError) ||
    (!bridgingTokenOptions && bridgingTokenOptionsError) ||
    (!stockTokenOptions && stockTokenOptionsError)

  const loading =
    (!portfolioTokenOptions && portfolioTokenOptionsLoading) ||
    (!trendingTokenOptions && trendingTokenOptionsLoading) ||
    (!favoriteTokenOptions && favoriteTokenOptionsLoading) ||
    (!commonTokenOptions && commonTokenOptionsLoading) ||
    (!bridgingTokenOptions && bridgingTokenOptionsLoading) ||
    (!stockTokenOptions && stockTokenOptionsLoading)

  const refetchAll = useCallback(() => {
    refetchPortfolioTokenOptions?.()
    refetchTrendingTokenOptions?.()
    refetchFavoriteTokenOptions?.()
    refetchCommonTokenOptions?.()
    refetchBridgingTokenOptions?.()
    refetchStockTokenOptions?.()
  }, [
    refetchTrendingTokenOptions,
    refetchPortfolioTokenOptions,
    refetchFavoriteTokenOptions,
    refetchCommonTokenOptions,
    refetchBridgingTokenOptions,
    refetchStockTokenOptions,
  ])

  const suggestedSectionOptions = useMemo(() => [commonTokenOptions ?? []], [commonTokenOptions])
  const suggestedSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.SuggestedTokens,
    options: suggestedSectionOptions,
  })

  const stockSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Tokens,
    options: stockTokenOptions,
  })
  const portfolioSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.YourTokens,
    options: portfolioTokenOptions,
  })
  const recentSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.RecentSearches,
    options: recentlySearchedTokenOptions,
  })
  const favoriteSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.FavoriteTokens,
    options: favoriteTokenOptions,
  })
  const trendingSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingTokens,
    options: trendingTokenOptions,
  })
  const bridgingSectionTokenOptions: TokenSelectorOption[] = useMemo(
    () => (shouldNestBridgingTokens ? [bridgingTokenOptions ?? []] : bridgingTokenOptions ?? []),
    [bridgingTokenOptions, shouldNestBridgingTokens],
  )
  const bridgingSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.BridgingTokens,
    options: bridgingSectionTokenOptions,
  })

  const sections = useMemo(() => {
    if (isSwapListLoading({ loading, portfolioSection, trendingSection, isTestnetModeEnabled })) {
      return undefined
    }

    if (isTestnetModeEnabled) {
      return [...(suggestedSection ?? []), ...(portfolioSection ?? [])]
    }

    if (isStockRoute) {
      return [...(suggestedSection ?? []), ...(stockSection ?? [])] satisfies OnchainItemSection<TokenSelectorOption>[]
    }

    return [
      ...(suggestedSection ?? []),
      ...(bridgingSection ?? []),
      ...(portfolioSection ?? []),
      ...(recentSection ?? []),
      // TODO(WEB-3061): Favorited wallets/tokens
      // Extension & interface do not support favoriting but has a default list, so we can't rely on empty array check
      ...(isMobileApp ? favoriteSection ?? [] : []),
      ...(trendingSection ?? []),
    ] satisfies OnchainItemSection<TokenSelectorOption>[]
  }, [
    suggestedSection,
    favoriteSection,
    loading,
    trendingSection,
    portfolioSection,
    recentSection,
    isTestnetModeEnabled,
    bridgingSection,
    stockSection,
    isStockRoute,
  ])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchAll,
    }),
    [error, loading, refetchAll, sections],
  )
}

function _TokenSelectorSwapInputList({
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  isKeyboardOpen,
  oppositeSelectedToken,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwapInput({
    activeAccountAddress,
    chainFilter,
    oppositeSelectedToken,
  })

  return (
    <TokenSelectorList
      showTokenAddress
      chainFilter={chainFilter}
      hasError={Boolean(error)}
      isKeyboardOpen={isKeyboardOpen}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapInputList = memo(_TokenSelectorSwapInputList)
