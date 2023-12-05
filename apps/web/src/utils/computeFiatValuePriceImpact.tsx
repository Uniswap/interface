import { Percent } from '@uniswap/sdk-core'
import { BIPS_BASE } from 'constants/misc'

export function computeFiatValuePriceImpact(
  fiatValueInput: number | undefined | null,
  fiatValueOutput: number | undefined | null
): Percent | undefined {
  if (!fiatValueOutput || !fiatValueInput) return undefined
  if (fiatValueInput === 0) return undefined

  const ratio = 1 - fiatValueOutput / fiatValueInput
  const numerator = Math.floor(ratio * BIPS_BASE)
  return new Percent(numerator, BIPS_BASE)
}
