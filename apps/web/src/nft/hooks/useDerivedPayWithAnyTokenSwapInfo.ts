import { Currency, CurrencyAmount, NativeCurrency, Percent, Token, TradeType } from '@uniswap/sdk-core'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useDebouncedTrade } from 'hooks/useDebouncedTrade'
import { useMemo } from 'react'
import { ClassicTrade, RouterPreference, TradeState } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'

export default function useDerivedPayWithAnyTokenSwapInfo(
  inputCurrency?: Currency,
  parsedOutputAmount?: CurrencyAmount<NativeCurrency | Token>
): {
  state: TradeState
  trade?: ClassicTrade
  maximumAmountIn?: CurrencyAmount<Token>
  allowedSlippage: Percent
} {
  const { state, trade } = useDebouncedTrade(
    TradeType.EXACT_OUTPUT,
    parsedOutputAmount,
    inputCurrency ?? undefined,
    RouterPreference.API
  )

  const allowedSlippage = useAutoSlippageTolerance(isClassicTrade(trade) ? trade : undefined)
  const maximumAmountIn = useMemo(() => {
    const maximumAmountIn = trade?.maximumAmountIn(allowedSlippage)
    return maximumAmountIn?.currency.isToken ? (maximumAmountIn as CurrencyAmount<Token>) : undefined
  }, [allowedSlippage, trade])

  return useMemo(() => {
    return {
      state,
      trade,
      maximumAmountIn,
      allowedSlippage,
    }
  }, [allowedSlippage, maximumAmountIn, state, trade])
}
