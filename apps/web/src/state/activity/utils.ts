import { TradingApi } from '@universe/api'
import { TransactionType, TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Get the appropriate routing type for a transaction based on its type info
 * This function handles routing for various transaction types including swaps, bridges, wraps, etc.
 */
export const getRoutingForTransaction = (typeInfo: TransactionTypeInfo) => {
  return typeInfo.type === TransactionType.Bridge ? TradingApi.Routing.BRIDGE : TradingApi.Routing.CLASSIC
}

/**
 * Snake-cased RWA analytics captured on the swap typeInfo at submit, for the `Swap Confirmed on Client` event.
 * Empty for non-swap transactions. Mirrors the spread used for `Swap Transaction Completed`.
 */
export const getRwaSwapAnalyticsFromTypeInfo = (
  typeInfo: TransactionTypeInfo,
): { market_closed?: boolean; price_warning?: boolean; token_in_stocks?: boolean; token_out_stocks?: boolean } => {
  if (typeInfo.type !== TransactionType.Swap) {
    return {}
  }
  return {
    market_closed: typeInfo.marketClosed,
    price_warning: typeInfo.priceWarning,
    token_in_stocks: typeInfo.tokenInStocks,
    token_out_stocks: typeInfo.tokenOutStocks,
  }
}
