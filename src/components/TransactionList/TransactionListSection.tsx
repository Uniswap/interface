import React, { Suspense, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { useAllFormattedTransactions } from 'src/features/transactions/hooks'
import TransactionSummaryRouter from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { TransactionDetails } from 'src/features/transactions/types'
import { Screens } from 'src/screens/Screens'

const renderItem = (item: ListRenderItemInfo<TransactionDetails>) => {
  return <TransactionSummaryRouter readonly showInlineWarning bg="none" transaction={item.item} />
}

const key = (info: TransactionDetails) => info.hash

export function TransactionListSection({ owner, count = 3 }: { owner: Address; count?: number }) {
  return (
    <Suspense fallback={<Loading repeat={3} type="box" />}>
      <TransactionListSectionInner count={count} owner={owner} />
    </Suspense>
  )
}

function TransactionListSectionInner({ owner, count = 3 }: { owner: Address; count?: number }) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  const { combinedTransactionList: transactions } = useAllFormattedTransactions(owner)

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
          title={t('No transactions yet')}
        />
      ) : (
        <>
          <BaseCard.Header
            title={title}
            onPress={() => {
              navigation.navigate(Screens.UserTransactions, { owner })
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
