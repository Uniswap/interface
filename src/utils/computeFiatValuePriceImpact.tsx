import { CurrencyAmount, currencyEquals, Percent } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { ONE_HUNDRED_PERCENT } from '../constants'

export function computeFiatValuePriceImpact(
  fiatValueInput: CurrencyAmount | undefined | null,
  fiatValueOutput: CurrencyAmount | undefined | null
): Percent | undefined {
  if (!fiatValueOutput || !fiatValueInput) return undefined
  if (!currencyEquals(fiatValueInput.currency, fiatValueOutput.currency)) return undefined
  if (JSBI.equal(fiatValueInput.raw, JSBI.BigInt(0))) return undefined
  const pct = ONE_HUNDRED_PERCENT.subtract(fiatValueOutput.divide(fiatValueInput))
  return new Percent(pct.numerator, pct.denominator)
}
