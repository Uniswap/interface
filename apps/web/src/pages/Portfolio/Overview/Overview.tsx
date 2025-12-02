import { EmptyWalletCards } from 'components/emptyWallet/EmptyWalletCards'
import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { OverviewActionTiles } from 'pages/Portfolio/Overview/ActionTiles'
import { OVERVIEW_RIGHT_COLUMN_WIDTH } from 'pages/Portfolio/Overview/constants'
import { PortfolioOverviewTables } from 'pages/Portfolio/Overview/OverviewTables'
import { PortfolioChart } from 'pages/Portfolio/Overview/PortfolioChart'
import { OverviewStatsTiles } from 'pages/Portfolio/Overview/StatsTiles'
import { memo, useMemo } from 'react'
import { Flex, Separator, styled, useMedia } from 'ui/src'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { ElementName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { filterDefinedWalletAddresses } from 'utils/filterDefinedWalletAddresses'

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
  const { isTestnetModeEnabled } = useEnabledChains()

  // Fetch portfolio total value to determine if portfolio is zero
  const { data: portfolioData } = usePortfolioTotalValue({
    evmAddress: portfolioAddresses.evmAddress,
    svmAddress: portfolioAddresses.svmAddress,
  })

  const { balanceUSD } = portfolioData || {}

  // Calculate isPortfolioZero - denominated portfolio balance on testnet is always 0
  const isPortfolioZero = useMemo(() => !isTestnetModeEnabled && balanceUSD === 0, [isTestnetModeEnabled, balanceUSD])

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
          <PortfolioChart isPortfolioZero={isPortfolioZero} />
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
            <ActionsAndStatsContainer fullWidth={isFullWidth}>
              <OverviewActionTiles />
              <OverviewStatsTiles activityData={activityData} />
            </ActionsAndStatsContainer>
          )}
        </Flex>

        <Separator />

        {/* Mini tables section */}
        {!isPortfolioZero && (
          <PortfolioOverviewTables
            activityData={activityData}
            chainId={chainId}
            portfolioAddresses={portfolioAddresses}
          />
        )}
      </Flex>
    </Trace>
  )
})
