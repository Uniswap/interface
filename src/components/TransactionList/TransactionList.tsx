import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList } from 'react-native'
import { Box } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import { useAllFormattedTransactions } from 'src/features/transactions/hooks'
import TransactionSummaryItem, {
  TransactionSummaryInfo,
} from 'src/features/transactions/SummaryCards/TransactionSummaryItem'

const key = (info: TransactionSummaryInfo) => info.hash

export function TransactionList({ address }: { address: string }) {
  const { t } = useTranslation()
  const { todayTransactionList, weekTransactionList, beforeCurrentWeekTransactionList } =
    useAllFormattedTransactions(address)

  const sectionData = useMemo(() => {
    return [
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
  }, [beforeCurrentWeekTransactionList, t, todayTransactionList, weekTransactionList])

  const renderItem = (item: ListRenderItemInfo<TransactionSummaryInfo>) => {
    return <TransactionSummaryItem {...item.item} />
  }

  return (
    <SectionList
      ItemSeparatorComponent={() => <Separator px="md" />}
      keyExtractor={key}
      renderItem={renderItem}
      renderSectionHeader={({ section: { title } }) => (
        <Box bg="mainBackground" px="xs" py="md">
          <Text color="textSecondary" variant="smallLabel">
            {title}
          </Text>
        </Box>
      )}
      sections={sectionData}
    />
  )
}
