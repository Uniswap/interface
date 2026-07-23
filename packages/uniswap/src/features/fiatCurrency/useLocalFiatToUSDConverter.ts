import { useCallback } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

/**
 * Hook to convert local fiat currency amount to USD amount
 * @returns USD amount
 */
export const useLocalFiatToUSDConverter = (): ((fiatAmount: number) => number | undefined) => {
  const { convertFiatAmount } = useLocalizationContext()
  return useCallback(
    (fiatAmount: number): number | undefined => {
      const { amount: USDInLocalCurrency } = convertFiatAmount(1)
      return USDInLocalCurrency ? fiatAmount / USDInLocalCurrency : undefined
    },
    [convertFiatAmount],
  )
}
