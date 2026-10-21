import { describe, expect, it } from 'vitest'
import { getMarginAdjustCtaKind } from '~/pages/Swap/Margin/marginAdjustCtaLabel'

const NONE = { kind: 'none' } as const
const DEPOSIT = { kind: 'deposit', paymentAmountRaw: '1880000000000000000' } as const
const WITHDRAW = { kind: 'withdraw', withdrawAmountRaw: '8100000000000000' } as const
const CURRENT = 3.28

describe('getMarginAdjustCtaKind', () => {
  it('names nothing to do when neither input has moved', () => {
    expect(getMarginAdjustCtaKind({ funding: NONE, mode: { kind: 'locked' }, currentLeverage: CURRENT })).toBe(
      'noChange',
    )
  })

  it('names the deposit', () => {
    expect(getMarginAdjustCtaKind({ funding: DEPOSIT, mode: { kind: 'locked' }, currentLeverage: CURRENT })).toBe(
      'deposit',
    )
  })

  it('names the withdrawal', () => {
    expect(getMarginAdjustCtaKind({ funding: WITHDRAW, mode: { kind: 'locked' }, currentLeverage: CURRENT })).toBe(
      'withdraw',
    )
  })

  it('names the leverage change when no funds move', () => {
    expect(
      getMarginAdjustCtaKind({ funding: NONE, mode: { kind: 'explicit', value: 5 }, currentLeverage: CURRENT }),
    ).toBe('leverage')
  })

  // Both moved: the money is the part that has to be read off the button.
  it('lets funding win over leverage', () => {
    expect(
      getMarginAdjustCtaKind({ funding: WITHDRAW, mode: { kind: 'explicit', value: 5 }, currentLeverage: CURRENT }),
    ).toBe('withdraw')
    expect(
      getMarginAdjustCtaKind({ funding: DEPOSIT, mode: { kind: 'explicit', value: 5 }, currentLeverage: CURRENT }),
    ).toBe('deposit')
  })

  // Same threshold the quote gate uses, so the label can never promise a change the server rejects.
  it('ignores a sub-threshold slider nudge', () => {
    expect(
      getMarginAdjustCtaKind({ funding: NONE, mode: { kind: 'explicit', value: 3.3 }, currentLeverage: CURRENT }),
    ).toBe('noChange')
  })

  // Drift is the lock-off, slider-untouched state: leverage floats as a consequence, it is not a request.
  it('treats untouched drift as no change', () => {
    expect(getMarginAdjustCtaKind({ funding: NONE, mode: { kind: 'drift' }, currentLeverage: CURRENT })).toBe(
      'noChange',
    )
  })
})
