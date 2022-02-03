import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useClientSideV3Trade } from 'hooks/useClientSideV3Trade'
import useDebounce from 'hooks/useDebounce'
import { useMemo } from 'react'
import { InterfaceTrade, TradeState } from 'state/routing/types'

import useClientSideSmartOrderRouterTrade from '../routing/useClientSideSmartOrderRouterTrade'

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
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
} {
  // debounce used to prevent excessive requests to SOR, as it is data intensive
  const [debouncedAmount, debouncedOtherCurrency] = useDebounce(
    useMemo(() => [amountSpecified, otherCurrency], [amountSpecified, otherCurrency]),
    200
  )

  const routingAPITrade = useClientSideSmartOrderRouterTrade(tradeType, debouncedAmount, debouncedOtherCurrency)

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

  const useFallback = !debouncing && routingAPITrade.state === TradeState.NO_ROUTE_FOUND

  // use simple client side logic as backup if SOR is not available
  const bestV3Trade = useClientSideV3Trade(
    tradeType,
    useFallback ? debouncedAmount : undefined,
    useFallback ? debouncedOtherCurrency : undefined
  )

  return useMemo(
    () => ({
      ...(useFallback ? bestV3Trade : routingAPITrade),
      ...(debouncing ? { state: TradeState.SYNCING } : {}),
      ...(isLoading ? { state: TradeState.LOADING } : {}),
    }),
    [bestV3Trade, debouncing, isLoading, routingAPITrade, useFallback]
  )
}
