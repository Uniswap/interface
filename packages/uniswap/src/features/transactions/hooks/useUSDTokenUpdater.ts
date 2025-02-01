import { Currency } from '@uniswap/sdk-core'
import { useEffect, useRef } from 'react'
import { isUniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { STABLECOIN_AMOUNT_OUT, useUSDCPrice } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'

const NUM_DECIMALS_USD = 2
const NUM_DECIMALS_DISPLAY = 2

type USDTokenUpdaterProps = {
  isFiatInput: boolean
  exactAmountToken: string
  exactAmountFiat: string
  currency?: Currency
  onFiatAmountUpdated: (amount: string) => void
  onTokenAmountUpdated: (amount: string) => void
}

export function useUSDTokenUpdater({
  isFiatInput,
  exactAmountToken,
  exactAmountFiat,
  currency,
  onFiatAmountUpdated,
  onTokenAmountUpdated,
}: USDTokenUpdaterProps): void {
  const { price } = useUSDCPrice(currency)
  const shouldUseUSDRef = useRef(isFiatInput)
  const { convertFiatAmount, formatCurrencyAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount

  useEffect(() => {
    shouldUseUSDRef.current = isFiatInput
  }, [isFiatInput])

  useEffect(() => {
    if (!currency || !price || !isUniverseChainId(currency.chainId)) {
      return undefined
    }

    const exactAmountUSD = (parseFloat(exactAmountFiat || '0') / conversionRate).toFixed(NUM_DECIMALS_USD)

    if (shouldUseUSDRef.current) {
      const stablecoinAmount = getCurrencyAmount({
        value: exactAmountUSD,
        valueType: ValueType.Exact,
        currency: STABLECOIN_AMOUNT_OUT[currency.chainId]?.currency,
      })

      const currencyAmount = stablecoinAmount ? price?.invert().quote(stablecoinAmount) : undefined

      return onTokenAmountUpdated(currencyAmount?.toExact() ?? '')
    }

    const exactCurrencyAmount = getCurrencyAmount({
      value: exactAmountToken,
      valueType: ValueType.Exact,
      currency,
    })
    const usdPrice = exactCurrencyAmount ? price?.quote(exactCurrencyAmount) : undefined
    const fiatPrice = parseFloat(usdPrice?.toExact() ?? '0') * conversionRate

    return onFiatAmountUpdated(fiatPrice ? fiatPrice.toFixed(NUM_DECIMALS_DISPLAY) : '')
  }, [
    shouldUseUSDRef,
    exactAmountFiat,
    exactAmountToken,
    currency,
    price,
    conversionRate,
    formatCurrencyAmount,
    onFiatAmountUpdated,
    onTokenAmountUpdated,
  ])
}
