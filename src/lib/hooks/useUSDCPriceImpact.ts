import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { useMemo } from 'react'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'

export default function useUSDCPriceImpact(
  inputAmount: CurrencyAmount<Currency> | undefined,
  outputAmount: CurrencyAmount<Currency> | undefined
): {
  inputUSDC?: CurrencyAmount<Token>
  outputUSDC?: CurrencyAmount<Token>
  priceImpact?: Percent
} {
  const inputUSDC = useUSDCValue(inputAmount) ?? undefined
  const outputUSDC = useUSDCValue(outputAmount) ?? undefined
  return useMemo(() => {
    const priceImpact = computeFiatValuePriceImpact(inputUSDC, outputUSDC)
    return { inputUSDC, outputUSDC, priceImpact }
  }, [inputUSDC, outputUSDC])
}

export function toHumanReadablePriceImpact(priceImpact: Percent): string {
  const sign = priceImpact.lessThan(0) ? '+' : ''
  const number = parseFloat(priceImpact.multiply(-1)?.toSignificant(3))
  return `${sign}${number}%`
}
