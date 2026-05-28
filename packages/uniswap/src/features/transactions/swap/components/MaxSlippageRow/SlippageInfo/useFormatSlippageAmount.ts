import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'
import { NumberType } from 'utilities/src/format/types'

export function useFormatSlippageAmount(trade: TradeWithSlippage | null): string {
  const { formatCurrencyAmount } = useLocalizationContext()

  const formattedSlippageAmount = useMemo(() => {
    if (!trade) {
      return ''
    }
    const amount = formatCurrencyAmount({
      value: [TradeType.EXACT_INPUT, 'EXACT_INPUT'].includes(trade.tradeType) ? trade.minAmountOut : trade.maxAmountIn,
      type: NumberType.TokenTx,
    })
    const tokenSymbol = [TradeType.EXACT_INPUT, 'EXACT_INPUT'].includes(trade.tradeType)
      ? trade.outputAmount.currency.symbol
      : trade.inputAmount.currency.symbol

    return `${amount} ${tokenSymbol}`
  }, [trade, formatCurrencyAmount])

  return formattedSlippageAmount
}
