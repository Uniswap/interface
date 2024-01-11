import { getCountryFlagSvgUrl, isMeldApiError } from './meld'

describe('getCountryFlagSvgUrl', () => {
  test('should return the correct SVG URL for a given country code', () => {
    const countryCode = 'us'
    const expectedUrl = 'https://images-country.meld.io/us/flag.svg'
    const result = getCountryFlagSvgUrl(countryCode)
    expect(result).toBe(expectedUrl)
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
