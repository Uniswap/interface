import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getTradeAmounts } from 'uniswap/src/features/transactions/swap/utils/getTradeAmounts'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { FeeOnTransferFeeGroupProps } from 'uniswap/src/features/transactions/TransactionDetails/types'
import { NumberType } from 'utilities/src/format/types'

export function useFeeOnTransferAmounts(
  acceptedDerivedSwapInfo?: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>,
): FeeOnTransferFeeGroupProps | undefined {
  const priceUXEnabled = usePriceUXEnabled()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()
  const { inputCurrencyAmount, outputCurrencyAmount } = getTradeAmounts(acceptedDerivedSwapInfo, priceUXEnabled)

  const usdAmountIn = useUSDCValue(inputCurrencyAmount)
  const usdAmountOut = useUSDCValue(outputCurrencyAmount)

  return useMemo(() => {
    if (!acceptedDerivedSwapInfo) {
      return undefined
    }

    const { currencies } = acceptedDerivedSwapInfo
    const { input: inputCurrencyInfo, output: outputCurrencyInfo } = currencies

    const acceptedTrade = acceptedDerivedSwapInfo.trade.trade ?? acceptedDerivedSwapInfo.trade.indicativeTrade
    const tradeHasFeeToken = acceptedTrade?.inputTax?.greaterThan(0) || acceptedTrade?.outputTax?.greaterThan(0)

    if (!acceptedTrade || !tradeHasFeeToken || acceptedTrade.indicative || isBridge(acceptedTrade)) {
      return undefined
    }

    const usdTaxAmountIn = usdAmountIn?.multiply(acceptedTrade.inputTax).toExact()
    const usdTaxAmountOut = usdAmountOut?.multiply(acceptedTrade.outputTax).toExact()

    const formattedUsdTaxAmountIn = convertFiatAmountFormatted(usdTaxAmountIn, NumberType.FiatTokenQuantity)
    const formattedUsdTaxAmountOut = convertFiatAmountFormatted(usdTaxAmountOut, NumberType.FiatTokenQuantity)

    const taxAmountIn = inputCurrencyAmount?.multiply(acceptedTrade.inputTax)
    const taxAmountOut = outputCurrencyAmount?.multiply(acceptedTrade.outputTax)
    const formattedAmountIn = formatCurrencyAmount({ value: taxAmountIn, type: NumberType.TokenTx })
    const formattedAmountOut = formatCurrencyAmount({ value: taxAmountOut, type: NumberType.TokenTx })

    return {
      inputTokenInfo: {
        currencyInfo: inputCurrencyInfo,
        fee: acceptedTrade.inputTax,
        tokenSymbol: acceptedTrade.inputAmount.currency.symbol ?? t('token.symbol.input.fallback'),
        formattedUsdAmount: formattedUsdTaxAmountIn,
        formattedAmount: formattedAmountIn,
      },
      outputTokenInfo: {
        currencyInfo: outputCurrencyInfo,
        fee: acceptedTrade.outputTax,
        tokenSymbol: acceptedTrade.outputAmount.currency.symbol ?? t('token.symbol.output.fallback'),
        formattedUsdAmount: formattedUsdTaxAmountOut,
        formattedAmount: formattedAmountOut,
      },
    }
  }, [
    acceptedDerivedSwapInfo,
    usdAmountIn,
    usdAmountOut,
    convertFiatAmountFormatted,
    formatCurrencyAmount,
    inputCurrencyAmount,
    outputCurrencyAmount,
    t,
  ])
}
