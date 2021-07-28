import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { useRouterTradeExactIn, useRouterTradeExactOut } from 'state/routing/useRouterTrade'
import { useLocalV3TradeExactIn, useLocalV3TradeExactOut } from './useLocalV3Trade'

export enum V3TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  SYNCING,
}

const shouldUseFallback = (state: V3TradeState) => [V3TradeState.INVALID, V3TradeState.NO_ROUTE_FOUND].includes(state)

/**
 * Returns the best v3 trade for a desired exact input swap.
 * Uses optimized routes from the Routing API and falls back to the v3 router.
 * @param amountIn The amount to swap in
 * @param currentOut the desired output currency
 */
export function useV3TradeExactIn(
  amountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency
): { state: V3TradeState; trade: Trade<Currency, Currency, TradeType.EXACT_INPUT> | null } {
  // attempt to use multi-route trade
  const multiRouteTradeExactIn = useRouterTradeExactIn(amountIn, currencyOut)

  const useFallback = shouldUseFallback(multiRouteTradeExactIn.state)

  // only local router if multi-route trade failed
  const bestV3TradeExactIn = useLocalV3TradeExactIn(
    useFallback ? amountIn : undefined,
    useFallback ? currencyOut : undefined
  )

  return useFallback ? bestV3TradeExactIn : multiRouteTradeExactIn
}

/**
 * Returns the best v3 trade for a desired exact output swap.
 * Uses optimized routes from the Routing API and falls back to the v3 router.
 * @param currentIn the desired input currency
 * @param amountOut The amount to swap out
 */
export function useV3TradeExactOut(
  currencyIn?: Currency,
  amountOut?: CurrencyAmount<Currency>
): { state: V3TradeState; trade: Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | null } {
  // attempt to use multi-route trade
  const multiRouteTradeExactOut = useRouterTradeExactOut(currencyIn, amountOut)

  const useFallback = shouldUseFallback(multiRouteTradeExactOut.state)

  // only local router if multi-route trade failed
  const bestV3TradeExactOut = useLocalV3TradeExactOut(
    useFallback ? currencyIn : undefined,
    useFallback ? amountOut : undefined
  )

  return useFallback ? bestV3TradeExactOut : multiRouteTradeExactOut
}
