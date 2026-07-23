import { memo } from 'react'
import { Flex } from 'ui/src'
import { ActivityRenderData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useConnectionStatus } from '~/features/accounts/store/hooks'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import {
  MAX_ACTIVITY_ROWS,
  MAX_POOLS_ROWS,
  MAX_TOKENS_ROWS,
  OVERVIEW_RIGHT_COLUMN_WIDTH,
} from '~/pages/Portfolio/Overview/constants'
import { MiniActivityTable } from '~/pages/Portfolio/Overview/MiniActivityTable'
import { MiniPoolsTable } from '~/pages/Portfolio/Overview/MiniPoolsTable/MiniPoolsTable'
import { MiniTokensTable } from '~/pages/Portfolio/Overview/MiniTokensTable'
import { OpenLimitsTable } from '~/pages/Portfolio/Overview/OpenLimitsTable'
import { PortfolioEarnSection } from '~/pages/Portfolio/Overview/PortfolioEarnSection'

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
  const evmAddress = portfolioAddresses.evmAddress
  const { isConnected: isEvmConnected } = useConnectionStatus(Platform.EVM)
  const { isExternalWallet } = usePortfolioRoutes()
  const isEarnEnabled = useIsEarnEnabled()
  const { isTestnetModeEnabled } = useEnabledChains()
  const showMiniPoolsTable = !!evmAddress
  const showOpenLimitsTable = !!evmAddress && (!chainId || chainId === UniverseChainId.Mainnet)
  const isConnectedUserPortfolio = isEvmConnected && !isExternalWallet
  const showEarnSection = isEarnEnabled && !isTestnetModeEnabled && showOpenLimitsTable && isConnectedUserPortfolio

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
        {showMiniPoolsTable && <MiniPoolsTable account={evmAddress} maxPools={MAX_POOLS_ROWS} chainId={chainId} />}
      </Flex>
      <Flex width={OVERVIEW_RIGHT_COLUMN_WIDTH} gap="$spacing48" $xl={{ width: '100%' }}>
        {showEarnSection && <PortfolioEarnSection account={evmAddress} />}
        {showOpenLimitsTable && <OpenLimitsTable account={evmAddress} />}
        <MiniActivityTable maxActivities={MAX_ACTIVITY_ROWS} activityData={activityData} />
      </Flex>
    </Flex>
  )
})
