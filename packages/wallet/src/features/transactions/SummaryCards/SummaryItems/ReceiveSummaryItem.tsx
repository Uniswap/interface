import { TransferTokenSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransferTokenSummaryItem'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import {
  ReceiveTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'wallet/src/features/transactions/types'

export function ReceiveSummaryItem({
  transaction,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: ReceiveTokenTransactionInfo }
}): JSX.Element {
  return (
    <TransferTokenSummaryItem
      index={index}
      otherAddress={transaction.typeInfo.sender}
      transaction={transaction}
      transactionType={TransactionType.Receive}
    />
  )
}
