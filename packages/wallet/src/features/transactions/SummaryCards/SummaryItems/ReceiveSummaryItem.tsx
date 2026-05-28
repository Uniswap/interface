import {
  ReceiveTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransferTokenSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransferTokenSummaryItem'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'

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
