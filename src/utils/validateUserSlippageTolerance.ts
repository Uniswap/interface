import { Percent } from '@thinkincoin-libs/sdk-core'

export enum SlippageValidationResult {
  TooLow,
  TooHigh,
  Valid,
}

export const MINIMUM_RECOMMENDED_SLIPPAGE = new Percent(5, 10_000)
export const MAXIMUM_RECOMMENDED_SLIPPAGE = new Percent(1, 100)

export default function validateUserSlippageTolerance(userSlippageTolerance: Percent) {
  if (userSlippageTolerance.lessThan(MINIMUM_RECOMMENDED_SLIPPAGE)) {
    return SlippageValidationResult.TooLow
  } else if (userSlippageTolerance.greaterThan(MAXIMUM_RECOMMENDED_SLIPPAGE)) {
    return SlippageValidationResult.TooHigh
  } else {
    return SlippageValidationResult.Valid
  }
}
