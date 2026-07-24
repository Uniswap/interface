import { useQueryClient } from '@tanstack/react-query'
import { ChartPeriod, WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags, useFeatureFlag, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import { useEffect, useMemo, useState } from 'react'
import { PortfolioChart } from 'src/components/home/PortfolioChart/PortfolioChart'
import { usePortfolioChartData } from 'src/components/home/PortfolioChart/usePortfolioChartData'
import { PortfolioPerformance } from 'src/components/home/PortfolioPerformance'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { getBreakdownCardProps } from 'src/screens/PortfolioChartDetailsScreen/getBreakdownCardProps'
import { PortfolioBalanceBreakdownCard } from 'src/screens/PortfolioChartDetailsScreen/PortfolioBalanceBreakdownCard'
import { PortfolioChartDetailsMenu } from 'src/screens/PortfolioChartDetailsScreen/PortfolioChartDetailsMenu'
import { useChartScrub } from 'src/screens/PortfolioChartDetailsScreen/useChartScrub'
import { usePortfolioChartDetailsHeartbeatCoordinator } from 'src/screens/PortfolioChartDetailsScreen/usePortfolioChartDetailsHeartbeatCoordinator'
import { Flex, ScrollView, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { iconSizes, spacing } from 'ui/src/theme'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { getPortfolioHistoricalValueChartQuery } from 'uniswap/src/data/rest/getPortfolioChart'
import {
  getUnavailableCategories,
  useWalletBalancesIncludeCategories,
} from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioBalanceBreakdown } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier'
import { CHART_PERIOD_OPTIONS } from 'uniswap/src/features/portfolio/chartPeriod'
import { PoolsDataIssueBanner } from 'uniswap/src/features/portfolio/pools/PoolsDataIssueBanner'
import { usePoolsOutageBanner } from 'uniswap/src/features/portfolio/pools/usePoolsOutageBanner'
import { useUnavailableBalancesText } from 'uniswap/src/features/portfolio/PortfolioBalance/BalanceUnavailableIndicator'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { usePortfolioChartBalanceMismatch } from 'uniswap/src/features/portfolio/usePortfolioChartBalanceMismatch'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useActiveAccountWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'

export function PortfolioChartDetailsScreen(): JSX.Element {
  const activeAccount = useActiveAccountWithThrow()
  const displayName = useDisplayName(activeAccount.address)
  const { chains } = useEnabledChains()
  // The heartbeat coordinator only takes over balance refreshing when this flag is on —
  // otherwise PortfolioBalance must keep its own poll running, or balances would never refresh.
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)
  usePortfolioChartDetailsHeartbeatCoordinator({ enabled: isDataLivelinessEnabled })
  const insets = useAppInsets()
  const queryClient = useQueryClient()
  const [chartPeriod, setChartPeriod] = useState(ChartPeriod.DAY)
  // Read without logging; the pools exposure is logged only where the feature is actually shown (see usePoolsTabVisibility).
  const portfolioPoolsBalancesEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.PortfolioPoolsBalances)
  const includeCategories = useWalletBalancesIncludeCategories()
  const portfolioValueModifier = useRestPortfolioValueModifier(activeAccount.address)

  const {
    data: chartData,
    tokensData,
    poolsData,
    loading: chartLoading,
    chartColor,
  } = usePortfolioChartData({
    evmAddress: activeAccount.address,
    chartPeriod,
    chainIds: chains,
  })

  const { chartScrubFiatValue, chartScrubTokensValue, chartScrubPoolsValue, handleScrub } = useChartScrub({
    tokensData,
    poolsData,
  })

  const chartPercentChange = useMemo(() => {
    const firstPoint = chartData[0]
    if (chartScrubFiatValue !== undefined && firstPoint !== undefined) {
      return getPortfolioChartPercentChange([firstPoint.value, chartScrubFiatValue])
    }
    return getPortfolioChartPercentChange(chartData.map((dataPoint) => dataPoint.value))
  }, [chartData, chartScrubFiatValue])

  const lastChartValue = useMemo(() => {
    if (chartData.length === 0) {
      return undefined
    }

    return chartData[chartData.length - 1]?.value
  }, [chartData])

  const { data: breakdown, requestedCategories } = usePortfolioBalanceBreakdown({
    evmAddress: activeAccount.address,
    chainIds: chains,
  })

  const unavailableCategories = useMemo(
    () => getUnavailableCategories({ breakdown, requestedCategories }),
    [breakdown, requestedCategories],
  )
  const poolsUnavailable = unavailableCategories.includes(WalletBalanceCategory.POOLS)
  const unavailableBalancesText = useUnavailableBalancesText(unavailableCategories)

  const outageBanner = usePoolsOutageBanner({
    evmAddress: activeAccount.address,
    enabled: portfolioPoolsBalancesEnabled,
  })

  const { isTotalValueMatch } = usePortfolioChartBalanceMismatch({
    lastChartValue,
    portfolioTotalBalanceUSD: breakdown?.total.balanceUSD,
  })

  const canShowChart = chartData.length > 0
  const isAllTimePeriod = chartPeriod === ChartPeriod.MAX

  const breakdownCardProps = useMemo(
    () =>
      getBreakdownCardProps({
        enabled: portfolioPoolsBalancesEnabled,
        poolsUnavailable,
        breakdown,
        scrub: { total: chartScrubFiatValue, tokens: chartScrubTokensValue, pools: chartScrubPoolsValue },
        tokensData,
        poolsData,
        isAllTimePeriod,
      }),
    [
      portfolioPoolsBalancesEnabled,
      poolsUnavailable,
      breakdown,
      chartScrubFiatValue,
      chartScrubTokensValue,
      chartScrubPoolsValue,
      tokensData,
      poolsData,
      isAllTimePeriod,
    ],
  )

  useEffect(() => {
    if (!activeAccount.address) {
      return
    }

    for (const period of CHART_PERIOD_OPTIONS) {
      if (period === chartPeriod) {
        continue
      }

      queryClient
        .prefetchQuery(
          getPortfolioHistoricalValueChartQuery({
            input: {
              evmAddress: activeAccount.address,
              chartPeriod: period,
              chainIds: chains,
              includeCategories,
              ...(includeCategories.includes(WalletBalanceCategory.POOLS) && {
                poolIncludeOverrides: portfolioValueModifier?.poolIncludeOverrides,
                poolExcludeOverrides: portfolioValueModifier?.poolExcludeOverrides,
              }),
            },
          }),
        )
        .catch(() => undefined)
    }
  }, [activeAccount.address, chartPeriod, chains, includeCategories, portfolioValueModifier, queryClient])

  const centerElement = useMemo(
    () => (
      <Flex row shrink alignItems="center" gap="$spacing8" justifyContent="center" maxWidth={220}>
        <AccountIcon
          showBorder
          address={activeAccount.address}
          showBackground={true}
          showViewOnlyBadge={activeAccount.type === AccountType.Readonly}
          size={iconSizes.icon20}
          borderColor="$surface3"
          borderWidth="$spacing1"
        />
        <DisplayNameText
          displayName={displayName}
          unitagIconSize={iconSizes.icon16}
          flexShrink={1}
          textProps={{ ellipsizeMode: 'tail', numberOfLines: 1, variant: 'body3' }}
        />
      </Flex>
    ),
    [activeAccount.address, activeAccount.type, displayName],
  )

  return (
    <ScreenWithHeader centerElement={centerElement} rightElement={<PortfolioChartDetailsMenu />}>
      <ScrollView flex={1} showsVerticalScrollIndicator={false} testID={TestID.PortfolioChartDetailsScreen}>
        {unavailableBalancesText && (
          <Flex
            row
            alignItems="center"
            gap="$spacing12"
            backgroundColor="$surface2"
            px="$spacing24"
            py="$spacing12"
            testID={TestID.BalanceUnavailableBanner}
          >
            <AlertTriangleFilled color="$neutral2" size="$icon.20" />
            <Text color="$neutral2" variant="body3">
              {unavailableBalancesText}
            </Text>
          </Flex>
        )}
        {!poolsUnavailable && outageBanner.isVisible && (
          <PoolsDataIssueBanner fullWidth message={outageBanner.message} onDismiss={outageBanner.onDismiss} />
        )}
        <Flex
          gap={breakdownCardProps ? '$spacing4' : '$spacing24'}
          px="$spacing24"
          pt="$spacing20"
          pb={insets.bottom + spacing.spacing24}
        >
          <PortfolioBalance
            hideUnavailableIndicator
            // Disabled because this screen's heartbeat coordinator polls balances at the same
            // cadence as the rest of the page instead.
            disablePolling={isDataLivelinessEnabled}
            evmOwner={activeAccount.address}
            chartPeriod={canShowChart ? chartPeriod : undefined}
            overrideBalanceUSD={chartScrubFiatValue}
            overridePercentChange={canShowChart ? chartPercentChange?.percentChange : undefined}
            overrideAbsoluteChangeUSD={canShowChart ? chartPercentChange?.absoluteChangeUSD : undefined}
            hidePercentChange={isAllTimePeriod}
          />
          {breakdownCardProps && <PortfolioBalanceBreakdownCard {...breakdownCardProps} />}
          <Flex>
            <PortfolioChart
              data={chartData}
              loading={chartLoading}
              chartColor={chartColor}
              isExpanded={true}
              chartPeriod={chartPeriod}
              isTotalValueMatch={isTotalValueMatch}
              onChartPeriodChange={setChartPeriod}
              onScrub={handleScrub}
            />
            <Flex pt="$spacing4">
              <PortfolioPerformance evmAddress={activeAccount.address} chainIds={chains} />
            </Flex>
          </Flex>
        </Flex>
      </ScrollView>
    </ScreenWithHeader>
  )
}
