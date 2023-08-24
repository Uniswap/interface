export const TRANSACTION_CANCELLATION_GAS_FACTOR = 1.2 // Increase gas price offer by this factor when cancellation txs
// Slippage tolerances are percentages (ex. 5 = 5% slippage tolerance)
export const DEFAULT_SLIPPAGE_TOLERANCE = 5
export const MIN_AUTO_SLIPPAGE_TOLERANCE = 0.5
export const MAX_AUTO_SLIPPAGE_TOLERANCE = 5
export const MAX_CUSTOM_SLIPPAGE_TOLERANCE = 20

/**
 * Temp fix for fee-on-transfer swap failures. For V2 swaps, we use a higher slippage tolerance and submit through
 * private RPC to account for likely chance of transfer tax during swap.
 *
 * TODO: can lower or remove when MOB-1087 is resolved.
 */
export const AGGRESIVE_AUTO_SLIPPAGE_TOLERANCE = 15
export const MAX_TRADE_SIZE_FOR_AGGRESIVE_SLIPPAGE_USD = 1000
