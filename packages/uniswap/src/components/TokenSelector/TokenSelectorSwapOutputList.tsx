import { memo, useCallback, useMemo } from 'react'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  useCommonTokensOptionsWithFallback,
  useFavoriteTokensOptions,
  usePopularTokensOptions,
  usePortfolioTokenOptions,
  useRecentlySearchedTokens,
} from 'uniswap/src/components/TokenSelector/hooks'
import {
  OnSelectCurrency,
  TokenOptionSection,
  TokenSection,
  TokenSectionsHookProps,
} from 'uniswap/src/components/TokenSelector/types'
import {
  isSwapListLoading,
  tokenOptionDifference,
  useTokenOptionsSection,
} from 'uniswap/src/components/TokenSelector/utils'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { GqlResult } from 'uniswap/src/data/types'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { isMobileApp } from 'utilities/src/platform'

function useTokenSectionsForSwapOutput({
  activeAccountAddress,
  chainFilter,
  input,
}: TokenSectionsHookProps): GqlResult<TokenSection[]> {
  const isBridgingEnabled = useFeatureFlag(FeatureFlags.Bridging)

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions(activeAccountAddress, chainFilter)

  const {
    data: popularTokenOptions,
    error: popularTokenOptionsError,
    refetch: refetchPopularTokenOptions,
    loading: popularTokenOptionsLoading,
    // if there is no chain filter then we show mainnet tokens
  } = usePopularTokensOptions(activeAccountAddress, chainFilter ?? UniverseChainId.Mainnet)

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
    // if there is no chain filter then we show mainnet tokens
  } = useCommonTokensOptionsWithFallback(activeAccountAddress, chainFilter ?? UniverseChainId.Mainnet)

  const {
    data: bridgingTokenOptions,
    error: bridgingTokenOptionsError,
    refetch: refetchBridgingTokenOptions,
    loading: bridgingTokenOptionsLoading,
    shouldNest: shouldNestBridgingTokens,
  } = useBridgingTokensOptions({ input, walletAddress: activeAccountAddress, chainFilter })

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!popularTokenOptions && popularTokenOptionsError) ||
    (!favoriteTokenOptions && favoriteTokenOptionsError) ||
    (!commonTokenOptions && commonTokenOptionsError) ||
    (!bridgingTokenOptions && bridgingTokenOptionsError)

  const loading =
    portfolioTokenOptionsLoading ||
    popularTokenOptionsLoading ||
    favoriteTokenOptionsLoading ||
    commonTokenOptionsLoading ||
    bridgingTokenOptionsLoading

  const refetchAll = useCallback(() => {
    refetchPortfolioTokenOptions?.()
    refetchPopularTokenOptions?.()
    refetchFavoriteTokenOptions?.()
    refetchCommonTokenOptions?.()
    refetchBridgingTokenOptions?.()
  }, [
    refetchBridgingTokenOptions,
    refetchCommonTokenOptions,
    refetchFavoriteTokenOptions,
    refetchPopularTokenOptions,
    refetchPortfolioTokenOptions,
  ])

  // we draw the Suggested pills as a single item of a section list, so `data` is TokenOption[][]
  const suggestedSection = useTokenOptionsSection(TokenOptionSection.SuggestedTokens, [commonTokenOptions ?? []])
  const portfolioSection = useTokenOptionsSection(TokenOptionSection.YourTokens, portfolioTokenOptions)
  const recentSection = useTokenOptionsSection(TokenOptionSection.RecentTokens, recentlySearchedTokenOptions)
  const favoriteSection = useTokenOptionsSection(TokenOptionSection.FavoriteTokens, favoriteTokenOptions)

  const popularMinusPortfolioTokens = tokenOptionDifference(popularTokenOptions, portfolioTokenOptions)
  const popularSection = useTokenOptionsSection(TokenOptionSection.PopularTokens, popularMinusPortfolioTokens)
  const bridgingSection = useTokenOptionsSection(
    TokenOptionSection.BridgingTokens,
    shouldNestBridgingTokens ? [bridgingTokenOptions ?? []] : bridgingTokenOptions ?? [],
    <NewTag />,
  )

  const sections = useMemo(() => {
    if (isSwapListLoading(loading, portfolioSection, popularSection)) {
      return undefined
    }

    return [
      ...(suggestedSection ?? []),
      ...(isBridgingEnabled ? bridgingSection ?? [] : []),
      ...(portfolioSection ?? []),
      ...(recentSection ?? []),
      // TODO(WEB-3061): Favorited wallets/tokens
      // Extension & interface do not support favoriting but has a default list, so we can't rely on empty array check
      ...(isMobileApp ? favoriteSection ?? [] : []),
      ...(popularSection ?? []),
    ]
  }, [
    loading,
    portfolioSection,
    popularSection,
    suggestedSection,
    isBridgingEnabled,
    bridgingSection,
    recentSection,
    favoriteSection,
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

function _TokenSelectorSwapOutputList({
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  isKeyboardOpen,
  input,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwapOutput({
    activeAccountAddress,
    chainFilter,
    input,
  })
  return (
    <TokenSelectorList
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

export const TokenSelectorSwapOutputList = memo(_TokenSelectorSwapOutputList)
