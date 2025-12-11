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
import { memo } from 'react'
import { Flex } from 'ui/src'
import { ActivityRenderData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface PortfolioOverviewTablesProps {
  activityData: ActivityRenderData
  chainId: UniverseChainId | undefined
  portfolioAddresses: { evmAddress: Address | undefined; svmAddress: Address | undefined }
}

export const PortfolioOverviewTables = memo(function PortfolioOverviewTables({
  activityData,
  chainId,
  portfolioAddresses,
}: PortfolioOverviewTablesProps) {
  return (
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
      <Flex gap="$spacing40" grow shrink $xl={{ width: '100%' }}>
        <MiniTokensTable maxTokens={MAX_TOKENS_ROWS} chainId={chainId} />
        {portfolioAddresses.evmAddress && (
          <MiniPoolsTable account={portfolioAddresses.evmAddress} maxPools={MAX_POOLS_ROWS} chainId={chainId} />
        )}
      </Flex>
      <Flex width={OVERVIEW_RIGHT_COLUMN_WIDTH} gap="$spacing40" $xl={{ width: '100%' }}>
        {portfolioAddresses.evmAddress && (!chainId || chainId === UniverseChainId.Mainnet) && (
          <OpenLimitsTable account={portfolioAddresses.evmAddress} maxLimits={MAX_LIMITS_ROWS} />
        )}
        <MiniActivityTable maxActivities={MAX_ACTIVITY_ROWS} activityData={activityData} />
      </Flex>
    </Flex>
  )
})
