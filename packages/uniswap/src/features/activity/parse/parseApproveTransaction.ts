import { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { ApproveTransactionInfo, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

export function parseApproveTransaction(transaction: OnChainTransaction): ApproveTransactionInfo | undefined {
  const { approvals, to, protocol } = transaction
  const firstApproval = approvals[0]
  if (!firstApproval) {
    return undefined
  }
  const token = firstApproval.asset.value
  const dappInfo = protocol?.name
    ? {
        name: protocol.name,
        icon: protocol.logoUrl,
      }
    : undefined
  return {
    type: TransactionType.Approve,
    tokenAddress: token?.address ?? '',
    spender: to,
    approvalAmount: String(firstApproval.amount?.amount ?? ''),
    dappInfo,
  }
}
