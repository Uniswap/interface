import {
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransferTokenSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransferTokenSummaryItem'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'

export function SendSummaryItem({
  transaction,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: SendTokenTransactionInfo }
}): JSX.Element {
  return (
    <TransferTokenSummaryItem
      index={index}
      otherAddress={transaction.typeInfo.recipient}
      transaction={transaction}
      transactionType={TransactionType.Send}
    />
  )
}
