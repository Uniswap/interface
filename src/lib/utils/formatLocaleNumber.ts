import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { SupportedLocale } from 'constants/locales'

interface FormatLocaleNumberArgs {
  number: CurrencyAmount<Currency> | Price<Currency, Currency> | number
  locale: SupportedLocale | null | undefined
  options?: Intl.NumberFormatOptions
  sigFigs?: number
}

export default function formatLocaleNumber({ number, locale, sigFigs, options = {} }: FormatLocaleNumberArgs): string {
  if (typeof number === 'number') {
    return number.toLocaleString(locale ? [locale, 'en-US'] : 'en-US', options)
  } else {
    return parseFloat(number.toSignificant(sigFigs)).toLocaleString(locale ? [locale, 'en-US'] : 'en-US', options)
  }
}
