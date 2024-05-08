import { useEffect } from 'react'
import { NumberType } from 'utilities/src/format/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import {
  STABLECOIN_AMOUNT_OUT,
  useUSDCPrice,
} from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import { currencyIdToChain } from 'wallet/src/utils/currencyId'
import { ValueType, getCurrencyAmount } from 'wallet/src/utils/getCurrencyAmount'

// Used for rounding in conversion math
const NUM_DECIMALS_FIAT_ROUNDING = 2

// Used for display text on fiat amount
const NUM_DECIMALS_DISPLAY_FIAT = 2

/**
 * Updater to always populate fiatAmount, or tokenAmount in swap context. If fiat mode is enabled,
 * we reference the current fiat input amount, and update the token amount. If not enabled, we update the fiat amount based on token
 * amount. This allows us to toggle between 2 modes, without losing the entered amount.
 */
export function useSyncFiatAndTokenAmountUpdater(): void {
  const {
    isFiatMode,
    updateSwapForm,
    exactAmountToken,
    exactAmountFiat,
    derivedSwapInfo,
    exactCurrencyField,
  } = useSwapFormContext()

  const exactCurrency = derivedSwapInfo.currencies[exactCurrencyField]

  const usdPriceOfCurrency = useUSDCPrice(exactCurrency?.currency ?? undefined)
  const { convertFiatAmount, formatCurrencyAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount().amount
  const chainId = currencyIdToChain(exactCurrency?.currencyId ?? '')

  useEffect(() => {
    if (!exactCurrency || !usdPriceOfCurrency || !chainId) {
      return
    }

    if (isFiatMode) {
      const usdAmount = (parseFloat(exactAmountFiat ?? '0') / conversionRate).toFixed(
        NUM_DECIMALS_FIAT_ROUNDING
      )
      const stablecoinAmount = getCurrencyAmount({
        value: usdAmount,
        valueType: ValueType.Exact,
        currency: STABLECOIN_AMOUNT_OUT[chainId]?.currency,
      })
      const tokenAmount = stablecoinAmount
        ? usdPriceOfCurrency?.invert().quote(stablecoinAmount)
        : undefined
      const tokenAmountFormatted = formatCurrencyAmount({
        value: tokenAmount,
        type: NumberType.SwapTradeAmount,
        placeholder: '',
      })
      updateSwapForm({
        exactAmountToken: tokenAmountFormatted,
      })
    }

    // Special case when we have token amount, but not fiat, which can occur when we hit "max"
    if (!isFiatMode || (isFiatMode && !exactAmountFiat && exactAmountToken)) {
      const tokenAmount = getCurrencyAmount({
        value: exactAmountToken,
        valueType: ValueType.Exact,
        currency: exactCurrency.currency,
      })
      const usdAmount = tokenAmount ? usdPriceOfCurrency?.quote(tokenAmount) : undefined
      const fiatAmount = parseFloat(usdAmount?.toExact() ?? '0') * conversionRate
      const fiatAmountFormatted = fiatAmount ? fiatAmount.toFixed(NUM_DECIMALS_DISPLAY_FIAT) : ''
      updateSwapForm({
        exactAmountFiat: fiatAmountFormatted,
      })
    }
  }, [
    exactAmountFiat,
    exactAmountToken,
    exactCurrency,
    conversionRate,
    formatCurrencyAmount,
    updateSwapForm,
    chainId,
    usdPriceOfCurrency,
    isFiatMode,
  ])
}
