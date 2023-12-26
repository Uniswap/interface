import { ForwardedRef, forwardRef, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl } from 'react-native'
import Animated from 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { NoTransactions } from 'src/components/icons/NoTransactions'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import { TabProps, TAB_BAR_HEIGHT } from 'src/components/layout/TabHelpers'
import { Loader } from 'src/components/loading'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { IS_ANDROID } from 'src/constants/globals'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import TransactionSummaryLayout from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, useDeviceInsets, useSporeColors } from 'ui/src'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { GQLQueries } from 'wallet/src/data/queries'
import { useFormattedTransactionDataForFeed } from 'wallet/src/features/activity/hooks'
import { selectWatchedAddressSet } from 'wallet/src/features/favorites/selectors'
import { generateActivityItemRenderer } from 'wallet/src/features/transactions/SummaryCards/utils'
import {
  useActiveAccountWithThrow,
  useSelectAccountHideSpamTokens,
} from 'wallet/src/features/wallet/hooks'

export const FEED_TAB_DATA_DEPENDENCIES = [GQLQueries.FeedTransactionList]

const ESTIMATED_ITEM_SIZE = 92

const SectionTitle = ({ title }: { title: string }): JSX.Element => (
  <Flex pb="$spacing12">
    <Text color="$neutral2" variant="subheading2">
      {title}
    </Text>
  </Flex>
)

export const FeedTab = memo(
  forwardRef<FlatList<unknown>, TabProps>(function _FeedTab(
    { containerProps, scrollHandler, headerHeight, refreshing, onRefresh },
    ref
  ) {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const colors = useSporeColors()
    const insets = useDeviceInsets()

    const watchedWalletsSet = useAppSelector(selectWatchedAddressSet)
    const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

    const { onContentSizeChange } = useAdaptiveFooter(containerProps?.contentContainerStyle)

    // Hide all spam transactions if active wallet has enabled setting.
    const activeAccount = useActiveAccountWithThrow()
    const hideSpamTokens = useSelectAccountHideSpamTokens(activeAccount.address)

    const renderActivityItem = useMemo(() => {
      return generateActivityItemRenderer(
        TransactionSummaryLayout,
        <Loader.Transaction />,
        SectionTitle
      )
    }, [])

    const { onRetry, hasData, isLoading, isError, sectionData, keyExtractor } =
      useFormattedTransactionDataForFeed(watchedWalletsList, hideSpamTokens)

    const onPressReceive = (): void => {
      // in case we received a pending session from a previous scan after closing modal
      dispatch(removePendingSession())
      dispatch(
        openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr })
      )
    }

    const errorCard = (
      <Flex grow style={containerProps?.emptyContainerStyle}>
        <BaseCard.ErrorState
          retryButtonLabel={t('Retry')}
          title={t('Couldn’t load activity')}
          onRetry={onRetry}
        />
      </Flex>
    )

    const emptyListView = (
      <Flex grow style={containerProps?.emptyContainerStyle}>
        <BaseCard.EmptyState
          description={t('When your favorited wallets makes transactions, they’ll appear here.')}
          icon={<NoTransactions />}
          title={t('No activity yet')}
          onPress={onPressReceive}
        />
      </Flex>
    )

    let emptyComponent = null
    if (!hasData && isError) {
      emptyComponent = errorCard
    } else if (!isLoading && emptyListView) {
      emptyComponent = emptyListView
    }

    const refreshControl = useMemo(() => {
      return (
        <RefreshControl
          progressViewOffset={
            insets.top + (IS_ANDROID && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)
          }
          refreshing={refreshing ?? false}
          tintColor={colors.neutral3.get()}
          onRefresh={onRefresh}
        />
      )
    }, [refreshing, headerHeight, onRefresh, colors.neutral3, insets.top])

    if (!hasData && isError) {
      return errorCard
    }

    // We want to display the loading shimmer in the footer only when the data haven't been fetched yet
    // (list items use their own loading shimmer so there is no need to display it in the footer)
    const isLoadingInitially = isLoading && !sectionData

    return (
      <Flex grow px="$spacing24">
        <AnimatedFlatList
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={ref as ForwardedRef<Animated.FlatList<any>>}
          ListEmptyComponent={emptyComponent}
          // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
          ListFooterComponent={<>{isLoadingInitially && <Loader.Transaction repeat={4} />}</>}
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
