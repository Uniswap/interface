import { NFTTradeTransactionInfo, TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { NFTSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/NFTSummaryItem'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'

export function NFTTradeSummaryItem({
  transaction,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: NFTTradeTransactionInfo }
}): JSX.Element {
  return <NFTSummaryItem index={index} transaction={transaction} transactionType={transaction.typeInfo.type} />
}
