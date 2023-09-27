import { FlashList } from '@shopify/flash-list'
import React, { forwardRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch } from 'src/app/hooks'
import { useAdaptiveFooter } from 'src/components/home/hooks'
import { NoTransactions } from 'src/components/icons/NoTransactions'
import { TabProps, TAB_BAR_HEIGHT } from 'src/components/layout/TabHelpers'
import { Loader } from 'src/components/loading'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { IS_ANDROID } from 'src/constants/globals'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import {
  useCreateSwapFormState,
  useMergeLocalAndRemoteTransactions,
} from 'src/features/transactions/hooks'
import TransactionSummaryLayout from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { useMostRecentSwapTx } from 'src/features/transactions/swap/hooks'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { AnimatedFlashList, Flex, Text, useSporeColors } from 'ui/src'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { GQLQueries } from 'wallet/src/data/queries'
import { useFormattedTransactionDataForActivity } from 'wallet/src/features/activity/hooks'
import { getActivityItemType } from 'wallet/src/features/activity/utils'
import { SwapSummaryCallbacks } from 'wallet/src/features/transactions/SummaryCards/types'
import { generateActivityItemRenderer } from 'wallet/src/features/transactions/SummaryCards/utils'
import { TransactionState } from 'wallet/src/features/transactions/transactionState/types'
import {
  useActiveAccountWithThrow,
  useSelectAccountHideSpamTokens,
} from 'wallet/src/features/wallet/hooks'

export const ACTIVITY_TAB_DATA_DEPENDENCIES = [GQLQueries.TransactionList]

const ESTIMATED_ITEM_SIZE = 92

const SectionTitle = ({ title }: { title: string }): JSX.Element => (
  <Flex pb="$spacing12">
    <Text color="$neutral2" variant="subheading2">
      {title}
    </Text>
  </Flex>
)

export const ActivityTab = forwardRef<FlashList<unknown>, TabProps>(function _ActivityTab(
  {
    owner,
    containerProps,
    scrollHandler,
    headerHeight,
    isExternalProfile = false,
    refreshing,
    onRefresh,
  },
  ref
) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const colors = useSporeColors()
  const insets = useSafeAreaInsets()

  const { onContentSizeChange, adaptiveFooter } = useAdaptiveFooter(
    containerProps?.contentContainerStyle
  )

  // Hide all spam transactions if active wallet has enabled setting.
  const activeAccount = useActiveAccountWithThrow()
  const hideSpamTokens = useSelectAccountHideSpamTokens(activeAccount.address)

  const swapCallbacks: SwapSummaryCallbacks = useMemo(() => {
    return {
      getLatestSwapTransaction: useMostRecentSwapTx,
      getSwapFormTransactionState: useCreateSwapFormState,
      onRetryGenerator: (swapFormState: TransactionState | undefined) => {
        return () => {
          dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
        }
      },
    }
  }, [dispatch])

  const renderActivityItem = useMemo(() => {
    return generateActivityItemRenderer(
      TransactionSummaryLayout,
      <Loader.Transaction />,
      SectionTitle,
      swapCallbacks
    )
  }, [swapCallbacks])

  const { onRetry, hasData, isLoading, isError, sectionData, keyExtractor } =
    useFormattedTransactionDataForActivity(
      owner,
      hideSpamTokens,
      useMergeLocalAndRemoteTransactions
    )

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
      <AnimatedFlashList
        ref={ref}
        ListEmptyComponent={
          // error view
          !hasData && isError
            ? errorCard
            : // empty view
              (!isLoading && (
                <Flex grow style={containerProps?.emptyContainerStyle}>
                  <BaseCard.EmptyState
                    buttonLabel={isExternalProfile ? undefined : 'Receive tokens or NFTs'}
                    description={
                      isExternalProfile
                        ? t('When this wallet makes transactions, they’ll appear here.')
                        : t(
                            'When you approve, trade, or transfer tokens or NFTs, your transactions will appear here.'
                          )
                    }
                    icon={<NoTransactions />}
                    title={t('No activity yet')}
                    onPress={onPressReceive}
                  />
                </Flex>
              )) ||
              null
          // initial loading is implemented inside sectionData
        }
        // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
        ListFooterComponent={
          <>
            {isLoadingInitially && <Loader.Transaction repeat={4} />}
            {adaptiveFooter}
          </>
        }
        data={sectionData}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        // To achieve better performance, specify the type based on the item
        // https://shopify.github.io/flash-list/docs/fundamentals/performant-components#getitemtype
        getItemType={getActivityItemType}
        keyExtractor={keyExtractor}
        maxToRenderPerBatch={20}
        numColumns={1}
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
})
