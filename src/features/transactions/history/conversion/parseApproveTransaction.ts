import { TransactionHistoryResponse } from 'src/features/transactions/history/transactionHistory'
import {
  ApproveTransactionInfo,
  NFTApproveTransactionInfo,
  TransactionType,
} from 'src/features/transactions/types'

export default function parseAppoveTransction(
  transaction: Nullable<TransactionHistoryResponse>
): ApproveTransactionInfo | NFTApproveTransactionInfo | undefined {
  const change = transaction?.assetChanges[0]
  if (!change) return undefined
  if (change.__typename === 'TokenApproval' && change.tokenStandard === 'ERC20') {
    const tokenAddress = change.asset?.address
    const spender = change.approvedAddress
    if (!(tokenAddress && spender)) return undefined
    return {
      type: TransactionType.Approve,
      tokenAddress,
      spender,
    }
  }
  return undefined
}
