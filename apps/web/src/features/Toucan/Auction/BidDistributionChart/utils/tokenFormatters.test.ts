import {
  formatTokenPriceSubscript,
  formatTokenVolume,
} from '~/features/Toucan/Auction/BidDistributionChart/utils/tokenFormatters'

describe('formatTokenPriceSubscript', () => {
  it('renders en-US subscript and standard values with a dot separator', () => {
    const subscript = formatTokenPriceSubscript(0.00000001024, { locale: 'en-US' })
    expect(subscript.usesSubscript).toBe(true)
    expect(subscript.text).toBe('0.0₇1024')
    expect(subscript.html.startsWith('0.0<span')).toBe(true)
    expect(formatTokenPriceSubscript(0.0123, { locale: 'en-US' }).text).toBe('0.0123')
    expect(formatTokenPriceSubscript(1234.5, { locale: 'en-US' }).text).toBe('1,235')
  })

  it('renders nl-NL subscript and standard values with a comma separator', () => {
    const subscript = formatTokenPriceSubscript(0.00000001024, { locale: 'nl-NL' })
    expect(subscript.text).toBe('0,0₇1024')
    expect(subscript.html.startsWith('0,0<span')).toBe(true)
    expect(formatTokenPriceSubscript(0.0123, { locale: 'nl-NL' }).text).toBe('0,0123')
    expect(formatTokenPriceSubscript(1234.5, { locale: 'nl-NL' }).text).toBe('1.235')
  })

  it('returns 0 for zero', () => {
    expect(formatTokenPriceSubscript(0, { locale: 'nl-NL' })).toEqual({ text: '0', html: '0', usesSubscript: false })
  })
})

describe('formatTokenVolume', () => {
  it('renders en-US values with a dot separator', () => {
    expect(formatTokenVolume(1234.567, { locale: 'en-US' })).toBe('1,234.567')
    expect(formatTokenVolume(0.00000001234, { locale: 'en-US' })).toBe('0.0₇1234')
    expect(formatTokenVolume(-0.00000001234, { locale: 'en-US' })).toBe('-0.0₇1234')
  })

  it('renders nl-NL values with a comma separator', () => {
    expect(formatTokenVolume(1234.567, { locale: 'nl-NL' })).toBe('1.234,567')
    expect(formatTokenVolume(0.00000001234, { locale: 'nl-NL' })).toBe('0,0₇1234')
    expect(formatTokenVolume(-0.00000001234, { locale: 'nl-NL' })).toBe('-0,0₇1234')
    expect(formatTokenVolume(0.0001234, { locale: 'nl-NL' })).toBe('0,0001234')
  })

  it('returns 0 for zero', () => {
    expect(formatTokenVolume(0, { locale: 'nl-NL' })).toBe('0')
  })
})
