import { Platform } from '@universe/chains'
import { parseOptionalHex } from '@universe/encoding'
import {
  FeatureFlags,
  SynchronizedHeartbeatsConfigKey,
  useFeatureFlagWithExposureLoggingDisabled,
} from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PortfolioBalancePart } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { usePortfolioBalancePart } from 'uniswap/src/features/dataApi/balances/usePortfolioBalancePart'
import { PoolsDataIssueBanner } from 'uniswap/src/features/portfolio/pools/PoolsDataIssueBanner'
import { usePoolsOutageBanner } from 'uniswap/src/features/portfolio/pools/usePoolsOutageBanner'
import { PortfolioBalance } from 'uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance'
import { usePoolsPositionsReport } from 'uniswap/src/features/positions/hooks/usePoolsPositionsReport'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { APP_BODY_MOBILE_GUTTER_PX } from '~/app/layout/constants'
import { useConnectionStatus } from '~/features/accounts/store/hooks'
import { EmptyPositionsView } from '~/features/Liquidity/components/emptyStates/EmptyPositionsView'
import { ErrorPositionsView } from '~/features/Liquidity/components/emptyStates/ErrorPositionsView'
import { PoolsUnavailableOnSolanaView } from '~/features/Liquidity/components/emptyStates/PoolsUnavailableOnSolanaView'
import {
  deriveActiveRangeFilter,
  deriveLifecycleFilter,
  LP_POSITION_PROTOCOL_VERSIONS,
} from '~/features/Liquidity/constants'
import { useWalletPositionsWeb } from '~/features/Liquidity/hooks/useWalletPositionsWeb'
import { PositionsSummaryChips } from '~/features/Liquidity/PositionsSummaryChips'
import { PositionsTable, PositionsTableLoader } from '~/features/Liquidity/PositionsTable'
import { hasActiveControlBarFilter } from '~/features/Liquidity/PositionsTableControlBar'
import { useIsSynchronizedHeartbeatEnabled } from '~/lib/hooks/useHeartbeatCoordinator'
import { PortfolioBalanceCountIndicator } from '~/pages/Portfolio/components/PortfolioBalanceCountIndicator'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { usePortfolioHeartbeatEnabled } from '~/pages/Portfolio/hooks/usePortfolioHeartbeatCoordinator'
import { useResolvedAddresses } from '~/pages/Portfolio/hooks/useResolvedAddresses'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { usePoolsPositionCount } from '~/pages/Portfolio/Pools/usePoolsPositionCount'
import { usePortfolioPoolsFilters } from '~/pages/Portfolio/Pools/usePortfolioPoolsFilters'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { buildCreatePositionHref } from '~/utils/createPositionRoute'

// Right gutter the summary carousel cancels to bleed to the viewport edge on mWeb: AppBody's gutter,
// the only one below the md breakpoint.
const SUMMARY_CHIPS_BLEED_GUTTERS = { md: APP_BODY_MOBILE_GUTTER_PX }

const PoolsPositionCountIndicator = memo(function PoolsPositionCountIndicator({ count }: { count?: number }) {
  const { t } = useTranslation()

  return (
    <PortfolioBalanceCountIndicator
      label={count !== undefined ? t('portfolio.pools.balance.totalPositions', { count }) : '-'}
    />
  )
})

