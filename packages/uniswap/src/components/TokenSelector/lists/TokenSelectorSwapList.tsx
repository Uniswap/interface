import { GqlResult } from '@universe/api'
import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import { memo, useCallback, useMemo, useRef } from 'react'
import { Flex } from 'ui/src'
import { TokenSelectorListOption, TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SectionHeader } from 'uniswap/src/components/lists/SectionHeader'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
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
  chainIds,
  oppositeSelectedToken,
  variation,
}: TokenSectionsHookProps): GqlResult<OnchainItemSection<TokenSelectorListOption>[]> {
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()

  // Fetch portfolio balances once and share across all sub-hooks to avoid 5 redundant hook chain traversals
  const portfolioData = usePortfolioBalancesForAddressById(addresses)

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions({ chainFilter, chainIds, portfolioData })

  const {
    data: trendingTokenOptions,
    error: trendingTokenOptionsError,
    refetch: refetchTrendingTokenOptions,
    loading: trendingTokenOptionsLoading,
  } = useTrendingTokensOptions({ chainFilter, chainIds, portfolioData })

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
  } = useBridgingTokensOptions({ oppositeSelectedToken, chainFilter, chainIds, portfolioData })

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter, { chainIds })

  const error =
    (!portfolioTokenOptions && portfolioTokenOptionsError) ||
    (!trendingTokenOptions && trendingTokenOptionsError) ||
    (!commonTokenOptions && commonTokenOptionsError) ||
    (!bridgingTokenOptions && bridgingTokenOptionsError)

  const loading =
    (!portfolioTokenOptions && portfolioTokenOptionsLoading) ||
    (!trendingTokenOptions && trendingTokenOptionsLoading) ||
    (!commonTokenOptions && commonTokenOptionsLoading) ||
    (!bridgingTokenOptions && bridgingTokenOptionsLoading)

  const refetchAllRef = useRef<() => void>(() => {})

  refetchAllRef.current = (): void => {
    refetchPortfolioTokenOptions?.()
    refetchTrendingTokenOptions?.()
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

  const isRwaRegionBlocked = useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA)
  const shouldShowStocks =
    !isRwaRegionBlocked && variation === TokenSelectorVariation.SwapOutput && !isTestnetModeEnabled
  // Gate the RWA query so it isn't fetched unless the Stocks section will actually render.
  // With no chain filter (All Chains), filter to the input token's chain so we never suggest impossible swaps.
  const rwaTokenOptions = useRwaTokenOptions({
    chainFilter: chainFilter ?? oppositeSelectedToken?.chainId ?? null,
    enabled: shouldShowStocks,
  })
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

function TokenSelectorSwapListInner({
  onSelectCurrency,
  onSelectRwaToken,
  addresses,
  chainFilter,
  chainIds,
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
    chainIds,
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
