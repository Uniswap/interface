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
  const clientSORTradeObject = useClientSideSmartOrderRouterTrade(tradeType, amountSpecified, otherCurrency)

  // Use a simple client side logic as backup if SOR is not available.
  const useFallback =
    clientSORTradeObject.state === TradeState.NO_ROUTE_FOUND || clientSORTradeObject.state === TradeState.INVALID
  const fallbackTradeObject = useClientSideV3Trade(
    tradeType,
    useFallback ? amountSpecified : undefined,
    useFallback ? otherCurrency : undefined
  )

  const tradeObject = useFallback ? fallbackTradeObject : clientSORTradeObject
  const lastTrade = useLast(tradeObject.trade, Boolean) ?? undefined

  // Return the last trade while syncing/loading to avoid jank from clearing the last trade while loading.
  // If the trade is unsettled and not stale, return the last trade as a placeholder during settling.
  return useMemo(() => {
    const { state, trade } = tradeObject
    // If the trade is in a settled state, return it.
    if ((state !== TradeState.LOADING && state !== TradeState.SYNCING) || trade) return tradeObject

    const [currencyIn, currencyOut] =
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency]

    // If the trade currencies have switched, consider it stale - do not return the last trade.
    const isStale =
      (currencyIn && !lastTrade?.inputAmount?.currency.equals(currencyIn)) ||
      (currencyOut && !lastTrade?.outputAmount?.currency.equals(currencyOut))
    if (isStale) return tradeObject

    return { state, trade: lastTrade }
  }, [amountSpecified?.currency, lastTrade, otherCurrency, tradeObject, tradeType])
}
