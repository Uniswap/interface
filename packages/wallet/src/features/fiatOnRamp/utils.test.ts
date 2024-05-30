import {
  getCountryFlagSvgUrl,
  isFiatOnRampApiError,
  isInvalidRequestAmountTooHigh,
  isInvalidRequestAmountTooLow,
} from './utils'

describe('getCountryFlagSvgUrl', () => {
  test('should return the correct SVG URL for a given country code', () => {
    const countryCode = 'us'
    const expectedUrl = 'https://images-country.meld.io/us/flag.svg'
    const result = getCountryFlagSvgUrl(countryCode)
    expect(result).toBe(expectedUrl)
  })
})

describe('isFiatOnRampApiError', () => {
  test('returns true', () => {
    const error = {
      data: {
        statusCode: 400,
        errorName: 'InvalidRequestAmountTooLow',
        message: 'Source amount is below the minimum allowed, which is 50.00 USD',
      },
    }
    const result = isFiatOnRampApiError(error)
    expect(result).toBe(true)
  })

  test('returns false', () => {
    const error = {
      data: {
        message: 'Source amount is below the minimum allowed, which is 50.00 USD',
      },
    }
    const result = isFiatOnRampApiError(error)
    expect(result).toBe(false)
  })
})

describe('isInvalidRequestAmountTooHigh', () => {
  test('returns true', () => {
    const error = {
      data: {
        statusCode: 400,
        errorName: 'InvalidRequestAmountTooHigh',
        message: 'Source amount is above the maximum allowed, which is 50000.00 USD',
        context: {
          maximumAllowed: 50000,
        },
      },
    }
    const result = isInvalidRequestAmountTooHigh(error)
    expect(result).toBe(true)
  })

  test('returns false when context has unexpected type', () => {
    const error = {
      data: {
        statusCode: 400,
        errorName: 'InvalidRequestAmountTooHigh',
        message: 'Source amount is above the maximum allowed, which is 50000.00 USD',
        context: {
          randomProperty: 50000,
        },
      },
    }
    const result = isInvalidRequestAmountTooHigh(error)
    expect(result).toBe(false)
  })

  test('returns false when statusCode is not 400', () => {
    const error = {
      data: {
        statusCode: 404,
        errorName: 'InvalidRequestAmountTooHigh',
        message: 'Source amount is above the maximum allowed, which is 50000.00 USD',
        context: {
          maximumAllowed: 50000,
        },
      },
    }
    const result = isInvalidRequestAmountTooHigh(error)
    expect(result).toBe(false)
  })

  test('returns false when errorName is not InvalidRequestAmountTooHigh', () => {
    const error = {
      data: {
        statusCode: 400,
        errorName: 'InvalidRequestAmountTooBig',
        message: 'Source amount is above the maximum allowed, which is 50000.00 USD',
        context: {
          maximumAllowed: 50000,
        },
      },
    }
    const result = isInvalidRequestAmountTooHigh(error)
    expect(result).toBe(false)
  })
})

describe('isInvalidRequestAmountTooLow', () => {
  test('returns true', () => {
    const error = {
      data: {
        statusCode: 400,
        errorName: 'InvalidRequestAmountTooLow',
        message: 'Source amount is below the minimum allowed, which is 50.00 USD',
        context: {
          minimumAllowed: 50,
        },
      },
    }
    const result = isInvalidRequestAmountTooLow(error)
    expect(result).toBe(true)
  })

  test('returns false when context has unexpected type', () => {
    const error = {
      data: {
        statusCode: 400,
        errorName: 'InvalidRequestAmountTooLow',
        message: 'Source amount is below the minimum allowed, which is 50.00 USD',
        context: {
          randomProperty: 50,
        },
      },
    }
    const result = isInvalidRequestAmountTooLow(error)
    expect(result).toBe(false)
  })

  test('returns false when statusCode is not 400', () => {
    const error = {
      data: {
        statusCode: 404,
        errorName: 'InvalidRequestAmountTooLow',
        message: 'Source amount is below the minimum allowed, which is 50.00 USD',
        context: {
          minimumAllowed: 50,
        },
      },
    }
    const result = isInvalidRequestAmountTooLow(error)
    expect(result).toBe(false)
  })

  test('returns false when errorName is not InvalidRequestAmountTooLow', () => {
    const error = {
      data: {
        statusCode: 400,
        errorName: 'InvalidRequestAmountTooSmall',
        message: 'Source amount is below the minimum allowed, which is 50.00 USD',
        context: {
          minimumAllowed: 50,
        },
      },
    }
    const result = isInvalidRequestAmountTooLow(error)
    expect(result).toBe(false)
  })
})
