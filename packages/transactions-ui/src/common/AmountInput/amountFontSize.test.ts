import { getAmountFontSize } from '@universe/transactions-ui/src/common/AmountInput/amountFontSize'
import { describe, expect, it } from 'vitest'

const range = { max: 36, min: 24 }

describe('getAmountFontSize', () => {
  it('uses the largest size until the field is measured', () => {
    expect(getAmountFontSize({ text: '123456789012345', availableWidth: 0, range })).toBe(36)
  })

  it('keeps the largest size when the text fits', () => {
    expect(getAmountFontSize({ text: '1.5', availableWidth: 300, range })).toBe(36)
  })

  it('shrinks long amounts to fit, down to the minimum', () => {
    const shrunk = getAmountFontSize({ text: '123456.123456', availableWidth: 220, range })
    expect(shrunk).toBeLessThan(36)
    expect(shrunk).toBeGreaterThanOrEqual(24)
    expect(getAmountFontSize({ text: '123456789012345678901234567890', availableWidth: 220, range })).toBe(24)
  })

  it('scales glyph widths with the range, so a compact field shrinks at the same fill', () => {
    const compact = { max: 18, min: 12 }
    expect(getAmountFontSize({ text: '1.5', availableWidth: 150, range: compact })).toBe(18)
    const shrunk = getAmountFontSize({ text: '123456.123456', availableWidth: 110, range: compact })
    expect(shrunk).toBeLessThan(18)
    expect(shrunk).toBeGreaterThanOrEqual(12)
  })
})
