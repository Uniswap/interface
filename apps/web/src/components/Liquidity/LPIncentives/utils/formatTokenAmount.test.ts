import { formatTokenAmount } from 'components/Liquidity/LPIncentives/utils/formatTokenAmount'
import { describe, expect, it } from 'vitest'

describe('formatTokenAmount', () => {
  it('formats a token amount with decimals, truncating to 3 decimal places', () => {
    // 1234567890000000000 with 18 decimals = 1.23456789
    expect(formatTokenAmount('1234567890000000000', 18)).toBe('1.234')
  })

  it('formats a token amount with no decimals (integer)', () => {
    // 1000000000000000000 with 18 decimals = 1
    expect(formatTokenAmount('1000000000000000000', 18)).toBe('1')
  })

  it('formats a token amount with less than 3 decimals', () => {
    // 1200000000000000000 with 18 decimals = 1.2
    expect(formatTokenAmount('1200000000000000000', 18)).toBe('1.2')
  })

  it('returns 0 for invalid input (non-numeric string)', () => {
    expect(formatTokenAmount('notanumber', 18)).toBe('0')
  })

  it('returns 0 for invalid input (empty string)', () => {
    expect(formatTokenAmount('', 18)).toBe('0')
  })
})
