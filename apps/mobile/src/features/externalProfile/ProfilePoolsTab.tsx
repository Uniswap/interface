import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { FeatureFlags, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, type ListRenderItemInfo } from 'react-native'
import { useAppStackNavigation } from 'src/app/navigation/types'
import type { TabProps } from 'src/components/layout/TabHelpers'
import { usePoolsListRenderData } from 'src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData'
import { Flex, Loader } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
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
    ({ item }: ListRenderItemInfo<PositionInfo>): JSX.Element => (
      <ProfilePoolPositionRow owner={owner} positionInfo={item} />
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
        {hiddenExpanded &&
          filteredHiddenPositions.map((position) => (
            <ProfilePoolPositionRow key={getPositionKey(position)} owner={owner} positionInfo={position} />
          ))}
      </>
    ),
    [isFetchingNextPage, filteredHiddenPositions, hiddenExpanded, toggleHidden, owner, t],
  )

  const List = renderedInModal ? BottomSheetFlatList<PositionInfo> : FlatList<PositionInfo>

  return (
    <Flex grow backgroundColor="$surface1">
      <List
        contentContainerStyle={containerProps?.contentContainerStyle}
        data={hasErrorWithoutData || isLoadingFirstPage ? [] : visiblePositions}
        keyExtractor={getPositionKey}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        showsVerticalScrollIndicator={false}
        onEndReached={onListEndReached}
        onEndReachedThreshold={0.5}
      />
    </Flex>
  )
})

const ProfilePoolPositionRow = memo(function ProfilePoolPositionRow({
  owner,
  positionInfo,
}: {
  owner: string
  positionInfo: PositionInfo
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

  return <PositionItem hasOuterPadding positionInfo={positionInfo} onPress={onPress} />
})