export function PortfolioPools() {
  const { evmAddress, isExternalWallet } = usePortfolioAddresses()
  const { isConnected: isEvmConnected } = useConnectionStatus(Platform.EVM)
  const { evmAddress: resolvedEvmAddress, svmAddress: resolvedSvmAddress } = useResolvedAddresses()
  const { chainId, externalAddress } = usePortfolioRoutes()
  const showDemoView = useShowDemoView()
  const portfolioPoolsBalancesEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.PortfolioPoolsBalances)
  const isSynchronizedHeartbeatsEnabled = useIsSynchronizedHeartbeatEnabled(
    SynchronizedHeartbeatsConfigKey.PortfolioPollIntervalSeconds,
    usePortfolioHeartbeatEnabled({ tab: PortfolioTab.Pools, poolsEnabled: portfolioPoolsBalancesEnabled }),
  )
  const outageBanner = usePoolsOutageBanner({ evmAddress, chainId, enabled: portfolioPoolsBalancesEnabled })
  const showBalanceHeader = portfolioPoolsBalancesEnabled

  const {
    search,
    versionFilter,
    statusFilter,
    v2StatusFilter,
    showHiddenPositions,
    sort,
    onSort,
    positionsTableControlBarProps,
  } = usePortfolioPoolsFilters({
    chainId,
    externalAddress: externalAddress?.address,
    positionsOwnerAddress: evmAddress,
  })

  // Status and search are filtered server-side by GetWalletPositions; only version stays client-side.
  const {
    visiblePositions,
    hiddenPositions,
    isFetching,
    isPlaceholderData,
    hasNextPage,
    isLoadingPositions,
    hasErrorWithoutData,
    refetch,
    loadMorePositions,
    pagesLoaded,
  } = useWalletPositionsWeb({
    address: evmAddress,
    chainFilter: chainId ?? null,
    versionFilter: LP_POSITION_PROTOCOL_VERSIONS,
    statusFilter,
    v2StatusFilter,
    sort,
    searchText: search,
  })

  usePoolsPositionsReport({
    positions: visiblePositions,
    lifecycleFilter: deriveLifecycleFilter(v2StatusFilter),
    rangeFilter: deriveActiveRangeFilter(statusFilter),
    pagesLoaded,
    hasMore: hasNextPage,
    // A filter change serves the previous query's rows as placeholder data while refetching;
    // treat that window as loading so the old set is never emitted under the new filter name.
    isLoading: isLoadingPositions || isPlaceholderData,
    enabled: !!evmAddress,
  })

  const balanceChainIds = useMemo(() => (chainId ? [chainId] : undefined), [chainId])
  const { data: poolsBalance } = usePortfolioBalancePart({
    part: PortfolioBalancePart.Pools,
    evmAddress,
    chainIds: balanceChainIds,
  })
  const hasLoadedBalance = poolsBalance !== undefined
  const totalPoolsCount = poolsBalance?.count

  const hasLoadedPositions = !isLoadingPositions && !hasErrorWithoutData
  const poolsPositionCount = usePoolsPositionCount({
    v2StatusFilter,
    visiblePositions,
    totalPoolsCount,
    hasLoadedPositions,
    hasNextPage,
  })

  const hasSolanaOnlyWallet = !resolvedEvmAddress && !!resolvedSvmAddress
  // Version stays client-side; status and search are already filtered server-side. Position order is
  // set server-side (sort_by), so preserve it.
  const matchesPositionFilters = useCallback(
    (position: PositionInfo): boolean => versionFilter.includes(position.version),
    [versionFilter],
  )
  const filteredVisiblePositions = useMemo(
    () => visiblePositions.filter(matchesPositionFilters),
    [visiblePositions, matchesPositionFilters],
  )
  const filteredHiddenPositions = useMemo(
    () => hiddenPositions.filter(matchesPositionFilters),
    [hiddenPositions, matchesPositionFilters],
  )
  const walletHasAnyPositions = visiblePositions.length > 0 || hiddenPositions.length > 0
  const hasActiveV2Filter = hasActiveControlBarFilter(positionsTableControlBarProps)
  // The Hidden toggle can empty the list (wallet has no hidden positions); like an active filter it
  // must keep the table+control bar mounted, otherwise the switch unmounts with no way back. The
  // route chain scope is the same trap: a chain with no positions must show the no-results table
  // (whose Clear filters widens back to all networks), not the bare empty view.
  const showEmptyState = hasLoadedPositions && !walletHasAnyPositions && !hasActiveV2Filter && !showHiddenPositions

  const portfolioPoolsUrl = buildPortfolioUrl({
    tab: PortfolioTab.Pools,
    chainId,
    externalAddress: externalAddress?.address,
  })
  const newPositionHref = buildCreatePositionHref({ entryPoint: portfolioPoolsUrl })

  const renderListContent = (): JSX.Element => {
    if (hasErrorWithoutData) {
      return <ErrorPositionsView onRetry={refetch} />
    }
    if (isLoadingPositions) {
      return <PositionsTableLoader {...positionsTableControlBarProps} />
    }
    return (
      <PositionsTable
        visiblePositions={filteredVisiblePositions}
        hiddenPositions={filteredHiddenPositions}
        hasNextPage={hasNextPage}
        isFetching={isFetching}
        isPlaceholderData={isPlaceholderData}
        loadMorePositions={loadMorePositions}
        sort={sort}
        onSort={onSort}
        entryPoint={portfolioPoolsUrl}
        readOnly={isExternalWallet}
        {...positionsTableControlBarProps}
      />
    )
  }

  const renderContent = (): JSX.Element => {
    if (hasSolanaOnlyWallet) {
      return <PoolsUnavailableOnSolanaView />
    }
    if (showEmptyState) {
      return <EmptyPositionsView newPositionHref={newPositionHref} showNewPositionAction={!isExternalWallet} />
    }

    return (
      <Flex gap="$spacing24">
        <Flex gap="$spacing24">
          {showBalanceHeader && (
            <PortfolioBalance
              evmOwner={evmAddress}
              chainIds={balanceChainIds}
              endText={hasLoadedBalance ? <PoolsPositionCountIndicator count={poolsPositionCount} /> : undefined}
              part={PortfolioBalancePart.Pools}
              // The heartbeat refetches balances on its tick — avoid a second overlapping schedule
              disablePolling={isSynchronizedHeartbeatsEnabled}
              disableRefresh={showDemoView}
            />
          )}
          <PositionsSummaryChips
            walletAddress={parseOptionalHex(evmAddress)}
            showActions={!isExternalWallet && isEvmConnected}
            balanceChainIds={balanceChainIds}
            rewardsTooltipVariant="portfolio"
            bleedGutters={SUMMARY_CHIPS_BLEED_GUTTERS}
          />
        </Flex>
        <Flex grow shrink width="100%">
          {outageBanner.isVisible && (
            <Flex mb="$spacing16">
              <PoolsDataIssueBanner message={outageBanner.message} onDismiss={outageBanner.onDismiss} />
            </Flex>
          )}
          {renderListContent()}
        </Flex>
      </Flex>
    )
  }

  return (
    <Trace logImpression page={InterfacePageName.PortfolioPoolsPage} properties={{ isExternal: isExternalWallet }}>
      {renderContent()}
    </Trace>
  )
}
