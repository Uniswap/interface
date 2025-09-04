import type { SectionListData } from 'react-native'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import {
  FiatOnRampCurrency,
  FORCurrencyOrBalance,
  FORFilters,
  FORFiltersMap,
  FORLogo,
  FORQuote,
  InitialQuoteSelection,
} from 'uniswap/src/features/fiatOnRamp/types'
import { isAndroid, isIOS } from 'utilities/src/platform'
import { v4 as uuid } from 'uuid'

const APPLE_PAY = 'Apple Pay'
const GOOGLE_PAY = 'Google Pay'

export function transformPaymentMethods(paymentMethods: string[]): string[] {
  return paymentMethods.filter((pm) => !(pm === APPLE_PAY && isAndroid) && !(pm === GOOGLE_PAY && isIOS))
}

export function getCountryFlagSvgUrl(countryCode: string): string {
  return `https://images-country.meld.io/${countryCode}/flag.svg`
}

export interface FORApiError {
  data: {
    statusCode: number
    errorName: string
    message: string
    context: object | undefined | string
  }
}

export interface InvalidRequestAmountTooLow extends FORApiError {
  data: FORApiError['data'] & {
    statusCode: 400
    errorName: 'InvalidRequestAmountTooLow'
    context: {
      minimumAllowed: number
      unit?: 'token' | 'fiat'
    }
  }
}

export interface BadRequest extends FORApiError {
  data: FORApiError['data'] & {
    statusCode: 400
    errorName: 'BadRequest'
    context: string
  }
}

export function isBadRequestAmountTooLow(error: FORApiError): error is BadRequest {
  const e = error
  return (
    e.data.statusCode === 400 &&
    e.data.errorName === 'BadRequest' &&
    typeof e.data.context === 'string' &&
    e.data.context.includes('Source amount is below the minimum allowed')
  )
}

export function isBadRequestAmountTooHigh(error: FORApiError): error is BadRequest {
  const e = error
  return (
    e.data.statusCode === 400 &&
    e.data.errorName === 'BadRequest' &&
    typeof e.data.context === 'string' &&
    e.data.context.includes('Source amount is above the maximum allowed')
  )
}

export function isInvalidRequestAmountTooLow(error: FORApiError): error is InvalidRequestAmountTooLow {
  const e = error
  return (
    e.data.statusCode === 400 &&
    e.data.errorName === 'InvalidRequestAmountTooLow' &&
    typeof (e as InvalidRequestAmountTooLow).data.context.minimumAllowed === 'number'
  )
}

export interface InvalidRequestAmountTooHigh extends FORApiError {
  data: FORApiError['data'] & {
    statusCode: 400
    errorName: 'InvalidRequestAmountTooHigh'
    context: {
      maximumAllowed: number
      unit?: 'token' | 'fiat'
    }
  }
}

export function isInvalidRequestAmountTooHigh(error: FORApiError): error is InvalidRequestAmountTooHigh {
  const e = error
  return (
    e.data.statusCode === 400 &&
    e.data.errorName === 'InvalidRequestAmountTooHigh' &&
    typeof (e as InvalidRequestAmountTooHigh).data.context.maximumAllowed === 'number'
  )
}

export interface NoQuotesError extends FORApiError {
  data: FORApiError['data'] & {
    statusCode: 400
    errorName: 'NoQuotes'
  }
}

export function isNoQuotesError(error: FORApiError): error is InvalidRequestAmountTooHigh {
  const e = error
  return e.data.statusCode === 400 && e.data.errorName === 'NoQuotes'
}

export function isFiatOnRampApiError(error: unknown): error is FORApiError {
  if (typeof error === 'object' && error !== null) {
    const e = error as FORApiError
    return (
      typeof e.data === 'object' &&
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      e.data !== null &&
      typeof e.data.statusCode === 'number' &&
      typeof e.data.errorName === 'string'
    )
  }
  return false
}

export function getOptionalServiceProviderLogo(logos: FORLogo | undefined, isDarkMode: boolean): string | undefined {
  return isDarkMode ? logos?.darkLogo : logos?.lightLogo
}

export function getServiceProviderLogo(logos: FORLogo, isDarkMode: boolean): string {
  return isDarkMode ? logos.darkLogo : logos.lightLogo
}

export function createOnRampTransactionId(serviceProvider?: string, idSuffix?: string): string {
  const id = idSuffix ? `${uuid().split('-')[0]}-${idSuffix}` : uuid()
  // The backend expects MoonPay transactions to have the MOONPAY prefix.
  return `${serviceProvider?.toUpperCase() === 'MOONPAY' ? 'MOONPAY' : ''}${id}`
}

export function selectInitialQuote(quotes: FORQuote[] | undefined): {
  quote: FORQuote | undefined
  type: InitialQuoteSelection | undefined
} {
  const quoteFromLastUsedProvider = quotes?.find((q) => q.isMostRecentlyUsedProvider)
  if (quoteFromLastUsedProvider) {
    return {
      quote: quoteFromLastUsedProvider,
      type: InitialQuoteSelection.MostRecent,
    }
  }

  const bestQuote = quotes && quotes.length && quotes[0]
  if (bestQuote) {
    return {
      quote: quotes.reduce<FORQuote>((prev, curr) => {
        return curr.destinationAmount > prev.destinationAmount ? curr : prev
      }, bestQuote),
      type: InitialQuoteSelection.Best,
    }
  }
  return { quote: undefined, type: undefined }
}

export function isSupportedFORCurrency(currency: FORCurrencyOrBalance): currency is FiatOnRampCurrency {
  return (currency as FiatOnRampCurrency).meldCurrencyCode !== undefined
}

export function getUnsupportedFORTokensWithBalance(
  supportedCurrencies: FiatOnRampCurrency[],
  balancesById: Record<string, PortfolioBalance> | undefined,
): PortfolioBalance[] {
  const offRampCurrencyIds = supportedCurrencies.map((currency) => currency.currencyInfo?.currencyId)
  return Object.values(balancesById || {}).filter(
    (balance) => !offRampCurrencyIds.includes(balance.currencyInfo.currencyId),
  )
}

export function filterQuotesByPaymentMethod(quotes: Maybe<FORQuote[]>, paymentFilter?: FORFilters): Maybe<FORQuote[]> {
  if (!quotes || !paymentFilter) {
    return quotes
  }

  return quotes.filter((quote) => {
    return quote.serviceProviderDetails.paymentMethods.some((paymentMethod) => {
      const mappedFilter = FORFiltersMap[paymentMethod]
      return mappedFilter === paymentFilter
    })
  })
}

type OrganizedQuoteSections = {
  sections: SectionListData<FORQuote>[]
  initialQuote: FORQuote
}

export function organizeQuotesIntoSections(quotes: Maybe<FORQuote[]>): OrganizedQuoteSections | undefined {
  if (!quotes) {
    return undefined
  }

  const { quote, type } = selectInitialQuote(quotes)
  if (!quote) {
    return undefined
  }

  let sections: SectionListData<FORQuote>[]
  if (type === InitialQuoteSelection.MostRecent) {
    const otherQuotes = quotes.filter((item) => item !== quote)
    sections = [{ data: [quote], type }, ...(otherQuotes.length ? [{ data: otherQuotes }] : [])]
  } else {
    sections = [{ data: quotes, type }]
  }

  return { sections, initialQuote: quote }
}
