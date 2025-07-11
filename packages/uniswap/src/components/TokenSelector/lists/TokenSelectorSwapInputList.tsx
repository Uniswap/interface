import { apolloSubgraphClient } from 'graphql/data/apollo/client'
import { useCallback, useMemo } from 'react'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { useFavoriteTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useFavoriteTokensOptions'
import { usePopularTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/usePopularTokensOptions'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
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
import { TokenSelectorItemTypes } from 'uniswap/src/components/lists/types'
import { GqlResult } from 'uniswap/src/data/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isMobileApp } from 'utilities/src/platform'
import { useGetAllPoolsQuery } from 'v3-subgraph/generated/types-and-hooks'
import { smartBCHTokenOptions } from './smartBCH'

function useTokenSectionsForSwapInput({
  activeAccountAddress,
  chainFilter,
}: TokenSectionsHookProps): GqlResult<TokenSection<TokenSelectorItemTypes>[]> {
  const isTokenSelectorTrendingTokensEnabled = useFeatureFlag(FeatureFlags.TokenSelectorTrendingTokens)
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()
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
  } = usePopularTokensOptions(activeAccountAddress, chainFilter)

  const {
    data: favoriteTokenOptions,
    error: favoriteTokenOptionsError,
    refetch: refetchFavoriteTokenOptions,
    loading: favoriteTokenOptionsLoading,
  } = useFavoriteTokensOptions(activeAccountAddress, chainFilter)

  const { data: commonTokenOptions } = useCommonTokensOptionsWithFallback(
    activeAccountAddress,
    chainFilter ?? defaultChainId,
  )

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!popularTokenOptions && popularTokenOptionsError) ||
    (!favoriteTokenOptions && favoriteTokenOptionsError)

  const loading =
    (!portfolioTokenOptions && portfolioTokenOptionsLoading) ||
    (!popularTokenOptions && popularTokenOptionsLoading) ||
    (!favoriteTokenOptions && favoriteTokenOptionsLoading)

  const refetchAll = useCallback(() => {
    refetchPortfolioTokenOptions?.()
    refetchPopularTokenOptions?.()
    refetchFavoriteTokenOptions?.()
  }, [refetchPopularTokenOptions, refetchPortfolioTokenOptions, refetchFavoriteTokenOptions])

  const isTestnet = chainFilter && isTestnetChain(chainFilter)

  const suggestedSection = useTokenOptionsSection({
    sectionKey: TokenOptionSection.SuggestedTokens,
    tokenOptions: [(isTestnet ? commonTokenOptions : []) ?? []],
  })

  const portfolioSection = useTokenOptionsSection({
    sectionKey: TokenOptionSection.YourTokens,
    tokenOptions: portfolioTokenOptions,
  })
  const recentSection = useTokenOptionsSection({
    sectionKey: TokenOptionSection.RecentTokens,
    tokenOptions: recentlySearchedTokenOptions,
  })
  const favoriteSection = useTokenOptionsSection({
    sectionKey: TokenOptionSection.FavoriteTokens,
    tokenOptions: favoriteTokenOptions,
  })
  const popularMinusPortfolioTokens = tokenOptionDifference(popularTokenOptions, portfolioTokenOptions)
  const popularSection = useTokenOptionsSection({
    // TODO(WEB-5917): Rename to trendingTokens once feature flag is fully on
    sectionKey: TokenOptionSection.PopularTokens,
    tokenOptions: isTokenSelectorTrendingTokensEnabled ? popularTokenOptions : popularMinusPortfolioTokens,
  })

  const sections = useMemo(() => {
    if (isSwapListLoading({ loading, portfolioSection, popularSection, isTestnetModeEnabled })) {
      return undefined
    }

    if (isTestnetModeEnabled) {
      return [...(suggestedSection ?? []), ...(portfolioSection ?? [])]
    }

    return [
      ...(suggestedSection ?? []),
      ...(portfolioSection ?? []),
      ...(recentSection ?? []),
      // TODO(WEB-3061): Favorited wallets/tokens
      // Extension & interface do not support favoriting but has a default list, so we can't rely on empty array check
      ...(isMobileApp ? favoriteSection ?? [] : []),
      ...(popularSection ?? []),
    ] satisfies TokenSection<TokenSelectorItemTypes>[]
  }, [
    suggestedSection,
    favoriteSection,
    loading,
    popularSection,
    portfolioSection,
    recentSection,
    isTestnetModeEnabled,
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
  tokenFilter,
  isKeyboardOpen,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  tokenFilter?: string[]
}): JSX.Element {
  const { data: poolData, loading: isLoading } = useGetAllPoolsQuery({
    client: apolloSubgraphClient,
  })
  const chainInfo = getChainInfo(10000)
  const data = useMemo(() => {
    const tokensWithPools = poolData?.pools.flatMap((p) => [p.token0.id, p.token1.id])?.map((s) => s.toLowerCase())
    if (tokensWithPools?.includes(chainInfo.wrappedNativeCurrency.address.toLowerCase())) {
      tokensWithPools.push(chainInfo.nativeCurrency.address.toLowerCase())
    }
    const smartBCHTokenOptionsInPools = smartBCHTokenOptions.filter((t) =>
      tokensWithPools?.includes(t.currencyInfo.address?.toLowerCase()),
    )
    if (tokenFilter != null) {
      return smartBCHTokenOptionsInPools.filter((t) => tokenFilter.includes(t.currencyInfo.currencyId))
    }
    return smartBCHTokenOptionsInPools
  }, [tokenFilter, poolData])

  return (
    <TokenSelectorList
      showTokenAddress
      chainFilter={chainFilter}
      hasError={false}
      isKeyboardOpen={isKeyboardOpen}
      loading={isLoading}
      refetch={() => {}}
      sections={[
        {
          data,
          sectionKey: TokenOptionSection.SuggestedTokens,
        },
      ]}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapInputList = _TokenSelectorSwapInputList
