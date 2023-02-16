import { NetworkStatus } from '@apollo/client'
import { FlashList } from '@shopify/flash-list'
import { TFunction } from 'i18next'
import React, { forwardRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { NoTransactions } from 'src/components/icons/NoTransactions'
import { Box, Flex } from 'src/components/layout'
import { AnimatedFlashList } from 'src/components/layout/AnimatedFlashList'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TabContentProps, TAB_STYLES } from 'src/components/layout/TabHelpers'
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
import TransactionSummaryRouter from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { TransactionDetails } from 'src/features/transactions/types'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { makeSelectAccountHideSpamTokens } from 'src/features/wallet/selectors'

type ActivityTabProps = {
  owner: string
  containerProps?: TabContentProps
  scrollHandler?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}

const PENDING_TITLE = (t: TFunction): string => t('Pending')
const TODAY_TITLE = (t: TFunction): string => t('Today')
const MONTH_TITLE = (t: TFunction): string => t('This Month')

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

const FOOTER_HEIGHT = 20
const ESTIMATED_ITEM_SIZE = 92

const SectionTitle = ({ title }: { title: string }): JSX.Element => (
  <Box pb="spacing2" pt="spacing12">
    <Text color="textSecondary" variant="subheadSmall">
      {title}
    </Text>
  </Box>
)

const renderActivityItem = (
  item: TransactionDetails | SectionHeader | LoadingItem,
  readonly: boolean
): JSX.Element => {
  // if it's a loading item, render the loading placeholder
  if (isLoadingItem(item)) {
    return <Loader.Transaction />
  }
  // if it's a section header, render it differently
  if (isSectionHeader(item)) {
    return <SectionTitle title={item.title} />
  }
  return (
    <TransactionSummaryRouter
      readonly={readonly}
      // TODO: [MOB-3879] @ianlapham Implement finalized inline/card designs for special case txns (failure, pending failure, etc)
      // When finalized, delete this prop if no longer using inline copy.
      showInlineWarning={false}
      transaction={item}
    />
  )
}

export const ActivityTab = forwardRef<FlashList<unknown>, ActivityTabProps>(
  ({ owner, containerProps, scrollHandler }, ref) => {
    const { t } = useTranslation()
    const { type } = useActiveAccountWithThrow()
    const readonly = type === AccountType.Readonly

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

      const parsedTxHistory = parseDataResponseToTransactionDetails(data, hideSpamTokens)

      return parsedTxHistory
    }, [data, hideSpamTokens])

    const transactions = useMergeLocalAndRemoteTransactions(owner, formattedTransactions)

    // Format transactions for section list
    const {
      pending,
      todayTransactionList,
      monthTransactionList,
      priorByMonthTransactionList,
      combinedTransactionList,
    } = useMemo(() => formatTransactionsByDate(transactions), [transactions])

    const hasTransactions = combinedTransactionList?.length > 0

    const hasData = !!data?.portfolios?.[0]?.assetActivities
    const isLoading = isNonPollingRequestInFlight(networkStatus)
    const isError = usePersistedError(requestLoading, requestError)

    // show loading if no data and fetching, or refetching when there is error (for UX when "retry" is clicked).
    const showLoading =
      (!hasData && isLoading) || (Boolean(isError) && networkStatus === NetworkStatus.refetch)

    const sectionData = useMemo(() => {
      if (showLoading) {
        return LOADING_DATA
      }

      if (!hasTransactions) {
        return EMPTY_ARRAY
      }
      return [
        ...(pending.length > 0 ? [PENDING_TITLE(t), ...pending] : EMPTY_ARRAY),
        ...(todayTransactionList.length > 0
          ? [{ itemType: 'HEADER', title: TODAY_TITLE(t) }, ...todayTransactionList]
          : EMPTY_ARRAY),
        ...(monthTransactionList.length > 0
          ? [{ itemType: 'HEADER', title: MONTH_TITLE(t) }, ...monthTransactionList]
          : EMPTY_ARRAY),
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
    }, [
      hasTransactions,
      monthTransactionList,
      pending,
      priorByMonthTransactionList,
      t,
      todayTransactionList,
      showLoading,
    ])

    /**
     * If tab container is smaller than the approximate screen height, we need to manually add
     * padding so scroll works as intended since minHeight is not supported by FlashList in
     * `contentContainerStyle`. Padding is proportional to the number of rows the data items take up.
     */
    const footerPadding =
      transactions.length < 6
        ? (ESTIMATED_ITEM_SIZE * (6 - transactions.length)) / 2
        : FOOTER_HEIGHT

    const onRetry = useCallback(() => {
      refetch({
        address: owner,
      })
    }, [owner, refetch])

    if (!hasData && isError) {
      return (
        <Box height="100%" pb="spacing60">
          <BaseCard.ErrorState
            retryButtonLabel={t('Retry')}
            title={t('Couldn’t load activity')}
            onRetry={onRetry}
          />
        </Box>
      )
    }

    return transactions.length === 0 ? (
      <Flex centered grow flex={1} style={containerProps?.emptyContainerStyle}>
        <BaseCard.EmptyState
          description={t('When this wallet makes transactions, they’ll appear here.')}
          icon={<NoTransactions />}
          title={t('No activity yet')}
        />
      </Flex>
    ) : (
      <Flex grow style={TAB_STYLES.tabListContainer}>
        <AnimatedFlashList
          ref={ref}
          ListFooterComponent={
            // If not loading, we add a footer  to cover any possible space that is covered up by bottom tab bar
            networkStatus === NetworkStatus.fetchMore ? (
              <Box p="spacing12">
                <Loader.Transaction repeat={4} />
              </Box>
            ) : (
              <Box height={footerPadding} />
            )
          }
          data={sectionData}
          estimatedItemSize={ESTIMATED_ITEM_SIZE}
          keyExtractor={keyExtractor}
          numColumns={1}
          renderItem={({ item }): JSX.Element => renderActivityItem(item, readonly)}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          {...containerProps}
        />
      </Flex>
    )
  }
)
