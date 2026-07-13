import { describe, expect, it } from 'vitest'
import { formatUnits } from './createFormatUnits'

describe('formatUnits', () => {
  it('formats fractional values', () => {
    expect(formatUnits(1500000000000000000n, 18)).toEqual('1.5')
    expect(formatUnits(1000000000000n, 18)).toEqual('0.000001')
    expect(formatUnits(123456789n, 6)).toEqual('123.456789')
    expect(formatUnits(1123456789012345678n, 18)).toEqual('1.123456789012345678')
  })

  it('formats whole numbers without trailing zeros', () => {
    expect(formatUnits(1000000000000000000n, 18)).toEqual('1')
    expect(formatUnits(0n, 18)).toEqual('0')
    expect(formatUnits(-1000000000000000000n, 18)).toEqual('-1')
  })

  it('formats with zero decimals', () => {
    expect(formatUnits(42n, 0)).toEqual('42')
    expect(formatUnits(0n, 0)).toEqual('0')
  })

  it('formats very small fractions', () => {
    expect(formatUnits(1n, 18)).toEqual('0.000000000000000001')
  })

  // Parity with the hand-rolled `Number(raw) / 10 ** decimals` pattern. Holds
  // for typical token-magnitude inputs where both forms collapse to `Number`.
  it('matches `Number(raw) / 10 ** decimals` for typical token amounts', () => {
    const cases: [bigint, number][] = [
      [0n, 18],
      [1n, 18],
      [1000000n, 6],
      [1234567800n, 6],
      [1500000000000000000n, 18],
      [1000000000000000000000n, 18],
    ]
    for (const [raw, decimals] of cases) {
      expect(Number(formatUnits(raw, decimals))).toBe(Number(raw) / 10 ** decimals)
    }
  })
})
