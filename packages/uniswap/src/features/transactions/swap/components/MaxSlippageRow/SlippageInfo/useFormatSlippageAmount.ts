import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TradeWithSlippage } from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { NumberType } from 'utilities/src/format/types'

export function useFormatSlippageAmount(trade: TradeWithSlippage): string {
  const { formatCurrencyAmount } = useLocalizationContext()

  const formattedSlippageAmount = useMemo(() => {
    const slippageTolerancePercent = slippageToleranceToPercent(trade.slippageTolerance)
    const amount = formatCurrencyAmount({
      value:
        trade.tradeType === TradeType.EXACT_INPUT
          ? trade.minimumAmountOut(slippageTolerancePercent)
          : trade.maximumAmountIn(slippageTolerancePercent),
      type: NumberType.TokenTx,
    })
    const tokenSymbol =
      trade.tradeType === TradeType.EXACT_INPUT ? trade.outputAmount.currency.symbol : trade.inputAmount.currency.symbol

    return `${amount} ${tokenSymbol}`
  }, [trade, formatCurrencyAmount])

  return formattedSlippageAmount
}
