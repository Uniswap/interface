import { Currency, CurrencyAmount, Fraction } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import formatLocaleNumber from 'lib/utils/formatLocaleNumber'
import { DEFAULT_LOCALE, Locale } from 'uniswap/src/features/language/constants'

export function formatCurrencyAmount(
  amount: CurrencyAmount<Currency> | undefined,
  sigFigs: number,
  locale: Locale = DEFAULT_LOCALE,
  fixedDecimals?: number,
): string {
  if (!amount) {
    return '-'
  }

  if (JSBI.equal(amount.quotient, JSBI.BigInt(0))) {
    return '0'
  }

  if (amount.divide(amount.decimalScale).lessThan(new Fraction(1, 100000))) {
    return `<${formatLocaleNumber({ number: 0.00001, locale })}`
  }

  return formatLocaleNumber({ number: amount, locale, sigFigs, fixedDecimals })
}
