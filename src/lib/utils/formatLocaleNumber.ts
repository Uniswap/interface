import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'

interface FormatLocaleNumberArgs {
  number: CurrencyAmount<Currency> | Price<Currency, Currency> | number
  locale: string | null | undefined
  options?: Intl.NumberFormatOptions
  sigFigs?: number
}

export default function formatLocaleNumber({ number, locale, sigFigs, options = {} }: FormatLocaleNumberArgs): string {
  let localeArg: string | string[]
  if (!locale || (locale && !SUPPORTED_LOCALES.includes(locale))) {
    localeArg = DEFAULT_LOCALE
  } else {
    localeArg = [locale, DEFAULT_LOCALE]
  }
  options.maximumSignificantDigits = options.maximumSignificantDigits || sigFigs
  if (typeof number === 'number') {
    return number.toLocaleString(localeArg, options)
  } else {
    return parseFloat(number.toSignificant(sigFigs)).toLocaleString(localeArg, options)
  }
}
