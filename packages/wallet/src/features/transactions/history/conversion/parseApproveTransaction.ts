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

  const change = transaction.details.assetChanges?.[0]
  if (!change) {
    return undefined
  }

  if (change.__typename === 'TokenApproval' && change.tokenStandard === 'ERC20') {
    const tokenAddress = change.asset?.address
    const spender = change.approvedAddress
    const approvalAmount = change.quantity
    if (!(tokenAddress && spender)) {
      return undefined
    }

    const dappInfo = transaction.details.application?.address
      ? {
          name: transaction.details.application?.name,
          address: transaction.details.application.address,
          icon: transaction.details.application?.icon?.url,
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
