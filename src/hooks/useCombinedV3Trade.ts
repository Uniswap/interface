import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { V3TradeState } from 'state/routing/types'
import { useRoutingAPITradeExactIn, useRoutingAPITradeExactOut } from 'state/routing/useRoutingAPITrade'
import { useRoutingAPIEnabled } from 'state/user/hooks'
import useDebounce from './useDebounce'
import useIsWindowVisible from './useIsWindowVisible'
import { useClientV3TradeExactIn, useClientSideV3TradeExactOut } from './useClientSideV3Trade'

/**
 * Returns the best v3 trade for a desired exact input swap.
 * Uses optimized routes from the Routing API and falls back to the v3 router.
 * @param amountIn The amount to swap in
 * @param currentOut the desired output currency
 */
export function useV3TradeExactIn(
  amountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency
): {
  state: V3TradeState
  trade: Trade<Currency, Currency, TradeType.EXACT_INPUT> | null
} {
  const routingAPIEnabled = useRoutingAPIEnabled()
  const isWindowVisible = useIsWindowVisible()

  const debouncedAmountIn = useDebounce(amountIn, 100)

  const routingAPITradeExactIn = useRoutingAPITradeExactIn(
    routingAPIEnabled && isWindowVisible ? debouncedAmountIn : undefined,
    currencyOut
  )

  const isLoading = amountIn !== undefined && debouncedAmountIn === undefined

  // consider trade debouncing when inputs/outputs do not match
  const debouncing =
    routingAPITradeExactIn.trade &&
    amountIn &&
    (!routingAPITradeExactIn.trade.inputAmount.equalTo(amountIn) ||
      !amountIn.currency.equals(routingAPITradeExactIn.trade.inputAmount.currency) ||
      !currencyOut?.equals(routingAPITradeExactIn.trade.outputAmount.currency))

  const useFallback =
    !routingAPIEnabled || (!debouncing && routingAPITradeExactIn.state === V3TradeState.NO_ROUTE_FOUND)

  // only use client side router if routing api trade failed
  const bestV3TradeExactIn = useClientV3TradeExactIn(
    useFallback ? debouncedAmountIn : undefined,
    useFallback ? currencyOut : undefined
  )

  return {
    ...(useFallback ? bestV3TradeExactIn : routingAPITradeExactIn),
    ...(debouncing ? { state: V3TradeState.SYNCING } : {}),
    ...(isLoading ? { state: V3TradeState.LOADING } : {}),
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
): {
  state: V3TradeState
  trade: Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | null
} {
  const routingAPIEnabled = useRoutingAPIEnabled()
  const isWindowVisible = useIsWindowVisible()

  const debouncedAmountOut = useDebounce(amountOut, 100)

  const routingAPITradeExactOut = useRoutingAPITradeExactOut(
    routingAPIEnabled && isWindowVisible ? currencyIn : undefined,
    debouncedAmountOut
  )

  const isLoading = amountOut !== undefined && debouncedAmountOut === undefined

  const debouncing =
    routingAPITradeExactOut.trade &&
    amountOut &&
    (!routingAPITradeExactOut.trade.outputAmount.equalTo(amountOut) ||
      !currencyIn?.equals(routingAPITradeExactOut.trade.inputAmount.currency) ||
      !amountOut.currency.equals(routingAPITradeExactOut.trade.outputAmount.currency))

  const useFallback =
    !routingAPIEnabled || (!debouncing && routingAPITradeExactOut.state === V3TradeState.NO_ROUTE_FOUND)

  const bestV3TradeExactOut = useClientSideV3TradeExactOut(
    useFallback ? currencyIn : undefined,
    useFallback ? debouncedAmountOut : undefined
  )

  return {
    ...(useFallback ? bestV3TradeExactOut : routingAPITradeExactOut),
    ...(debouncing ? { state: V3TradeState.SYNCING } : {}),
    ...(isLoading ? { state: V3TradeState.LOADING } : {}),
  }
}
