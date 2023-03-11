import { Percent } from '@uniswap/sdk-core'

export function computeFiatValuePriceImpact(
  fiatValueInput: number | undefined | null,
  fiatValueOutput: number | undefined | null
): Percent | undefined {
  if (!fiatValueOutput || !fiatValueInput) return undefined
  if (fiatValueInput === 0) return undefined

  console.log('fiatValueOutput', fiatValueOutput, fiatValueInput)
  const ratio = 1 - fiatValueOutput / fiatValueInput
  const numerator = Math.floor(ratio * 10000)
  return new Percent(numerator, 10000)
}
