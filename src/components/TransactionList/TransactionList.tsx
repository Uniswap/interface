import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, SectionListRenderItemInfo } from 'react-native'
import { Box } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { AllFormattedTransactions } from 'src/features/transactions/hooks'
import TransactionSummaryItem, {
  TransactionSummaryInfo,
} from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import { TransactionStatus } from 'src/features/transactions/types'

const key = (info: TransactionSummaryInfo) => info.hash

const SectionTitle: SectionList['props']['renderSectionHeader'] = ({ section: { title } }) => (
  <Box px="xs" py="md">
    <Text color="textSecondary" variant="smallLabel">
      {title}
    </Text>
  </Box>
)

/** Displays historical and pending transactions for a given address. */
export function TransactionList({ transactions }: { transactions: AllFormattedTransactions }) {
  const { t } = useTranslation()
  const { pending, todayTransactionList, weekTransactionList, beforeCurrentWeekTransactionList } =
    transactions

  const sectionData = useMemo(() => {
    return [
      ...(pending.length > 0 ? [{ title: t('Pending'), data: pending }] : []),
      ...(todayTransactionList.length > 0
        ? [{ title: t('Today'), data: todayTransactionList }]
        : []),
      ...(weekTransactionList.length > 0
        ? [{ title: t('This Week'), data: weekTransactionList }]
        : []),
      ...(beforeCurrentWeekTransactionList.length > 0
        ? [{ title: t('All'), data: beforeCurrentWeekTransactionList }]
        : []),
    ]
  }, [beforeCurrentWeekTransactionList, pending, t, todayTransactionList, weekTransactionList])

  const renderItem = useMemo(() => {
    return (item: SectionListRenderItemInfo<TransactionSummaryInfo>) => {
      // Logic to render border radius and margins on groups of items.
      const aboveItem = item.index > 0 ? item.section.data[item.index - 1] : undefined
      const currentIsIsolated =
        (item.item.status === TransactionStatus.Cancelled ||
          item.item?.status === TransactionStatus.Cancelling ||
          item.item?.status === TransactionStatus.FailedCancel) &&
        item.index === 0 &&
        item.section.title === 'Today'
      const aboveIsIsolated =
        (aboveItem?.status === TransactionStatus.Cancelled ||
          aboveItem?.status === TransactionStatus.Cancelling ||
          aboveItem?.status === TransactionStatus.FailedCancel) &&
        item.index === 1 &&
        item.section.title === 'Today'

      const borderTop = aboveIsIsolated || item.index === 0
      const borderBottom = currentIsIsolated || item.index === item.section.data.length - 1
      const useInlineWarning = item.index !== 0 || item.section.title !== 'Today'

      return (
        <TransactionSummaryItem
          borderBottomColor={borderBottom ? 'none' : 'backgroundOutline'}
          borderBottomLeftRadius={borderBottom ? 'lg' : 'none'}
          borderBottomRightRadius={borderBottom ? 'lg' : 'none'}
          borderBottomWidth={borderBottom ? 0 : 1}
          borderTopLeftRadius={borderTop ? 'lg' : 'none'}
          borderTopRightRadius={borderTop ? 'lg' : 'none'}
          inlineWarning={useInlineWarning}
          mb={currentIsIsolated ? 'md' : 'none'}
          transactionSummaryInfo={item.item}
        />
      )
    }
  }, [])

  return (
    <SectionList
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={SectionTitle}
      sections={sectionData}
    />
  )
}
