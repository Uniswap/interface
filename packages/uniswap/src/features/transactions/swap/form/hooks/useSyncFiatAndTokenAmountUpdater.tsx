import { useEffect } from 'react'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { currencyIdToChain } from 'uniswap/src/utils/currencyId'

// Used for rounding in conversion math
const NUM_DECIMALS_FIAT_ROUNDING = 2

// Used for display text on fiat amount
const NUM_DECIMALS_DISPLAY_FIAT = 2

/**
 * Updater to always populate fiatAmount, or tokenAmount in swap context. If fiat mode is enabled,
 * we reference the current fiat input amount, and update the token amount. If not enabled, we update the fiat amount based on token
 * amount. This allows us to toggle between 2 modes, without losing the entered amount.
 */
export function useSyncFiatAndTokenAmountUpdater({ skip = false }: { skip?: boolean }): void {
  const { isFiatMode, updateSwapForm, exactAmountToken, exactAmountFiat, exactCurrencyField } = useSwapFormStore(
    (s) => ({
      isFiatMode: s.isFiatMode,
      updateSwapForm: s.updateSwapForm,
      exactAmountToken: s.exactAmountToken,
      exactAmountFiat: s.exactAmountFiat,
      exactCurrencyField: s.exactCurrencyField,
    }),
  )

  const currencies = useSwapFormStoreDerivedSwapInfo((s) => s.currencies)
  const exactCurrency = currencies[exactCurrencyField]

  const { price: usdPriceOfCurrency } = useUSDCPrice(skip ? undefined : (exactCurrency?.currency ?? undefined))
  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount
  const chainId = currencyIdToChain(exactCurrency?.currencyId ?? '')

  useEffect(() => {
    if (skip || !exactCurrency || !usdPriceOfCurrency || !chainId) {
      return
    }

    if (isFiatMode) {
      const fiatAmount = exactAmountFiat && !isNaN(parseFloat(exactAmountFiat)) ? parseFloat(exactAmountFiat) : 0
      const usdAmount = (fiatAmount / conversionRate).toFixed(NUM_DECIMALS_FIAT_ROUNDING)
      const stablecoinAmount = getCurrencyAmount({
        value: usdAmount,
        valueType: ValueType.Exact,
        currency: getPrimaryStablecoin(chainId),
      })
      const tokenAmount = stablecoinAmount ? usdPriceOfCurrency.invert().quote(stablecoinAmount) : undefined
      updateSwapForm({ exactAmountToken: tokenAmount?.toExact() })
    }

    // When we have new token amount after user hit "max" or changes exact currency field
    if (!isFiatMode || (!exactAmountFiat && exactAmountToken)) {
      const tokenAmount = getCurrencyAmount({
        value: exactAmountToken,
        valueType: ValueType.Exact,
        currency: exactCurrency.currency,
      })
      const usdAmount = tokenAmount ? usdPriceOfCurrency.quote(tokenAmount) : undefined
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
    updateSwapForm,
    chainId,
    usdPriceOfCurrency,
    isFiatMode,
    skip,
  ])
}
