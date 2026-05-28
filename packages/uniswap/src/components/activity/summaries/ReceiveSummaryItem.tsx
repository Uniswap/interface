import { TransferTokenSummaryItem } from 'uniswap/src/components/activity/summaries/TransferTokenSummaryItem'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import {
  ReceiveTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function ReceiveSummaryItem({
  transaction,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: ReceiveTokenTransactionInfo }
}): JSX.Element {
  return (
    <TransferTokenSummaryItem
      index={index}
      otherAddress={transaction.typeInfo.sender}
      transaction={transaction}
      transactionType={TransactionType.Receive}
      isExternalProfile={isExternalProfile}
    />
  )
}
