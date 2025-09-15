import { SwapOrderStatus, SwapOrderType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { OrderStatus, OrderType, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Converts a trading API OrderType to internal Routing type.
 * Used when creating transactions from external UniswapX orders.
 */
export function convertOrderTypeToRouting(
  orderType: OrderType,
): Routing.DUTCH_LIMIT | Routing.DUTCH_V2 | Routing.DUTCH_V3 | Routing.PRIORITY {
  switch (orderType) {
    case OrderType.PRIORITY:
      return Routing.PRIORITY
    case OrderType.DUTCH_V2:
      return Routing.DUTCH_V2
    case OrderType.DUTCH_V3:
      return Routing.DUTCH_V3
    case OrderType.DUTCH:
    case OrderType.DUTCH_LIMIT:
    default:
      return Routing.DUTCH_LIMIT
  }
}

/**
 * Converts a GraphQL SwapOrderType to internal Routing type.
 * Used when creating transactions from external UniswapX orders.
 */
export function convertSwapOrderTypeToRouting(
  orderType: SwapOrderType,
): Routing.DUTCH_LIMIT | Routing.DUTCH_V2 | Routing.PRIORITY {
  switch (orderType) {
    case SwapOrderType.Priority:
      return Routing.PRIORITY
    case SwapOrderType.Dutch:
    case SwapOrderType.DutchV2:
      return Routing.DUTCH_V2
    case SwapOrderType.Limit:
      return Routing.DUTCH_LIMIT
    default:
      return Routing.DUTCH_V2
  }
}

/**
 * Converts a trading API OrderStatus to internal TransactionStatus.
 * Used for syncing order status from backend to local transaction state.
 */
export function convertOrderStatusToTransactionStatus(status: OrderStatus): TransactionStatus {
  switch (status) {
    case OrderStatus.FILLED:
      return TransactionStatus.Success
    case OrderStatus.OPEN:
      return TransactionStatus.Pending
    case OrderStatus.EXPIRED:
      return TransactionStatus.Expired
    case OrderStatus.ERROR:
      return TransactionStatus.Failed
    case OrderStatus.CANCELLED:
      return TransactionStatus.Canceled
    case OrderStatus.INSUFFICIENT_FUNDS:
      return TransactionStatus.InsufficientFunds
    case OrderStatus.UNVERIFIED:
    default:
      return TransactionStatus.Unknown
  }
}

/**
 * Converts a GraphQL OrderStatus to internal TransactionStatus.
 * Used for syncing order status from backend to local transaction state.
 */
export function remoteOrderStatusToLocalTxStatus(orderStatus: SwapOrderStatus): TransactionStatus {
  switch (orderStatus) {
    case SwapOrderStatus.Open:
      return TransactionStatus.Pending
    case SwapOrderStatus.Expired:
      return TransactionStatus.Expired
    case SwapOrderStatus.Error:
      return TransactionStatus.Failed
    case SwapOrderStatus.InsufficientFunds:
      return TransactionStatus.InsufficientFunds
    case SwapOrderStatus.Filled:
      return TransactionStatus.Success
    case SwapOrderStatus.Cancelled:
      return TransactionStatus.Canceled
    default:
      return TransactionStatus.Unknown
  }
}

/**
 * Checks if a transaction is a limit order.
 * Limit orders are UniswapX orders with DUTCH_LIMIT routing.
 */
export function isLimitOrder(tx: TransactionDetails): boolean {
  return isUniswapX(tx) && tx.routing === Routing.DUTCH_LIMIT
}
