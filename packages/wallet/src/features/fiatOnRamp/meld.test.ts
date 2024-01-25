import { mockLocalizedFormatter } from 'wallet/src/test/utils'
import { extractCurrencyAmountFromError, getCountryFlagSvgUrl, isMeldApiError } from './meld'

describe('getCountryFlagSvgUrl', () => {
  test('should return the correct SVG URL for a given country code', () => {
    const countryCode = 'us'
    const expectedUrl = 'https://images-country.meld.io/us/flag.svg'
    const result = getCountryFlagSvgUrl(countryCode)
    expect(result).toBe(expectedUrl)
  })
})

describe('extractCurrencyAmountFromError', () => {
  test('extracts amount too low error', () => {
    // USD currency
    const errorStringUsd = 'Source amount is below the minimum allowed, which is 50.00 USD'
    const resultUsd = extractCurrencyAmountFromError(
      errorStringUsd,
      mockLocalizedFormatter.formatNumberOrString
    )
    expect(resultUsd).toEqual('$50.00')

    // Not USD currency
    const errorStringEur = 'Source amount is below the minimum allowed, which is 50.00 EUR'
    const resultEur = extractCurrencyAmountFromError(
      errorStringEur,
      mockLocalizedFormatter.formatNumberOrString
    )
    expect(resultEur).toEqual('€50.00')
  })

  test('extracts amount too high error', () => {
    // USD currency
    const errorStringUsd = 'Source amount is above the maximum allowed, which is 50.00 USD'
    const resultUsd = extractCurrencyAmountFromError(
      errorStringUsd,
      mockLocalizedFormatter.formatNumberOrString
    )
    expect(resultUsd).toEqual('$50.00')

    // Not USD currency
    const errorStringEur = 'Source amount is above the maximum allowed, which is 50.00 EUR'
    const resultEur = extractCurrencyAmountFromError(
      errorStringEur,
      mockLocalizedFormatter.formatNumberOrString
    )
    expect(resultEur).toEqual('€50.00')
  })

  test('extracts nothing', () => {
    const errorString = 'Test'
    const result = extractCurrencyAmountFromError(
      errorString,
      mockLocalizedFormatter.formatNumberOrString
    )
    expect(result).toEqual(undefined)
  })
})

describe('isMeldApiError', () => {
  test('returns true', () => {
    const error = {
      data: {
        code: 'INVALID_AMOUNT_TOO_LOW',
        message: 'Source amount is below the minimum allowed, which is 50.00 USD',
      },
    }
    const result = isMeldApiError(error)
    expect(result).toBe(true)
  })

  test('returns false', () => {
    const error = {
      data: {
        message: 'Source amount is below the minimum allowed, which is 50.00 USD',
      },
    }
    const result = isMeldApiError(error)
    expect(result).toBe(false)
  })
})
