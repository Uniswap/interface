import { BigNumber } from '@ethersproject/bignumber'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { useRoutingAPITradeExactIn, useRoutingAPITradeExactOut } from 'state/routing/useRoutingAPITrade'
import { useRoutingAPIEnabled } from 'state/user/hooks'
import useDebounce from './useDebounce'
import { useLocalV3TradeExactIn, useLocalV3TradeExactOut } from './useLocalV3Trade'

export enum V3TradeState {
  LOADING,
  INVALID,
  NO_ROUTE_FOUND,
  VALID,
  SYNCING,
}

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
  gasPriceWei?: BigNumber
  gasUseEstimate?: BigNumber
} {
  const routingAPIEnabled = useRoutingAPIEnabled()

  const debouncedAmountIn = useDebounce(amountIn, 250)

  // attempt to use multi-route trade
  const multiRouteTradeExactIn = useRoutingAPITradeExactIn(
    routingAPIEnabled ? debouncedAmountIn : undefined,
    currencyOut
  )

  // consider trade debouncing when inputs/outputs do not match
  const debouncing =
    multiRouteTradeExactIn.trade &&
    amountIn &&
    (!multiRouteTradeExactIn.trade.inputAmount.equalTo(amountIn) ||
      !amountIn.currency.equals(multiRouteTradeExactIn.trade.inputAmount.currency) ||
      !currencyOut?.equals(multiRouteTradeExactIn.trade.outputAmount.currency))

  const useFallback =
    !debouncing && (!routingAPIEnabled || multiRouteTradeExactIn.state === V3TradeState.NO_ROUTE_FOUND)

  // only use local router if multi-route trade failed
  const bestV3TradeExactIn = useLocalV3TradeExactIn(
    useFallback ? debouncedAmountIn : undefined,
    useFallback ? currencyOut : undefined
  )

  return {
    ...(useFallback ? bestV3TradeExactIn : multiRouteTradeExactIn),
    ...(debouncing ? { state: V3TradeState.SYNCING } : {}),
    gasPriceWei: multiRouteTradeExactIn?.gasPriceWei,
    gasUseEstimate: multiRouteTradeExactIn?.gasUseEstimate,
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
  gasPriceWei?: BigNumber
  gasUseEstimate?: BigNumber
} {
  const routingAPIEnabled = useRoutingAPIEnabled()

  const debouncedAmountOut = useDebounce(amountOut, 250)

  const multiRouteTradeExactOut = useRoutingAPITradeExactOut(
    routingAPIEnabled ? currencyIn : undefined,
    debouncedAmountOut
  )

  const debouncing =
    multiRouteTradeExactOut.trade &&
    amountOut &&
    (!multiRouteTradeExactOut.trade.outputAmount.equalTo(amountOut) ||
      !currencyIn?.equals(multiRouteTradeExactOut.trade.inputAmount.currency) ||
      !amountOut.currency.equals(multiRouteTradeExactOut.trade.outputAmount.currency))

  const useFallback =
    !debouncing && (!routingAPIEnabled || multiRouteTradeExactOut.state === V3TradeState.NO_ROUTE_FOUND)

  const bestV3TradeExactOut = useLocalV3TradeExactOut(
    useFallback ? currencyIn : undefined,
    useFallback ? debouncedAmountOut : undefined
  )

  return {
    ...(useFallback ? bestV3TradeExactOut : multiRouteTradeExactOut),
    ...(debouncing ? { state: V3TradeState.SYNCING } : {}),
    gasPriceWei: multiRouteTradeExactOut?.gasPriceWei,
    gasUseEstimate: multiRouteTradeExactOut?.gasUseEstimate,
  }
}
