import { FeatureFlags, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import { useScrollWindow } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useScrollWindow'
import { TabMeasuredLayout } from 'src/screens/HomeScreen/portfolio/tabs/common/TabMeasuredLayout'
import type { PoolsTabRenderData } from 'src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData'
import { PoolPositionRow } from 'src/screens/HomeScreen/portfolio/tabs/pools/PoolPositionRow'
import { Flex, Loader } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { PoolsDataIssueBanner } from 'uniswap/src/features/portfolio/pools/PoolsDataIssueBanner'
import { usePoolsOutageBanner } from 'uniswap/src/features/portfolio/pools/usePoolsOutageBanner'
import { PositionsEmptyFilterView } from 'uniswap/src/features/positions/components/PositionsEmptyFilterView'
import {
  POSITION_STATUS_FILTER_TO_STATUSES,
  PositionStatusFilterValue,
} from 'uniswap/src/features/positions/components/PositionStatusFilter'
import { filterAndSortPositions, getPositionKey } from 'uniswap/src/features/positions/utils'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const FIRST_PAGE_LOADER_ROW_COUNT = 6
const NEXT_PAGE_LOADER_ROW_COUNT = 2
/** Estimated PositionItem row height for placeholder sizing + windowing math. */
const POOL_POSITION_ROW_HEIGHT = 64
const poolPlaceholderStyle: ViewStyle = { height: POOL_POSITION_ROW_HEIGHT, width: '100%' }

interface HomeScreenPoolsTabProps {
  testID?: string
  owner: string
  shouldLoadPools: boolean
  poolsListRenderData: PoolsTabRenderData
  onHeightChange: (height: number) => void
  statusFilter: PositionStatusFilterValue
  onStatusFilterChange: (value: PositionStatusFilterValue) => void
  /** Outer FlatList scroll offset; used to derive which rows are within the visible window. */
  feedScrollValue: SharedValue<number>
  /** Outer FlatList viewport height, approximately device height. */
  viewportHeight: number
  /** Y-offset of the Pools tab's first row inside the outer FlatList content. */
  bodyOffsetY: number
}

export const HomeScreenPoolsTab = memo(function HomeScreenPoolsTabInner({
  testID,
  owner,
  shouldLoadPools,
  poolsListRenderData,
  onHeightChange,
  statusFilter,
  onStatusFilterChange,
  feedScrollValue,
  viewportHeight,
  bodyOffsetY,
}: HomeScreenPoolsTabProps): JSX.Element {
  const { t } = useTranslation()
  const portfolioPoolsBalancesEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.PortfolioPoolsBalances)
  const outageBanner = usePoolsOutageBanner({
    evmAddress: owner,
    enabled: portfolioPoolsBalancesEnabled,
  })
  const { positions, hiddenPositions, isFetchingNextPage, isLoadingFirstPage, hasErrorWithoutData, refetch } =
    poolsListRenderData
  const { value: hiddenExpanded, toggle: toggleHidden } = useBooleanState(false)

  // Filter client-side (the query fetches every status) and keep closed positions last.
  const filterStatuses = POSITION_STATUS_FILTER_TO_STATUSES[statusFilter]
  const visiblePositions = useMemo(() => filterAndSortPositions(positions, filterStatuses), [positions, filterStatuses])
  const filteredHiddenPositions = useMemo(
    () => filterAndSortPositions(hiddenPositions, filterStatuses),
    [hiddenPositions, filterStatuses],
  )
  const openPositionsCount = useMemo(
    () =>
      positions.filter((position) =>
        POSITION_STATUS_FILTER_TO_STATUSES[PositionStatusFilterValue.Open].includes(position.status),
      ).length,
    [positions],
  )
  const viewOpenPositions = useEvent(() => onStatusFilterChange(PositionStatusFilterValue.Open))

  const isRowVisible = useScrollWindow({
    feedScrollValue,
    viewportHeight,
    bodyOffsetY,
    numRows: visiblePositions.length,
    rowHeight: POOL_POSITION_ROW_HEIGHT,
  })

  if (!shouldLoadPools) {
    return (
      <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
        <Flex />
      </TabMeasuredLayout>
    )
  }

  if (hasErrorWithoutData) {
    return (
      <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
        <BaseCard.ErrorState
          retryEnabled
          icon={<AlertTriangleFilled color="$neutral3" size="$icon.36" />}
          description={t('pool.balances.unavailable')}
          retryButtonLabel={t('common.button.tryAgain')}
          onRetry={refetch}
        />
      </TabMeasuredLayout>
    )
  }

  if (isLoadingFirstPage) {
    return (
      <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
        <Flex px="$spacing24" testID="pools-loading-skeleton">
          <Loader.Token withPrice repeat={FIRST_PAGE_LOADER_ROW_COUNT} />
        </Flex>
      </TabMeasuredLayout>
    )
  }

  return (
    <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
      {outageBanner.isVisible && (
        <Flex px="$spacing20" pb="$spacing4">
          <PoolsDataIssueBanner message={outageBanner.message} onDismiss={outageBanner.onDismiss} />
        </Flex>
      )}
      {visiblePositions.length === 0 ? (
        <PositionsEmptyFilterView
          statusFilter={statusFilter}
          openPositionsCount={openPositionsCount}
          onViewOpenPositions={viewOpenPositions}
        />
      ) : (
        visiblePositions.map((position, i) => {
          if (!isRowVisible(i)) {
            return <View key={getPositionKey(position)} style={poolPlaceholderStyle} />
          }
          return (
            <PoolPositionRow
              key={getPositionKey(position)}
              isVisible
              positionInfo={position}
              onReportSuccess={refetch}
            />
          )
        })
      )}
      {isFetchingNextPage && (
        <Flex px="$spacing24">
          <Loader.Token withPrice repeat={NEXT_PAGE_LOADER_ROW_COUNT} />
        </Flex>
      )}
      {filteredHiddenPositions.length > 0 && (
        <Flex px="$spacing24">
          <ExpandoRow
            isExpanded={hiddenExpanded}
            label={t('hidden.pools.info.text.button', { numHidden: filteredHiddenPositions.length })}
            onPress={toggleHidden}
          />
        </Flex>
      )}
      {hiddenExpanded &&
        filteredHiddenPositions.map((position) => (
          <PoolPositionRow
            key={getPositionKey(position)}
            positionInfo={position}
            isVisible={false}
            onReportSuccess={refetch}
          />
        ))}
    </TabMeasuredLayout>
  )
})
