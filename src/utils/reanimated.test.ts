import { numberToLocaleStringWorklet } from 'src/utils/reanimated'

describe('reanimated numberToLocaleStringWorklet', function () {
  'use strict'

  it('needs to be overridden for phantomjs', function () {
    const num = 123456
    const locale = 'en-GB'

    function testLocale() {
      return numberToLocaleStringWorklet(num, locale)
    }

    expect(testLocale).not.toThrow()
  })

  it('returns a string', function () {
    const num = 123456
    const locale = 'en-GB'

    expect(typeof numberToLocaleStringWorklet(num, locale)).toBe('string')
  })

  it('returns a string formatted in FR style (1\u00A0234.5) when passed FR', function () {
    const num = 1234.5
    const locale = 'fr'

    expect(numberToLocaleStringWorklet(num, locale)).toEqual('1\u00A0234,5')
  })

  it('returns a string formatted in US style (1,234.5) when passed US', function () {
    const num = 1234.5
    const locale = 'en-US'

    expect(numberToLocaleStringWorklet(num, locale)).toBe('1,234.5')
  })

  it('returns a string formatted in IT style (1.234,5) when passed IT', function () {
    const num = 1234.5
    const locale = 'it'

    expect(numberToLocaleStringWorklet(num, locale)).toBe('1.234,5')
  })

  it("returns a string formatted in de-CH style (1'234.5) when passed de-CH", function () {
    const num = 1234.5
    const locale = 'de-CH'

    expect(numberToLocaleStringWorklet(num, locale)).toBe("1'234.5")
  })

  it('returns a string formatted in DK style (1.234,5) when passed da-DK', function () {
    const num = 1234.5
    const locale = 'da-DK'

    expect(numberToLocaleStringWorklet(num, locale)).toBe('1.234,5')
  })

  it('returns a string formatted in NO style (1 234,5) when passed nb-NO', function () {
    const num = 1234.5
    const locale = 'nb-NO'

    expect(numberToLocaleStringWorklet(num, locale)).toBe('1\u00A0234,5')
  })

  it('throws when the language tag does not conform to the standard', function () {
    const num = 1234.5
    const locale = 'i'

    function testLocale() {
      // @ts-ignore
      return numberToLocaleStringWorklet(num, locale)
    }

    expect(testLocale).toThrow(new RangeError('Invalid language tag: ' + locale))
  })

  it('should support options with maximumFractionDigits 2', function () {
    const num = 1234
    const locale = 'it'

    expect(numberToLocaleStringWorklet(num, locale, { maximumFractionDigits: 2 })).toBe('1.234,00')
  })

  it('should support options with maximumFractionDigits 4', function () {
    const num = 1234.0
    const locale = 'it'

    expect(numberToLocaleStringWorklet(num, locale, { maximumFractionDigits: 4 })).toBe(
      '1.234,0000'
    )
  })

  it('should support options with maximumFractionDigits with 0 value', function () {
    const num = 1234.1234
    const locale = 'it'
    const currency = 'EUR'

    expect(
      numberToLocaleStringWorklet(num, locale, {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
      })
    ).toBe('1.234 €')
  })

  it('returns a string formatted in US style (1,234.5) by default', function () {
    const num = 1234.5

    expect(numberToLocaleStringWorklet(num)).toBe('1,234.5')
    //@ts-ignore
    expect(numberToLocaleStringWorklet(num, 'es')).toBe('1,234.5')
    //@ts-ignore
    expect(numberToLocaleStringWorklet(num, 'AU')).toBe('1,234.5')
  })

  it('returns a string formatted in Hungarian style (1 234,56) by default', function () {
    const num = 1234.56

    expect(numberToLocaleStringWorklet(num, 'hu')).toBe('1\u00A0234,56')
    expect(numberToLocaleStringWorklet(num, 'hu-HU')).toBe('1\u00A0234,56')
  })

  it('returns currency properly formatted for the locale specified', function () {
    const num = 1234.56
    const negative_num = -1234.56
    const style = 'currency'
    const currency = 'USD'

    expect(
      numberToLocaleStringWorklet(num, 'en-US', {
        style: style,
        currency: currency,
      })
    ).toBe('$1,234.56')

    expect(
      numberToLocaleStringWorklet(negative_num, 'en-US', {
        style: style,
        currency: currency,
      })
    ).toBe('-$1,234.56')

    expect(
      numberToLocaleStringWorklet(num, 'de-DE', {
        style: style,
        currency: currency,
      })
    ).toBe('1.234,56 $')

    expect(
      numberToLocaleStringWorklet(num, 'hu', {
        style: style,
        currency: 'huf',
      })
    ).toBe('1\u00A0234,56 Ft')

    expect(
      numberToLocaleStringWorklet(num, 'hu-HU', {
        style: style,
        currency: 'huf',
      })
    ).toBe('1\u00A0234,56 Ft')

    expect(
      numberToLocaleStringWorklet(num, 'da-DK', {
        style: style,
        currency: 'DKK',
      })
    ).toBe('1.234,56 kr')

    expect(
      numberToLocaleStringWorklet(num, 'nb-NO', {
        style: style,
        currency: 'NOK',
      })
    ).toBe('1\u00A0234,56 kr')
  })
})
