import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { useRouterTradeExactIn, useRouterTradeExactOut } from 'state/routing/useRouterTrade'
import useDebounce from './useDebounce'
import { useLocalV3TradeExactIn, useLocalV3TradeExactOut } from './useLocalV3Trade'

export enum V3TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  SYNCING,
}

const shouldUseFallback = (state: V3TradeState) => false //[V3TradeState.NO_ROUTE_FOUND].includes(state)

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
  const debouncedAmountIn = useDebounce(amountIn, 250)

  // attempt to use multi-route trade
  const multiRouteTradeExactIn = useRouterTradeExactIn(debouncedAmountIn, currencyOut)

  // consider trade debounced when input amount is the same as output amount
  const debouncing =
    multiRouteTradeExactIn.trade && amountIn && !multiRouteTradeExactIn.trade.inputAmount.equalTo(amountIn)

  const useFallback = !debouncing && shouldUseFallback(multiRouteTradeExactIn.state)

  // only local router if multi-route trade failed
  const bestV3TradeExactIn = useLocalV3TradeExactIn(
    useFallback ? debouncedAmountIn : undefined,
    useFallback ? currencyOut : undefined
  )

  return {
    ...(useFallback ? bestV3TradeExactIn : multiRouteTradeExactIn),
    ...(debouncing ? { state: V3TradeState.SYNCING } : {}),
  }
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
  const debouncedAmountOut = useDebounce(amountOut, 250)

  // attempt to use multi-route trade
  const multiRouteTradeExactOut = useRouterTradeExactOut(currencyIn, debouncedAmountOut)

  // consider trade debounced when input amount is the same as output amount
  const debouncing =
    multiRouteTradeExactOut.trade && amountOut && !multiRouteTradeExactOut.trade.outputAmount.equalTo(amountOut)

  const useFallback = !debouncing && shouldUseFallback(multiRouteTradeExactOut.state)

  // only local router if multi-route trade failed
  const bestV3TradeExactOut = useLocalV3TradeExactOut(
    useFallback ? currencyIn : undefined,
    useFallback ? debouncedAmountOut : undefined
  )

  return {
    ...(useFallback ? bestV3TradeExactOut : multiRouteTradeExactOut),
    ...(debouncing ? { state: V3TradeState.SYNCING } : {}),
  }
}
