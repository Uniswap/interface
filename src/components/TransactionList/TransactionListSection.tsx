import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Box } from 'src/components/layout/Box'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import TransactionSummaryItem, {
  TransactionSummaryInfo,
} from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import { Screens } from 'src/screens/Screens'

const renderItem = (item: ListRenderItemInfo<TransactionSummaryInfo>) => {
  return <TransactionSummaryItem bg="none" readonly={true} transactionSummaryInfo={item.item} />
}

const key = (info: TransactionSummaryInfo) => info.hash

export function TransactionListSection({
  owner,
  loading,
  transactions,
  count = 3,
}: {
  owner: Address
  loading: boolean
  transactions: TransactionSummaryInfo[]
  count?: number
}) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  let totalTransactionCount = transactions.length
  const transactionsToDisplay = useMemo(() => transactions.slice(0, count), [transactions, count])

  const title = useMemo(
    () =>
      totalTransactionCount > 0
        ? `${t('Transactions')} (${totalTransactionCount})`
        : t('Transactions'),
    [t, totalTransactionCount]
  )

  if (loading) {
    return (
      <Box padding="sm">
        <Loading repeat={4} type="box" />
      </Box>
    )
  }

  totalTransactionCount = 0
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
