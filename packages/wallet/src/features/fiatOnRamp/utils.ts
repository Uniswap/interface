import { isAndroid, isIOS } from 'uniswap/src/utils/platform'
import { FORLogo } from './types'

const APPLE_PAY = 'Apple Pay'
const GOOGLE_PAY = 'Google Pay'

export interface FORApiError {
  data: {
    statusCode: number
    errorName: string
    message: string
    context: object | undefined
  }
}

export interface InvalidRequestAmountTooLow extends FORApiError {
  data: FORApiError['data'] & {
    statusCode: 400
    errorName: 'InvalidRequestAmountTooLow'
    context: {
      minimumAllowed: number
    }
  }
}

export function isInvalidRequestAmountTooLow(
  error: FORApiError
): error is InvalidRequestAmountTooLow {
  const e = error as InvalidRequestAmountTooLow
  return (
    e.data.statusCode === 400 &&
    e.data.errorName === 'InvalidRequestAmountTooLow' &&
    typeof e.data.context?.minimumAllowed === 'number'
  )
}

export interface InvalidRequestAmountTooHigh extends FORApiError {
  data: FORApiError['data'] & {
    statusCode: 400
    errorName: 'InvalidRequestAmountTooHigh'
    context: {
      maximumAllowed: number
    }
  }
}

export function isInvalidRequestAmountTooHigh(
  error: FORApiError
): error is InvalidRequestAmountTooHigh {
  const e = error as InvalidRequestAmountTooHigh
  return (
    e.data.statusCode === 400 &&
    e.data.errorName === 'InvalidRequestAmountTooHigh' &&
    typeof e.data.context?.maximumAllowed === 'number'
  )
}

export interface NoQuotesError extends FORApiError {
  data: FORApiError['data'] & {
    statusCode: 400
    errorName: 'NoQuotes'
  }
}

export function isNoQuotesError(error: FORApiError): error is InvalidRequestAmountTooHigh {
  const e = error as NoQuotesError
  return e.data.statusCode === 400 && e.data.errorName === 'NoQuotes'
}

export function getCountryFlagSvgUrl(countryCode: string): string {
  return `https://images-country.meld.io/${countryCode}/flag.svg`
}

export function isFiatOnRampApiError(error: unknown): error is FORApiError {
  if (typeof error === 'object' && error !== null) {
    const e = error as FORApiError
    return (
      typeof e.data === 'object' &&
      e.data !== null &&
      typeof e.data.statusCode === 'number' &&
      typeof e.data.errorName === 'string'
    )
  }
  return false
}

export function getOptionalServiceProviderLogo(
  logos: FORLogo | undefined,
  isDarkMode: boolean
): string | undefined {
  return isDarkMode ? logos?.darkLogo : logos?.lightLogo
}

export function getServiceProviderLogo(logos: FORLogo, isDarkMode: boolean): string {
  return isDarkMode ? logos.darkLogo : logos.lightLogo
}

export function transformPaymentMethods(paymentMethods: string[]): string[] {
  return paymentMethods.filter(
    (pm) => !(pm === APPLE_PAY && isAndroid) && !(pm === GOOGLE_PAY && isIOS)
  )
}
