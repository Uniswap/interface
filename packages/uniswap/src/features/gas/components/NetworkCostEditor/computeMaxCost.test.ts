import { computeMaxCost } from 'uniswap/src/features/gas/components/NetworkCostEditor/computeMaxCost'

describe('computeMaxCost', () => {
  it('returns (maxBaseFee + priorityFee) * gasLimit in wei', () => {
    // 3 + 2 = 5 GWEI, * 100000 gasLimit = 500000 GWEI = 5e14 wei
    expect(computeMaxCost({ maxBaseFeeGwei: '3', priorityFeeGwei: '2', gasLimit: '100000' })).toBe('500000000000000')
  })

  it('handles decimal GWEI inputs', () => {
    const result = computeMaxCost({ maxBaseFeeGwei: '3.21', priorityFeeGwei: '6.05', gasLimit: '169698' })
    expect(result).toMatch(/^\d+$/)
    expect(BigInt(result!) > BigInt('1500000000000000')).toBe(true)
    expect(BigInt(result!) < BigInt('1600000000000000')).toBe(true)
  })

  it('handles thousands separators (commas) in gasLimit', () => {
    expect(computeMaxCost({ maxBaseFeeGwei: '5', priorityFeeGwei: '0', gasLimit: '100,000' })).toBe('500000000000000')
  })

  it('returns undefined when any input is missing or invalid', () => {
    expect(computeMaxCost({ maxBaseFeeGwei: '', priorityFeeGwei: '2', gasLimit: '100000' })).toBeUndefined()
    expect(computeMaxCost({ maxBaseFeeGwei: 'abc', priorityFeeGwei: '2', gasLimit: '100000' })).toBeUndefined()
    expect(computeMaxCost({ maxBaseFeeGwei: '3', priorityFeeGwei: '2', gasLimit: '' })).toBeUndefined()
  })
})
