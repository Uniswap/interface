import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import { Flex } from '@universe/mycelium'
import { useMemo } from 'react'
import { TokenSelectorListOption, TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { useRwaTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useRwaTokenOptions'
import { useTrendingTokensOptions } from 'uniswap/src/components/TokenSelector/hooks/useTrendingTokensOptions'
import { TokenSectionsHookProps, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { RECENT_PILLS_MAX_COUNT } from 'uniswap/src/components/TokenSelectorV2/constants'
import { TokenSelectorV2SectionHeader } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2SectionHeader'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import { ClearRecentSearchesButton } from 'uniswap/src/features/search/ClearRecentSearchesButton'
import { useEvent } from 'utilities/src/react/hooks'
import type { DerivedQueryResult } from 'utilities/src/reactQuery/types'

// V2 section header plus the single-line outage banner and spacing (mirrors legacy TokenSelectorSwapList).
const PORTFOLIO_OUTAGE_SECTION_HEADER_ROW_HEIGHT = 104

/**
 * V2 swap sections (SWAP-3039): Recent → Suggested → Stocks (output only) → Bridging →
 * [Your tokens on single-pane layouts] → Trending.
 *
 * Differences from the legacy `useTokenSectionsForSwap` (which stays untouched):
 * - Recent renders as a horizontal pill row, so its options are wrapped as a single row item.
 * - Your-tokens is excluded when the dual-pane sidebar owns it (`includeYourTokens=false`);
 *   single-pane platforms (mobile/extension/small web) keep it in the list — no designs exist
 *   for a sidebar there and dropping the section would lose functionality.
 * - Trending rows render the price/24h-change market data the shared trending options carry.
 * - Section headers are the V2 icon+title headers.
 */
export function useTokenSectionsForSwapV2({
  chainFilter,
  chainIds,
  oppositeSelectedToken,
  variation,
  includeYourTokens,
  portfolioData,
}: Omit<TokenSectionsHookProps, 'addresses'> & {
  includeYourTokens: boolean
  portfolioData: PortfolioBalancesResult
}): DerivedQueryResult<OnchainItemSection<TokenSelectorListOption>[]> {
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    isLoading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions({ chainFilter, chainIds, portfolioData })

  const {
    data: trendingTokenOptions,
    error: trendingTokenOptionsError,
    refetch: refetchTrendingTokenOptions,
    isLoading: trendingTokenOptionsLoading,
  } = useTrendingTokensOptions({ chainFilter, chainIds, portfolioData })

  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    isLoading: commonTokenOptionsLoading,
  } = useCommonTokensOptionsWithFallback({
    chainFilter: chainFilter ?? oppositeSelectedToken?.chainId ?? defaultChainId,
    portfolioData,
  })

  const {
    data: bridgingTokenOptions,
    error: bridgingTokenOptionsError,
    refetch: refetchBridgingTokenOptions,
    isLoading: bridgingTokenOptionsLoading,
  } = useBridgingTokensOptions({ oppositeSelectedToken, chainFilter, chainIds, portfolioData })

  const recentlySearchedTokenOptions = useRecentlySearchedTokens(chainFilter, {
    chainIds,
    numberOfResults: RECENT_PILLS_MAX_COUNT,
  })

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

  const refetch = useEvent(() => {
    refetchPortfolioTokenOptions?.()
    refetchTrendingTokenOptions?.()
    refetchCommonTokenOptions?.()
    refetchBridgingTokenOptions?.()
  })

  // Recent is a single horizontal pill-row item, so its options are wrapped as TokenOption[][].
  const recentSectionOptions = useMemo(
    () => (recentlySearchedTokenOptions.length ? [recentlySearchedTokenOptions] : undefined),
    [recentlySearchedTokenOptions],
  )
  const recentSectionHeader = useMemo(
    () => (
      <TokenSelectorV2SectionHeader
        endElement={<ClearRecentSearchesButton />}
        sectionKey={OnchainItemSectionName.RecentSearches}
      />
    ),
    [],
  )
  const recentSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.RecentSearches,
    options: recentSectionOptions,
    sectionHeader: recentSectionHeader,
  })

  const suggestedSectionOptions = useMemo(() => [commonTokenOptions ?? []], [commonTokenOptions])
  const suggestedSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.SuggestedTokens,
    options: suggestedSectionOptions,
  })

  const isRwaRegionBlocked = useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA)
  const shouldShowStocks =
    !isRwaRegionBlocked && variation === TokenSelectorVariation.SwapOutput && !isTestnetModeEnabled
  const rwaTokenOptions = useRwaTokenOptions({
    chainFilter: chainFilter ?? oppositeSelectedToken?.chainId ?? null,
    enabled: shouldShowStocks,
  })
  const stocksSectionOptions = useMemo(() => [rwaTokenOptions], [rwaTokenOptions])
  const stocksSectionHeader = useMemo(
    () => <TokenSelectorV2SectionHeader endElement={<NewTag />} sectionKey={OnchainItemSectionName.Stocks} />,
    [],
  )
  const stocksSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.Stocks,
    options: stocksSectionOptions,
    sectionHeader: stocksSectionHeader,
  })

  const bridgingSectionHeader = useMemo(
    () => <TokenSelectorV2SectionHeader sectionKey={OnchainItemSectionName.BridgingTokens} />,
    [],
  )
  const bridgingSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.BridgingTokens,
    options: bridgingTokenOptions as TokenSelectorOption[] | undefined,
    sectionHeader: bridgingSectionHeader,
  })

  // Stale balances + live error → show the outage banner over Your tokens (mirrors legacy useTokenSectionsForSwap).
  const isPortfolioOutage = Boolean(portfolioTokenOptions) && Boolean(portfolioTokenOptionsError)
  const yourTokensSectionHeader = useMemo(() => {
    if (!isPortfolioOutage) {
      return <TokenSelectorV2SectionHeader sectionKey={OnchainItemSectionName.YourTokens} />
    }
    return (
      <Flex backgroundColor="$surface1" width="100%">
        <TokenSelectorV2SectionHeader sectionKey={OnchainItemSectionName.YourTokens} />
        <Flex backgroundColor="$surface1" px="$spacing8" pt="$spacing8">
          <DataApiOutageBanner />
        </Flex>
      </Flex>
    )
  }, [isPortfolioOutage])
  // Built even when excluded from the list (dual-pane): the sidebar renders it separately.
  const yourTokensSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.YourTokens,
    options: portfolioTokenOptions,
    sectionHeader: yourTokensSectionHeader,
    sectionHeaderHeight: isPortfolioOutage ? PORTFOLIO_OUTAGE_SECTION_HEADER_ROW_HEIGHT : undefined,
  })

  const trendingSectionHeader = useMemo(
    () => <TokenSelectorV2SectionHeader sectionKey={OnchainItemSectionName.TrendingTokens} />,
    [],
  )
  const trendingSection = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.TrendingTokens,
    options: trendingTokenOptions,
    sectionHeader: trendingSectionHeader,
  })

  // Deliberately does NOT blank out while `loading` is true. A refetch briefly drops one constituent
  // section, and discarding the whole list for that swapped the mounted rows for the skeleton
  // mid-scroll. `undefined` now means "nothing to show at all", which is the first load — and that is
  // the only case `SelectorBaseList` should render its skeleton for.
  const sections = useMemo(() => {
    if (isTestnetModeEnabled) {
      const builtForTestnet = [...(suggestedSection ?? []), ...(includeYourTokens ? (yourTokensSection ?? []) : [])]
      return builtForTestnet.length ? builtForTestnet : undefined
    }

    const built = [
      ...(recentSection ?? []),
      ...(suggestedSection ?? []),
      ...(shouldShowStocks ? (stocksSection ?? []) : []),
      ...(bridgingSection ?? []),
      ...(includeYourTokens ? (yourTokensSection ?? []) : []),
      ...(trendingSection ?? []),
    ]
    return built.length ? built : undefined
  }, [
    yourTokensSection,
    trendingSection,
    suggestedSection,
    stocksSection,
    shouldShowStocks,
    bridgingSection,
    recentSection,
    includeYourTokens,
    isTestnetModeEnabled,
  ])

  return useMemo(
    () => ({
      data: sections,
      isLoading: loading,
      error: error || null,
      refetch,
    }),
    [error, loading, refetch, sections],
  )
}
