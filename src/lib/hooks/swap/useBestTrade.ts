import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useClientSideV3Trade } from 'hooks/useClientSideV3Trade'
import useLast from 'hooks/useLast'
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
  const clientSORTrade = useClientSideSmartOrderRouterTrade(tradeType, amountSpecified, otherCurrency)

  // Use a simple client side logic as backup if SOR is not available.
  const useFallback = clientSORTrade.state === TradeState.NO_ROUTE_FOUND || clientSORTrade.state === TradeState.INVALID
  const fallbackTrade = useClientSideV3Trade(
    tradeType,
    useFallback ? amountSpecified : undefined,
    useFallback ? otherCurrency : undefined
  )

  const trade = useFallback ? fallbackTrade : clientSORTrade
  const lastTrade = useLast(trade.trade, Boolean) ?? undefined

  const [currencyIn, currencyOut] =
    tradeType === TradeType.EXACT_INPUT
      ? [amountSpecified?.currency, otherCurrency]
      : [otherCurrency, amountSpecified?.currency]

  // Return the last trade state while syncing/loading to avoid jank from clearing the last trade while loading.
  return useMemo(() => {
    if ((trade.state !== TradeState.LOADING && trade.state !== TradeState.SYNCING) || trade.trade) return trade

    // Dont return last trade if currencies dont match.
    const isStale =
      (currencyIn && !lastTrade?.inputAmount?.currency.equals(currencyIn)) ||
      (currencyOut && !lastTrade?.outputAmount?.currency.equals(currencyOut))
    if (isStale) return trade

    return { state: trade.state, trade: lastTrade }
  }, [currencyIn, currencyOut, lastTrade, trade])
}
