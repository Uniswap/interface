import { useScrollToTop } from '@react-navigation/native'
import { Flex, Loader, UniversalList, type UniversalListRef } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { useDispatch } from 'react-redux'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import type { TabProps } from 'src/components/layout/TabHelpers'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import {
  SCREEN_DRAW_MULTIPLIER,
  ACTIVITY_ROW_HEIGHT,
  activityItemsAreEqual,
  getActivityItemSize,
  ON_END_REACHED_THRESHOLD,
} from 'uniswap/src/components/activity/activityListItems'
import { getActivityItemType } from 'uniswap/src/components/activity/utils'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import type { DataApiOutageState } from 'uniswap/src/features/dataApi/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { useEvent } from 'utilities/src/react/hooks'
import { useActivityDataWallet } from 'wallet/src/features/activity/useActivityDataWallet'

type ActivityContentProps = TabProps & {
  onErrorStateChange?: ({ error, dataUpdatedAt }: DataApiOutageState) => void
}

export const ActivityContent = memo(function ActivityTabInner({
  owner,
  containerProps,
  isExternalProfile = false,
  refreshing,
  onRefresh,
  onErrorStateChange,
}: ActivityContentProps): JSX.Element {
  const dispatch = useDispatch()
  const colors = useSporeColors()
  const dimensions = useWindowDimensions()

  const { trigger: biometricsTrigger } = useBiometricPrompt()
  const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()

  const { onContentSizeChange, adaptiveFooter } = useAdaptiveFooter(containerProps?.contentContainerStyle)

  const onPressReceive = useEvent((): void => {
    // in case we received a pending session from a previous scan after closing modal
    dispatch(removePendingSession())
    dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr }))
  })

  const {
    maybeEmptyComponent,
    renderActivityItem,
    sectionData,
    keyExtractor,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
    error: activityError,
    dataUpdatedAt,
  } = useActivityDataWallet({
    evmOwner: owner,
    authTrigger: requiresBiometrics ? biometricsTrigger : undefined,
    isExternalProfile,
    emptyComponentStyle: containerProps?.emptyComponentStyle,
    onPressEmptyState: onPressReceive,
  })

  const dataUpdatedAtRef = useRef(dataUpdatedAt)
  dataUpdatedAtRef.current = dataUpdatedAt

  useEffect(() => {
    onErrorStateChange?.({
      error: activityError,
      dataUpdatedAt: activityError ? dataUpdatedAtRef.current : undefined,
    })
  }, [activityError, onErrorStateChange])

  usePerformanceLogger(DDRumManualTiming.RenderActivityTabList, [])

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useEvent(async () => {
    setIsRefreshing(true)
    try {
      onRefresh?.()
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  })

  const refreshingAll = refreshing ?? isRefreshing

  const listRef = useRef<UniversalListRef>(null)
  useScrollToTop(listRef)

  const handleEndReached = useEvent((): void => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  })

  // Client-side filters (spam, hidden tokens, limit orders) can shrink a page to a few rows or none.
  // onEndReached won't re-fire for that: the adaptive footer pads the list to full height, so keep
  // paging until the real content covers the screen. Gate on isFetching (not just isFetchingNextPage):
  // fetchNextPage cancels an in-flight page-1 refetch, which would drop the newest transactions.
  const estimatedContentHeight = useMemo(
    () => sectionData.reduce((height, item) => height + getActivityItemSize(item), 0),
    [sectionData],
  )
  const shouldFillScreen =
    !isExternalProfile &&
    hasNextPage &&
    !isFetching &&
    !isFetchNextPageError &&
    estimatedContentHeight < dimensions.height

  useEffect(() => {
    if (shouldFillScreen) {
      fetchNextPage()
    }
  }, [shouldFillScreen, fetchNextPage])

  return (
    <Flex grow px="$spacing24" testID={TestID.ActivityContent}>
      <UniversalList
        // Force remount when wallet changes to reset internal list state
        key={owner}
        ref={listRef}
        recycleItems
        contentContainerStyle={{ style: containerProps?.contentContainerStyle }}
        data={sectionData}
        drawDistance={dimensions.height * SCREEN_DRAW_MULTIPLIER}
        estimatedItemSize={ACTIVITY_ROW_HEIGHT}
        estimatedListSize={dimensions}
        getItemType={getActivityItemType}
        itemsAreEqual={activityItemsAreEqual}
        keyExtractor={keyExtractor}
        ListEmptyComponent={maybeEmptyComponent}
        ListFooterComponent={
          isExternalProfile ? null : (
            <Flex>
              {isFetchingNextPage && <Loader.Transaction repeat={2} />}
              {adaptiveFooter}
            </Flex>
          )
        }
        refreshIndicatorColor={colors.neutral3.get()}
        refreshing={refreshingAll}
        renderItem={renderActivityItem}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={onContentSizeChange}
        onEndReached={isExternalProfile ? undefined : handleEndReached}
        onEndReachedThreshold={ON_END_REACHED_THRESHOLD}
        onRefresh={handleRefresh}
      />
    </Flex>
  )
})
