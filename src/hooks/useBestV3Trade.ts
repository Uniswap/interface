import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { TWO_PERCENT } from 'constants/misc'
import { useMemo } from 'react'
import { use0xQuoteAPITrade } from 'state/quote/useQuoteAPITrade'
import { SwapTransaction, V3TradeState } from 'state/routing/types'
import { useInchQuoteAPITrade } from 'state/routing/useRoutingAPITrade'
import { useRoutingAPIEnabled } from 'state/user/hooks'
import { isTradeBetter } from 'utils/isTradeBetter'

import { useClientSideV3Trade } from './useClientSideV3Trade'
import useDebounce from './useDebounce'
import useIsWindowVisible from './useIsWindowVisible'

export function useBestMarketTrade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: V3TradeState
  trade: V3Trade<Currency, Currency, typeof tradeType> | undefined
  tx: SwapTransaction | undefined
} {
  const isWindowVisible = useIsWindowVisible()

  const debouncedAmount = useDebounce(amountSpecified, 100)

  const routingAPIEnabled = useRoutingAPIEnabled()
  const routingAPITrade = use0xQuoteAPITrade(
    tradeType,
    null,
    true,
    routingAPIEnabled && isWindowVisible ? debouncedAmount : undefined,
    otherCurrency
  )

  const swapAPITrade = useInchQuoteAPITrade(
    tradeType,
    routingAPIEnabled && isWindowVisible ? debouncedAmount : undefined,
    otherCurrency
  )

  const isLoading = routingAPITrade.state === V3TradeState.LOADING || swapAPITrade.state === V3TradeState.LOADING

  const betterTrade = useMemo(() => {
    try {
      // compare if tradeB is better than tradeA
      return !isLoading
        ? isTradeBetter(swapAPITrade.trade, routingAPITrade.trade, TWO_PERCENT)
          ? routingAPITrade
          : swapAPITrade
        : undefined
    } catch (e) {
      // v3 trade may be debouncing or fetching and have different
      // inputs/ouputs than v2
      console.log('Error')
      return undefined
    }
  }, [isLoading, routingAPITrade, swapAPITrade])

  console.log(betterTrade)

  const debouncing =
    betterTrade?.trade &&
    amountSpecified &&
    (tradeType === TradeType.EXACT_INPUT
      ? !betterTrade?.trade.inputAmount.equalTo(amountSpecified) ||
        !amountSpecified.currency.equals(betterTrade?.trade.inputAmount.currency) ||
        !otherCurrency?.equals(betterTrade?.trade.outputAmount.currency)
      : !betterTrade?.trade.outputAmount.equalTo(amountSpecified) ||
        !amountSpecified.currency.equals(betterTrade?.trade.outputAmount.currency) ||
        !otherCurrency?.equals(betterTrade?.trade.inputAmount.currency))

  return useMemo(
    () => ({
      state: betterTrade ? betterTrade.state : V3TradeState.LOADING,
      trade: betterTrade?.trade,
      tx: betterTrade?.tx,
      ...(debouncing ? { state: V3TradeState.SYNCING } : {}),
      ...(isLoading ? { state: V3TradeState.LOADING } : {}),
    }),
    [betterTrade, debouncing, isLoading]
  )
}

/**
 * Returns the best v3 trade for a desired swap.
 * Uses optimized routes from the Routing API and falls back to the v3 router.
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useBestV3Trade(
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: V3TradeState
  trade: V3Trade<Currency, Currency, typeof tradeType> | null
} {
  const [debouncedAmount, debouncedOtherCurrency] = useDebounce([amountSpecified, otherCurrency], 200)

  const isLoading = amountSpecified !== undefined && debouncedAmount === undefined

  // use client side router
  const bestV3Trade = useClientSideV3Trade(tradeType, debouncedAmount, debouncedOtherCurrency)

  return {
    ...bestV3Trade,
    ...(isLoading ? { state: V3TradeState.LOADING } : {}),
  }
}
