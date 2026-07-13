import { useQueryClient } from '@tanstack/react-query'
import { ChartPeriod, WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Flex, Separator, styled, useMedia } from 'ui/src'
import {
  getPortfolioHistoricalValueChartQuery,
  useGetPortfolioHistoricalValueChartQuery,
} from 'uniswap/src/data/rest/getPortfolioChart'
import { useWalletBalancesIncludeCategories } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  usePortfolioBalanceBreakdown,
  usePortfolioTotalValue,
} from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier'
import { usePortfolioChartBalanceMismatch } from 'uniswap/src/features/portfolio/usePortfolioChartBalanceMismatch'
import { ElementName, InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { EmptyWalletCards } from '~/components/emptyWallet/EmptyWalletCards'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { OverviewActionTiles } from '~/pages/Portfolio/Overview/ActionTiles'
import { OVERVIEW_RIGHT_COLUMN_WIDTH } from '~/pages/Portfolio/Overview/constants'
import { useIsPortfolioZero } from '~/pages/Portfolio/Overview/hooks/useIsPortfolioZero'
import {
  PortfolioChartCategory,
  usePortfolioChartSeries,
} from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'
import { PortfolioOverviewTables } from '~/pages/Portfolio/Overview/OverviewTables'
import { PortfolioChart } from '~/pages/Portfolio/Overview/PortfolioChart'
import { PortfolioPerformance } from '~/pages/Portfolio/Overview/PortfolioPerformance'
import { filterDefinedWalletAddresses } from '~/utils/filterDefinedWalletAddresses'

const ActionsAndStatsContainer = styled(Flex, {
  width: OVERVIEW_RIGHT_COLUMN_WIDTH,
  gap: '$spacing16',
  variants: {
    fullWidth: {
      true: {
        width: '100%',
      },
      false: {
        width: OVERVIEW_RIGHT_COLUMN_WIDTH,
      },
    },
  } as const,
})

// Keep in sync with the rendered PortfolioBalanceHeader height.
const ACTIONS_TOP_OFFSET_WITH_BALANCE_HEADER = 92

export const PortfolioOverview = memo(function PortfolioOverview() {
  const media = useMedia()
  const isFullWidth = media.xl
  const portfolioPoolsBalancesEnabled = useFeatureFlag(FeatureFlags.PortfolioPoolsBalances)
  const showBalanceHeaderRow = portfolioPoolsBalancesEnabled
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

  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress: portfolioAddresses.evmAddress,
    svmAddress: portfolioAddresses.svmAddress,
    chainIds: filterChainIds,
  })

  // Shares the React Query cache entry with `usePortfolioTotalValue` (same input → same key,
  // different `select`), so this does not trigger an additional network request.
  const { data: portfolioBreakdown } = usePortfolioBalanceBreakdown({
    evmAddress: portfolioAddresses.evmAddress,
    svmAddress: portfolioAddresses.svmAddress,
    chainIds: filterChainIds,
  })

  // Fetch portfolio historical value chart data
  const {
    data: portfolioChartData,
    isPending: isChartPending,
    error: chartError,
  } = useGetPortfolioHistoricalValueChartQuery({
    input: { ...chartInput, chartPeriod: selectedPeriod },
    enabled: !!(portfolioAddresses.evmAddress || portfolioAddresses.svmAddress),
  })

  const {
    series,
    tokensSeries,
    poolsSeries,
    chartPercentChange,
    tokensPercentChange,
    poolsPercentChange,
    hasCategoryBreakdown,
  } = usePortfolioChartSeries({
    chartData: portfolioChartData,
    selectedPeriod,
    selectedCategory,
  })

  // Reset to total when the selector hides, so a stale selection doesn't strand the chart on a now-hidden series.
  useEffect(() => {
    if (!hasCategoryBreakdown && selectedCategory !== PortfolioChartCategory.Total) {
      setSelectedCategory(PortfolioChartCategory.Total)
    }
  }, [hasCategoryBreakdown, selectedCategory])
  const isChartLoading = isChartPending || !series.length
  const isChartEmpty = useMemo(() => {
    if (!series.length) {
      return true
    }

    if (series[series.length - 1].close === 0) {
      return series.every((d) => d.close === 0)
    }

    return false
  }, [series])

  // Get the latest value from chart endpoint (last point in the array) for comparison
  const lastChartValue = useMemo(() => {
    if (!portfolioChartData?.points || portfolioChartData.points.length === 0) {
      return undefined
    }
    return portfolioChartData.points[portfolioChartData.points.length - 1]?.value
  }, [portfolioChartData])

  // Compare portfolio balance (EVM + Solana) with chart endpoint balance to detect spam-token divergence
  const { isTotalValueMatch } = usePortfolioChartBalanceMismatch({
    lastChartValue,
    portfolioTotalBalanceUSD: portfolioData?.balanceUSD,
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
              poolsValue={portfolioBreakdown?.pools}
              isPortfolioZero={isPortfolioZero}
              series={series}
              tokensSeries={tokensSeries}
              poolsSeries={poolsSeries}
              chartPercentChange={chartPercentChange}
              tokensPercentChange={tokensPercentChange}
              poolsPercentChange={poolsPercentChange}
              isLoading={isChartLoading}
              isChartEmpty={isChartEmpty}
              error={chartError}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              onHoverPeriod={handleHoverPeriod}
              isTotalValueMatch={isTotalValueMatch}
              showBalanceHeaderRow={showBalanceHeaderRow}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
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
                pt={showBalanceHeaderRow && !isFullWidth ? ACTIONS_TOP_OFFSET_WITH_BALANCE_HEADER : undefined}
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
