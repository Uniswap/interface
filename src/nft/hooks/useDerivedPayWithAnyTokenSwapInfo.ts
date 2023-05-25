import { Currency, CurrencyAmount, NativeCurrency, Percent, Token, TradeType } from '@uniswap/sdk-core'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useBestTrade } from 'hooks/useBestTrade'
import { useMemo } from 'react'
import { ClassicTrade, TradeState } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'

export default function useDerivedPayWithAnyTokenSwapInfo(
  inputCurrency?: Currency,
  parsedOutputAmount?: CurrencyAmount<NativeCurrency | Token>
): {
  state: TradeState
  trade: ClassicTrade | undefined
  maximumAmountIn: CurrencyAmount<Token> | undefined
  allowedSlippage: Percent
} {
  // TODO (tina): UMMM fix this? probably force the router config here to be Classic ONLY
  const { state, trade } = useBestTrade(TradeType.EXACT_OUTPUT, parsedOutputAmount, inputCurrency ?? undefined)
  const classicTrade = trade as ClassicTrade

  const allowedSlippage = useAutoSlippageTolerance(isClassicTrade(trade) ? trade : undefined)
  const maximumAmountIn = useMemo(() => {
    const maximumAmountIn = trade?.maximumAmountIn(allowedSlippage)
    return maximumAmountIn?.currency.isToken ? (maximumAmountIn as CurrencyAmount<Token>) : undefined
  }, [allowedSlippage, trade])

  return useMemo(() => {
    return {
      state,
      trade: classicTrade,
      maximumAmountIn,
      allowedSlippage,
    }
  }, [allowedSlippage, maximumAmountIn, state, classicTrade])
}
