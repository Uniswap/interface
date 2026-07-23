const MAX_SLIPPAGE_INPUT_DECIMALS = 4

/**
 * Normalizes a slippage tolerance number to at most 4 decimal places,
 * removing floating-point rounding artifacts from JS binary arithmetic.
 */

export function formatSlippage(value: number): number {
  return parseFloat(value.toFixed(MAX_SLIPPAGE_INPUT_DECIMALS))
}
