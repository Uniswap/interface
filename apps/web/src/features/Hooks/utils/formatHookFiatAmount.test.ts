import { type FiatNumberType, NumberType } from 'utilities/src/format/types'
import { formatHookFiatAmount } from '~/features/Hooks/utils/formatHookFiatAmount'

describe('formatHookFiatAmount', () => {
  it.each([null, undefined])('keeps missing %s unavailable without formatting it as zero', (value) => {
    const formatter = vi.fn<(value: number, type: FiatNumberType) => string>()

    expect(formatHookFiatAmount(value, formatter)).toBeUndefined()
    expect(formatter).not.toHaveBeenCalled()
  })

  it('preserves an exact zero using the standard fiat formatter', () => {
    const formatter = vi.fn((value: number, type: FiatNumberType) =>
      type === NumberType.FiatTokenStats && value === 0 ? '—' : '$0.00',
    )

    expect(formatHookFiatAmount(0, formatter)).toBe('$0.00')
    expect(formatter).toHaveBeenCalledWith(0, NumberType.FiatStandard)
  })

  it.each([123_456, 0.001, -100])('keeps the localized stats formatter for nonzero %s', (value) => {
    const formatter = vi.fn((_value: number, _type: FiatNumberType) => 'localized amount')

    expect(formatHookFiatAmount(value, formatter)).toBe('localized amount')
    expect(formatter).toHaveBeenCalledWith(value, NumberType.FiatTokenStats)
  })
})
