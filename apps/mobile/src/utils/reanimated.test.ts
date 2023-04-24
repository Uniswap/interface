import { Language, numberToLocaleStringWorklet, numberToPercentWorklet } from 'src/utils/reanimated'

describe('reanimated numberToLocaleStringWorklet', function () {
  'use strict'

  it('needs to be overridden for phantomjs', function () {
    const num = 123456
    const locale = 'en-GB'

    function testLocale(): string {
      return numberToLocaleStringWorklet(num, locale)
    }

    expect(testLocale).not.toThrow()
  })

  it('returns a string', function () {
    const num = 123456
    const locale = 'en-GB'

    expect(typeof numberToLocaleStringWorklet(num, locale)).toBe('string')
  })

  it('returns <$0.00000001 if the value is below that amount', function () {
    const num = 0.000000001

    expect(
      numberToLocaleStringWorklet(num, 'en-US', {
        style: 'currency',
        currency: 'USD',
      })
    ).toBe('<$0.00000001')
  })

  it('returns a string with 3 sig figs if it is between 0.00000001 and 1,', function () {
    const num = 0.0000000123

    expect(
      numberToLocaleStringWorklet(num, 'en-US', {
        style: 'currency',
        currency: 'USD',
      })
    ).toBe('$0.0000000123')
  })

  it('returns a string formatted in FR style (1\u00A0234.5) when passed FR', function () {
    const num = 1234.5
    const locale = 'fr'

    expect(numberToLocaleStringWorklet(num, locale)).toEqual('1\u00A0234,50')
  })

  it('returns a string formatted in US style (1,234.5) when passed US', function () {
    const num = 1234.5
    const locale = 'en-US'

    expect(numberToLocaleStringWorklet(num, locale)).toBe('1,234.50')
  })

  it('returns a string formatted in IT style (1.234,5) when passed IT', function () {
    const num = 1234.5
    const locale = 'it'

    expect(numberToLocaleStringWorklet(num, locale)).toBe('1.234,50')
  })

  it("returns a string formatted in de-CH style (1'234.5) when passed de-CH", function () {
    const num = 1234.5
    const locale = 'de-CH'

    expect(numberToLocaleStringWorklet(num, locale)).toBe("1'234.50")
  })

  it('returns a string formatted in DK style (1.234,5) when passed da-DK', function () {
    const num = 1234.5
    const locale = 'da-DK'

    expect(numberToLocaleStringWorklet(num, locale)).toBe('1.234,50')
  })

  it('returns a string formatted in NO style (1 234,5) when passed nb-NO', function () {
    const num = 1234.5
    const locale = 'nb-NO'

    expect(numberToLocaleStringWorklet(num, locale)).toBe('1\u00A0234,50')
  })

  it('throws when the language tag does not conform to the standard', function () {
    const num = 1234.5
    const locale = 'i'

    function testLocale(): string {
      return numberToLocaleStringWorklet(num, locale as Language)
    }

    expect(testLocale).toThrow(new RangeError('Invalid language tag: ' + locale))
  })

  it('returns a string formatted in US style (1,234.5) by default', function () {
    const num = 1234.5

    expect(numberToLocaleStringWorklet(num)).toBe('1,234.50')
    expect(numberToLocaleStringWorklet(num, 'es' as Language)).toBe('1,234.50')
    expect(numberToLocaleStringWorklet(num, 'AU' as Language)).toBe('1,234.50')
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
        style,
        currency,
      })
    ).toBe('$1,234.56')

    expect(
      numberToLocaleStringWorklet(negative_num, 'en-US', {
        style,
        currency,
      })
    ).toBe('-$1,234.56')

    expect(
      numberToLocaleStringWorklet(num, 'de-DE', {
        style,
        currency,
      })
    ).toBe('1.234,56 $')

    expect(
      numberToLocaleStringWorklet(num, 'hu', {
        style,
        currency: 'huf',
      })
    ).toBe('1\u00A0234,56 Ft')

    expect(
      numberToLocaleStringWorklet(num, 'hu-HU', {
        style,
        currency: 'huf',
      })
    ).toBe('1\u00A0234,56 Ft')

    expect(
      numberToLocaleStringWorklet(num, 'da-DK', {
        style,
        currency: 'DKK',
      })
    ).toBe('1.234,56 kr')

    expect(
      numberToLocaleStringWorklet(num, 'nb-NO', {
        style,
        currency: 'NOK',
      })
    ).toBe('1\u00A0234,56 kr')
  })

  it('format percentages with rounding and zero padding', function () {
    const num = -1234.56

    expect(numberToPercentWorklet(num, { precision: 0, absolute: true })).toBe('1235%')
    expect(numberToPercentWorklet(num, { precision: 1, absolute: true })).toBe('1234.6%')
    expect(numberToPercentWorklet(num, { precision: 2, absolute: true })).toBe('1234.56%')
    expect(numberToPercentWorklet(num, { precision: 3, absolute: true })).toBe('1234.560%')
    expect(numberToPercentWorklet(num, { precision: 4, absolute: true })).toBe('1234.5600%')
    expect(numberToPercentWorklet(num, { precision: 4, absolute: false })).toBe('-1234.5600%')
  })

  it('format zero value percentages with zero padding', function () {
    expect(numberToPercentWorklet(0, { precision: 0, absolute: true })).toBe('0%')
    expect(numberToPercentWorklet(0, { precision: 1, absolute: true })).toBe('0.0%')
    expect(numberToPercentWorklet(0, { precision: 2, absolute: true })).toBe('0.00%')
    expect(numberToPercentWorklet(0.001, { precision: 2, absolute: true })).toBe('0.00%')
  })

  it('format integer values with zero padding', function () {
    const intNum = -10

    expect(numberToPercentWorklet(intNum, { precision: 0, absolute: true })).toBe('10%')
    expect(numberToPercentWorklet(intNum, { precision: 1, absolute: true })).toBe('10.0%')
    expect(numberToPercentWorklet(intNum, { precision: 2, absolute: true })).toBe('10.00%')
  })
})
