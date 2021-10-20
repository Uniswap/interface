import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade } from '@uniswap/v3-sdk'
import { V3TradeState } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { useRoutingAPIEnabled } from 'state/user/hooks'

import { useClientSideV3Trade } from './useClientSideV3Trade'
import useDebounce from './useDebounce'
import useIsWindowVisible from './useIsWindowVisible'

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
  priceSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: V3TradeState
  trade: Trade<Currency, Currency, typeof tradeType> | null
} {
  const debouncedAmount = useDebounce(amountSpecified, 100)
  const debouncedPriceAmount = useDebounce(priceSpecified, 100)

  let isLoading = amountSpecified !== undefined && debouncedAmount === undefined
  isLoading = isLoading || (priceSpecified !== undefined && debouncedPriceAmount === undefined)

  // use client side router
  const bestV3Trade = useClientSideV3Trade(TradeType.EXACT_INPUT, debouncedAmount, debouncedPriceAmount, otherCurrency)
  console.log(bestV3Trade)

  return {
    ...bestV3Trade,
    ...(isLoading ? { state: V3TradeState.LOADING } : {}),
  }
}
