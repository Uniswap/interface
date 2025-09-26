import { TradingApi } from '@universe/api'
import { SwapOrderStatus, SwapOrderType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails, TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Converts a trading API OrderType to internal Routing type.
 * Used when creating transactions from external UniswapX orders.
 */
export function convertOrderTypeToRouting(
  orderType: TradingApi.OrderType,
):
  | TradingApi.Routing.DUTCH_LIMIT
  | TradingApi.Routing.DUTCH_V2
  | TradingApi.Routing.DUTCH_V3
  | TradingApi.Routing.PRIORITY {
  switch (orderType) {
    case TradingApi.OrderType.PRIORITY:
      return TradingApi.Routing.PRIORITY
    case TradingApi.OrderType.DUTCH_V2:
      return TradingApi.Routing.DUTCH_V2
    case TradingApi.OrderType.DUTCH_V3:
      return TradingApi.Routing.DUTCH_V3
    case TradingApi.OrderType.DUTCH:
    case TradingApi.OrderType.DUTCH_LIMIT:
    default:
      return TradingApi.Routing.DUTCH_LIMIT
  }
}

/**
 * Converts a GraphQL SwapOrderType to internal Routing type.
 * Used when creating transactions from external UniswapX orders.
 */
export function convertSwapOrderTypeToRouting(
  orderType: SwapOrderType,
): TradingApi.Routing.DUTCH_LIMIT | TradingApi.Routing.DUTCH_V2 | TradingApi.Routing.PRIORITY {
  switch (orderType) {
    case SwapOrderType.Priority:
      return TradingApi.Routing.PRIORITY
    case SwapOrderType.Dutch:
    case SwapOrderType.DutchV2:
      return TradingApi.Routing.DUTCH_V2
    case SwapOrderType.Limit:
      return TradingApi.Routing.DUTCH_LIMIT
    default:
      return TradingApi.Routing.DUTCH_V2
  }
}

/**
 * Converts a trading API OrderStatus to internal TransactionStatus.
 * Used for syncing order status from backend to local transaction state.
 */
export function convertOrderStatusToTransactionStatus(status: TradingApi.OrderStatus): TransactionStatus {
  switch (status) {
    case TradingApi.OrderStatus.FILLED:
      return TransactionStatus.Success
    case TradingApi.OrderStatus.OPEN:
      return TransactionStatus.Pending
    case TradingApi.OrderStatus.EXPIRED:
      return TransactionStatus.Expired
    case TradingApi.OrderStatus.ERROR:
      return TransactionStatus.Failed
    case TradingApi.OrderStatus.CANCELLED:
      return TransactionStatus.Canceled
    case TradingApi.OrderStatus.INSUFFICIENT_FUNDS:
      return TransactionStatus.InsufficientFunds
    case TradingApi.OrderStatus.UNVERIFIED:
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
  return isUniswapX(tx) && tx.routing === TradingApi.Routing.DUTCH_LIMIT
}
