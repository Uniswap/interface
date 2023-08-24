import {
  ApproveTransactionInfo,
  NFTApproveTransactionInfo,
  TransactionListQueryResponse,
  TransactionType,
} from 'wallet/src/features/transactions/types'

export default function parseApproveTransaction(
  transaction: NonNullable<TransactionListQueryResponse>
): ApproveTransactionInfo | NFTApproveTransactionInfo | undefined {
  const change = transaction.assetChanges[0]
  if (!change) return undefined

  if (change.__typename === 'TokenApproval' && change.tokenStandard === 'ERC20') {
    const tokenAddress = change.asset?.address
    const spender = change.approvedAddress
    const approvalAmount = change.quantity
    if (!(tokenAddress && spender)) return undefined
    return {
      type: TransactionType.Approve,
      tokenAddress,
      spender,
      approvalAmount,
    }
  }
  return undefined
}
