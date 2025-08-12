import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'
import { NumberType } from 'utilities/src/format/types'

export function useFormatSlippageAmount(trade: TradeWithSlippage): string {
  const { formatCurrencyAmount } = useLocalizationContext()

  const formattedSlippageAmount = useMemo(() => {
    const amount = formatCurrencyAmount({
      value: trade.tradeType === TradeType.EXACT_INPUT ? trade.minAmountOut : trade.maxAmountIn,
      type: NumberType.TokenTx,
    })
    const tokenSymbol =
      trade.tradeType === TradeType.EXACT_INPUT ? trade.outputAmount.currency.symbol : trade.inputAmount.currency.symbol

    return `${amount} ${tokenSymbol}`
  }, [trade, formatCurrencyAmount])

  return formattedSlippageAmount
}
