import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Separator } from 'src/components/layout/Separator'
import TransactionSummaryItem, {
  TransactionSummaryInfo,
} from 'src/features/transactions/SummaryCards/TransactionSummaryItem'
import { Screens } from 'src/screens/Screens'

const renderItem = (item: ListRenderItemInfo<TransactionSummaryInfo>) => {
  return <TransactionSummaryItem transactionSummaryInfo={item.item} />
}

const key = (info: TransactionSummaryInfo) => info.hash

export function TransactionListSection({
  owner,
  transactions,
  count = 3,
}: {
  owner: Address
  transactions: TransactionSummaryInfo[]
  count?: number
}) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  const transactionsToDisplay = useMemo(() => transactions.slice(0, count), [transactions, count])

  return (
    <BaseCard.Container>
      <BaseCard.Header
        title={t('Transactions')}
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
    </BaseCard.Container>
  )
}
