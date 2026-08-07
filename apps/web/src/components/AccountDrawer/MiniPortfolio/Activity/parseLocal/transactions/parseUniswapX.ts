import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { isCancelTimedOut } from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import type {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  InterfaceBaseTransactionDetails,
  InterfaceTransactionDetails,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import {
  getActivityTitle,
  getLimitOrderTextTable,
  getOrderTextTable,
} from '~/components/AccountDrawer/MiniPortfolio/Activity/constants'
import { parseSwap } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/transactions/parseSwap'
import type { FormatNumberFunctionType } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'

// Narrowing helper for when we actually need UniswapX-specific fields
export function isUniswapXDetails(
  details: InterfaceTransactionDetails,
): details is UniswapXOrderDetails<InterfaceBaseTransactionDetails> {
  return 'routing' in details && isUniswapX(details)
}

export async function parseUniswapXOrderLocal({
  details,
  formatNumber,
}: {
  details: InterfaceTransactionDetails
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const { typeInfo } = details
  const uniswapXOrderDetails = isUniswapXDetails(details) ? details : undefined
  const isLimitOrder = uniswapXOrderDetails?.routing === TradingApi.Routing.DUTCH_LIMIT

  // Get the appropriate order text table
  const orderTextTable = getOrderTextTable()
  const limitOrderTextTable = getLimitOrderTextTable()
  let orderTextTableEntry = (isLimitOrder ? limitOrderTextTable : orderTextTable)[details.status]

  // Cancel-flow states are evaluated BEFORE the status-table lookup. Only timed-out is a
  // persistent row treatment; finalizing and already-filled are transitional/reason states.
  if (uniswapXOrderDetails && getFeatureFlag(FeatureFlags.LimitCancelTimeout)) {
    if (isCancelTimedOut(uniswapXOrderDetails)) {
      orderTextTableEntry = {
        getTitle: () => i18n.t('limits.cancel.likelyToFail'),
        getStatusMessage: () => i18n.t('limits.cancel.timeout.alert'),
        status: TransactionStatus.Pending,
      }
    } else if (uniswapXOrderDetails.status === TransactionStatus.Cancelling && uniswapXOrderDetails.cancelTxMined) {
      orderTextTableEntry = {
        getTitle: () => i18n.t('limits.cancel.finalizing'),
        status: TransactionStatus.Pending,
      }
    } else if (uniswapXOrderDetails.cancelFailedReason === 'filled') {
      orderTextTableEntry = {
        getTitle: () => (isLimitOrder ? i18n.t('common.limit.executed') : i18n.t('transaction.status.swap.success')),
        getStatusMessage: () => i18n.t('limits.cancel.alreadyFilled'),
        status: TransactionStatus.Success,
      }
    }
  }

  // Fallback for missing status entries
  if (!orderTextTableEntry) {
    // Use default swap title/status as fallback
    orderTextTableEntry = {
      getTitle: () => getActivityTitle({ type: TransactionType.Swap, status: details.status }),
      status: details.status,
    }
  }

  const title = orderTextTableEntry.getTitle()
  const statusMessage = orderTextTableEntry.getStatusMessage?.()
  const swapFields = await parseSwap({
    swap: typeInfo as ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo,
    formatNumber,
  })

  // Create offchainOrderDetails if we have routing information
  const offchainOrderDetails = uniswapXOrderDetails
    ? {
        ...uniswapXOrderDetails,
        orderHash: uniswapXOrderDetails.orderHash || uniswapXOrderDetails.hash,
      }
    : undefined

  return {
    ...swapFields,
    title,
    status: orderTextTableEntry.status,
    statusMessage,
    isUniswapX: true,
    offchainOrderDetails,
  }
}
