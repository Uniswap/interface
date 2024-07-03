import { NFTSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/NFTSummaryItem'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { NFTTradeTransactionInfo, TransactionDetails } from 'wallet/src/features/transactions/types'

export function NFTTradeSummaryItem({
  transaction,
  layoutElement,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: NFTTradeTransactionInfo }
}): JSX.Element {
  return (
    <NFTSummaryItem
      layoutElement={layoutElement}
      transaction={transaction}
      transactionType={transaction.typeInfo.type}
    />
  )
}
