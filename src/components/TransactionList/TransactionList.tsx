import { NetworkStatus } from '@apollo/client'
import { TFunction } from 'i18next'
import React, { ReactElement, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { EMPTY_ARRAY, PollingInterval } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import {
  TransactionListQuery,
  useTransactionListQuery,
} from 'src/data/__generated__/types-and-hooks'
import { usePersistedError } from 'src/features/dataApi/utils'
import {
  formatTransactionsByDate,
  parseDataResponseToTransactionDetails,
} from 'src/features/transactions/history/utils'
import { useMergeLocalAndRemoteTransactions } from 'src/features/transactions/hooks'
import TransactionSummaryRouter from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { TransactionDetails } from 'src/features/transactions/types'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { makeSelectAccountHideSpamTokens } from 'src/features/wallet/selectors'
import { usePollOnFocusOnly } from 'src/utils/hooks'

const PENDING_TITLE = (t: TFunction): string => t('Pending')
const TODAY_TITLE = (t: TFunction): string => t('Today')
const MONTH_TITLE = (t: TFunction): string => t('This Month')

const LOADING_ITEM_TITLE = 'Section Title'
const LOADING_ITEM = { type: 'loading' }
function isLoadingItem(
  item: TransactionDetails | typeof LOADING_ITEM
): item is typeof LOADING_ITEM {
  return item === LOADING_ITEM
}
const LOADING_DATA = [
  {
    title: LOADING_ITEM_TITLE,
    data: [LOADING_ITEM],
  },
  { title: LOADING_ITEM_TITLE, data: [LOADING_ITEM] },
]

const key = (info: TransactionDetails): string => info.id

const SectionTitle: SectionList['props']['renderSectionHeader'] = ({ section: { title } }) => (
  <Box pb="xxxs" pt="sm" px="sm">
    <Text
      color="textSecondary"
      loading={title === LOADING_ITEM_TITLE}
      loadingPlaceholderText={LOADING_ITEM_TITLE}
      variant="subheadSmall">
      {title}
    </Text>
  </Box>
)

export type TransactionListQueryResponse = NonNullable<
  NonNullable<NonNullable<TransactionListQuery['portfolios']>[0]>['assetActivities']
>[0]

interface TransactionListProps {
  ownerAddress: Address
  readonly: boolean
  emptyStateContent: ReactElement | null
}

export default function TransactionList(props: TransactionListProps): ReactElement {
  const { t } = useTranslation()

  const {
    refetch,
    networkStatus,
    loading: requestLoading,
    data,
    error: requestError,
    startPolling,
    stopPolling,
  } = useTransactionListQuery({
    variables: { address: props.ownerAddress },
    notifyOnNetworkStatusChange: true,
  })

  usePollOnFocusOnly(startPolling, stopPolling, PollingInterval.Fast)

  const onRetry = useCallback(() => {
    refetch({
      address: props.ownerAddress,
    })
  }, [props.ownerAddress, refetch])

  const hasData = !!data?.portfolios?.[0]?.assetActivities
  const isLoading = isNonPollingRequestInFlight(networkStatus)
  const isError = usePersistedError(requestLoading, requestError)

  // show loading if no data and fetching, or refetching when there is error (for UX when "retry" is clicked).
  const showLoading =
    (!hasData && isLoading) || (Boolean(isError) && networkStatus === NetworkStatus.refetch)

  if (!showLoading && !hasData && isError) {
    return (
      <Box height="100%" pb="xxxl">
        <BaseCard.ErrorState
          retryButtonLabel={t('Retry')}
          title={t('Couldn’t load activity')}
          onRetry={onRetry}
        />
      </Box>
    )
  }

  return <TransactionListInner {...props} data={data} showLoading={showLoading} />
}

/** Displays historical and pending transactions for a given address. */
function TransactionListInner({
  data,
  ownerAddress,
  readonly,
  emptyStateContent,
  showLoading,
}: TransactionListProps & {
  data?: TransactionListQuery
  showLoading: boolean
}): ReactElement | null {
  const { t } = useTranslation()

  // Hide all spam transactions if active wallet has enabled setting.
  const activeAccount = useActiveAccountWithThrow()
  const hideSpamTokens = useAppSelector<boolean>(
    makeSelectAccountHideSpamTokens(activeAccount.address)
  )

  // Parse remote txn data from query and merge with local txn data
  const formattedTransactions = useMemo(() => {
    if (!data) return EMPTY_ARRAY

    const parsedTxHistory = parseDataResponseToTransactionDetails(data, hideSpamTokens)

    return parsedTxHistory
  }, [data, hideSpamTokens])

  const transactions = useMergeLocalAndRemoteTransactions(ownerAddress, formattedTransactions)

  // Format transactions for section list
  const {
    pending,
    todayTransactionList,
    monthTransactionList,
    priorByMonthTransactionList,
    combinedTransactionList,
  } = useMemo(() => formatTransactionsByDate(transactions), [transactions])

  const hasTransactions = combinedTransactionList?.length > 0

  const sectionData = useMemo(() => {
    if (showLoading) {
      return LOADING_DATA
    }

    if (!hasTransactions) {
      return EMPTY_ARRAY
    }
    return [
      ...(pending.length > 0 ? [{ title: PENDING_TITLE(t), data: pending }] : []),
      ...(todayTransactionList.length > 0
        ? [{ title: TODAY_TITLE(t), data: todayTransactionList }]
        : EMPTY_ARRAY),
      ...(monthTransactionList.length > 0
        ? [{ title: MONTH_TITLE(t), data: monthTransactionList }]
        : EMPTY_ARRAY),
      // for each month prior, detect length and render if includes transactions
      ...Object.keys(priorByMonthTransactionList).reduce(
        (
          accum: {
            title: string
            data: TransactionDetails[]
          }[],
          month
        ) => {
          const transactionList = priorByMonthTransactionList[month]
          if (transactionList && transactionList.length > 0) {
            accum.push({ title: month, data: transactionList })
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

  const renderItem = useMemo(() => {
    return ({ item }: { item: TransactionDetails }) => {
      if (isLoadingItem(item)) {
        return (
          <Box p="sm">
            <Loader.Token repeat={4} />
          </Box>
        )
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
  }, [readonly])

  if (!showLoading && !hasTransactions) {
    return emptyStateContent
  }

  return (
    <SectionList
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={SectionTitle}
      sections={sectionData}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      windowSize={5}
    />
  )
}
