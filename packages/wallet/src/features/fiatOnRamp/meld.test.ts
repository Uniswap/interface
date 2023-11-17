import { getCountryFlagSvgUrl } from './meld'

describe('getCountryFlagSvgUrl', () => {
  test('should return the correct SVG URL for a given country code', () => {
    const countryCode = 'us'
    const expectedUrl = 'https://images-country.meld.io/us/flag.svg'
    const result = getCountryFlagSvgUrl(countryCode)
    expect(result).toBe(expectedUrl)
  })
})
