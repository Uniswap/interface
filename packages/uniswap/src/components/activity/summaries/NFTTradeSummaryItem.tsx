import { NFTSummaryItem } from 'uniswap/src/components/activity/summaries/NFTSummaryItem'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { NFTTradeTransactionInfo, TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

export function NFTTradeSummaryItem({
  transaction,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: NFTTradeTransactionInfo }
}): JSX.Element {
  return (
    <NFTSummaryItem
      index={index}
      transaction={transaction}
      transactionType={transaction.typeInfo.type}
      isExternalProfile={isExternalProfile}
    />
  )
}
