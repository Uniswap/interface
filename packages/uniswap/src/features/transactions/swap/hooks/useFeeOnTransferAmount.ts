import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValueWithStatus } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { getTradeAmounts } from 'uniswap/src/features/transactions/swap/utils/getTradeAmounts'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { FeeOnTransferFeeGroupProps } from 'uniswap/src/features/transactions/TransactionDetails/types'
import { NumberType } from 'utilities/src/format/types'

export function useFeeOnTransferAmounts(
  acceptedDerivedSwapInfo?: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>,
): FeeOnTransferFeeGroupProps | undefined {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()
  const { inputCurrencyAmount, outputCurrencyAmount } = getTradeAmounts(acceptedDerivedSwapInfo)

  const { value: usdAmountIn, isLoading: isLoadingIn } = useUSDCValueWithStatus(inputCurrencyAmount)
  const { value: usdAmountOut, isLoading: isLoadingOut } = useUSDCValueWithStatus(outputCurrencyAmount)

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
        isLoading: isLoadingIn,
      },
      outputTokenInfo: {
        currencyInfo: outputCurrencyInfo,
        fee: acceptedTrade.outputTax,
        tokenSymbol: acceptedTrade.outputAmount.currency.symbol ?? t('token.symbol.output.fallback'),
        formattedUsdAmount: formattedUsdTaxAmountOut,
        formattedAmount: formattedAmountOut,
        isLoading: isLoadingOut,
      },
    }
  }, [
    acceptedDerivedSwapInfo,
    usdAmountIn,
    usdAmountOut,
    isLoadingIn,
    isLoadingOut,
    convertFiatAmountFormatted,
    formatCurrencyAmount,
    inputCurrencyAmount,
    outputCurrencyAmount,
    t,
  ])
}
