export const TRANSACTION_CANCELLATION_GAS_FACTOR = 1.2 // Increase gas price offer by this factor when cancellation txs
// Slippage tolerances are percentages (ex. 5 = 5% slippage tolerance)
export const MIN_AUTO_SLIPPAGE_TOLERANCE = 0.5
export const MAX_AUTO_SLIPPAGE_TOLERANCE = 5.5
export const MAX_CUSTOM_SLIPPAGE_TOLERANCE = 100
export const SLIPPAGE_CRITICAL_TOLERANCE = 20

export const MAX_FIAT_INPUT_DECIMALS = 2

// Default settings for swap deadline thresholds
export const DEFAULT_CUSTOM_DEADLINE = 30 // 30 minutes
export const WARNING_DEADLINE_TOLERANCE = 60 // 1 hour
export const MAX_CUSTOM_DEADLINE = 3 * 24 * 60 // 3 days
