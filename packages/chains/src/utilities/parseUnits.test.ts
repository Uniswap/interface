import { describe, expect, it } from 'vitest'
import { createParseUnits } from './createParseUnits'

const ethersParseUnits = createParseUnits({ getViemEnabled: () => false })
const viemParseUnits = createParseUnits({ getViemEnabled: () => true })

describe('parseUnits', () => {
  it('agree on simple integer values', () => {
    expect(ethersParseUnits('1', 18)).toEqual(viemParseUnits('1', 18))
    expect(ethersParseUnits('100', 6)).toEqual(viemParseUnits('100', 6))
    expect(ethersParseUnits('0', 18)).toEqual(viemParseUnits('0', 18))
  })

  it('agree on decimal values', () => {
    expect(ethersParseUnits('1.5', 18)).toEqual(viemParseUnits('1.5', 18))
    expect(ethersParseUnits('0.000001', 18)).toEqual(viemParseUnits('0.000001', 18))
    expect(ethersParseUnits('123.456789', 6)).toEqual(viemParseUnits('123.456789', 6))
  })

  it('agree on zero decimals with integer input', () => {
    expect(ethersParseUnits('42', 0)).toEqual(viemParseUnits('42', 0))
  })

  it('agree on max-precision values', () => {
    expect(ethersParseUnits('1.123456789012345678', 18)).toEqual(viemParseUnits('1.123456789012345678', 18))
  })

  it('agree on negative values', () => {
    expect(ethersParseUnits('-1', 18)).toEqual(viemParseUnits('-1', 18))
    expect(ethersParseUnits('-0.5', 18)).toEqual(viemParseUnits('-0.5', 18))
  })

  it('agree on very small fractions', () => {
    expect(ethersParseUnits('0.000000000000000001', 18)).toEqual(viemParseUnits('0.000000000000000001', 18))
  })

  it('agree on large values', () => {
    expect(ethersParseUnits('999999999999999999', 18)).toEqual(viemParseUnits('999999999999999999', 18))
  })

  it('both reject non-numeric strings', () => {
    expect(() => ethersParseUnits('abc', 18)).toThrow()
    expect(() => viemParseUnits('abc', 18)).toThrow()
  })

  it('both reject multiple decimal points', () => {
    expect(() => ethersParseUnits('1.2.3', 18)).toThrow()
    expect(() => viemParseUnits('1.2.3', 18)).toThrow()
  })

  // ethers throws on empty string, viem treats it as zero.
  it('empty string: ethers throws, viem returns 0', () => {
    expect(() => ethersParseUnits('', 18)).toThrow()
    expect(viemParseUnits('', 18)).toEqual(0n)
  })

  // ethers throws when the fractional part has more digits than the
  // specified decimals. viem silently rounds instead.
  // Impact: code that catches parseUnits errors to show user feedback
  // may behave differently under viem.
  it('too many decimals: ethers throws, viem rounds', () => {
    expect(() => ethersParseUnits('1.123', 2)).toThrow()
    expect(viemParseUnits('1.123', 2)).toEqual(112n)
  })

  it('fraction with zero decimals: ethers throws, viem rounds', () => {
    expect(() => ethersParseUnits('1.5', 0)).toThrow()
    expect(viemParseUnits('1.5', 0)).toEqual(2n)
  })
})
