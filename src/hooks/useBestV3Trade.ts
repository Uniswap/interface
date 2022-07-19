import { clippingParents } from '@popperjs/core'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { ChainName } from 'constants/chains'
import { BETTER_TRADE_LESS_HOPS_THRESHOLD, TWO_PERCENT } from 'constants/misc'
import { useMemo } from 'react'
import { useRoutingAPIEnabled } from 'state/user/hooks'
import { SwapTransaction, V3TradeState } from 'state/validator/types'
import { useGaslessAPITrade, useValidatorAPITrade } from 'state/validator/useValidatorAPITrade'

import { useClientSideV3Trade } from './useClientSideV3Trade'
import useDebounce from './useDebounce'
import useIsWindowVisible from './useIsWindowVisible'
import { useUSDCValue } from './useUSDCPrice'

export function useBestMarketTrade(
  gasless: boolean,
  tradeType: TradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: V3TradeState
  trade: V3Trade<Currency, Currency, typeof tradeType> | undefined
  tx: SwapTransaction | undefined
  savings: CurrencyAmount<Token> | null
  paymentToken: Token | null | undefined
  paymentFee: number | undefined
} {
  const isWindowVisible = useIsWindowVisible()

  const debouncedAmount = useDebounce(amountSpecified, 100)

  const routingAPIEnabled = useRoutingAPIEnabled()
  // const quoteTrade = useValidatorAPITrade(
  //   tradeType,
  //   null,
  //   null,
  //   true,
  //   !gasless,
  //   routingAPIEnabled && isWindowVisible ? debouncedAmount : undefined,
  //   otherCurrency
  // )

  const gaslessTradeOriginal = useGaslessAPITrade(
    tradeType,
    null,
    null,
    true,
    gasless,
    routingAPIEnabled && isWindowVisible ? debouncedAmount : undefined,
    otherCurrency
  )

  const gaslessTrade = useValidatorAPITrade(
    tradeType,
    null,
    null,
    true,
    !gasless,
    routingAPIEnabled && isWindowVisible ? debouncedAmount : undefined,
    otherCurrency
  )

  const betterTrade = gaslessTradeOriginal //gasless ? gaslessTrade : quoteTrade
  const isLoading = betterTrade.state === V3TradeState.LOADING

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
  //const savings = useUSDCValue(betterTrade.uniswapAmount)
  const savings = betterTrade.uniswapAmount as CurrencyAmount<Token>
  return useMemo(
    () => ({
      state: betterTrade ? betterTrade?.state : V3TradeState.LOADING, //: V3TradeState.LOADING,
      trade: betterTrade?.trade,
      tx: betterTrade?.tx,
      savings,
      paymentToken: betterTrade.paymentToken,
      paymentFee: betterTrade ? betterTrade.paymentFees : undefined,
      // ...(debouncing ? { state: V3TradeState.SYNCING } : {}),
      // ...(isLoading ? { state: V3TradeState.LOADING } : {}),
    }),
    [betterTrade, savings]
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
