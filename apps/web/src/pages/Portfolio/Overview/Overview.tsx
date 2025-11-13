import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from 'pages/Portfolio/hooks/usePortfolioAddresses'
import { OverviewActionTiles } from 'pages/Portfolio/Overview/ActionTiles'
import {
  MAX_ACTIVITY_ROWS,
  MAX_LIMITS_ROWS,
  MAX_POOLS_ROWS,
  MAX_TOKENS_ROWS,
  OVERVIEW_RIGHT_COLUMN_WIDTH,
} from 'pages/Portfolio/Overview/constants'
import { MiniActivityTable } from 'pages/Portfolio/Overview/MiniActivityTable'
import { MiniPoolsTable } from 'pages/Portfolio/Overview/MiniPoolsTable/MiniPoolsTable'
import { MiniTokensTable } from 'pages/Portfolio/Overview/MiniTokensTable'
import { OpenLimitsTable } from 'pages/Portfolio/Overview/OpenLimitsTable'
import { OverviewStatsTiles } from 'pages/Portfolio/Overview/StatsTiles'
import { Flex, Separator, styled, Text, useMedia } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'

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

export function PortfolioOverview() {
  const media = useMedia()
  const isFullWidth = media.xl
  const { chainId } = usePortfolioRoutes()
  const portfolioAddresses = usePortfolioAddresses()

  return (
    <Trace logImpression page={InterfacePageName.PortfolioOverviewPage}>
      <Flex gap="$spacing40" mb="$spacing40">
        <Flex row gap="$spacing40" $xl={{ flexDirection: 'column' }}>
          <Flex grow backgroundColor="$surface3" borderRadius="$rounded8" centered minHeight={200}>
            <Text>Chart</Text>
          </Flex>
          <ActionsAndStatsContainer fullWidth={isFullWidth}>
            <OverviewActionTiles />
            <OverviewStatsTiles />
          </ActionsAndStatsContainer>
        </Flex>

        <Separator />

        {/* Mini tables section */}
        <Flex
          row
          gap="$spacing40"
          width="100%"
          alignItems="flex-start"
          justifyContent="space-between"
          $md={{ padding: '$none' }}
          grow
          $xl={{ flexDirection: 'column-reverse' }}
        >
          <Flex gap="$spacing16" grow shrink $xl={{ width: '100%' }}>
            <MiniTokensTable maxTokens={MAX_TOKENS_ROWS} chainId={chainId} />
            {portfolioAddresses.evmAddress && (
              <MiniPoolsTable account={portfolioAddresses.evmAddress} maxPools={MAX_POOLS_ROWS} chainId={chainId} />
            )}
          </Flex>
          <Flex width={OVERVIEW_RIGHT_COLUMN_WIDTH} gap="$spacing40" $xl={{ width: '100%' }}>
            {portfolioAddresses.evmAddress && (!chainId || chainId === UniverseChainId.Mainnet) && (
              <OpenLimitsTable account={portfolioAddresses.evmAddress} maxLimits={MAX_LIMITS_ROWS} />
            )}
            <MiniActivityTable maxActivities={MAX_ACTIVITY_ROWS} chainId={chainId} />
          </Flex>
        </Flex>
      </Flex>
    </Trace>
  )
}
