import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { TransactionType, TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'

export function getRoutingForUniswapXOrder(
  order: UniswapXOrderDetails,
): Routing.DUTCH_LIMIT | Routing.DUTCH_V2 | Routing.DUTCH_V3 | Routing.PRIORITY | Routing.CLASSIC {
  switch (order.type) {
    case SignatureType.SIGN_UNISWAPX_ORDER:
      return Routing.DUTCH_LIMIT
    case SignatureType.SIGN_UNISWAPX_V2_ORDER:
      return Routing.DUTCH_V2
    case SignatureType.SIGN_UNISWAPX_V3_ORDER:
      return Routing.DUTCH_V3
    case SignatureType.SIGN_PRIORITY_ORDER:
      return Routing.PRIORITY
    default:
      return Routing.CLASSIC
  }
}

/**
 * Get the appropriate routing type for a transaction based on its type info
 * This function handles routing for various transaction types including swaps, bridges, wraps, etc.
 */
export const getRoutingForTransaction = (typeInfo: TransactionTypeInfo) => {
  return typeInfo.type === TransactionType.Bridge ? Routing.BRIDGE : Routing.CLASSIC
}
