import { TFunction } from 'i18next'
import React, { ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, SectionListData } from 'react-native'
import { Box } from 'src/components/layout'
import { TabViewScrollProps } from 'src/components/layout/screens/TabbedScrollScreen'
import { Text } from 'src/components/Text'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { formatTransactionsByDate } from 'src/features/transactions/history/utils'
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

/** Displays historical and pending transactions for a given address. */
export default function TransactionList({
  transactions,
  readonly,
  emptyStateContent,
  tabViewScrollProps,
}: {
  transactions: TransactionDetails[]
  readonly: boolean
  emptyStateContent: ReactElement | null
  tabViewScrollProps?: TabViewScrollProps
}) {
  const { t } = useTranslation()

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
      ref={tabViewScrollProps?.ref}
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={SectionTitle}
      sections={sectionData}
      showsVerticalScrollIndicator={false}
      windowSize={5}
      onScroll={tabViewScrollProps?.onScroll}
      {...tabViewScrollProps}
    />
  )
}
