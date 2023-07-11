import { Percent } from '@thinkincoin-libs/sdk-core'

const PRECISION = 10000
export function computeFiatValuePriceImpact(
  fiatValueInput: number | undefined | null,
  fiatValueOutput: number | undefined | null
): Percent | undefined {
  if (!fiatValueOutput || !fiatValueInput) return undefined
  if (fiatValueInput === 0) return undefined

  const ratio = 1 - fiatValueOutput / fiatValueInput
  const numerator = Math.floor(ratio * PRECISION)
  return new Percent(numerator, PRECISION)
}
