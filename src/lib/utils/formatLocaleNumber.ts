import { BigintIsh } from '@uniswap/sdk-core'
import { SupportedLocale } from 'constants/locales'

export default function formatLocaleNumber(
  n: BigintIsh,
  locale: SupportedLocale | null | undefined,
  options: Intl.NumberFormatOptions | undefined
): string {
  return n.toLocaleString(locale ? [locale, 'en-US'] : 'en-US', options)
}
