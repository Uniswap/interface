import { CurrencyAmount, Percent, _10000, JSBI, currencyEquals, ZERO } from '@swapr/sdk'

const ONE_HUNDRED_PERCENT = new Percent(_10000, _10000)

/**
 * Calculates the difference between fiat value ouput and input in percentage terms.
 * @param {CurrencyAmount} fiatValueInput
 * @param {CurrencyAmount} fiatValueOutput
 * @returns {Percent}
 */
export function computeFiatValuePriceImpact(
  fiatValueInput: CurrencyAmount | undefined | null,
  fiatValueOutput: CurrencyAmount | undefined | null
): Percent | undefined {
  if (
    !fiatValueOutput ||
    !fiatValueInput ||
    !currencyEquals(fiatValueInput.currency, fiatValueOutput.currency) ||
    JSBI.equal(fiatValueInput.quotient, ZERO)
  )
    return undefined

  const pct = ONE_HUNDRED_PERCENT.subtract(fiatValueOutput.divide(fiatValueInput))
  return new Percent(pct.numerator, pct.denominator)
}
