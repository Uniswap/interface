import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'
import {
  NFTMintTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { NFTSummaryItem } from './NFTSummaryItem'

export function NFTMintSummaryItem({
  transaction,
  layoutElement,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: NFTMintTransactionInfo }
}): JSX.Element {
  return (
    <NFTSummaryItem
      layoutElement={layoutElement}
      transaction={transaction}
      transactionType={TransactionType.NFTMint}
    />
  )
}
