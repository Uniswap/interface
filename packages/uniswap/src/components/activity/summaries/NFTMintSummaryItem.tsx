import { NFTSummaryItem } from 'uniswap/src/components/activity/summaries/NFTSummaryItem'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import {
  NFTMintTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function NFTMintSummaryItem({
  transaction,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: NFTMintTransactionInfo }
}): JSX.Element {
  return (
    <NFTSummaryItem
      index={index}
      transaction={transaction}
      transactionType={TransactionType.NFTMint}
      isExternalProfile={isExternalProfile}
    />
  )
}
