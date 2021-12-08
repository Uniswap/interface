import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { TradeState } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'

import useDebounce from './useDebounce'
import useIsWindowVisible from './useIsWindowVisible'

/**
 * Returns the best v2+v3 trade for a desired swap.
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useBestTrade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: TradeState
  trade: Trade<Currency, Currency, TradeType> | undefined
} {
  const isWindowVisible = useIsWindowVisible()

  const [debouncedAmount, debouncedOtherCurrency] = useDebounce([amountSpecified, otherCurrency], 200)

  const routingAPITrade = useRoutingAPITrade(
    tradeType,
    isWindowVisible ? debouncedAmount : undefined,
    debouncedOtherCurrency
  )

  const isLoading = amountSpecified !== undefined && debouncedAmount === undefined

  // consider trade debouncing when inputs/outputs do not match
  const debouncing =
    routingAPITrade.trade &&
    amountSpecified &&
    (tradeType === TradeType.EXACT_INPUT
      ? !routingAPITrade.trade.inputAmount.equalTo(amountSpecified) ||
        !amountSpecified.currency.equals(routingAPITrade.trade.inputAmount.currency) ||
        !debouncedOtherCurrency?.equals(routingAPITrade.trade.outputAmount.currency)
      : !routingAPITrade.trade.outputAmount.equalTo(amountSpecified) ||
        !amountSpecified.currency.equals(routingAPITrade.trade.outputAmount.currency) ||
        !debouncedOtherCurrency?.equals(routingAPITrade.trade.inputAmount.currency))

  return {
    ...routingAPITrade,
    ...(debouncing ? { state: TradeState.SYNCING } : {}),
    ...(isLoading ? { state: TradeState.LOADING } : {}),
  }
}
