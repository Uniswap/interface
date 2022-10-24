import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { NoTransactions } from 'src/components/icons/NoTransactions'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Separator } from 'src/components/layout/Separator'
import TransactionSummaryRouter from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { TransactionDetails } from 'src/features/transactions/types'

const renderItem = (item: ListRenderItemInfo<TransactionDetails>) => {
  return <TransactionSummaryRouter readonly showInlineWarning bg="none" transaction={item.item} />
}

const key = (info: TransactionDetails) => info.hash

export function TransactionListSection({
  transactions,
  count = 3,
}: {
  transactions: TransactionDetails[]
  count?: number
}) {
  const { t } = useTranslation()
  let totalTransactionCount = transactions.length
  const transactionsToDisplay = useMemo(() => transactions.slice(0, count), [transactions, count])

  const title = useMemo(
    () =>
      totalTransactionCount > 0
        ? `${t('Transactions')} (${totalTransactionCount})`
        : t('Transactions'),
    [t, totalTransactionCount]
  )
  return (
    <BaseCard.Container>
      {totalTransactionCount === 0 ? (
        <BaseCard.EmptyState
          description={t('Any transactions made by this wallet will appear here.')}
          icon={<NoTransactions />}
          title={t('No transactions yet')}
        />
      ) : (
        <>
          <BaseCard.Header
            title={title}
            onPress={() => {
              // TODO: @ian remove this click behavior when we replace with tabs with infinite scroll
            }}
          />
          <FlatList
            ItemSeparatorComponent={() => <Separator px="md" />}
            data={transactionsToDisplay}
            keyExtractor={key}
            listKey="transactions"
            renderItem={renderItem}
          />
        </>
      )}
    </BaseCard.Container>
  )
}
