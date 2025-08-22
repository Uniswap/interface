import { ForwardedRef, forwardRef, memo, useMemo } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import Animated from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { AnimatedBottomSheetFlatList, AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import { TAB_BAR_HEIGHT, TabProps } from 'src/components/layout/TabHelpers'
import { useBiometricAppSettings } from 'src/features/biometrics/useBiometricAppSettings'
import { useBiometricPrompt } from 'src/features/biometricsSettings/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, useSporeColors } from 'ui/src'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { isAndroid } from 'utilities/src/platform'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { useActivityDataWallet } from 'wallet/src/features/activity/useActivityDataWallet'

export const ACTIVITY_TAB_DATA_DEPENDENCIES = [GQLQueries.TransactionList]

const ESTIMATED_ITEM_SIZE = 92

export const ActivityTab = memo(
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

    const { trigger: biometricsTrigger } = useBiometricPrompt()
    const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()

    const { onContentSizeChange, adaptiveFooter } = useAdaptiveFooter(containerProps?.contentContainerStyle)

    const onPressReceive = (): void => {
      // in case we received a pending session from a previous scan after closing modal
      dispatch(removePendingSession())
      dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr }))
    }

    const { maybeEmptyComponent, renderActivityItem, sectionData, keyExtractor } = useActivityDataWallet({
      owner,
      authTrigger: requiresBiometrics ? biometricsTrigger : undefined,
      isExternalProfile,
      emptyComponentStyle: containerProps?.emptyComponentStyle,
      onPressEmptyState: onPressReceive,
    })

    usePerformanceLogger(DDRumManualTiming.RenderActivityTabList, [])

    const refreshControl = useMemo(() => {
      return (
        <RefreshControl
          progressViewOffset={insets.top + (isAndroid && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)}
          refreshing={refreshing ?? false}
          tintColor={colors.neutral3.get()}
          onRefresh={onRefresh}
        />
      )
    }, [refreshing, headerHeight, onRefresh, colors.neutral3, insets.top])

    const List = renderedInModal ? AnimatedBottomSheetFlatList : AnimatedFlatList

    return (
      <Flex grow px="$spacing24" testID={TestID.ActivityContent}>
        <List
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={ref as ForwardedRef<Animated.FlatList<any>>}
          ListEmptyComponent={maybeEmptyComponent}
          // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
          ListFooterComponent={isExternalProfile ? null : adaptiveFooter}
          // `sectionData` will be either an array of transactions or an array of loading skeletons
          data={sectionData}
          estimatedItemSize={ESTIMATED_ITEM_SIZE}
          initialNumToRender={10}
          keyExtractor={keyExtractor}
          maxToRenderPerBatch={10}
          refreshControl={refreshControl}
          refreshing={refreshing}
          renderItem={renderActivityItem}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={onContentSizeChange}
          onRefresh={onRefresh}
          onScroll={scrollHandler}
          {...containerProps}
        />
      </Flex>
    )
  }),
)
