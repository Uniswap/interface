import { ForwardedRef, forwardRef, memo, useMemo } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import Animated from 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import {
  AnimatedBottomSheetFlatList,
  AnimatedFlatList,
} from 'src/components/layout/AnimatedFlatList'
import { TAB_BAR_HEIGHT, TabProps } from 'src/components/layout/TabHelpers'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, useDeviceInsets, useSporeColors } from 'ui/src'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { isAndroid } from 'uniswap/src/utils/platform'
import { useActivityData } from 'wallet/src/features/activity/useActivityData'
import { ModalName } from 'wallet/src/telemetry/constants'

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
    ref
  ) {
    const dispatch = useAppDispatch()
    const colors = useSporeColors()
    const insets = useDeviceInsets()

    const { trigger: biometricsTrigger } = useBiometricPrompt()
    const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()

    const { onContentSizeChange, adaptiveFooter } = useAdaptiveFooter(
      containerProps?.contentContainerStyle
    )

    const onPressReceive = (): void => {
      // in case we received a pending session from a previous scan after closing modal
      dispatch(removePendingSession())
      dispatch(
        openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
      )
    }

    const {
      maybeLoaderComponent,
      maybeEmptyComponent,
      renderActivityItem,
      sectionData,
      keyExtractor,
    } = useActivityData({
      owner,
      authTrigger: requiresBiometrics ? biometricsTrigger : undefined,
      isExternalProfile,
      emptyContainerStyle: containerProps?.emptyContainerStyle,
      onPressEmptyState: onPressReceive,
    })

    const refreshControl = useMemo(() => {
      return (
        <RefreshControl
          progressViewOffset={
            insets.top + (isAndroid && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)
          }
          refreshing={refreshing ?? false}
          tintColor={colors.neutral3.get()}
          onRefresh={onRefresh}
        />
      )
    }, [refreshing, headerHeight, onRefresh, colors.neutral3, insets.top])

    const List = renderedInModal ? AnimatedBottomSheetFlatList : AnimatedFlatList

    return (
      <Flex grow px="$spacing24">
        <List
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={ref as ForwardedRef<Animated.FlatList<any>>}
          ListEmptyComponent={maybeEmptyComponent}
          // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
          ListFooterComponent={
            <>
              {maybeLoaderComponent}
              {isExternalProfile ? null : adaptiveFooter}
            </>
          }
          data={sectionData}
          estimatedItemSize={ESTIMATED_ITEM_SIZE}
          initialNumToRender={20}
          keyExtractor={keyExtractor}
          maxToRenderPerBatch={20}
          refreshControl={refreshControl}
          refreshing={refreshing}
          renderItem={renderActivityItem}
          showsVerticalScrollIndicator={false}
          updateCellsBatchingPeriod={10}
          onContentSizeChange={onContentSizeChange}
          onRefresh={onRefresh}
          onScroll={scrollHandler}
          {...containerProps}
        />
      </Flex>
    )
  })
)
