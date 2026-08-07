import { GqlResult } from '@universe/api'
import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import { useMemo } from 'react'
import { Flex } from 'ui/src'
import { TokenSelectorListOption, TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { useCommonTokensOptionsWithFallback } from 'uniswap/src/components/TokenSelector/hooks/useCommonTokensOptionsWithFallback'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { useRwaTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/useRwaTokenOptions'
import { TokenSectionsHookProps, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { isSwapListLoading } from 'uniswap/src/components/TokenSelector/utils'
import { RECENT_PILLS_MAX_COUNT } from 'uniswap/src/components/TokenSelectorV2/constants'
import { useTrendingTokensOptionsV2 } from 'uniswap/src/components/TokenSelectorV2/hooks/useTrendingTokensOptionsV2'
import { TokenSelectorV2SectionHeader } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2SectionHeader'
import { useBridgingTokensOptions } from 'uniswap/src/features/bridging/hooks/tokens'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import { ClearRecentSearchesButton } from 'uniswap/src/features/search/ClearRecentSearchesButton'
import { useEvent } from 'utilities/src/react/hooks'

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
 * - Trending options carry price/24h-change market data for the V2 rows.
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
}): GqlResult<OnchainItemSection<TokenSelectorListOption>[]> {
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()

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
  } = useTrendingTokensOptionsV2({ chainFilter, chainIds, portfolioData })

  const {
    data: commonTokenOptions,
    error: commonTokenOptionsError,
    refetch: refetchCommonTokenOptions,
    loading: commonTokenOptionsLoading,
  } = useCommonTokensOptionsWithFallback({
    chainFilter: chainFilter ?? oppositeSelectedToken?.chainId ?? defaultChainId,
    portfolioData,
  })

  const {
    data: bridgingTokenOptions,
    error: bridgingTokenOptionsError,
    refetch: refetchBridgingTokenOptions,
    loading: bridgingTokenOptionsLoading,
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
  // Built even when excluded from the list (dual-pane) — isSwapListLoading keys off its presence.
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

  const sections = useMemo(() => {
    if (isSwapListLoading({ loading, portfolioSection: yourTokensSection, trendingSection, isTestnetModeEnabled })) {
      return undefined
    }

    if (isTestnetModeEnabled) {
      return [...(suggestedSection ?? []), ...(includeYourTokens ? (yourTokensSection ?? []) : [])]
    }

    return [
      ...(recentSection ?? []),
      ...(suggestedSection ?? []),
      ...(shouldShowStocks ? (stocksSection ?? []) : []),
      ...(bridgingSection ?? []),
      ...(includeYourTokens ? (yourTokensSection ?? []) : []),
      ...(trendingSection ?? []),
    ]
  }, [
    loading,
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
      loading,
      error: error || undefined,
      refetch,
    }),
    [error, loading, refetch, sections],
  )
}
