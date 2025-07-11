import { memo, useCallback, useMemo, useRef } from 'react'
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
import { TokenOption, TokenSelectorItemTypes } from 'uniswap/src/components/lists/types'

import { apolloSubgraphClient } from 'graphql/data/apollo/client'
import { GqlResult } from 'uniswap/src/data/types'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { isMobileApp } from 'utilities/src/platform'
import { useGetPoolsByTokenQuery } from 'v3-subgraph/generated/types-and-hooks'
import { smartBCHTokenOptions } from './smartBCH'

// eslint-disable-next-line complexity
function useTokenSectionsForSwapOutput({
  activeAccountAddress,
  chainFilter,
  input,
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

  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
    // if there is no chain filter then we show default chain tokens
  } = useCommonTokensOptionsWithFallback(activeAccountAddress, chainFilter ?? defaultChainId)

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
    (!portfolioTokenOptions && portfolioTokenOptionsLoading) ||
    (!popularTokenOptions && popularTokenOptionsLoading) ||
    (!favoriteTokenOptions && favoriteTokenOptionsLoading) ||
    (!commonTokenOptions && commonTokenOptionsLoading) ||
    (!bridgingTokenOptions && bridgingTokenOptionsLoading)

  const refetchAllRef = useRef<() => void>(() => {})

  refetchAllRef.current = (): void => {
    refetchPortfolioTokenOptions?.()
    refetchPopularTokenOptions?.()
    refetchFavoriteTokenOptions?.()
    refetchCommonTokenOptions?.()
    refetchBridgingTokenOptions?.()
  }

  const refetch = useCallback(() => {
    refetchAllRef.current()
  }, [])

  // we draw the Suggested pills as a single item of a section list, so `data` is TokenOption[][]

  const suggestedSectionOptions = useMemo(() => [commonTokenOptions ?? []], [commonTokenOptions])
  const suggestedSection = useTokenOptionsSection({
    sectionKey: TokenOptionSection.SuggestedTokens,
    tokenOptions: suggestedSectionOptions,
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

  const popularMinusPortfolioTokens = useMemo(
    () => tokenOptionDifference(popularTokenOptions, portfolioTokenOptions),
    [popularTokenOptions, portfolioTokenOptions],
  )
  const popularSection = useTokenOptionsSection({
    // TODO(WEB-5917): Rename to trendingTokens once feature flag is fully on
    sectionKey: TokenOptionSection.PopularTokens,
    tokenOptions: isTokenSelectorTrendingTokensEnabled ? popularTokenOptions : popularMinusPortfolioTokens,
  })

  const bridgingSectionTokenOptions: TokenSelectorItemTypes[] = useMemo(
    () => (shouldNestBridgingTokens ? [bridgingTokenOptions ?? []] : bridgingTokenOptions ?? []),
    [bridgingTokenOptions, shouldNestBridgingTokens],
  )
  const bridgingSection = useTokenOptionsSection({
    sectionKey: TokenOptionSection.BridgingTokens,
    tokenOptions: bridgingSectionTokenOptions,
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
      ...(bridgingSection ?? []),
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

const chainInfo = getChainInfo(10000)

const filterOutInput = (input: string, tokens: TokenOption[]) => {
  return tokens.filter((t) => {
    if (
      input.toLowerCase() === chainInfo.nativeCurrency.address.toLowerCase() ||
      input.toLowerCase() === chainInfo.wrappedNativeCurrency.address.toLowerCase()
    ) {
      return (
        t.currencyInfo.address?.toLowerCase() !== chainInfo.nativeCurrency.address.toLowerCase() &&
        t.currencyInfo.address?.toLowerCase() !== chainInfo.wrappedNativeCurrency.address.toLowerCase()
      )
    }
    return t.currencyInfo.address !== input
  })
}

function _TokenSelectorSwapOutputList({
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  isKeyboardOpen,
  tokenFilter,
  input,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
  tokenFilter?: string[]
}): JSX.Element {
  const {
    data: poolData,
    loading: isLoading,
    error,
  } = useGetPoolsByTokenQuery({
    client: apolloSubgraphClient,
    variables: {
      tokenAddress:
        input?.address.toLowerCase() === chainInfo.nativeCurrency.address.toLowerCase()
          ? chainInfo.wrappedNativeCurrency.address
          : input?.address ?? '',
    },
  })
  const data = useMemo(() => {
    const tokensWithPools = poolData?.pools.flatMap((p) => [p.token0.id, p.token1.id])?.map((s) => s.toLowerCase())
    if (tokensWithPools?.includes(chainInfo.wrappedNativeCurrency.address.toLowerCase())) {
      tokensWithPools.push(chainInfo.nativeCurrency.address.toLowerCase())
    }
    const smartBCHTokenOptionsInPools = smartBCHTokenOptions.filter((t) =>
      tokensWithPools?.includes(t.currencyInfo.address?.toLowerCase()),
    )
    return smartBCHTokenOptionsInPools
  }, [tokenFilter, poolData, input?.address])
  return (
    <TokenSelectorList
      showTokenAddress
      chainFilter={chainFilter}
      hasError={error != null}
      isKeyboardOpen={isKeyboardOpen}
      loading={isLoading}
      refetch={() => {}}
      sections={[
        {
          data: filterOutInput(input?.address ?? '', data),
          sectionKey: TokenOptionSection.SuggestedTokens,
        },
      ]}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSwapOutputList = memo(_TokenSelectorSwapOutputList)
