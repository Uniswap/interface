import { NetworkStatus } from '@apollo/client'
import { TFunction } from 'i18next'
import React, { ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, SectionListData } from 'react-native'
import { Box } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { EMPTY_ARRAY, PollingInterval } from 'src/constants/misc'
import {
  TransactionListQuery,
  useTransactionListQuery,
} from 'src/data/__generated__/types-and-hooks'
import {
  formatTransactionsByDate,
  parseDataResponseToTransactionDetails,
} from 'src/features/transactions/history/utils'
import { useMergeLocalAndRemoteTransactions } from 'src/features/transactions/hooks'
import TransactionSummaryRouter from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'

const PENDING_TITLE = (t: TFunction) => t('Pending')
const TODAY_TITLE = (t: TFunction) => t('Today')
const MONTH_TITLE = (t: TFunction) => t('This Month')

const key = (info: TransactionDetails) => info.hash

const SectionTitle: SectionList['props']['renderSectionHeader'] = ({ section: { title } }) => (
  <Box pb="xxxs" pt="sm" px="xs">
    <Text color="textSecondary" variant="subheadSmall">
      {title}
    </Text>
  </Box>
)

export type TransactionListQueryResponse = NonNullable<
  NonNullable<TransactionListQuery['portfolio']>['assetActivities']
>[0]

interface TransactionListProps {
  ownerAddress: Address
  readonly: boolean
  emptyStateContent: ReactElement | null
}

export default function TransactionList(props: TransactionListProps) {
  // Parse remote txn data from query and merge with local txn data
  const { data, loading, error, networkStatus } = useTransactionListQuery({
    variables: { address: props.ownerAddress },
    pollInterval: PollingInterval.Fast,
    notifyOnNetworkStatusChange: true,
  })

  if ((loading && networkStatus !== NetworkStatus.poll) || error) {
    return (
      <Box>
        <Loading type="transactions" />
      </Box>
    )
  }
  return <TransactionListInner {...props} data={data} />
}

/** Displays historical and pending transactions for a given address. */
function TransactionListInner({
  data,
  ownerAddress,
  readonly,
  emptyStateContent,
}: TransactionListProps & { data: TransactionListQuery | undefined }) {
  const { t } = useTranslation()

  // format local and remote fetched txns
  const formattedTransactions = useMemo(
    () => (data ? parseDataResponseToTransactionDetails(data) : []),
    [data]
  )
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
    if (!hasTransactions) {
      return EMPTY_ARRAY
    }
    return [
      ...(pending.length > 0 ? [{ title: PENDING_TITLE(t), data: pending }] : []),
      ...(todayTransactionList.length > 0
        ? [{ title: TODAY_TITLE(t), data: todayTransactionList }]
        : []),
      ...(monthTransactionList.length > 0
        ? [{ title: MONTH_TITLE(t), data: monthTransactionList }]
        : []),
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
          if (transactionList.length > 0) {
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
  ])

  const renderItem = useMemo(() => {
    return ({
      item,
    }: {
      item: TransactionDetails
      index: number
      section: SectionListData<TransactionDetails>
    }) => {
      const currentIsIsolated = item?.status === TransactionStatus.Cancelling

      return (
        <TransactionSummaryRouter
          mb={currentIsIsolated ? 'md' : 'none'}
          readonly={readonly}
          showInlineWarning={!currentIsIsolated}
          transaction={item}
        />
      )
    }
  }, [readonly])

  if (!hasTransactions) {
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
