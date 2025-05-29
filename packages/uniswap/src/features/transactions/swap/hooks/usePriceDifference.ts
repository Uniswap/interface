import { useMemo } from 'react'
import { ColorTokens } from 'ui/src'
import { getPriceImpact } from 'uniswap/src/features/transactions/swap/review/hooks/usePriceImpact'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

const PRICE_DIFFERENCE_THRESHOLD = 5
const PRICE_DIFFERENCE_THRESHOLD_CRITICAL = 10

export type UsePriceDifferenceReturnType =
  | {
      priceDifferencePercentage?: number
      showPriceDifferenceWarning: false
      priceDifferenceColor: undefined
    }
  | {
      priceDifferencePercentage: number
      showPriceDifferenceWarning: true
      priceDifferenceColor: ColorTokens
    }

export function usePriceDifference(derivedSwapInfo?: DerivedSwapInfo): UsePriceDifferenceReturnType {
  const inputPrice = derivedSwapInfo?.currencyAmountsUSDValue[CurrencyField.INPUT]?.toFixed()
  const outputPrice = derivedSwapInfo?.currencyAmountsUSDValue[CurrencyField.OUTPUT]?.toFixed()

  return useMemo(() => {
    if (!derivedSwapInfo) {
      return { showPriceDifferenceWarning: false }
    }

    const priceDifferencePercentage =
      outputPrice !== undefined && inputPrice !== undefined
        ? ((+outputPrice - +inputPrice) / +inputPrice) * 100
        : +(getPriceImpact(derivedSwapInfo)?.toFixed() || 0)

    const showPriceDifferenceWarning =
      !!priceDifferencePercentage && priceDifferencePercentage * -1 > PRICE_DIFFERENCE_THRESHOLD

    if (showPriceDifferenceWarning) {
      return {
        priceDifferencePercentage,
        showPriceDifferenceWarning,
        priceDifferenceColor:
          priceDifferencePercentage * -1 > PRICE_DIFFERENCE_THRESHOLD_CRITICAL ? '$statusCritical' : '$statusWarning',
      }
    }

    return { priceDifferencePercentage, showPriceDifferenceWarning }
  }, [derivedSwapInfo, inputPrice, outputPrice])
}
