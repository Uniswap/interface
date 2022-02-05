import { BigintIsh } from '@uniswap/sdk-core'
import { SupportedLocale } from 'constants/locales'

interface FormatLocaleNumberArgs {
  number: BigintIsh
  locale: SupportedLocale | null | undefined
  options?: Intl.NumberFormatOptions
}

export default function formatLocaleNumber({ number, locale, options }: FormatLocaleNumberArgs): string {
  return number.toLocaleString(locale ? [locale, 'en-US'] : 'en-US', options)
}
