import { useQueryClient } from '@tanstack/react-query'
import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo, useState } from 'react'
import { PortfolioChart } from 'src/components/home/PortfolioChart/PortfolioChart'
import { usePortfolioChartData } from 'src/components/home/PortfolioChart/usePortfolioChartData'
import { PortfolioPerformance } from 'src/components/home/PortfolioPerformance'
import { ScreenWithHeader } from 'src/components/layout/screens/ScreenWithHeader'
import { PortfolioChartDetailsMenu } from 'src/screens/PortfolioChartDetailsScreen/PortfolioChartDetailsMenu'
import { useChartScrub } from 'src/screens/PortfolioChartDetailsScreen/useChartScrub'
import { Flex, ScrollView } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { getPortfolioHistoricalValueChartQuery } from 'uniswap/src/data/rest/getPortfolioChart'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { CHART_PERIOD_OPTIONS } from 'uniswap/src/features/portfolio/chartPeriod'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { usePortfolioChartBalanceMismatch } from 'uniswap/src/features/portfolio/usePortfolioChartBalanceMismatch'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useActiveAccountWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'

export function PortfolioChartDetailsScreen(): JSX.Element {
  const activeAccount = useActiveAccountWithThrow()
  const displayName = useDisplayName(activeAccount.address, { includeUnitagSuffix: true })
  const { chains } = useEnabledChains()
  const insets = useAppInsets()
  const queryClient = useQueryClient()
  const isPnLEnabled = useFeatureFlag(FeatureFlags.ProfitLoss)
  const [chartPeriod, setChartPeriod] = useState(ChartPeriod.DAY)
  const { chartScrubFiatValue, handleScrub } = useChartScrub()

  const {
    data: chartData,
    loading: chartLoading,
    chartColor,
  } = usePortfolioChartData({
    evmAddress: activeAccount.address,
    chartPeriod,
    chainIds: chains,
    enabled: isPnLEnabled,
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

  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress: activeAccount.address,
    chainIds: chains,
  })

  const { isTotalValueMatch } = usePortfolioChartBalanceMismatch({
    lastChartValue,
    portfolioTotalBalanceUSD: portfolioData?.balanceUSD,
  })

  const canShowChart = isPnLEnabled && chartData.length > 0
  const isAllTimePeriod = chartPeriod === ChartPeriod.MAX

  useEffect(() => {
    if (!isPnLEnabled || !activeAccount.address) {
      return
    }

    for (const period of CHART_PERIOD_OPTIONS) {
      if (period === chartPeriod) {
        continue
      }

      queryClient
        .prefetchQuery(
          getPortfolioHistoricalValueChartQuery({
            input: { evmAddress: activeAccount.address, chartPeriod: period, chainIds: chains },
          }),
        )
        .catch(() => undefined)
    }
  }, [activeAccount.address, chartPeriod, chains, isPnLEnabled, queryClient])

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
          includeUnitagSuffix
          displayName={displayName}
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
        <Flex gap="$spacing24" px="$spacing24" pt="$spacing20" pb={insets.bottom + spacing.spacing24}>
          <PortfolioBalance
            evmOwner={activeAccount.address}
            chartPeriod={canShowChart ? chartPeriod : undefined}
            overrideBalanceUSD={chartScrubFiatValue}
            overridePercentChange={canShowChart ? chartPercentChange?.percentChange : undefined}
            overrideAbsoluteChangeUSD={canShowChart ? chartPercentChange?.absoluteChangeUSD : undefined}
            hidePercentChange={isAllTimePeriod}
          />
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
