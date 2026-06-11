import { GqlResult } from '@universe/api'
import { isMobileApp } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useCallback, useMemo, useRef } from 'react'
import { Flex } from 'ui/src'
import { TokenSelectorListOption, TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SectionHeader } from 'uniswap/src/components/lists/SectionHeader'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { useFavoriteTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useFavoriteTokensOptions'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { useRwaTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useRwaTokenOptions'
import { useTrendingTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensOptions'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  OnSelectCurrency,
  OnSelectRwaToken,
  TokenSectionsHookProps,
  TokenSelectorVariation,
} from 'uniswap/src/components/TokenSelector/types'
import { isSwapListLoading } from 'uniswap/src/components/TokenSelector/utils'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import { ClearRecentSearchesButton } from 'uniswap/src/features/search/ClearRecentSearchesButton'

// Matches the default 40px section header plus the single-line outage banner and spacing on web.
const PORTFOLIO_OUTAGE_SECTION_HEADER_ROW_HEIGHT = 104

export function useTokenSectionsForSwap({
  addresses,
  chainFilter,
  oppositeSelectedToken,
  variation,
}: TokenSectionsHookProps): GqlResult<OnchainItemSection<TokenSelectorListOption>[]> {
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)

  // Fetch portfolio balances once and share across all sub-hooks to avoid 5 redundant hook chain traversals
  const portfolioData = usePortfolioBalancesForAddressById(addresses)

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions({ chainFilter, portfolioData })

  const {
    data: trendingTokenOptions,
    error: trendingTokenOptionsError,
    refetch: refetchTrendingTokenOptions,
    loading: trendingTokenOptionsLoading,
  } = useTrendingTokensOptions({ chainFilter, portfolioData })

  const {
    data: favoriteTokenOptions,
    error: favoriteTokenOptionsError,
    refetch: refetchFavoriteTokenOptions,
    loading: favoriteTokenOptionsLoading,
  } = useFavoriteTokensOptions({ chainFilter, portfolioData })

  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
    // if there is no chain filter, first check if the input token has a chainId, fallback to defaultChainId
  } = useCommonTokensOptionsWithFallback({
    chainFilter: chainFilter ?? oppositeSelectedToken?.chainId ?? defaultChainId,
    portfolioData,
  })

  const {
    data: bridgingTokenOptions,
    error: bridgingTokenOptionsError,
    refetch: refetchBridgingTokenOptions,
    loading: bridgingTokenOptionsLoading,
    shouldNest: shouldNestBridgingTokens,
  } = useBridgingTokensOptions({ oppositeSelectedToken, chainFilter, portfolioData })

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter)

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!trendingTokenOptions && trendingTokenOptionsError) ||
    (!multichainTokenUxEnabled && !favoriteTokenOptions && favoriteTokenOptionsError) ||
    (!commonTokenOptions && commonTokenOptionsError) ||
    (!bridgingTokenOptions && bridgingTokenOptionsError)

  const loading =
    (!portfolioTokenOptions && portfolioTokenOptionsLoading) ||
    (!trendingTokenOptions && trendingTokenOptionsLoading) ||
    (!multichainTokenUxEnabled && !favoriteTokenOptions && favoriteTokenOptionsLoading) ||
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

  const stocksEnabled = useFeatureFlag(FeatureFlags.RwaUxTokenSelector)
  const shouldShowStocks = stocksEnabled && variation === TokenSelectorVariation.SwapOutput && !isTestnetModeEnabled
  // Gate the RWA query so it isn't fetched unless the Stocks section will actually render.
  const rwaTokenOptions = useRwaTokenOptions({ chainFilter, enabled: shouldShowStocks })
  const stocksSectionOptions = useMemo(() => [rwaTokenOptions], [rwaTokenOptions])
  const memoizedNewTag = useMemo(() => <NewTag />, [])
  const stocksSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Stocks,
    options: stocksSectionOptions,
    rightElement: memoizedNewTag,
  })

  const isPortfolioOutage = !!portfolioTokenOptions && !!portfolioTokenOptionsError

  const portfolioOutageSectionHeader = useMemo(() => {
    if (!isPortfolioOutage) {
      return undefined
    }
    return (
      <Flex backgroundColor="$surface1" width="100%">
        <SectionHeader sectionKey={OnchainItemSectionName.YourTokens} />
        <Flex backgroundColor="$surface1" px="$spacing8" pt="$spacing8">
          <DataApiOutageBanner />
        </Flex>
      </Flex>
    )
  }, [isPortfolioOutage])

  const portfolioSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.YourTokens,
    options: portfolioTokenOptions,
    sectionHeader: portfolioOutageSectionHeader,
    sectionHeaderHeight: isPortfolioOutage ? PORTFOLIO_OUTAGE_SECTION_HEADER_ROW_HEIGHT : undefined,
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
      ...(shouldShowStocks ? (stocksSection ?? []) : []),
      ...(bridgingSection ?? []),
      ...(portfolioSection ?? []),
      ...(recentSection ?? []),
      // TODO(WEB-3061): Favorited wallets/tokens
      // Extension & interface do not support favoriting but has a default list, so we can't rely on empty array check
      ...(isMobileApp && !multichainTokenUxEnabled ? (favoriteSection ?? []) : []),
      ...(trendingSection ?? []),
    ]
  }, [
    loading,
    portfolioSection,
    trendingSection,
    suggestedSection,
    stocksSection,
    shouldShowStocks,
    bridgingSection,
    recentSection,
    favoriteSection,
    isTestnetModeEnabled,
    multichainTokenUxEnabled,
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

function TokenSelectorSwapListInner({
  onSelectCurrency,
  onSelectRwaToken,
  addresses,
  chainFilter,
  oppositeSelectedToken,
  renderedInModal,
  variation,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  onSelectRwaToken?: OnSelectRwaToken
  chainFilter: UniverseChainId | null
  renderedInModal: boolean
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSwap({
    addresses,
    chainFilter,
    oppositeSelectedToken,
    variation,
  })

  const hasError = Boolean(error)

  return (
    <Flex grow>
      <TokenSelectorList
        showTokenAddress
        chainFilter={chainFilter}
        hasError={hasError}
        loading={loading}
        refetch={refetch}
        sections={sections}
        showTokenWarnings={true}
        renderedInModal={renderedInModal}
        onSelectCurrency={onSelectCurrency}
        onSelectRwaToken={onSelectRwaToken}
      />
    </Flex>
  )
}

export const TokenSelectorSwapList = memo(TokenSelectorSwapListInner)
