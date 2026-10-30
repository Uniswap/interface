import { createYAxisPriceFormatter } from '~/features/Toucan/ToucanChart/clearingPrice/utils/priceFormatter'

describe('createYAxisPriceFormatter', () => {
  const format = createYAxisPriceFormatter({ scaleFactor: 1, maxFractionDigits: 8, locale: 'en-US' })

  it('renders 4+ leading zeros as subscript dust', () => {
    expect(format(0.00001024)).toBe('0.0₄1024')
    expect(format(0.00005)).toBe('0.0₄50')
  })

  it('keeps 2–4 significant digits elsewhere', () => {
    expect(format(0.00012345)).toBe('0.0001235')
    expect(format(0.5)).toBe('0.50')
    expect(format(1234.5)).toBe('1,235')
  })

  it('reads a non-positive tick as 0', () => {
    expect(format(0)).toBe('0')
    expect(format(-0.00001)).toBe('0')
  })

  it('applies the scale factor first', () => {
    const scaled = createYAxisPriceFormatter({ scaleFactor: 1e6, maxFractionDigits: 8, locale: 'en-US' })
    expect(scaled(10.24)).toBe('0.0₄1024')
  })
})
