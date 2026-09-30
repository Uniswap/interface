import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { FeatureFlags, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import {
  Flex,
  UniversalList,
  useIsRowViewable,
  type UniversalListRenderItemInfo,
  type UniversalListStyle,
} from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStackNavigation } from 'src/app/navigation/types'
import type { TabProps } from 'src/components/layout/TabHelpers'
import { usePoolsListRenderData } from 'src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData'
import { Loader } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { PositionItem } from 'uniswap/src/components/portfolio/PositionItem/PositionItem'
import { PoolsDataIssueBanner } from 'uniswap/src/features/portfolio/pools/PoolsDataIssueBanner'
import { usePoolsOutageBanner } from 'uniswap/src/features/portfolio/pools/usePoolsOutageBanner'
import { PositionsEmptyFilterView } from 'uniswap/src/features/positions/components/PositionsEmptyFilterView'
import {
  POSITION_STATUS_FILTER_TO_STATUSES,
  PositionStatusFilter,
  PositionStatusFilterValue,
} from 'uniswap/src/features/positions/components/PositionStatusFilter'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { filterAndSortPositions, getPositionKey } from 'uniswap/src/features/positions/utils'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const EMPTY_POSITIONS: PositionInfo[] = []

const FIRST_PAGE_LOADER_ROW_COUNT = 6
const NEXT_PAGE_LOADER_ROW_COUNT = 2

type ProfilePoolsTabProps = Pick<TabProps, 'owner' | 'containerProps' | 'renderedInModal'> & {
  openPositionsCount: number
}

/**
 * Read-only Pools list for the external wallet view. Mirrors the extension PoolsTab, minus
 * ownership actions (hide/report menus, data-quality reporting) — those mutate the viewer's
 * own state and don't apply to someone else's wallet.
 */
