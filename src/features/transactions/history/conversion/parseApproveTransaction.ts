import {
  ApproveTransactionInfo,
  NFTApproveTransactionInfo,
  TransactionType,
} from 'src/features/transactions/types'
import { ActivityScreenQueryResponse } from 'src/screens/ActivityScreen'
import { UserScreenQueryResponse } from 'src/screens/UserScreen'

export default function parseAppoveTransaction(
  transaction: ActivityScreenQueryResponse | UserScreenQueryResponse
): ApproveTransactionInfo | NFTApproveTransactionInfo | undefined {
  const change = transaction?.assetChanges[0]
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
