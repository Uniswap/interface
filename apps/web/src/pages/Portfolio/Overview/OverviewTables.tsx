import { UniverseChainId, Platform } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { memo } from 'react'
import { ActivityRenderData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useConnectionStatus } from '~/connection/accounts/hooks'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { usePortfolioRoutes } from '~/hooks/usePortfolioRoutes/usePortfolioRoutes'
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
import { PortfolioMarginSection } from '~/pages/Portfolio/Overview/PortfolioMarginSection'

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
  const { isTestnetModeEnabled } = useEnabledChains()
  const showMiniPoolsTable = !!evmAddress
  const showOpenLimitsTable = !!evmAddress && (!chainId || chainId === UniverseChainId.Mainnet)
  // External and disconnected demo portfolios are visible but never actionable.
  const isEarnSectionReadOnly = isExternalWallet || !isEvmConnected
  const showEarnSection = !isTestnetModeEnabled && showOpenLimitsTable
  const isMarginEnabled = useFeatureFlag(FeatureFlags.Margin)
  const showMarginSection =
    isMarginEnabled && !!evmAddress && !isTestnetModeEnabled && (!chainId || chainId === MARGIN_CHAIN_ID)

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
        {showEarnSection && <PortfolioEarnSection account={evmAddress} isReadOnly={isEarnSectionReadOnly} />}
        {showMarginSection && <PortfolioMarginSection account={evmAddress} isReadOnly={isEarnSectionReadOnly} />}
        {showOpenLimitsTable && <OpenLimitsTable account={evmAddress} />}
        <MiniActivityTable maxActivities={MAX_ACTIVITY_ROWS} activityData={activityData} />
      </Flex>
    </Flex>
  )
})
