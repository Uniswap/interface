import { NFTSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/NFTSummaryItem'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import { NFTMintTransactionInfo, TransactionDetails, TransactionType } from 'wallet/src/features/transactions/types'

export function NFTMintSummaryItem({
  transaction,
  layoutElement,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: NFTMintTransactionInfo }
}): JSX.Element {
  return (
    <NFTSummaryItem
      index={index}
      layoutElement={layoutElement}
      transaction={transaction}
      transactionType={TransactionType.NFTMint}
    />
  )
}
