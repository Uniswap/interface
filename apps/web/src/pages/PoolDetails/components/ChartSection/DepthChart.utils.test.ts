import { parseForSubscriptNotation } from 'utilities/src/format/parseForSubscriptNotation'
import { describe, expect, it } from 'vitest'
import { DEPTH_CHART_SUBSCRIPT_THRESHOLD } from '~/pages/PoolDetails/components/ChartSection/DepthChart.utils'

// Mirrors how `SubscriptZeroPrice` parses values in the depth-chart header (maxSigDigits 4)
// and order book / tooltip (maxSigDigits 6).
function parse(value: number, maxSigDigits = 4) {
  return parseForSubscriptNotation({
    value,
    minSigDigits: 2,
    maxSigDigits,
    subscriptThreshold: DEPTH_CHART_SUBSCRIPT_THRESHOLD,
    locale: 'en-US',
  })
}

describe('depth chart subscript threshold (LP-886, LP-888)', () => {
  it('uses subscript notation for 0.00001 instead of a plain run of zeros (LP-886)', () => {
    const parsed = parse(0.00001)
    expect(parsed.useSubscript).toBe(true)
    expect(parsed.leadingZeros).toBe(4)
    expect(parsed.significantPart).toBe('10')
  })

  it('switches to subscript at 4 leading zeros, e.g. 0.000034 (LP-888)', () => {
    const parsed = parse(0.000034)
    expect(parsed.useSubscript).toBe(true)
    expect(parsed.leadingZeros).toBe(4)
    expect(parsed.significantPart).toBe('34')
  })

  it('keeps plain notation just above the threshold (3 leading zeros)', () => {
    const parsed = parse(0.000123)
    expect(parsed.useSubscript).toBe(false)
    expect(parsed.fullFormatted).toBe('0.000123')
  })

  it('keeps plain notation for ordinary prices', () => {
    expect(parse(0.001).useSubscript).toBe(false)
    expect(parse(1.5).useSubscript).toBe(false)
    expect(parse(1.5).fullFormatted).toBe('1.5')
  })

  it('still subscripts ultra-small prices previously covered by the old threshold of 6', () => {
    const parsed = parse(0.0000001234, 6)
    expect(parsed.useSubscript).toBe(true)
    expect(parsed.leadingZeros).toBe(6)
    expect(parsed.significantPart).toBe('1234')
  })
})
