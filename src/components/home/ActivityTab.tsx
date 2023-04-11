import { NetworkStatus } from '@apollo/client'
import { FlashList } from '@shopify/flash-list'
import React, { createElement, forwardRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from 'src/app/hooks'
import { useAdaptiveFooterHeight } from 'src/components/home/hooks'
import { NoTransactions } from 'src/components/icons/NoTransactions'
import { Box, Flex } from 'src/components/layout'
import { AnimatedFlashList } from 'src/components/layout/AnimatedFlashList'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TabProps, TAB_STYLES } from 'src/components/layout/TabHelpers'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import { useTransactionListQuery } from 'src/data/__generated__/types-and-hooks'
import { usePersistedError } from 'src/features/dataApi/utils'
import {
  formatTransactionsByDate,
  parseDataResponseToTransactionDetails,
} from 'src/features/transactions/history/utils'
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
import { TransactionDetails, TransactionType } from 'src/features/transactions/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { makeSelectAccountHideSpamTokens } from 'src/features/wallet/selectors'

type LoadingItem = {
  itemType: 'LOADING'
  id: number
}
const isLoadingItem = (x: TransactionDetails | SectionHeader | LoadingItem): x is LoadingItem =>
  'itemType' in x && x.itemType === 'LOADING'

type SectionHeader = {
  itemType: 'HEADER'
  title: string
}
const isSectionHeader = (x: TransactionDetails | SectionHeader | LoadingItem): x is SectionHeader =>
  'itemType' in x && x.itemType === 'HEADER'

const LOADING_ITEM = (index: number): LoadingItem => ({ itemType: 'LOADING', id: index })
const LOADING_DATA = [LOADING_ITEM(1), LOADING_ITEM(2), LOADING_ITEM(3), LOADING_ITEM(4)]

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

function getItemType(item: TransactionDetails | SectionHeader | LoadingItem): string {
  if (isLoadingItem(item)) {
    return `loading`
  } else if (isSectionHeader(item)) {
    return `sectionHeader`
  } else {
    return `activity`
  }
}

export const ActivityTab = forwardRef<FlashList<unknown>, TabProps>(
  ({ owner, containerProps, scrollHandler, headerHeight }, ref) => {
    const { t } = useTranslation()

    const { onContentSizeChange, footerHeight } = useAdaptiveFooterHeight({
      headerHeight,
    })

    const keyExtractor = useCallback(
      (info: TransactionDetails | SectionHeader | LoadingItem) => {
        // for loading items, use the index as the key
        if (isLoadingItem(info)) {
          return `${owner}-${info.id}`
        }
        // for section headers, use the title as the key
        if (isSectionHeader(info)) {
          return `${owner}-${info.title}`
        }
        // for transactions, use the transaction hash as the key
        return info.id
      },
      [owner]
    )

    const {
      refetch,
      networkStatus,
      loading: requestLoading,
      data,
      error: requestError,
    } = useTransactionListQuery({
      variables: { address: owner },
      notifyOnNetworkStatusChange: true,
      // rely on TransactionHistoryUpdater for polling
      pollInterval: undefined,
    })

    // Hide all spam transactions if active wallet has enabled setting.
    const activeAccount = useActiveAccountWithThrow()
    const hideSpamTokens = useAppSelector<boolean>(
      makeSelectAccountHideSpamTokens(activeAccount.address)
    )

    const formattedTransactions = useMemo(() => {
      if (!data) return EMPTY_ARRAY
      return parseDataResponseToTransactionDetails(data, hideSpamTokens)
    }, [data, hideSpamTokens])

    const transactions = useMergeLocalAndRemoteTransactions(owner, formattedTransactions)

    // Format transactions for section list
    const { pending, last24hTransactionList, priorByMonthTransactionList } = useMemo(
      () => formatTransactionsByDate(transactions),
      [transactions]
    )

    const hasTransactions = transactions?.length > 0

    const hasData = !!data?.portfolios?.[0]?.assetActivities
    const isLoading = isNonPollingRequestInFlight(networkStatus)
    const isError = usePersistedError(requestLoading, requestError)

    // show loading if no data and fetching, or refetching when there is error (for UX when "retry" is clicked).
    const showLoading =
      (!hasData && isLoading) || (Boolean(isError) && networkStatus === NetworkStatus.refetch)

    const sectionData: Array<TransactionDetails | SectionHeader | LoadingItem> = useMemo(() => {
      if (showLoading) {
        return LOADING_DATA
      }

      if (!hasTransactions) {
        return EMPTY_ARRAY
      }
      return [
        ...pending,
        ...last24hTransactionList,
        // for each month prior, detect length and render if includes transactions
        ...Object.keys(priorByMonthTransactionList).reduce(
          (accum: (TransactionDetails | SectionHeader | LoadingItem)[], month) => {
            const transactionList = priorByMonthTransactionList[month]
            if (transactionList && transactionList.length > 0) {
              accum.push({ itemType: 'HEADER', title: month }, ...transactionList)
            }
            return accum
          },
          []
        ),
      ]
    }, [showLoading, hasTransactions, pending, last24hTransactionList, priorByMonthTransactionList])

    const onRetry = useCallback(() => {
      refetch({
        address: owner,
      })
    }, [owner, refetch])

    if (!hasData && isError) {
      return (
        <Flex grow style={containerProps?.emptyContainerStyle}>
          <BaseCard.ErrorState
            retryButtonLabel={t('Retry')}
            title={t('Couldn’t load activity')}
            onRetry={onRetry}
          />
        </Flex>
      )
    }

    return (
      <Flex grow style={TAB_STYLES.tabListContainer}>
        <AnimatedFlashList
          ref={ref}
          ListEmptyComponent={
            // error view
            !hasData && isError ? (
              <Flex grow style={containerProps?.emptyContainerStyle}>
                <BaseCard.ErrorState
                  retryButtonLabel={t('Retry')}
                  title={t('Couldn’t load activity')}
                  onRetry={onRetry}
                />
              </Flex>
            ) : (
              // empty view
              (!isLoading && (
                <Box flexGrow={1} style={containerProps?.emptyContainerStyle}>
                  <BaseCard.EmptyState
                    description={t('When this wallet makes transactions, they’ll appear here.')}
                    icon={<NoTransactions />}
                    title={t('No activity yet')}
                  />
                </Box>
              )) ||
              null
            )
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
          getItemType={getItemType}
          keyExtractor={keyExtractor}
          numColumns={1}
          renderItem={renderActivityItem}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={onContentSizeChange}
          onScroll={scrollHandler}
          {...containerProps}
        />
      </Flex>
    )
  }
)
