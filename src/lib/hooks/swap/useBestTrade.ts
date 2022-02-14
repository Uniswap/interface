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
  // Debounce is used to prevent excessive requests to SOR, as it is data intensive.
  // This helps provide a "syncing" state the UI can reference for loading animations.
  const [debouncedAmount, debouncedOtherCurrency] = useDebounce(
    useMemo(() => [amountSpecified, otherCurrency], [amountSpecified, otherCurrency]),
    200
  )
  const isDebouncing = amountSpecified !== debouncedAmount || otherCurrency !== debouncedOtherCurrency

  const clientSORTrade = useClientSideSmartOrderRouterTrade(tradeType, debouncedAmount, debouncedOtherCurrency)

  // Use a simple client side logic as backup if SOR is not available.
  const useFallback = clientSORTrade.state === TradeState.NO_ROUTE_FOUND || clientSORTrade.state === TradeState.INVALID
  const fallbackTrade = useClientSideV3Trade(
    tradeType,
    useFallback ? debouncedAmount : undefined,
    useFallback ? debouncedOtherCurrency : undefined
  )

  return useMemo(
    () => ({
      ...(useFallback ? fallbackTrade : clientSORTrade),
      ...(isDebouncing ? { state: TradeState.LOADING } : {}),
    }),
    [isDebouncing, fallbackTrade, clientSORTrade, useFallback]
  )
}
