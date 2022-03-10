import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useMemo } from 'react'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'
import { getPriceImpactWarning } from 'utils/prices'

/**
 * Computes input/output USDC equivalents and the price impact.
 * Returns the price impact as a human readable string.
 */
export default function useUSDCPriceImpact(
  inputAmount: CurrencyAmount<Currency> | undefined,
  outputAmount: CurrencyAmount<Currency> | undefined
): {
  inputUSDC?: CurrencyAmount<Token>
  outputUSDC?: CurrencyAmount<Token>
  priceImpact?: string
  priceImpactWarning?: 'warning' | 'error'
} {
  const inputUSDC = useUSDCValue(inputAmount) ?? undefined
  const outputUSDC = useUSDCValue(outputAmount) ?? undefined
  return useMemo(() => {
    const priceImpact = computeFiatValuePriceImpact(inputUSDC, outputUSDC)
    const priceImpactWarning = getPriceImpactWarning(priceImpact)
    return {
      inputUSDC,
      outputUSDC,
      priceImpact: priceImpact && toHumanReadablePriceImpact(priceImpact),
      priceImpactWarning,
    }
  }, [inputUSDC, outputUSDC])
}

function toHumanReadablePriceImpact(priceImpact: Percent): string {
  const sign = priceImpact.lessThan(0) ? '+' : ''
  const number = parseFloat(priceImpact.multiply(-1)?.toSignificant(3))
  return `${sign}${number}%`
}
