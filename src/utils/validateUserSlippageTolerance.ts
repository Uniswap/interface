import { Percent } from '@uniswap/sdk-core'

export enum SlippageValidationResult {
  TooLow = 'TOO_LOW',
  TooHigh = 'TOO_HIGH',
  Valid = 'VALID',
}

const MINIMUM_RECOMMENDED_SLIPPAGE = new Percent(5, 10_000)
const MAXIMUM_RECOMMENDED_SLIPPAGE = new Percent(1, 100)

export default function validateUserSlippageTolerance(userSlippageTolerance: Percent) {
  switch (true) {
    case userSlippageTolerance.lessThan(MINIMUM_RECOMMENDED_SLIPPAGE):
      return SlippageValidationResult.TooLow
    case userSlippageTolerance.greaterThan(MAXIMUM_RECOMMENDED_SLIPPAGE):
      return SlippageValidationResult.TooHigh
    default:
      return SlippageValidationResult.Valid
  }
}
