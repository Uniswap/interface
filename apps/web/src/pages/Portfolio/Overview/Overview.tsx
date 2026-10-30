import { useQueryClient } from '@tanstack/react-query'
import { ChartPeriod, WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Separator, useMedia } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  getPortfolioHistoricalValueChartQuery,
  useGetPortfolioHistoricalValueChartQuery,
} from 'uniswap/src/data/apiClients/dataApiService/balances/getPortfolioChart'
import {
  getUnavailableCategories,
  useWalletBalancesIncludeCategories,
} from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  usePortfolioBalanceBreakdown,
  usePortfolioTotalValue,
} from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier'
import { getUnavailableChartCategories } from 'uniswap/src/features/portfolio/getUnavailableChartCategories'
import { usePortfolioChartBalanceMismatch } from 'uniswap/src/features/portfolio/usePortfolioChartBalanceMismatch'
import { ElementName, InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { EmptyWalletCards } from '~/components/emptyWallet/EmptyWalletCards'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { OverviewActionTiles } from '~/pages/Portfolio/Overview/ActionTiles'
import { useIsPortfolioZero } from '~/pages/Portfolio/Overview/hooks/useIsPortfolioZero'
import {
  PortfolioChartCategory,
  usePortfolioChartSeries,
} from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'
import { PortfolioOverviewTables } from '~/pages/Portfolio/Overview/OverviewTables'
import { PortfolioChart } from '~/pages/Portfolio/Overview/PortfolioChart'
import { PortfolioPerformance } from '~/pages/Portfolio/Overview/PortfolioPerformance'
import { filterDefinedWalletAddresses } from '~/utils/filterDefinedWalletAddresses'

const ACTIONS_AND_STATS_VARIANTS = {
  fullWidth: {
    true: 'w-[100%]',
    false: 'w-[360px]',
  },
} as const

// 360px = OVERVIEW_RIGHT_COLUMN_WIDTH (keep in sync with the other right-column consumers).
const ActionsAndStatsContainer = styled(Flex, {
  base: 'gap-[16px] w-[360px]',
  variants: ACTIONS_AND_STATS_VARIANTS,
})

// Keep in sync with the rendered PortfolioBalanceHeader height.
const ACTIONS_TOP_OFFSET_WITH_BALANCE_HEADER = 92

export const PortfolioOverview = memo(function PortfolioOverview() {
  const media = useMedia()
  const isFullWidth = media.xl
  const portfolioPoolsBalancesEnabled = useFeatureFlag(FeatureFlags.PortfolioPoolsBalances)
  const { chainId, isExternalWallet } = usePortfolioRoutes()
  const portfolioAddresses = usePortfolioAddresses()
  const { chains: allChainIds } = useEnabledChains()

  const isPortfolioZero = useIsPortfolioZero()
  const queryClient = useQueryClient()

  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(ChartPeriod.DAY)
  const [selectedCategory, setSelectedCategory] = useState<PortfolioChartCategory>(PortfolioChartCategory.Total)

  const filterChainIds = useMemo(() => (chainId ? [chainId] : allChainIds), [chainId, allChainIds])

  const includeCategories = useWalletBalancesIncludeCategories()
  const portfolioValueModifier = useRestPortfolioValueModifier(portfolioAddresses.evmAddress)

  const chartInput = useMemo(
    () => ({
      evmAddress: portfolioAddresses.evmAddress,
      svmAddress: portfolioAddresses.svmAddress,
      chainIds: filterChainIds,
      includeCategories,
      includeOverrides: portfolioValueModifier?.includeOverrides,
      excludeOverrides: portfolioValueModifier?.excludeOverrides,
      includeSpamTokens: portfolioValueModifier?.includeSpamTokens,
      ...(includeCategories.includes(WalletBalanceCategory.POOLS) && {
        poolIncludeOverrides: portfolioValueModifier?.poolIncludeOverrides,
        poolExcludeOverrides: portfolioValueModifier?.poolExcludeOverrides,
      }),
    }),
    [
      portfolioAddresses.evmAddress,
      portfolioAddresses.svmAddress,
      filterChainIds,
      includeCategories,
      portfolioValueModifier,
    ],
  )

  const { data: portfolioData, isPending: isBalancePending } = usePortfolioTotalValue({
    evmAddress: portfolioAddresses.evmAddress,
    svmAddress: portfolioAddresses.svmAddress,
    chainIds: filterChainIds,
  })

  // Shares the React Query cache entry with `usePortfolioTotalValue` (same input → same key,
  // different `select`), so this does not trigger an additional network request.
  const { data: portfolioBreakdown, requestedCategories } = usePortfolioBalanceBreakdown({
    evmAddress: portfolioAddresses.evmAddress,
    svmAddress: portfolioAddresses.svmAddress,
    chainIds: filterChainIds,
  })

  // Opt-in categories the backend omitted, making the aggregate total incomplete. The header shows a
  // warning and falls back to the sum of the categories that did resolve.
  const unavailableCategories = useMemo(
    () => getUnavailableCategories({ breakdown: portfolioBreakdown, requestedCategories }),
    [portfolioBreakdown, requestedCategories],
  )

  // Fetch portfolio historical value chart data
  const {
    data: portfolioChartData,
    isPending: isChartPending,
    isPlaceholderData: isChartPlaceholderData,
    error: chartError,
  } = useGetPortfolioHistoricalValueChartQuery({
    input: { ...chartInput, chartPeriod: selectedPeriod },
    enabled: !!(portfolioAddresses.evmAddress || portfolioAddresses.svmAddress),
  })

  const {
    series,
    tokensSeries,
    poolsSeries,
    earnSeries,
    chartPercentChange,
    tokensPercentChange,
    poolsPercentChange,
    earnPercentChange,
    availableCategories,
    hasCategoryBreakdown,
  } = usePortfolioChartSeries({
    chartData: portfolioChartData,
    selectedPeriod,
    selectedCategory,
    poolsEnabled: portfolioPoolsBalancesEnabled,
  })

  // Reset to total when the selected category is no longer available (selector hidden, or that
  // category's data dropped out), so a stale selection doesn't strand the chart on a hidden series.
  useEffect(() => {
    if (selectedCategory !== PortfolioChartCategory.Total && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory(PortfolioChartCategory.Total)
    }
  }, [availableCategories, selectedCategory])
  const isChartLoading = isChartPending || (isChartPlaceholderData && !series.length)
  const isChartEmpty = useMemo(() => {
    if (!series.length) {
      return true
    }

    if (series[series.length - 1].close === 0) {
      return series.every((d) => d.close === 0)
    }

    return false
  }, [series])

  const unavailableChartCategories = useMemo(
    () => getUnavailableChartCategories({ chartData: portfolioChartData, requestedCategories: includeCategories }),
    [portfolioChartData, includeCategories],
  )

  // Detects spam-token divergence. Compared per category, so a single-category view isn't flagged when another
  // category's leg is missing from the chart.
  const { isTotalValueMatch } = usePortfolioChartBalanceMismatch({
    lastChartValue: series.at(-1)?.close,
    portfolioTotalBalanceUSD: {
      [PortfolioChartCategory.Total]: portfolioData?.balanceUSD,
      [PortfolioChartCategory.Tokens]: portfolioBreakdown?.tokens.balanceUSD,
      [PortfolioChartCategory.Pools]: portfolioBreakdown?.pools.balanceUSD,
      [PortfolioChartCategory.Earn]: portfolioBreakdown?.earn.balanceUSD,
    }[selectedCategory],
  })

  // Prefetch chart data for a timeframe on hover so it's ready when the user clicks
  const handleHoverPeriod = useCallback(
    (period: ChartPeriod) => {
      if (!portfolioAddresses.evmAddress && !portfolioAddresses.svmAddress) {
        return
      }
      if (period === selectedPeriod) {
        return
      }
      const periodQuery = getPortfolioHistoricalValueChartQuery({
        input: { ...chartInput, chartPeriod: period },
      })
      const existingPeriodQueryState = queryClient.getQueryState(periodQuery.queryKey)
      if (existingPeriodQueryState?.fetchStatus === 'fetching' || existingPeriodQueryState?.status === 'success') {
        return
      }
      queryClient.prefetchQuery(periodQuery).catch(() => undefined)
    },
    [queryClient, portfolioAddresses.evmAddress, portfolioAddresses.svmAddress, selectedPeriod, chartInput],
  )

  // Fetch activity data once at the top level to share across the overview tables
  const activityData = useActivityData({
    evmOwner: portfolioAddresses.evmAddress,
    svmOwner: portfolioAddresses.svmAddress,
    ownerAddresses: filterDefinedWalletAddresses([portfolioAddresses.evmAddress, portfolioAddresses.svmAddress]),
    fiatOnRampParams: undefined,
    chainIds: chainId ? [chainId] : undefined,
    skip: isPortfolioZero,
  })

  return (
    <Trace logImpression page={InterfacePageName.PortfolioOverviewPage} properties={{ isExternal: isExternalWallet }}>
      <Flex gap="$spacing40" mb="$spacing40">
        <Flex row gap="$spacing40" $xl={{ flexDirection: 'column' }}>
          <Trace section={SectionName.PortfolioOverviewTab} element={ElementName.PortfolioChart}>
            <PortfolioChart
              portfolioTotalBalanceUSD={portfolioData?.balanceUSD}
              tokensValue={portfolioBreakdown?.tokens}
              poolsValue={portfolioPoolsBalancesEnabled ? portfolioBreakdown?.pools : undefined}
              earnValue={portfolioBreakdown?.earn}
              unavailableCategories={unavailableCategories}
              unavailableChartCategories={unavailableChartCategories}
              isPortfolioZero={isPortfolioZero}
              series={series}
              tokensSeries={tokensSeries}
              poolsSeries={poolsSeries}
              earnSeries={earnSeries}
              chartPercentChange={chartPercentChange}
              tokensPercentChange={tokensPercentChange}
              poolsPercentChange={poolsPercentChange}
              earnPercentChange={earnPercentChange}
              isLoading={isChartLoading}
              isBalanceLoading={isBalancePending}
              isChartEmpty={isChartEmpty}
              error={chartError}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              onHoverPeriod={handleHoverPeriod}
              isTotalValueMatch={isTotalValueMatch}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              availableCategories={availableCategories}
              hasCategoryBreakdown={hasCategoryBreakdown}
            />
          </Trace>
          {isPortfolioZero ? (
            <ActionsAndStatsContainer minHeight={120} fullWidth={isFullWidth}>
              <EmptyWalletCards
                buyElementName={ElementName.EmptyStateBuy}
                receiveElementName={ElementName.EmptyStateReceive}
                cexTransferElementName={ElementName.EmptyStateCEXTransfer}
                horizontalLayout={isFullWidth && !media.sm}
                growFullWidth={isFullWidth && !media.sm}
              />
            </ActionsAndStatsContainer>
          ) : (
            <Trace section={SectionName.PortfolioOverviewTab} element={ElementName.PortfolioActionTiles}>
              <ActionsAndStatsContainer
                fullWidth={isFullWidth}
                pt={!isFullWidth ? ACTIONS_TOP_OFFSET_WITH_BALANCE_HEADER : undefined}
              >
                <OverviewActionTiles />
                <PortfolioPerformance />
              </ActionsAndStatsContainer>
            </Trace>
          )}
        </Flex>

        <Separator />

        {/* Mini tables section */}
        {!isPortfolioZero && (
          <Trace section={SectionName.PortfolioOverviewTab} element={ElementName.PortfolioOverviewTables}>
            <PortfolioOverviewTables
              activityData={activityData}
              chainId={chainId}
              portfolioAddresses={portfolioAddresses}
            />
          </Trace>
        )}
      </Flex>
    </Trace>
  )
})
