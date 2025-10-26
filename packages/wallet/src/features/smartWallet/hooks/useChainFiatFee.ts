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
  const [fiatAmount, setFiatAmount] = useState<number>(0)

  const currencyAmount = getCurrencyAmount({
    value: gasFeeDisplayValue,
    valueType: ValueType.Raw,
    currency: nativeOnChain(chainId),
  })

  const { price: usdPrice } = useUSDCPrice(currencyAmount?.currency)

  // biome-ignore lint/correctness/useExhaustiveDependencies: -chainId
  useEffect(() => {
    if (!currencyAmount) {
      onError?.(true)
      return
    }
    if (!usdPrice) {
      return
    }
    try {
      const usdAmount = usdPrice.quote(currencyAmount)
      setFiatAmount(convertFiatAmount(Number(usdAmount.toExact())).amount)
    } catch (_error) {
      onError?.(true)
    }
  }, [currencyAmount, usdPrice, convertFiatAmount, onError, chainId])

  useEffect(() => {
    if (fiatAmount) {
      onFetched?.(chainId, fiatAmount)
    }
  }, [chainId, fiatAmount, onFetched])
}
