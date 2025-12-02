import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { EmptyWalletCards } from 'components/emptyWallet/EmptyWalletCards'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { OverviewActionTiles } from 'pages/Portfolio/Overview/ActionTiles'
import { OVERVIEW_RIGHT_COLUMN_WIDTH } from 'pages/Portfolio/Overview/constants'
import { useIsPortfolioZero } from 'pages/Portfolio/Overview/hooks/useIsPortfolioZero'
import { PortfolioOverviewTables } from 'pages/Portfolio/Overview/OverviewTables'
import { PortfolioChart } from 'pages/Portfolio/Overview/PortfolioChart'
import { OverviewStatsTiles } from 'pages/Portfolio/Overview/StatsTiles'
import { checkBalanceDiffWithinRange } from 'pages/Portfolio/Overview/utils/checkBalanceDiffWithinRange'
import { memo, useMemo, useState } from 'react'
import { Flex, Separator, styled, useMedia } from 'ui/src'
import { useGetPortfolioHistoricalValueChartQuery } from 'uniswap/src/data/rest/getPortfolioChart'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { ElementName, InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { filterDefinedWalletAddresses } from 'utils/filterDefinedWalletAddresses'

const BALANCE_PERCENT_DIFFERENCE_THRESHOLD = 2

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

export const PortfolioOverview = memo(function PortfolioOverview() {
  const media = useMedia()
  const isFullWidth = media.xl
  const { chainId } = usePortfolioRoutes()
  const portfolioAddresses = usePortfolioAddresses()
  const { chains: allChainIds } = useEnabledChains()

  const isPortfolioZero = useIsPortfolioZero()

  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(ChartPeriod.DAY)

  const filterChainIds = useMemo(() => (chainId ? [chainId] : allChainIds), [chainId, allChainIds])

  const { data: portfolioData } = usePortfolioTotalValue({
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
    input: {
      evmAddress: portfolioAddresses.evmAddress,
      svmAddress: portfolioAddresses.svmAddress,
      chainIds: filterChainIds,
      chartPeriod: selectedPeriod,
    },
    enabled: !!(portfolioAddresses.evmAddress || portfolioAddresses.svmAddress),
  })

  // Get the latest value from chart endpoint (last point in the array) for comparison
  const chartTotalBalanceUSD = useMemo(() => {
    if (!portfolioChartData?.points || portfolioChartData.points.length === 0) {
      return undefined
    }
    const lastPoint = portfolioChartData.points[portfolioChartData.points.length - 1]
    return lastPoint.value
  }, [portfolioChartData])

  // Compare portfolio balance (EVM + Solana) with chart endpoint balance (for debugging/validation)
  const isTotalValueMatch = checkBalanceDiffWithinRange({
    chartTotalBalanceUSD,
    portfolioTotalBalanceUSD: portfolioData?.balanceUSD,
    percentDifferenceThreshold: BALANCE_PERCENT_DIFFERENCE_THRESHOLD,
  })

  // Fetch activity data once at the top level to share between useSwapsThisWeek and MiniActivityTable
  const activityData = useActivityData({
    evmOwner: portfolioAddresses.evmAddress,
    svmOwner: portfolioAddresses.svmAddress,
    ownerAddresses: filterDefinedWalletAddresses([portfolioAddresses.evmAddress, portfolioAddresses.svmAddress]),
    fiatOnRampParams: undefined,
    chainIds: chainId ? [chainId] : undefined,
    skip: isPortfolioZero,
  })

  return (
    <Trace logImpression page={InterfacePageName.PortfolioOverviewPage}>
      <Flex gap="$spacing40" mb="$spacing40">
        <Flex row gap="$spacing40" $xl={{ flexDirection: 'column' }}>
          <Trace section={SectionName.PortfolioOverviewTab} element={ElementName.PortfolioChart}>
            <PortfolioChart
              portfolioTotalBalanceUSD={portfolioData?.balanceUSD}
              isPortfolioZero={isPortfolioZero}
              chartData={portfolioChartData}
              isPending={isChartPending}
              error={chartError}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              isTotalValueMatch={isTotalValueMatch}
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
              <ActionsAndStatsContainer fullWidth={isFullWidth}>
                <OverviewActionTiles />
                <OverviewStatsTiles activityData={activityData} />
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
