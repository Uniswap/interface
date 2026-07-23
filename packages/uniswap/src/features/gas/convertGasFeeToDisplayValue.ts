import { type GasStrategy } from '@universe/api'
import { BigNumber } from 'ethers/lib/ethers'

/**
 * Converts a gas fee calculated with the provided gas strategy to a display value.
 * When calculating the gas fee, the gas limit is multiplied by the `limitInflationFactor`,
 * but in the vast majority of cases, the transaction uses only the originally estimated gas limit.
 * We use the `displayLimitInflationFactor` to calculate the display value, which can be
 * different from the `limitInflationFactor` so that the gas fee displayed is more accurate.
 *
 * When `hasOverrides` is true the user applied gas overrides, so the raw `gasFee`
 * is returned without the inflation backoff (deflating it would understate the
 * displayed cost). Callers that show the full max cost handle that separately.
 */
export function convertGasFeeToDisplayValue({
  gasFee,
  gasStrategy,
  hasOverrides,
}: {
  gasFee: string | undefined
  gasStrategy: GasStrategy | undefined
  /** When true, return `gasFee` unchanged (no limit-inflation adjustment). */
  hasOverrides?: boolean
}): string | undefined {
  if (!gasFee || hasOverrides || !gasStrategy || gasStrategy.limitInflationFactor === 0) {
    return gasFee
  }

  const PRECISION = 1_000_000
  const { displayLimitInflationFactor, limitInflationFactor } = gasStrategy

  // Scale the inflation factors to integers
  const scaledDisplayFactor = Math.round(displayLimitInflationFactor * PRECISION)
  const scaledLimitFactor = Math.round(limitInflationFactor * PRECISION)

  return BigNumber.from(gasFee)
    .mul(BigNumber.from(scaledDisplayFactor))
    .div(BigNumber.from(scaledLimitFactor))
    .toString()
}
