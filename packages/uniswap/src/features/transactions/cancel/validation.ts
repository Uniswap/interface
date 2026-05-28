import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { hasEncodedOrder } from 'uniswap/src/features/transactions/utils/uniswapX.utils'

/**
 * Result of order validation
 */
export type ValidationResult =
  | {
      valid: true
      chainId: UniverseChainId
      error?: never
    }
  | {
      valid: false
      chainId?: never
      error: string
    }

/**
 * Type guard to check if an order has all required data for cancellation
 */
export function hasValidCancellationData(order: UniswapXOrderDetails): order is UniswapXOrderDetails & {
  orderHash: string
  encodedOrder: string
} {
  return hasEncodedOrder(order) && order.orderHash !== undefined
}

/**
 * Validates that orders can be cancelled together
 * This is the single source of truth for cancellation validation
 *
 * @param orders - Orders to validate for batch cancellation
 * @returns Validation result with chainId if valid, or error message if invalid
 */
export function validateOrdersForCancellation(orders: UniswapXOrderDetails[]): ValidationResult {
  // Get the chain ID from the first order
  const firstOrder = orders[0]
  if (!firstOrder) {
    return { valid: false, error: 'Invalid orders array' }
  }

  const firstChainId = firstOrder.chainId

  // Check all orders are on the same chain
  const allSameChain = orders.every((order) => order.chainId === firstChainId)
  if (!allSameChain) {
    const uniqueChains = [...new Set(orders.map((o) => o.chainId))]
    return {
      valid: false,
      error: `Cannot cancel orders from different chains (found: ${uniqueChains.join(', ')})`,
    }
  }

  return { valid: true, chainId: firstChainId }
}
