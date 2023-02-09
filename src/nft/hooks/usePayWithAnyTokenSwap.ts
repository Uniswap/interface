import { Currency, CurrencyAmount, NativeCurrency, Token, TradeType } from '@uniswap/sdk-core'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useBestTrade } from 'hooks/useBestTrade'
import { useMemo } from 'react'
import { InterfaceTrade, TradeState } from 'state/routing/types'

export default function usePayWithAnyTokenSwap(
  inputCurrency?: Currency,
  parsedOutputAmount?: CurrencyAmount<NativeCurrency | Token>
): {
  state: TradeState
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
  maximumAmountIn: CurrencyAmount<Token> | undefined
} {
  const { state, trade } = useBestTrade(TradeType.EXACT_OUTPUT, parsedOutputAmount, inputCurrency ?? undefined)
  const allowedSlippage = useAutoSlippageTolerance(trade)
  const maximumAmountIn = useMemo(() => {
    const maximumAmountIn = trade?.maximumAmountIn(allowedSlippage)
    return maximumAmountIn?.currency.isToken ? (maximumAmountIn as CurrencyAmount<Token>) : undefined
  }, [allowedSlippage, trade])

  return useMemo(() => {
    return {
      state,
      trade,
      maximumAmountIn,
    }
  }, [maximumAmountIn, state, trade])
}
