import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'

interface FormatLocaleNumberArgs {
  number: CurrencyAmount<Currency> | Price<Currency, Currency> | number
  locale: string | null | undefined
  options?: Intl.NumberFormatOptions
  sigFigs?: number
}

export default function formatLocaleNumber({ number, locale, sigFigs, options = {} }: FormatLocaleNumberArgs): string {
  if (locale && !SUPPORTED_LOCALES.includes(locale)) {
    locale = DEFAULT_LOCALE
  }
  if (typeof number === 'number') {
    return number.toLocaleString(locale ? [locale, DEFAULT_LOCALE] : DEFAULT_LOCALE, options)
  } else {
    return parseFloat(number.toSignificant(sigFigs)).toLocaleString(
      locale ? [locale, DEFAULT_LOCALE] : DEFAULT_LOCALE,
      options
    )
  }
}
