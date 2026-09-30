import { SharedEventName } from '@uniswap/analytics-events'
import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Flex, spacing, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { PortfolioChart } from 'src/components/home/PortfolioChart/PortfolioChart'
import { usePortfolioChartData } from 'src/components/home/PortfolioChart/usePortfolioChartData'
import { Coachmark } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { usePoolsBalanceCoachmarkVisibility } from 'uniswap/src/features/portfolio/PortfolioBalance/usePoolsBalanceCoachmarkVisibility'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { usePortfolioChartBalanceMismatch } from 'uniswap/src/features/portfolio/usePortfolioChartBalanceMismatch'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { noop } from 'utilities/src/react/noop'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

interface PortfolioChartSectionProps {
  evmAddress: string
  chainIds: number[]
}

export function PortfolioOverview({ evmAddress, chainIds }: PortfolioChartSectionProps): JSX.Element {
  const { t } = useTranslation()
  const chartPeriod = ChartPeriod.DAY
  const activeAccount = useActiveAccountWithThrow()
  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const { shouldShow: shouldShowPoolsCoachmark, dismiss: dismissPoolsCoachmark } = usePoolsBalanceCoachmarkVisibility({
    // View-only wallets never get the coachmark; omitting the address also skips the zero-balance auto-dismiss.
    evmAddress: isSignerAccount ? evmAddress : undefined,
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
                  // The Home heartbeat coordinator refreshes balances on its 60s full tick instead.
                  disablePolling
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
          {/* The Home heartbeat coordinator refreshes balances on its 60s full tick instead. */}
          <PortfolioBalance disablePolling evmOwner={evmAddress} />
        </Coachmark>
      )}
    </Flex>
  )
}
