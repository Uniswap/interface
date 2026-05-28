import {
  NFTMintTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { NFTSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/NFTSummaryItem'
import { SummaryItemProps } from 'wallet/src/features/transactions/SummaryCards/types'

export function NFTMintSummaryItem({
  transaction,
  index,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: NFTMintTransactionInfo }
}): JSX.Element {
  return <NFTSummaryItem index={index} transaction={transaction} transactionType={TransactionType.NFTMint} />
}
