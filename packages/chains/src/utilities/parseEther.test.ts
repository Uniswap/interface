import { describe, expect, it } from 'vitest'
import { parseEther } from './createParseEther'

describe('parseEther', () => {
  it('parses whole-ether values to 18-decimal wei', () => {
    expect(parseEther('1')).toEqual(1000000000000000000n)
    expect(parseEther('0')).toEqual(0n)
    expect(parseEther('100')).toEqual(100000000000000000000n)
  })

  it('parses fractional values', () => {
    expect(parseEther('1.5')).toEqual(1500000000000000000n)
    expect(parseEther('0.000001')).toEqual(1000000000000n)
    expect(parseEther('1.123456789012345678')).toEqual(1123456789012345678n)
  })

  it('parses very small fractions down to 1 wei', () => {
    expect(parseEther('0.000000000000000001')).toEqual(1n)
  })

  it('parses negative values', () => {
    expect(parseEther('-1')).toEqual(-1000000000000000000n)
  })

  it('rejects non-numeric strings', () => {
    expect(() => parseEther('abc')).toThrow()
    expect(() => parseEther('1.2.3')).toThrow()
  })

  // viem rounds extra fractional digits rather than throwing, the same
  // divergence documented in `parseUnits.test.ts`. Callers that catch
  // parseEther errors for user feedback should validate precision upstream.
  it('rounds extra fractional digits past 18 decimals', () => {
    expect(parseEther('1.1234567890123456789')).toEqual(1123456789012345679n)
  })
})
