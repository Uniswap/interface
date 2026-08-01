import type { GasStrategy } from '@universe/api'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/convertGasFeeToDisplayValue'

const strategy: GasStrategy = {
  limitInflationFactor: 1.15,
  displayLimitInflationFactor: 1,
  priceInflationFactor: 1.5,
  percentileThresholdFor1559Fee: 75,
  thresholdToInflateLastBlockBaseFee: 0.75,
  baseFeeMultiplier: 1,
  baseFeeHistoryWindow: 20,
  minPriorityFeeRatioOfBaseFee: 0.2,
  minPriorityFeeGwei: 2,
  maxPriorityFeeGwei: 9,
}

describe(convertGasFeeToDisplayValue, () => {
  it('returns undefined when gasFee is undefined', () => {
    expect(convertGasFeeToDisplayValue({ gasFee: undefined, gasStrategy: strategy })).toBeUndefined()
  })

  it('returns gasFee unchanged when gasStrategy is undefined', () => {
    expect(convertGasFeeToDisplayValue({ gasFee: '1150', gasStrategy: undefined })).toBe('1150')
  })

  it('returns gasFee unchanged when limitInflationFactor is 0', () => {
    const zeroLimit = { ...strategy, limitInflationFactor: 0 }
    expect(convertGasFeeToDisplayValue({ gasFee: '1150', gasStrategy: zeroLimit })).toBe('1150')
  })

  it('returns gasFee unchanged when hasOverrides is true (short-circuit)', () => {
    expect(convertGasFeeToDisplayValue({ gasFee: '1150', gasStrategy: strategy, hasOverrides: true })).toBe('1150')
  })

  it('applies displayLimitInflationFactor / limitInflationFactor when hasOverrides is false', () => {
    // 1150 * 1 / 1.15 = 1000
    expect(convertGasFeeToDisplayValue({ gasFee: '1150', gasStrategy: strategy, hasOverrides: false })).toBe('1000')
  })

  it('applies the ratio when hasOverrides is omitted (defaults to inflation-adjusted path)', () => {
    expect(convertGasFeeToDisplayValue({ gasFee: '1150', gasStrategy: strategy })).toBe('1000')
  })
})
