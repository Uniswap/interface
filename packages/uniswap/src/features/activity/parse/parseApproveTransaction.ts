import { OnChainTransaction } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  ApproveTransactionInfo,
  NFTApproveTransactionInfo,
  TransactionDetailsType,
  TransactionListQueryResponse,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export default function parseApproveTransaction(
  transaction: NonNullable<TransactionListQueryResponse>,
): ApproveTransactionInfo | NFTApproveTransactionInfo | undefined {
  if (transaction.details.__typename !== TransactionDetailsType.Transaction) {
    return undefined
  }

  const change = transaction.details.assetChanges[0]
  if (!change) {
    return undefined
  }

  if (change.__typename === 'TokenApproval' && change.tokenStandard === 'ERC20') {
    const tokenAddress = change.asset.address
    const spender = change.approvedAddress
    const approvalAmount = change.quantity
    if (!(tokenAddress && spender)) {
      return undefined
    }

    const dappInfo = transaction.details.application?.address
      ? {
          name: transaction.details.application.name,
          address: transaction.details.application.address,
          icon: transaction.details.application.icon?.url,
        }
      : undefined
    return {
      type: TransactionType.Approve,
      tokenAddress,
      spender,
      approvalAmount,
      dappInfo,
    }
  }
  return undefined
}

/**
 * Parse an approve transaction from the REST API
 */
export function parseRestApproveTransaction(transaction: OnChainTransaction): ApproveTransactionInfo | undefined {
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
