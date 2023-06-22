import { FlashList } from '@shopify/flash-list'
import React, { createElement, forwardRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { useAdaptiveFooterHeight } from 'src/components/home/hooks'
import { NoTransactions } from 'src/components/icons/NoTransactions'
import { Box, Flex } from 'src/components/layout'
import { AnimatedFlashList } from 'src/components/layout/AnimatedFlashList'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TabProps } from 'src/components/layout/TabHelpers'
import { Loader } from 'src/components/loading'
import { ScannerModalState } from 'src/components/QRCodeScanner/constants'
import { Text } from 'src/components/Text'
import { GQLQueries } from 'src/data/queries'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useMergeLocalAndRemoteTransactions } from 'src/features/transactions/hooks'
import ApproveSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/ApproveSummaryItem'
import FiatPurchaseSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/FiatPurchaseSummaryItem'
import NFTApproveSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/NFTApproveSummaryItem'
import NFTMintSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/NFTMintSummaryItem'
import NFTTradeSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/NFTTradeSummaryItem'
import ReceiveSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/ReceiveSummaryItem'
import SendSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/SendSummaryItem'
import SwapSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/SwapSummaryItem'
import UnknownSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/UnknownSummaryItem'
import WCSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/WCSummaryItem'
import WrapSummaryItem from 'src/features/transactions/SummaryCards/SummaryItems/WrapSummaryItem'
import { removePendingSession } from 'src/features/walletConnect/walletConnectSlice'
import { useFormattedTransactionDataForActivity } from 'wallet/src/features/activity/hooks'
import {
  getActivityItemType,
  isLoadingItem,
  isSectionHeader,
  LoadingItem,
  SectionHeader,
} from 'wallet/src/features/activity/utils'
import { TransactionDetails, TransactionType } from 'wallet/src/features/transactions/types'
import {
  useActiveAccountWithThrow,
  useSelectAccountHideSpamTokens,
} from 'wallet/src/features/wallet/hooks'

export const ACTVITIY_TAB_DATA_DEPENDENCIES = [GQLQueries.TransactionList]

const ESTIMATED_ITEM_SIZE = 92

const SectionTitle = ({ title }: { title: string }): JSX.Element => (
  <Box pb="spacing12">
    <Text color="textSecondary" variant="subheadSmall">
      {title}
    </Text>
  </Box>
)

const renderActivityItem = ({
  item,
}: {
  item: TransactionDetails | SectionHeader | LoadingItem
}): JSX.Element => {
  // if it's a loading item, render the loading placeholder
  if (isLoadingItem(item)) {
    return <Loader.Transaction />
  }
  // if it's a section header, render it differently
  if (isSectionHeader(item)) {
    return <SectionTitle title={item.title} />
  }
  // item is a transaction
  let SummaryItem
  switch (item.typeInfo.type) {
    case TransactionType.Approve:
      SummaryItem = ApproveSummaryItem
      break
    case TransactionType.NFTApprove:
      SummaryItem = NFTApproveSummaryItem
      break
    case TransactionType.Swap:
      SummaryItem = SwapSummaryItem
      break
    case TransactionType.NFTTrade:
      SummaryItem = NFTTradeSummaryItem
      break
    case TransactionType.Send:
      SummaryItem = SendSummaryItem
      break
    case TransactionType.Receive:
      SummaryItem = ReceiveSummaryItem
      break
    case TransactionType.NFTMint:
      SummaryItem = NFTMintSummaryItem
      break
    case TransactionType.Wrap:
      SummaryItem = WrapSummaryItem
      break
    case TransactionType.WCConfirm:
      SummaryItem = WCSummaryItem
      break
    case TransactionType.FiatPurchase:
      SummaryItem = FiatPurchaseSummaryItem
      break
    default:
      SummaryItem = UnknownSummaryItem
  }
  return createElement(
    SummaryItem as React.FunctionComponent<{ transaction: TransactionDetails }>,
    {
      transaction: item,
    }
  )
}

export const ActivityTab = forwardRef<FlashList<unknown>, TabProps>(
  (
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
  ) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const theme = useAppTheme()
    const insets = useSafeAreaInsets()

    const { onContentSizeChange, footerHeight } = useAdaptiveFooterHeight({
      headerHeight,
    })

    // Hide all spam transactions if active wallet has enabled setting.
    const activeAccount = useActiveAccountWithThrow()
    const hideSpamTokens = useSelectAccountHideSpamTokens(activeAccount.address)

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
          progressViewOffset={insets.top}
          refreshing={refreshing ?? false}
          tintColor={theme.colors.textTertiary}
          onRefresh={onRefresh}
        />
      )
    }, [refreshing, onRefresh, theme.colors.textTertiary, insets.top])

    if (!hasData && isError) {
      return errorCard
    }

    return (
      <Flex grow paddingHorizontal="spacing24">
        <AnimatedFlashList
          ref={ref}
          ListEmptyComponent={
            // error view
            !hasData && isError
              ? errorCard
              : // empty view
                (!isLoading && (
                  <Box flexGrow={1} style={containerProps?.emptyContainerStyle}>
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
                  </Box>
                )) ||
                null
            // initial loading is implemented inside sectionData
          }
          // we add a footer to cover any possible space, so user can scroll the top menu all the way to the top
          ListFooterComponent={
            <>
              {isLoading && <Loader.Transaction repeat={4} />}
              <Box height={footerHeight} />
            </>
          }
          data={sectionData}
          estimatedItemSize={ESTIMATED_ITEM_SIZE}
          // To achieve better performance, specify the type based on the item
          // https://shopify.github.io/flash-list/docs/fundamentals/performant-components#getitemtype
          getItemType={getActivityItemType}
          keyExtractor={keyExtractor}
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
  }
)
