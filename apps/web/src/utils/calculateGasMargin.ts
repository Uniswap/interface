/**
 * Returns the gas value plus a margin for
 * unexpected or variable gas costs
 *
 * @param value - The gas value to pad
 * @returns Computed gas margin += 20%
 */
export function calculateGasMargin(value: bigint): bigint {
  return (value * 120n) / 100n
}
