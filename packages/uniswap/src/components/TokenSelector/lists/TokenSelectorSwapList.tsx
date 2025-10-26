import { GqlResult } from '@universe/api'
import { memo, useCallback, useMemo, useRef } from 'react'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { useFavoriteTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useFavoriteTokensOptions'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { useTrendingTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensOptions'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency, TokenSectionsHookProps } from 'uniswap/src/components/TokenSelector/types'
import { isSwapListLoading } from 'uniswap/src/components/TokenSelector/utils'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ClearRecentSearchesButton } from 'uniswap/src/features/search/ClearRecentSearchesButton'
import { isMobileApp } from 'utilities/src/platform'

// eslint-disable-next-line complexity
function useTokenSectionsForSwap({
  evmAddress,
  svmAddress,
  chainFilter,
  oppositeSelectedToken,
}: TokenSectionsHookProps): GqlResult<OnchainItemSection<TokenSelectorOption>[]> {
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions({ evmAddress, svmAddress, chainFilter })

  const {
    data: trendingTokenOptions,
    error: trendingTokenOptionsError,
    refetch: refetchTrendingTokenOptions,
    loading: trendingTokenOptionsLoading,
  } = useTrendingTokensOptions({ evmAddress, svmAddress, chainFilter })

  const {
    data: favoriteTokenOptions,
    error: favoriteTokenOptionsError,
    refetch: refetchFavoriteTokenOptions,
    loading: favoriteTokenOptionsLoading,
  } = useFavoriteTokensOptions({ evmAddress, svmAddress, chainFilter })

  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
    // if there is no chain filter, first check if the input token has a chainId, fallback to defaultChainId
  } = useCommonTokensOptionsWithFallback({
    evmAddress,
    svmAddress,
    chainFilter: chainFilter ?? oppositeSelectedToken?.chainId ?? defaultChainId,
  })

  const {
    data: bridgingTokenOptions,
    error: bridgingTokenOptionsError,
    refetch: refetchBridgingTokenOptions,
    loading: bridgingTokenOptionsLoading,
    shouldNest: shouldNestBridgingTokens,
  } = useBridgingTokensOptions({ oppositeSelectedToken, evmAddress, svmAddress, chainFilter })

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!trendingTokenOptions && trendingTokenOptionsError) ||
    (!favoriteTokenOptions && favoriteTokenOptionsError) ||
    (!commonTokenOptions && commonTokenOptionsError) ||
    (!bridgingTokenOptions && bridgingTokenOptionsError)

  const loading =
    (!portfolioTokenOptions && portfolioTokenOptionsLoading) ||
    (!trendingTokenOptions && trendingTokenOptionsLoading) ||
    (!favoriteTokenOptions && favoriteTokenOptionsLoading) ||
    (!commonTokenOptions && commonTokenOptionsLoading) ||
    (!bridgingTokenOptions && bridgingTokenOptionsLoading)

  const refetchAllRef = useRef<() => void>(() => {})

  refetchAllRef.current = (): void => {
    refetchPortfolioTokenOptions?.()
    refetchTrendingTokenOptions?.()
    refetchFavoriteTokenOptions?.()
    refetchCommonTokenOptions?.()
    refetchBridgingTokenOptions?.()
  }

  const refetch = useCallback(() => {
    refetchAllRef.current()
  }, [])

  // we draw the Suggested pills as a single item of a section list, so `data` is TokenOption[][]

  const suggestedSectionOptions = useMemo(() => [commonTokenOptions ?? []], [commonTokenOptions])
  const suggestedSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.SuggestedTokens,
    options: suggestedSectionOptions,
  })

  const portfolioSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.YourTokens,
    options: portfolioTokenOptions,
  })

  const memoizedEndElement = useMemo(() => <ClearRecentSearchesButton />, [])
  const recentSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.RecentSearches,
    options: recentlySearchedTokenOptions,
    endElement: memoizedEndElement,
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
    () => (shouldNestBridgingTokens ? [bridgingTokenOptions ?? []] : (bridgingTokenOptions ?? [])),
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

    return [
      ...(suggestedSection ?? []),
      ...(bridgingSection ?? []),
      ...(portfolioSection ?? []),
      ...(recentSection ?? []),
      // TODO(WEB-3061): Favorited wallets/tokens
      // Extension & interface do not support favoriting but has a default list, so we can't rely on empty array check
      ...(isMobileApp ? (favoriteSection ?? []) : []),
      ...(trendingSection ?? []),
    ]
  }, [
    loading,
    portfolioSection,
    trendingSection,
    suggestedSection,
    bridgingSection,
    recentSection,
    favoriteSection,
    isTestnetModeEnabled,
  ])

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch,
    }),
    [error, loading, refetch, sections],
  )
}

function _TokenSelectorSwapList({
  onSelectCurrency,
  evmAddress,
  svmAddress,
  chainFilter,
  oppositeSelectedToken,
  renderedInModal,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
  renderedInModal: boolean
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwap({
    evmAddress,
    svmAddress,
    chainFilter,
    oppositeSelectedToken,
  })
  return (
    <TokenSelectorList
      showTokenAddress
      chainFilter={chainFilter}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      renderedInModal={renderedInModal}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapList = memo(_TokenSelectorSwapList)
