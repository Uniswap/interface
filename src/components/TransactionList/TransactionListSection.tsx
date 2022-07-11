import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Separator } from 'src/components/layout/Separator'
import TransactionSummaryItem, {
  TransactionSummaryInfo,
} from 'src/features/transactions/SummaryCards/TransactionSummaryItem'

const renderItem = (item: ListRenderItemInfo<TransactionSummaryInfo>) => {
  return <TransactionSummaryItem {...item.item} />
}

const key = (info: TransactionSummaryInfo) => info.hash

export function TransactionListSection({
  transactions,
  count = 3,
}: {
  transactions: TransactionSummaryInfo[]
  count?: number
}) {
  const { t } = useTranslation()
  const transactionsToDisplay = useMemo(() => transactions.slice(0, count), [transactions, count])

  return (
    <BaseCard.Container>
      <BaseCard.Header
        title={t('Transactions ({{totalCount}})', { totalCount: transactions.length })}
        onPress={() => {
          // TODO: implement navigation to transaction list
        }}
      />
      <FlatList
        ItemSeparatorComponent={() => <Separator px="md" />}
        data={transactionsToDisplay}
        keyExtractor={key}
        listKey="transactions"
        renderItem={renderItem}
      />
    </BaseCard.Container>
  )
}
