import { AppTFunction } from 'src/app/i18n'
import {
  NFTTradeType,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'

/*
 * Get verb form for transaction type
 * @returns {Array.<string|string?>} An array of strings with the following structure:
 * [0]: Past verb form (e.g. 'Swapped')
 * [1]: Present verb form (e.g. 'Swapping') (optional)
 * [2]: Base verb form (e.g. 'swap') (optional)
 */
function getTransactionTypeVerbs(
  typeInfo: TransactionDetails['typeInfo'],
  t: AppTFunction
): [string, string?, string?] {
  switch (typeInfo.type) {
    case TransactionType.Swap:
      return [t('Swapped'), t('Swapping'), t('swap')]
    case TransactionType.Receive:
      return [t('Received')]
    case TransactionType.Send:
      return [t('Sent'), t('Sending'), t('send')]
    case TransactionType.Wrap:
      if (typeInfo.unwrapped) {
        return [t('Unwrapped'), t('Unwrapping'), t('unwrap')]
      } else {
        return [t('Wrapped'), t('Wrapping'), t('wrap')]
      }
    case TransactionType.Approve:
      if (typeInfo.approvalAmount === '0.0') {
        return [t('Revoked'), t('Revoking'), t('revoke')]
      } else {
        return [t('Approved'), t('Approving'), t('approve')]
      }
    case TransactionType.NFTApprove:
      return [t('Approved'), t('Approving'), t('approve')]
    case TransactionType.NFTMint:
      return [t('Minted'), t('Minting'), t('mint')]
    case TransactionType.NFTTrade:
      if (typeInfo.tradeType === NFTTradeType.BUY) {
        return [t('Bought'), t('Buying'), t('buy')]
      } else {
        return [t('Sold'), t('Selling'), t('sell')]
      }
    case TransactionType.FiatPurchase:
      return [t('Purchased'), t('Purchasing'), t('purchase')]
    case TransactionType.Unknown:
    case TransactionType.WCConfirm:
    default:
      return [t('Transaction confirmed'), t('Transaction in progress'), t('confirm')]
  }
}

export function getTransactionSummaryTitle(
  tx: TransactionDetails,
  t: AppTFunction
): string | undefined {
  const [completed, inProgress, action] = getTransactionTypeVerbs(tx.typeInfo, t)
  switch (tx.status) {
    case TransactionStatus.Pending:
      return inProgress
    case TransactionStatus.Cancelling:
      return t('Cancelling {{action}}', { action })
    case TransactionStatus.Cancelled:
      return t('Cancelled {{action}}', { action })
    case TransactionStatus.Failed:
      return t('Failed to {{action}}', { action })
    case TransactionStatus.Success:
      return completed
    default:
      return undefined
  }
}
