import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import {
  NFTApproveTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { NFTSummaryItem } from './NFTSummaryItem'

export function NFTApproveSummaryItem({
  transaction,
  layoutElement,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: NFTApproveTransactionInfo }
}): JSX.Element {
  return (
    <NFTSummaryItem
      layoutElement={layoutElement}
      transaction={transaction}
      transactionType={TransactionType.NFTApprove}
    />
  )
}
