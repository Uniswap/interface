import { TransferTokenSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransferTokenSummaryItem'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { SendTokenTransactionInfo, TransactionDetails, TransactionType } from 'wallet/src/features/transactions/types'

export function SendSummaryItem({
  transaction,
  layoutElement,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: SendTokenTransactionInfo }
}): JSX.Element {
  return (
    <TransferTokenSummaryItem
      layoutElement={layoutElement}
      otherAddress={transaction.typeInfo.recipient}
      transaction={transaction}
      transactionType={TransactionType.Send}
    />
  )
}
