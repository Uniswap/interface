import { SharedEventName } from '@uniswap/analytics-events'
import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { PortfolioChart } from 'src/components/home/PortfolioChart/PortfolioChart'
import { usePortfolioChartData } from 'src/components/home/PortfolioChart/usePortfolioChartData'
import { Coachmark, Flex, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { spacing } from 'ui/src/theme'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { usePoolsBalanceCoachmarkVisibility } from 'uniswap/src/features/portfolio/PortfolioBalance/usePoolsBalanceCoachmarkVisibility'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { usePortfolioChartBalanceMismatch } from 'uniswap/src/features/portfolio/usePortfolioChartBalanceMismatch'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { noop } from 'utilities/src/react/noop'

interface PortfolioChartSectionProps {
  evmAddress: string
  chainIds: number[]
}

export function PortfolioOverview({ evmAddress, chainIds }: PortfolioChartSectionProps): JSX.Element {
  const { t } = useTranslation()
  const chartPeriod = ChartPeriod.DAY
  // The Home heartbeat coordinator only takes over balance refreshing when this flag is on —
  // otherwise PortfolioBalance must keep its own poll running, or balances would never refresh.
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)

  const { shouldShow: shouldShowPoolsCoachmark, dismiss: dismissPoolsCoachmark } = usePoolsBalanceCoachmarkVisibility({
    evmAddress,
  })

  const {
    data: chartData,
    loading: chartLoading,
    chartColor,
  } = usePortfolioChartData({
    evmAddress,
    chartPeriod,
    chainIds,
  })

  const chartPercentChange = useMemo(() => {
    return getPortfolioChartPercentChange(chartData.map((d) => d.value))
  }, [chartData])

  const lastChartValue = useMemo(() => {
    if (chartData.length === 0) {
      return undefined
    }
    return chartData[chartData.length - 1]?.value
  }, [chartData])

  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress,
    chainIds,
  })

  const { isTotalValueMatch } = usePortfolioChartBalanceMismatch({
    lastChartValue,
    portfolioTotalBalanceUSD: portfolioData?.balanceUSD,
  })

  // Hide the chart (and its tap-through to the details/PnL screen) on an empty wallet — a zero
  // total balance is meaningless to chart. Matches `isEmptyWalletBalance`: a defined, non-positive total.
  const isEmptyPortfolio = portfolioData?.balanceUSD !== undefined && portfolioData.balanceUSD <= 0
  const canShowChart = !isEmptyPortfolio && chartData.length > 0

  const openPortfolioChartDetails = useCallback(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.PortfolioChart,
    })
    navigate(MobileScreens.PortfolioChartDetails)
  }, [])

  const chartNavigationIcon = useMemo((): JSX.Element | undefined => {
    if (!canShowChart) {
      return undefined
    }

    return (
      <Flex ml="$spacing4">
        <RotatableChevron color="$neutral3" direction="right" size="$icon.16" />
      </Flex>
    )
  }, [canShowChart])

  return (
    <Flex py="$spacing20" px="$spacing24">
      {canShowChart ? (
        <TouchableArea testID={TestID.PortfolioChartToggle} activeOpacity={1} onPress={openPortfolioChartDetails}>
          <Flex row alignItems="flex-start">
            <Flex flex={1}>
              <Coachmark
                open={shouldShowPoolsCoachmark}
                placement="bottom-start"
                // Shift up so the pill sits under the balance value rather than the change row below it.
                offset={{ mainAxis: -spacing.spacing16 }}
                text={t('portfolio.poolsBalance.coachmark.body')}
                testID={TestID.PoolsBalanceCoachmark}
                onDismiss={dismissPoolsCoachmark}
              >
                <PortfolioBalance
                  // Disabled because the Home heartbeat coordinator polls balances at the same
                  // cadence as the rest of the page instead.
                  disablePolling={isDataLivelinessEnabled}
                  evmOwner={evmAddress}
                  endText={chartNavigationIcon}
                  chartPeriod={chartPeriod}
                  overridePercentChange={chartPercentChange?.percentChange}
                  overrideAbsoluteChangeUSD={chartPercentChange?.absoluteChangeUSD}
                />
              </Coachmark>
            </Flex>
            <PortfolioChart
              data={chartData}
              loading={chartLoading}
              chartColor={chartColor}
              isExpanded={false}
              chartPeriod={chartPeriod}
              isTotalValueMatch={isTotalValueMatch}
              onChartPeriodChange={noop}
            />
          </Flex>
        </TouchableArea>
      ) : (
        <Coachmark
          open={shouldShowPoolsCoachmark}
          placement="bottom-start"
          // Shift up so the pill sits under the balance value rather than the change row below it.
          offset={{ mainAxis: -spacing.spacing16 }}
          text={t('portfolio.poolsBalance.coachmark.body')}
          testID={TestID.PoolsBalanceCoachmark}
          onDismiss={dismissPoolsCoachmark}
        >
          {/* Disabled because the Home heartbeat coordinator polls balances at the same cadence as the rest of the page instead. */}
          <PortfolioBalance disablePolling={isDataLivelinessEnabled} evmOwner={evmAddress} />
        </Coachmark>
      )}
    </Flex>
  )
}
