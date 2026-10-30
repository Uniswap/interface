import type { RateDisplay } from '@universe/swap-ui'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { getTradeAmounts } from 'uniswap/src/features/transactions/swap/utils/getTradeAmounts'
import { calculateRateLine, getRateToDisplay } from 'uniswap/src/features/transactions/swap/utils/trade'

export type SwapRateInputs = {
  trade: Trade | IndicativeTrade | undefined | null
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
}

/** Derives both rate orientations (and their fiat lines) for the swap-ui rate views. */
export function useSwapRateDisplay({ trade, derivedSwapInfo }: SwapRateInputs): RateDisplay | undefined {
  const formatter = useLocalizationContext()
  const { outputCurrencyAmount } = getTradeAmounts(derivedSwapInfo)
  const usdAmountOut = useUSDCValue(outputCurrencyAmount)

  if (!trade) {
    return undefined
  }

  const forward = getRateToDisplay({ formatter, trade, showInverseRate: false })
  const inverted = getRateToDisplay({ formatter, trade, showInverseRate: true })
  return {
    rate: forward.rate,
    fullPrecisionRate: forward.fullPrecisionRate,
    rateUsd: calculateRateLine({ usdAmountOut, outputCurrencyAmount, trade, showInverseRate: false, formatter }),
    invertedRate: inverted.rate,
    invertedFullPrecisionRate: inverted.fullPrecisionRate,
    invertedRateUsd: calculateRateLine({ usdAmountOut, outputCurrencyAmount, trade, showInverseRate: true, formatter }),
  }
}
