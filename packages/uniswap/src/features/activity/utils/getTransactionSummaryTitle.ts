import { AppTFunction } from 'ui/src/i18n/types'
import {
  NFTTradeType,
  REVOKE_APPROVAL_AMOUNT,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'

export function getTransactionSummaryTitle(tx: TransactionDetails, t: AppTFunction): string | undefined {
  const { success, pending, failed, canceling, canceled, expired, insufficientFunds } = getTransactionTypeVerbs(
    tx.typeInfo,
    t,
  )

  switch (tx.status) {
    case TransactionStatus.Pending:
      return pending
    case TransactionStatus.Cancelling:
      return canceling
    case TransactionStatus.Expired:
      return expired
    case TransactionStatus.InsufficientFunds:
      return insufficientFunds
    case TransactionStatus.Canceled:
      return canceled
    case TransactionStatus.Failed:
      return failed
    case TransactionStatus.Success:
      return success
    default:
      return undefined
  }
}

/*
 * Get verb form for transaction type
 * @returns {Array.<string|string?>} An array of strings with the following structure:
 * [0]: Past verb form (e.g. 'Swapped')
 * [1]: Present verb form (e.g. 'Swapping') (optional)
 * [2]: Base verb form (e.g. 'swap') (optional)
 */
// eslint-disable-next-line complexity
function getTransactionTypeVerbs(
  typeInfo: TransactionDetails['typeInfo'],
  t: AppTFunction,
): {
  success: string
  pending?: string
  failed?: string
  canceling?: string
  canceled?: string
  expired?: string
  insufficientFunds?: string
} {
  const externalDappName = typeInfo.externalDappInfo?.name

  switch (typeInfo.type) {
    case TransactionType.Bridge:
    case TransactionType.Swap:
      return {
        success: externalDappName
          ? t('transaction.status.swap.successDapp', { externalDappName })
          : t('transaction.status.swap.success'),
        pending: t('transaction.status.swap.pending'),
        failed: t('transaction.status.swap.failed'),
        canceling: t('transaction.status.swap.canceling'),
        canceled: t('transaction.status.swap.canceled'),
        expired: t('transaction.status.swap.expired'),
        insufficientFunds: t('transaction.status.swap.insufficientFunds'),
      }
    case TransactionType.Receive:
      return {
        success: externalDappName
          ? t('transaction.status.receive.successDapp', { externalDappName })
          : t('transaction.status.receive.success'),
      }
    case TransactionType.Send:
      return {
        success: externalDappName
          ? t('transaction.status.send.successDapp', { externalDappName })
          : t('transaction.status.send.success'),
        pending: t('transaction.status.send.pending'),
        failed: t('transaction.status.send.failed'),
        canceling: t('transaction.status.send.canceling'),
        canceled: t('transaction.status.send.canceled'),
      }
    case TransactionType.Wrap:
      if (typeInfo.unwrapped) {
        return {
          success: externalDappName
            ? t('transaction.status.unwrap.successDapp', { externalDappName })
            : t('transaction.status.unwrap.success'),
          pending: t('transaction.status.unwrap.pending'),
          failed: t('transaction.status.unwrap.failed'),
          canceling: t('transaction.status.unwrap.canceling'),
          canceled: t('transaction.status.unwrap.canceled'),
        }
      } else {
        return {
          success: externalDappName
            ? t('transaction.status.wrap.successDapp', { externalDappName })
            : t('transaction.status.wrap.success'),
          pending: t('transaction.status.wrap.pending'),
          failed: t('transaction.status.wrap.failed'),
          canceling: t('transaction.status.wrap.canceling'),
          canceled: t('transaction.status.wrap.canceled'),
        }
      }
    case TransactionType.Approve:
      if (typeInfo.approvalAmount === REVOKE_APPROVAL_AMOUNT) {
        return {
          success: externalDappName
            ? t('transaction.status.revoke.successDapp', { externalDappName })
            : t('transaction.status.revoke.success'),
          pending: t('transaction.status.revoke.pending'),
          failed: t('transaction.status.revoke.failed'),
          canceling: t('transaction.status.revoke.canceling'),
          canceled: t('transaction.status.revoke.canceled'),
        }
      } else {
        return {
          success: externalDappName
            ? t('transaction.status.approve.successDapp', { externalDappName })
            : t('transaction.status.approve.success'),
          pending: t('transaction.status.approve.pending'),
          failed: t('transaction.status.approve.failed'),
          canceling: t('transaction.status.approve.canceling'),
          canceled: t('transaction.status.approve.canceled'),
        }
      }
    case TransactionType.NFTApprove:
      return {
        success: externalDappName
          ? t('transaction.status.approve.successDapp', { externalDappName })
          : t('transaction.status.approve.success'),
        pending: t('transaction.status.approve.pending'),
        failed: t('transaction.status.approve.failed'),
        canceling: t('transaction.status.approve.canceling'),
        canceled: t('transaction.status.approve.canceled'),
      }
    case TransactionType.NFTMint:
      return {
        success: externalDappName
          ? t('transaction.status.mint.successDapp', { externalDappName })
          : t('transaction.status.mint.success'),
        pending: t('transaction.status.mint.pending'),
        failed: t('transaction.status.mint.failed'),
        canceling: t('transaction.status.mint.canceling'),
        canceled: t('transaction.status.mint.canceled'),
      }
    case TransactionType.NFTTrade:
      if (typeInfo.tradeType === NFTTradeType.BUY) {
        return {
          success: externalDappName
            ? t('transaction.status.buy.successDapp', { externalDappName })
            : t('transaction.status.buy.success'),
          pending: t('transaction.status.buy.pending'),
          failed: t('transaction.status.buy.failed'),
          canceling: t('transaction.status.buy.canceling'),
          canceled: t('transaction.status.buy.canceled'),
        }
      } else {
        return {
          success: externalDappName
            ? t('transaction.status.sell.successDapp', { externalDappName })
            : t('transaction.status.sell.success'),
          pending: t('transaction.status.sell.pending'),
          failed: t('transaction.status.sell.failed'),
          canceling: t('transaction.status.sell.canceling'),
          canceled: t('transaction.status.sell.canceled'),
        }
      }
    case TransactionType.OnRampPurchase: {
      const serviceProvider = typeInfo.serviceProvider.name
      return {
        success: t('transaction.status.purchase.successOn', { serviceProvider }),
        pending: t('transaction.status.purchase.pendingOn', { serviceProvider }),
        failed: t('transaction.status.purchase.failedOn', { serviceProvider }),
        canceling: t('transaction.status.purchase.canceling'), // On ramp transactions are not cancellable
        canceled: t('transaction.status.purchase.canceled'), // On ramp transactions are not cancellable
      }
    }
    case TransactionType.OnRampTransfer: {
      const serviceProvider = typeInfo.serviceProvider.name
      return {
        success: t('transaction.status.receive.successFrom', { serviceProvider }),
        pending: t('transaction.status.receive.pendingFrom', { serviceProvider }),
        failed: t('transaction.status.receive.failedFrom', { serviceProvider }),
        canceling: t('transaction.status.receive.canceling'), // On ramp transactions are not cancellable
        canceled: t('transaction.status.receive.canceled'), // On ramp transactions are not cancellable
      }
    }
    case TransactionType.OffRampSale: {
      const serviceProvider = typeInfo.serviceProvider.name
      return {
        success: t('transaction.status.sale.successOn', { serviceProvider }),
        pending: t('transaction.status.sale.pendingOn', { serviceProvider }),
        failed: t('transaction.status.sale.failedOn', { serviceProvider }),
        canceling: t('transaction.status.sale.canceling'), // Offramp transactions are not cancellable
        canceled: t('transaction.status.sale.canceled'), // Offramp transactions are not cancellable
      }
    }
    case TransactionType.LiquidityIncrease:
      return {
        success: t('transaction.status.liquidityIncrease.success'),
        pending: t('transaction.status.liquidityIncrease.pending'),
        failed: t('transaction.status.liquidityIncrease.failed'),
        canceling: t('transaction.status.liquidityIncrease.canceling'),
        canceled: t('transaction.status.liquidityIncrease.canceled'),
      }
    case TransactionType.LiquidityDecrease:
      return {
        success: t('transaction.status.liquidityDecrease.success'),
        pending: t('transaction.status.liquidityDecrease.pending'),
        failed: t('transaction.status.liquidityDecrease.failed'),
        canceling: t('transaction.status.liquidityDecrease.canceling'),
        canceled: t('transaction.status.liquidityDecrease.canceled'),
      }
    case TransactionType.CollectFees:
      return {
        success: t('transaction.status.claim.success'),
        pending: t('transaction.status.claim.pending'),
        failed: t('transaction.status.claim.failed'),
        canceling: t('transaction.status.claim.canceling'),
        canceled: t('transaction.status.claim.canceled'),
      }
    case TransactionType.LPIncentivesClaimRewards:
      return {
        success: t('transaction.status.lpIncentivesClaim.success'),
        pending: t('transaction.status.lpIncentivesClaim.pending'),
        failed: t('transaction.status.lpIncentivesClaim.failed'),
        canceling: t('transaction.status.lpIncentivesClaim.canceling'),
        canceled: t('transaction.status.lpIncentivesClaim.canceled'),
      }
    case TransactionType.CreatePair:
      return {
        success: t('transaction.status.createPair.success'),
        pending: t('transaction.status.createPair.pending'),
        failed: t('transaction.status.createPair.failed'),
        canceling: t('transaction.status.createPair.canceling'),
        canceled: t('transaction.status.createPair.canceled'),
      }
    case TransactionType.CreatePool:
      return {
        success: t('transaction.status.createPool.success'),
        pending: t('transaction.status.createPool.pending'),
        failed: t('transaction.status.createPool.failed'),
        canceling: t('transaction.status.createPool.canceling'),
        canceled: t('transaction.status.createPool.canceled'),
      }
    case TransactionType.Unknown:
    case TransactionType.WCConfirm:
    default:
      return {
        success: externalDappName
          ? t('transaction.status.confirm.successDapp', { externalDappName })
          : t('transaction.status.confirm.success'),
        pending: t('transaction.status.confirm.pending'),
        failed: t('transaction.status.confirm.failed'),
        canceling: t('transaction.status.confirm.canceling'),
        canceled: t('transaction.status.confirm.canceled'),
      }
  }
}
