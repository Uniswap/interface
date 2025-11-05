import type { LegendListRef } from '@legendapp/list'
import { LegendList } from '@legendapp/list'
import { useScrollToTop } from '@react-navigation/native'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { ForwardedRef } from 'react'
import { forwardRef, memo, useMemo, useRef, useState } from 'react'
import type { FlatList } from 'react-native'
import { RefreshControl } from 'react-native'
import type Animated from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { AnimatedBottomSheetFlatList, AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import type { TabProps } from 'src/components/layout/TabHelpers'
import { TAB_BAR_HEIGHT } from 'src/components/layout/TabHelpers'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Loader, useSporeColors } from 'ui/src'
import { ScannerModalState } from 'uniswap/src/components/ReceiveQRCode/constants'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { isAndroid } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { useActivityDataWallet } from 'wallet/src/features/activity/useActivityDataWallet'

const ESTIMATED_ITEM_SIZE = 92
const AMOUNT_TO_DRAW = 18
const ON_END_REACHED_THRESHOLD = 0.1 // trigger onEndReached at 10% of visible length

export const ActivityContent = memo(
  forwardRef<FlatList<unknown>, TabProps>(function _ActivityTab(
    {
      owner,
      containerProps,
      scrollHandler,
      headerHeight,
      isExternalProfile = false,
      renderedInModal = false,
      refreshing,
      onRefresh,
    },
    ref,
  ) {
    const dispatch = useDispatch()
    const colors = useSporeColors()
    const insets = useAppInsets()

    const isBottomTabsEnabled = useFeatureFlag(FeatureFlags.BottomTabs)

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
      isFetchingNextPage,
      refetch,
    } = useActivityDataWallet({
      evmOwner: owner,
      authTrigger: requiresBiometrics ? biometricsTrigger : undefined,
      isExternalProfile,
      emptyComponentStyle: containerProps?.emptyComponentStyle,
      onPressEmptyState: onPressReceive,
    })

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

    const refreshControl = useMemo(() => {
      const progressViewOffset = isBottomTabsEnabled
        ? undefined
        : insets.top + (isAndroid && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)

      return (
        <RefreshControl
          progressViewOffset={progressViewOffset}
          refreshing={refreshingAll}
          tintColor={colors.neutral3.get()}
          onRefresh={handleRefresh}
        />
      )
    }, [isBottomTabsEnabled, insets.top, headerHeight, refreshingAll, colors.neutral3, handleRefresh])

    const List = renderedInModal ? AnimatedBottomSheetFlatList : AnimatedFlatList

    const legendListRef = useRef<LegendListRef>(null)
    useScrollToTop(legendListRef)

    return (
      <Flex grow px="$spacing24" testID={TestID.ActivityContent}>
        {isBottomTabsEnabled ? (
          <LegendList
            ref={legendListRef}
            keyExtractor={keyExtractor}
            data={sectionData}
            renderItem={renderActivityItem}
            showsVerticalScrollIndicator={false}
            estimatedItemSize={ESTIMATED_ITEM_SIZE}
            drawDistance={ESTIMATED_ITEM_SIZE * AMOUNT_TO_DRAW}
            ListEmptyComponent={maybeEmptyComponent}
            ListFooterComponent={
              isExternalProfile ? null : (
                <Flex>
                  {isFetchingNextPage && <Loader.Transaction />}
                  {adaptiveFooter}
                </Flex>
              )
            }
            contentContainerStyle={containerProps?.contentContainerStyle}
            refreshControl={refreshControl}
            refreshing={refreshingAll}
            onContentSizeChange={onContentSizeChange}
            onEndReached={hasNextPage && !isFetchingNextPage ? fetchNextPage : undefined}
            onEndReachedThreshold={ON_END_REACHED_THRESHOLD}
          />
        ) : (
          <List
            // biome-ignore lint/suspicious/noExplicitAny: FlatList ref type is complex with animated wrapper
            ref={ref as ForwardedRef<Animated.FlatList<any>>}
            initialNumToRender={10}
            keyExtractor={keyExtractor}
            maxToRenderPerBatch={10}
            refreshControl={refreshControl}
            refreshing={refreshingAll}
            renderItem={renderActivityItem}
            showsVerticalScrollIndicator={false}
            // `sectionData` will be either an array of transactions or an array of loading skeletons
            data={sectionData}
            estimatedItemSize={ESTIMATED_ITEM_SIZE}
            ListEmptyComponent={maybeEmptyComponent}
            // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
            ListFooterComponent={
              isExternalProfile ? null : (
                <Flex>
                  {isFetchingNextPage && <Loader.Transaction />}
                  {adaptiveFooter}
                </Flex>
              )
            }
            onScroll={scrollHandler}
            onContentSizeChange={onContentSizeChange}
            onEndReached={hasNextPage && !isFetchingNextPage ? fetchNextPage : undefined}
            onEndReachedThreshold={ON_END_REACHED_THRESHOLD}
            {...containerProps}
          />
        )}
      </Flex>
    )
  }),
)
