import { FORLogo } from './types'

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
      typeof e.data.errorName === 'string' &&
      typeof e.data.message === 'string'
    )
  }
  return false
}

export function getServiceProviderLogo(
  logos: FORLogo | undefined,
  isDarkMode: boolean
): string | undefined {
  if (!logos) {
    return
  }

  return isDarkMode ? logos.darkLogo : logos.lightLogo
}
