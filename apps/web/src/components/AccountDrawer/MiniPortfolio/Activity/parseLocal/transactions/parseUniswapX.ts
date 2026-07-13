import { TradingApi } from '@universe/api'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import type {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  InterfaceBaseTransactionDetails,
  InterfaceTransactionDetails,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
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
