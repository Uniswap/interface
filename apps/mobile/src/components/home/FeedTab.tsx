import { ForwardedRef, forwardRef, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, RefreshControl } from 'react-native'
import Animated from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import { TAB_BAR_HEIGHT, TabProps } from 'src/components/layout/TabHelpers'
import { Loader } from 'src/components/loading/loaders'
import { openModal } from 'src/features/modals/modalSlice'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { Flex, Text, useDeviceInsets, useSporeColors } from 'ui/src'
import { NoTransactions } from 'ui/src/components/icons'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { selectWatchedAddressSet } from 'uniswap/src/features/favorites/selectors'
import { useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isAndroid } from 'utilities/src/platform'
import { ScannerModalState } from 'wallet/src/components/QRCodeScanner/constants'
import { useFormattedTransactionDataForFeed } from 'wallet/src/features/activity/hooks'
import { generateActivityItemRenderer } from 'wallet/src/features/transactions/SummaryCards/utils'

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
    ref,
  ) {
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const colors = useSporeColors()
    const insets = useDeviceInsets()

    const watchedWalletsSet = useSelector(selectWatchedAddressSet)
    const watchedWalletsList = useMemo(() => Array.from(watchedWalletsSet), [watchedWalletsSet])

    const { onContentSizeChange } = useAdaptiveFooter(containerProps?.contentContainerStyle)

    // Hide all spam transactions if active wallet has enabled setting.
    const hideSpamTokens = useHideSpamTokensSetting()

    const renderActivityItem = useMemo(() => {
      return generateActivityItemRenderer(<Loader.Transaction />, SectionTitle, undefined, undefined)
    }, [])

    const { onRetry, hasData, isLoading, isError, sectionData, keyExtractor } = useFormattedTransactionDataForFeed(
      watchedWalletsList,
      hideSpamTokens,
    )

    const onPressReceive = (): void => {
      // in case we received a pending session from a previous scan after closing modal
      dispatch(removePendingSession())
      dispatch(openModal({ name: ModalName.WalletConnectScan, initialState: ScannerModalState.WalletQr }))
    }

    const errorCard = (
      <Flex grow style={containerProps?.emptyComponentStyle}>
        <BaseCard.ErrorState
          retryButtonLabel={t('common.button.retry')}
          title={t('home.feed.error')}
          onRetry={onRetry}
        />
      </Flex>
    )

    const emptyListView = (
      <Flex grow style={containerProps?.emptyComponentStyle}>
        <BaseCard.EmptyState
          description={t('home.feed.empty.description')}
          icon={<NoTransactions color="$neutral3" size="$icon.70" />}
          title={t('home.feed.empty.title')}
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
          progressViewOffset={insets.top + (isAndroid && headerHeight ? headerHeight + TAB_BAR_HEIGHT : 0)}
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
  }),
)
