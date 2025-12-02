import { useEffect, useState } from 'react'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'

// Hook for individual chain fee calculation
export function useChainFiatFee(params: {
  chainId: number
  gasFeeDisplayValue?: string
  onFetched?: (chainId: number, amount: number) => void
  onError?: (error: boolean) => void
}): void {
  const { chainId, gasFeeDisplayValue, onFetched, onError } = params
  const { convertFiatAmount } = useLocalizationContext()
  const [fiatAmount, setFiatAmount] = useState<number | undefined>(undefined)

  const currencyAmount = getCurrencyAmount({
    value: gasFeeDisplayValue,
    valueType: ValueType.Raw,
    currency: nativeOnChain(chainId),
  })

  const { price: usdPrice, isLoading: usdPriceLoading } = useUSDCPrice(currencyAmount?.currency)

  // biome-ignore lint/correctness/useExhaustiveDependencies: -chainId
  useEffect(() => {
    if (!currencyAmount) {
      onError?.(true)
      return
    }
    if (usdPrice === undefined) {
      if (!usdPriceLoading) {
        // can not fetch USD price
        onError?.(true)
      }
      return
    }
    try {
      const usdAmount = usdPrice.quote(currencyAmount)
      setFiatAmount(convertFiatAmount(Number(usdAmount.toExact())).amount)
    } catch (_error) {
      onError?.(true)
    }
  }, [currencyAmount, usdPrice, usdPriceLoading, convertFiatAmount, onError, chainId])

  useEffect(() => {
    if (fiatAmount !== undefined) {
      onFetched?.(chainId, fiatAmount)
    }
  }, [chainId, fiatAmount, onFetched])
}
