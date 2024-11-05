import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FeeOnTransferFeeGroupProps } from 'uniswap/src/features/transactions/TransactionDetails/FeeOnTransferFee'
import { getTradeAmounts } from 'uniswap/src/features/transactions/swap/hooks/getTradeAmounts'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { NumberType } from 'utilities/src/format/types'

export function useFeeOnTransferAmounts(
  acceptedDerivedSwapInfo?: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>,
): FeeOnTransferFeeGroupProps | undefined {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { inputCurrencyAmount, outputCurrencyAmount } = getTradeAmounts(acceptedDerivedSwapInfo)

  const usdAmountIn = useUSDCValue(inputCurrencyAmount)
  const usdAmountOut = useUSDCValue(outputCurrencyAmount)

  return useMemo(() => {
    if (!acceptedDerivedSwapInfo) {
      return undefined
    }

    const acceptedTrade = acceptedDerivedSwapInfo.trade.trade ?? acceptedDerivedSwapInfo.trade.indicativeTrade
    const tradeHasFeeToken = acceptedTrade?.inputTax?.greaterThan(0) || acceptedTrade?.outputTax?.greaterThan(0)

    if (!acceptedTrade || !tradeHasFeeToken || acceptedTrade.indicative || isBridge(acceptedTrade)) {
      return undefined
    }

    const usdTaxAmountIn = usdAmountIn?.multiply(acceptedTrade.inputTax).toExact()
    const usdTaxAmountOut = usdAmountOut?.multiply(acceptedTrade.outputTax).toExact()

    const formattedUsdTaxAmountIn = convertFiatAmountFormatted(usdTaxAmountIn, NumberType.FiatTokenQuantity)
    const formattedUsdTaxAmountOut = convertFiatAmountFormatted(usdTaxAmountOut, NumberType.FiatTokenQuantity)

    return {
      inputTokenInfo: {
        fee: acceptedTrade.inputTax,
        tokenSymbol: acceptedTrade.inputAmount.currency.symbol ?? t('token.symbol.input.fallback'),
        formattedUsdAmount: formattedUsdTaxAmountIn,
      },
      outputTokenInfo: {
        fee: acceptedTrade.outputTax,
        tokenSymbol: acceptedTrade.outputAmount.currency.symbol ?? t('token.symbol.output.fallback'),
        formattedUsdAmount: formattedUsdTaxAmountOut,
      },
    }
  }, [acceptedDerivedSwapInfo, usdAmountIn, usdAmountOut, convertFiatAmountFormatted, t])
}
