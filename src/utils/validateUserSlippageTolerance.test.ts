import { Percent } from '@uniswap/sdk-core'

import validateUserSlippageTolerance, { SlippageValidationResponse } from './validateUserSlippageTolerance'

describe('validateUserSlippageTolerance', () => {
  it('should return warning when slippage is too low', () => {
    expect(validateUserSlippageTolerance(new Percent(4, 10_000))).toBe(SlippageValidationResponse.TooLow)
  })
  it('should return warning when slippage is too high', () => {
    expect(validateUserSlippageTolerance(new Percent(2, 100))).toBe(SlippageValidationResponse.TooHigh)
  })
  it('should not return warning when slippage is in bounds', () => {
    expect(validateUserSlippageTolerance(new Percent(1, 100))).toBe(SlippageValidationResponse.Valid)
  })
})
