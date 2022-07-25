import { TFunction } from 'i18next'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, SectionListData } from 'react-native'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { AllFormattedTransactions } from 'src/features/transactions/hooks'
import TransactionSummaryItem, {
  TransactionSummaryInfo,
} from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import { TransactionStatus } from 'src/features/transactions/types'

const PENDING_TITLE = (t: TFunction) => t('Pending')
const TODAY_TITLE = (t: TFunction) => t('Today')
const WEEK_TITLE = (t: TFunction) => t('This Week')
const ALL_TIME_TITLE = (t: TFunction) => t('All')

const key = (info: TransactionSummaryInfo) => info.hash

const SectionTitle: SectionList['props']['renderSectionHeader'] = ({ section: { title } }) => (
  <Box px="xs" py="md">
    <Text color="textSecondary" variant="smallLabel">
      {title}
    </Text>
  </Box>
)

/** Displays historical and pending transactions for a given address. */
export function TransactionList({
  transactions,
  readonly,
}: {
  transactions: AllFormattedTransactions
  readonly: boolean
}) {
  const { t } = useTranslation()
  const { pending, todayTransactionList, weekTransactionList, beforeCurrentWeekTransactionList } =
    transactions

  const sectionData = useMemo(() => {
    return [
      ...(pending.length > 0 ? [{ title: PENDING_TITLE(t), data: pending }] : []),
      ...(todayTransactionList.length > 0
        ? [{ title: TODAY_TITLE(t), data: todayTransactionList }]
        : []),
      ...(weekTransactionList.length > 0
        ? [{ title: WEEK_TITLE(t), data: weekTransactionList }]
        : []),
      ...(beforeCurrentWeekTransactionList.length > 0
        ? [{ title: ALL_TIME_TITLE(t), data: beforeCurrentWeekTransactionList }]
        : []),
    ]
  }, [beforeCurrentWeekTransactionList, pending, t, todayTransactionList, weekTransactionList])

  const renderItem = useMemo(() => {
    return ({
      item,
      index,
      section,
    }: {
      item: TransactionSummaryInfo
      index: number
      section: SectionListData<TransactionSummaryInfo>
    }) => {
      // Logic to render border radius and margins on groups of items.
      const aboveItem = index > 0 ? section.data[index - 1] : undefined
      const currentIsIsolated =
        (item.status === TransactionStatus.Cancelled ||
          item?.status === TransactionStatus.Cancelling ||
          item?.status === TransactionStatus.FailedCancel) &&
        index === 0 &&
        section.title === TODAY_TITLE(t)
      const aboveIsIsolated =
        (aboveItem?.status === TransactionStatus.Cancelled ||
          aboveItem?.status === TransactionStatus.Cancelling ||
          aboveItem?.status === TransactionStatus.FailedCancel) &&
        index === 1 &&
        section.title === TODAY_TITLE(t)

      const borderTop = aboveIsIsolated || index === 0
      const borderBottom = currentIsIsolated || index === section.data.length - 1
      // Only show banner if first element in pending or daily section.
      const showInlineWarning =
        index !== 0 || !(section.title === TODAY_TITLE(t) || section.title === PENDING_TITLE(t))

      return (
        <TransactionSummaryItem
          borderBottomColor={borderBottom ? 'none' : 'backgroundOutline'}
          borderBottomLeftRadius={borderBottom ? 'lg' : 'none'}
          borderBottomRightRadius={borderBottom ? 'lg' : 'none'}
          borderBottomWidth={borderBottom ? 0 : 1}
          borderTopLeftRadius={borderTop ? 'lg' : 'none'}
          borderTopRightRadius={borderTop ? 'lg' : 'none'}
          mb={currentIsIsolated ? 'md' : 'none'}
          readonly={readonly}
          showInlineWarning={showInlineWarning}
          transactionSummaryInfo={item}
        />
      )
    }
  }, [readonly, t])

  return (
    <SectionList
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={SectionTitle}
      sections={sectionData}
    />
  )
}
