import { FeatureFlags, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Loader, ScrollView } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { PositionItem } from 'uniswap/src/components/portfolio/PositionItem/PositionItem'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { PoolsDataIssueBanner } from 'uniswap/src/features/portfolio/pools/PoolsDataIssueBanner'
import { usePoolsOutageBanner } from 'uniswap/src/features/portfolio/pools/usePoolsOutageBanner'
import { PositionsEmptyFilterView } from 'uniswap/src/features/positions/components/PositionsEmptyFilterView'
import {
  POSITION_STATUS_FILTER_TO_STATUSES,
  PositionStatusFilter,
  PositionStatusFilterValue,
} from 'uniswap/src/features/positions/components/PositionStatusFilter'
import { usePoolsPositionsReport } from 'uniswap/src/features/positions/hooks/usePoolsPositionsReport'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import { filterAndSortPositions, getPositionKey } from 'uniswap/src/features/positions/utils'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useInfiniteScroll } from 'utilities/src/react/useInfiniteScroll'
import { usePendingLiquidityTransactionsChangeListener } from 'wallet/src/features/transactions/hooks/usePendingLiquidityTransactionsChangeListener'

const PAGE_SIZE = 25
const FIRST_PAGE_LOADER_ROW_COUNT = 6
const NEXT_PAGE_LOADER_ROW_COUNT = 2

export const PoolsTab = memo(function PoolsTabInner({
  address,
  skip,
  openPositionsCount = 0,
}: {
  address: Address
  skip?: boolean
  openPositionsCount?: number
}): JSX.Element {
  const { t } = useTranslation()
  const { chains } = useEnabledChains({ platform: Platform.EVM })
  const portfolioPoolsBalancesEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.PortfolioPoolsBalances)
  const outageBanner = usePoolsOutageBanner({ evmAddress: address, enabled: portfolioPoolsBalancesEnabled })

  const { value: hiddenExpanded, toggle: toggleHidden } = useBooleanState(false)
  const [statusFilter, setStatusFilter] = useState<PositionStatusFilterValue>(PositionStatusFilterValue.Open)
  const viewOpenPositions = useEvent(() => setStatusFilter(PositionStatusFilterValue.Open))
  const filterStatuses = POSITION_STATUS_FILTER_TO_STATUSES[statusFilter]

  // Fetch every status once and filter client-side, so toggling the pill never refetches and this
  // query shares its cache entry with the HomeScreen visibility query (which also fetches all statuses).
  const {
    positions,
    hiddenPositions,
    hasData,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    pagesLoaded,
  } = useWalletPositions({
    account: address,
    chainIds: chains,
    statuses: POSITION_STATUS_FILTER_TO_STATUSES[PositionStatusFilterValue.All],
    includeHidden: true,
    autoFetchAllPages: false,
    pageSize: PAGE_SIZE,
    disabled: skip,
    pollInterval: PollingInterval.Normal,
  })

  usePendingLiquidityTransactionsChangeListener(refetch)

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: () => {
      void fetchNextPage()
    },
    hasNextPage,
    isFetching: isFetchingNextPage,
  })

  const isFetchingFirstPage = isFetching && !isFetchingNextPage
  const isLoadingFirstPage = isFetchingFirstPage && !hasData
  const hasErrorWithoutData = !!error && !hasData && !isFetchingFirstPage

  usePoolsPositionsReport({
    positions,
    pagesLoaded,
    hasMore: hasNextPage,
    isLoading: isLoadingFirstPage,
    enabled: !skip,
  })

  const visiblePositions = useMemo(() => filterAndSortPositions(positions, filterStatuses), [positions, filterStatuses])
  const filteredHiddenPositions = useMemo(
    () => filterAndSortPositions(hiddenPositions, filterStatuses),
    [hiddenPositions, filterStatuses],
  )

  const renderPositions = (items: typeof positions, isVisible: boolean): JSX.Element[] =>
    items.map((position) => (
      <PositionItem
        key={getPositionKey(position)}
        positionInfo={position}
        contextMenuActions={{ isVisible, onReportSuccess: refetch }}
      />
    ))

  return (
    <ScrollView showsVerticalScrollIndicator={false} width="100%">
      <Flex mb="$spacing8">
        <PositionStatusFilter value={statusFilter} onChange={setStatusFilter} disabled={hasErrorWithoutData} />
      </Flex>

      {outageBanner.isVisible && (
        <Flex mb="$spacing8">
          <PoolsDataIssueBanner message={outageBanner.message} onDismiss={outageBanner.onDismiss} />
        </Flex>
      )}

      {hasErrorWithoutData ? (
        <BaseCard.ErrorState
          icon={<AlertTriangleFilled color="$neutral3" size="$icon.36" />}
          description={t('pool.balances.unavailable')}
          retryButtonLabel={t('common.button.tryAgain')}
          retryEnabled
          onRetry={refetch}
        />
      ) : isLoadingFirstPage ? (
        <Flex px="$spacing8" testID="pools-loading-skeleton">
          <Loader.Token withPrice repeat={FIRST_PAGE_LOADER_ROW_COUNT} />
        </Flex>
      ) : (
        <>
          {visiblePositions.length === 0 ? (
            <PositionsEmptyFilterView
              statusFilter={statusFilter}
              openPositionsCount={openPositionsCount}
              onViewOpenPositions={viewOpenPositions}
            />
          ) : (
            renderPositions(visiblePositions, true)
          )}

          {filteredHiddenPositions.length > 0 && (
            <ExpandoRow
              isExpanded={hiddenExpanded}
              label={t('hidden.pools.info.text.button', { numHidden: filteredHiddenPositions.length })}
              onPress={toggleHidden}
            />
          )}

          {hiddenExpanded && renderPositions(filteredHiddenPositions, false)}

          {isFetchingNextPage && (
            <Flex px="$spacing8">
              <Loader.Token withPrice repeat={NEXT_PAGE_LOADER_ROW_COUNT} />
            </Flex>
          )}
          {/* infinite-scroll sentinel */}
          <Flex ref={sentinelRef} height={1} my="$spacing12" />
        </>
      )}
    </ScrollView>
  )
})
