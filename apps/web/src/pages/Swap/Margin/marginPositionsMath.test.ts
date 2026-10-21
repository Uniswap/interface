import { describe, expect, it } from 'vitest'
import { formatAge } from '~/pages/Swap/Margin/marginPositionsMath'

describe('formatAge', () => {
  it('formats hours, days and minutes', () => {
    expect(formatAge({ openedAtSeconds: 0, nowSeconds: 7200 })).toBe('2h')
    expect(formatAge({ openedAtSeconds: 0, nowSeconds: 31_449_600 })).toBe('364d')
    expect(formatAge({ openedAtSeconds: 0, nowSeconds: 90 })).toBe('1m')
  })

  it('floors sub-minute ages to <1m', () => {
    expect(formatAge({ openedAtSeconds: 0, nowSeconds: 30 })).toBe('<1m')
  })
})
