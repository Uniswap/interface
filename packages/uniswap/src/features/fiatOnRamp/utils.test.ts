import { FORFilters, FORQuote, FORServiceProvider, InitialQuoteSelection } from 'uniswap/src/features/fiatOnRamp/types'
import {
  filterQuotesByPaymentMethod,
  getCountryFlagSvgUrl,
  isFiatOnRampApiError,
  isInvalidRequestAmountTooHigh,
  isInvalidRequestAmountTooLow,
  organizeQuotesIntoSections,
} from 'uniswap/src/features/fiatOnRamp/utils'

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

interface CreateMockQuoteParams {
  paymentMethods: string[]
  destinationAmount?: number
  isMostRecent?: boolean
}

const createMockQuote = ({
  paymentMethods,
  destinationAmount = 100,
  isMostRecent = false,
}: CreateMockQuoteParams): FORQuote => ({
  countryCode: 'US',
  sourceAmount: 100,
  sourceCurrencyCode: 'USD',
  destinationAmount,
  destinationCurrencyCode: 'ETH',
  serviceProviderDetails: {
    paymentMethods,
  } as unknown as FORServiceProvider,
  totalFee: 5,
  isMostRecentlyUsedProvider: isMostRecent,
})

describe('filterQuotesByPaymentMethod', () => {
  const applePayQuote = createMockQuote({ paymentMethods: ['Apple Pay', 'Credit Card'] })
  const googlePayQuote = createMockQuote({ paymentMethods: ['Google Pay', 'Debit Card'] })
  const achQuote = createMockQuote({ paymentMethods: ['ACH', 'Wire Transfer'] })
  const sameDayAchQuote = createMockQuote({ paymentMethods: ['Same Day ACH', 'Credit Card'] })
  const debitQuote = createMockQuote({ paymentMethods: ['Payout via Debit Card', 'Credit Card'] })
  const paypalQuote = createMockQuote({ paymentMethods: ['PayPal', 'Venmo'] })
  const venmoQuote = createMockQuote({ paymentMethods: ['Venmo', 'Credit Card'] })
  const mixedQuote = createMockQuote({ paymentMethods: ['Apple Pay', 'ACH', 'PayPal'] })

  const allQuotes = [
    applePayQuote,
    googlePayQuote,
    achQuote,
    sameDayAchQuote,
    debitQuote,
    paypalQuote,
    venmoQuote,
    mixedQuote,
  ]

  test('returns all quotes when no filter is provided', () => {
    const result = filterQuotesByPaymentMethod(allQuotes, undefined)
    expect(result).toBe(allQuotes)
  })

  test('returns null when quotes is null', () => {
    const result = filterQuotesByPaymentMethod(null, FORFilters.ApplePay)
    expect(result).toBe(null)
  })

  test('returns undefined when quotes is undefined', () => {
    const result = filterQuotesByPaymentMethod(undefined, FORFilters.ApplePay)
    expect(result).toBe(undefined)
  })

  test('filters by Apple Pay', () => {
    const result = filterQuotesByPaymentMethod(allQuotes, FORFilters.ApplePay)
    expect(result).toHaveLength(2)
    expect(result).toContain(applePayQuote)
    expect(result).toContain(mixedQuote)
  })

  test('filters by Google Pay', () => {
    const result = filterQuotesByPaymentMethod(allQuotes, FORFilters.GooglePay)
    expect(result).toHaveLength(1)
    expect(result).toContain(googlePayQuote)
  })

  test('filters by Bank (includes ACH and Same Day ACH)', () => {
    const result = filterQuotesByPaymentMethod(allQuotes, FORFilters.Bank)
    expect(result).toHaveLength(3)
    expect(result).toContain(achQuote)
    expect(result).toContain(sameDayAchQuote)
    expect(result).toContain(mixedQuote)
  })

  test('filters by Debit', () => {
    const result = filterQuotesByPaymentMethod(allQuotes, FORFilters.Debit)
    expect(result).toHaveLength(2)
    expect(result).toContain(googlePayQuote)
    expect(result).toContain(debitQuote)
  })

  test('filters by PayPal', () => {
    const result = filterQuotesByPaymentMethod(allQuotes, FORFilters.PayPal)
    expect(result).toHaveLength(2)
    expect(result).toContain(paypalQuote)
    expect(result).toContain(mixedQuote)
  })

  test('filters by Venmo', () => {
    const result = filterQuotesByPaymentMethod(allQuotes, FORFilters.Venmo)
    expect(result).toHaveLength(2)
    expect(result).toContain(paypalQuote)
    expect(result).toContain(venmoQuote)
  })

  test('returns empty array when no quotes match the filter', () => {
    const quotesWithoutApplePay = [googlePayQuote, achQuote, debitQuote]
    const result = filterQuotesByPaymentMethod(quotesWithoutApplePay, FORFilters.ApplePay)
    expect(result).toHaveLength(0)
  })

  test('handles quotes with unmapped payment methods', () => {
    const unknownPaymentQuote = createMockQuote({ paymentMethods: ['Unknown Payment Method'] })
    const result = filterQuotesByPaymentMethod([unknownPaymentQuote], FORFilters.ApplePay)
    expect(result).toHaveLength(0)
  })

  test('handles empty quotes array', () => {
    const result = filterQuotesByPaymentMethod([], FORFilters.ApplePay)
    expect(result).toHaveLength(0)
  })
})