export const ProfilePoolsTab = memo(function ProfilePoolsTabInner({
  owner,
  containerProps,
  renderedInModal = false,
  openPositionsCount,
}: ProfilePoolsTabProps): JSX.Element {
  const { t } = useTranslation()
  const poolsBalancesEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.PortfolioPoolsBalances)
  const outageBanner = usePoolsOutageBanner({ evmAddress: owner, enabled: poolsBalancesEnabled })

  const [statusFilter, setStatusFilter] = useState<PositionStatusFilterValue>(PositionStatusFilterValue.Open)
  const { value: hiddenExpanded, toggle: toggleHidden } = useBooleanState(false)

  const {
    positions,
    hiddenPositions,
    isFetchingNextPage,
    isLoadingFirstPage,
    hasErrorWithoutData,
    refetch,
    onListEndReached,
  } = usePoolsListRenderData({ owner, skip: false })

  const filterStatuses = POSITION_STATUS_FILTER_TO_STATUSES[statusFilter]
  const visiblePositions = useMemo(() => filterAndSortPositions(positions, filterStatuses), [positions, filterStatuses])
  const filteredHiddenPositions = useMemo(
    () => filterAndSortPositions(hiddenPositions, filterStatuses),
    [hiddenPositions, filterStatuses],
  )
  const viewOpenPositions = useEvent(() => setStatusFilter(PositionStatusFilterValue.Open))

  const renderItem = useCallback(
    ({ item }: UniversalListRenderItemInfo<PositionInfo>): JSX.Element => (
      <ProfilePoolListRow owner={owner} positionInfo={item} rowKey={getPositionKey(item)} />
    ),
    [owner],
  )

  const ListHeaderComponent = useMemo(
    () => (
      <Flex gap="$spacing8" pb="$spacing8">
        <Flex px="$spacing16">
          <PositionStatusFilter value={statusFilter} disabled={hasErrorWithoutData} onChange={setStatusFilter} />
        </Flex>
        {outageBanner.isVisible && (
          <Flex px="$spacing20">
            <PoolsDataIssueBanner message={outageBanner.message} onDismiss={outageBanner.onDismiss} />
          </Flex>
        )}
      </Flex>
    ),
    [statusFilter, hasErrorWithoutData, outageBanner.isVisible, outageBanner.message, outageBanner.onDismiss],
  )

  const ListEmptyComponent = useMemo(() => {
    if (hasErrorWithoutData) {
      return (
        <BaseCard.ErrorState
          retryEnabled
          icon={<AlertTriangleFilled color="$neutral3" size="$icon.36" />}
          description={t('pool.balances.unavailable')}
          retryButtonLabel={t('common.button.tryAgain')}
          onRetry={refetch}
        />
      )
    }
    if (isLoadingFirstPage) {
      return (
        <Flex px="$spacing24" testID="pools-loading-skeleton">
          <Loader.Token withPrice repeat={FIRST_PAGE_LOADER_ROW_COUNT} />
        </Flex>
      )
    }
    return (
      <PositionsEmptyFilterView
        statusFilter={statusFilter}
        openPositionsCount={openPositionsCount}
        onViewOpenPositions={viewOpenPositions}
      />
    )
  }, [hasErrorWithoutData, isLoadingFirstPage, statusFilter, openPositionsCount, viewOpenPositions, refetch, t])

  const ListFooterComponent = useMemo(
    () => (
      <>
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
        {/* Footer rows aren't virtualized or viewability-tracked; hidden positions stay static. */}
        {hiddenExpanded &&
          filteredHiddenPositions.map((position) => (
            <ProfilePoolPositionRow
              key={getPositionKey(position)}
              suspendAnimations
              owner={owner}
              positionInfo={position}
            />
          ))}
      </>
    ),
    [isFetchingNextPage, filteredHiddenPositions, hiddenExpanded, toggleHidden, owner, t],
  )

  const contentContainerStyle = useMemo<UniversalListStyle>(
    () => ({ style: containerProps?.contentContainerStyle }),
    [containerProps?.contentContainerStyle],
  )

  return (
    // `fill` (flex:1) not `grow`: the list needs a parent with a definite height or it sizes to its content.
    <Flex fill backgroundColor="$surface1">
      <UniversalList
        trackRowViewability
        contentContainerStyle={contentContainerStyle}
        data={hasErrorWithoutData || isLoadingFirstPage ? EMPTY_POSITIONS : visiblePositions}
        keyExtractor={getPositionKey}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={renderItem}
        // Route scroll gestures through the sheet's own scrollable when rendered inside one.
        renderScrollComponent={renderedInModal ? BottomSheetScrollView : undefined}
        showsVerticalScrollIndicator={false}
        onEndReached={onListEndReached}
        onEndReachedThreshold={0.5}
      />
    </Flex>
  )
})

const ProfilePoolListRow = memo(function ProfilePoolListRow({
  owner,
  positionInfo,
  rowKey,
}: {
  owner: string
  positionInfo: PositionInfo
  rowKey: string
}): JSX.Element {
  const isViewable = useIsRowViewable(rowKey)
  return <ProfilePoolPositionRow owner={owner} positionInfo={positionInfo} suspendAnimations={!isViewable} />
})

const ProfilePoolPositionRow = memo(function ProfilePoolPositionRow({
  owner,
  positionInfo,
  suspendAnimations,
}: {
  owner: string
  positionInfo: PositionInfo
  suspendAnimations: boolean
}): JSX.Element {
  const navigation = useAppStackNavigation()

  const onPress = useEvent(() => {
    navigation.navigate(MobileScreens.PositionDetails, {
      poolId: positionInfo.poolId,
      tokenId: positionInfo.tokenId,
      chainId: positionInfo.chainId,
      protocolVersion: positionInfo.version,
      owner,
    })
  })

  return (
    <PositionItem hasOuterPadding positionInfo={positionInfo} suspendAnimations={suspendAnimations} onPress={onPress} />
  )
})