describe('organizeQuotesIntoSections', () => {
  test('returns undefined when quotes is null', () => {
    const result = organizeQuotesIntoSections(null)
    expect(result).toBeUndefined()
  })

  test('returns undefined when quotes is undefined', () => {
    const result = organizeQuotesIntoSections(undefined)
    expect(result).toBeUndefined()
  })

  test('returns undefined when quotes is empty', () => {
    const result = organizeQuotesIntoSections([])
    expect(result).toBeUndefined()
  })

  test('organizes quotes with most recent provider first', () => {
    const regularQuote1 = createMockQuote({ paymentMethods: ['Apple Pay'], destinationAmount: 80, isMostRecent: false })
    const regularQuote2 = createMockQuote({
      paymentMethods: ['Google Pay'],
      destinationAmount: 90,
      isMostRecent: false,
    })
    const mostRecentQuote = createMockQuote({ paymentMethods: ['ACH'], destinationAmount: 100, isMostRecent: true })
    const quotes = [regularQuote1, regularQuote2, mostRecentQuote]

    const result = organizeQuotesIntoSections(quotes)

    expect(result).toBeDefined()
    if (result) {
      expect(result.initialQuote).toBe(mostRecentQuote)
      expect(result.sections).toHaveLength(2)

      // First section should have the most recent quote
      expect(result.sections[0]?.data).toEqual([mostRecentQuote])
      expect(result.sections[0]?.type).toBe(InitialQuoteSelection.MostRecent)

      // Second section should have other quotes
      expect(result.sections[1]?.data).toEqual([regularQuote1, regularQuote2])
      expect(result.sections[1]?.type).toBeUndefined()
    }
  })

  test('organizes quotes by best quote when no most recent provider', () => {
    const lowerQuote = createMockQuote({ paymentMethods: ['Apple Pay'], destinationAmount: 80, isMostRecent: false })
    const bestQuote = createMockQuote({ paymentMethods: ['Google Pay'], destinationAmount: 120, isMostRecent: false })
    const midQuote = createMockQuote({ paymentMethods: ['ACH'], destinationAmount: 100, isMostRecent: false })
    const quotes = [lowerQuote, bestQuote, midQuote]

    const result = organizeQuotesIntoSections(quotes)

    expect(result).toBeDefined()
    if (result) {
      expect(result.initialQuote).toBe(bestQuote)
      expect(result.sections).toHaveLength(1)

      // Single section with all quotes and Best type
      expect(result.sections[0]?.data).toEqual(quotes)
      expect(result.sections[0]?.type).toBe(InitialQuoteSelection.Best)
    }
  })

  test('handles single quote', () => {
    const singleQuote = createMockQuote({ paymentMethods: ['Apple Pay'], destinationAmount: 100, isMostRecent: false })
    const quotes = [singleQuote]

    const result = organizeQuotesIntoSections(quotes)

    expect(result).toBeDefined()
    if (result) {
      expect(result.initialQuote).toBe(singleQuote)
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0]?.data).toEqual([singleQuote])
      expect(result.sections[0]?.type).toBe(InitialQuoteSelection.Best)
    }
  })

  test('handles single most recent quote', () => {
    const mostRecentQuote = createMockQuote({
      paymentMethods: ['Apple Pay'],
      destinationAmount: 100,
      isMostRecent: true,
    })
    const quotes = [mostRecentQuote]

    const result = organizeQuotesIntoSections(quotes)

    expect(result).toBeDefined()
    if (result) {
      expect(result.initialQuote).toBe(mostRecentQuote)
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0]?.data).toEqual([mostRecentQuote])
      expect(result.sections[0]?.type).toBe(InitialQuoteSelection.MostRecent)
    }
  })

  test('handles most recent quote with no other quotes', () => {
    const mostRecentQuote = createMockQuote({
      paymentMethods: ['Apple Pay'],
      destinationAmount: 100,
      isMostRecent: true,
    })
    const quotes = [mostRecentQuote]

    const result = organizeQuotesIntoSections(quotes)

    expect(result).toBeDefined()
    if (result) {
      expect(result.initialQuote).toBe(mostRecentQuote)
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0]?.data).toEqual([mostRecentQuote])
      expect(result.sections[0]?.type).toBe(InitialQuoteSelection.MostRecent)
    }
  })

  test('selects best quote correctly when multiple quotes have same amount', () => {
    const quote1 = createMockQuote({ paymentMethods: ['Apple Pay'], destinationAmount: 100, isMostRecent: false })
    const quote2 = createMockQuote({ paymentMethods: ['Google Pay'], destinationAmount: 100, isMostRecent: false })
    const quote3 = createMockQuote({ paymentMethods: ['ACH'], destinationAmount: 100, isMostRecent: false })
    const quotes = [quote1, quote2, quote3]

    const result = organizeQuotesIntoSections(quotes)

    expect(result).toBeDefined()
    if (result) {
      expect(result.initialQuote).toBe(quote1) // Should be the first one when amounts are equal
      expect(result.sections).toHaveLength(1)
      expect(result.sections[0]?.data).toEqual(quotes)
      expect(result.sections[0]?.type).toBe(InitialQuoteSelection.Best)
    }
  })

  test('handles quotes with multiple most recent providers (should pick first one)', () => {
    const mostRecentQuote1 = createMockQuote({
      paymentMethods: ['Apple Pay'],
      destinationAmount: 80,
      isMostRecent: true,
    })
    const mostRecentQuote2 = createMockQuote({
      paymentMethods: ['Google Pay'],
      destinationAmount: 90,
      isMostRecent: true,
    })
    const regularQuote = createMockQuote({ paymentMethods: ['ACH'], destinationAmount: 100, isMostRecent: false })
    const quotes = [mostRecentQuote1, mostRecentQuote2, regularQuote]

    const result = organizeQuotesIntoSections(quotes)

    expect(result).toBeDefined()
    if (result) {
      expect(result.initialQuote).toBe(mostRecentQuote1) // Should pick the first most recent
      expect(result.sections).toHaveLength(2)
      expect(result.sections[0]?.data).toEqual([mostRecentQuote1])
      expect(result.sections[0]?.type).toBe(InitialQuoteSelection.MostRecent)
      expect(result.sections[1]?.data).toEqual([mostRecentQuote2, regularQuote])
    }
  })
})
