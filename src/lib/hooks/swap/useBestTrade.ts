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
  // debounce used to prevent excessive requests to SOR, as it is data intensive
  // this helps provide a "syncing" state the UI can reference for loading animations
  const [debouncedAmount, debouncedOtherCurrency] = useDebounce(
    useMemo(() => [amountSpecified, otherCurrency], [amountSpecified, otherCurrency]),
    200
  )

  const routingAPITrade = useClientSideSmartOrderRouterTrade(tradeType, debouncedAmount, debouncedOtherCurrency)

  // check if the artifical delay we impose is still occuring
  const debouncing = amountSpecified !== undefined && debouncedAmount === undefined

  // the amount associated with field user is typing in
  const amountFromLatestTrade =
    tradeType === TradeType.EXACT_INPUT ? routingAPITrade.trade?.inputAmount : routingAPITrade.trade?.outputAmount

  // ordered currencies from API trade
  const [currencyFromTrade, otherCurrencyFromTrade] =
    tradeType === TradeType.EXACT_INPUT
      ? [routingAPITrade.trade?.inputAmount?.currency, routingAPITrade.trade?.outputAmount?.currency]
      : [routingAPITrade.trade?.outputAmount?.currency, routingAPITrade.trade?.inputAmount?.currency]

  // check that amount from user input matches latest trade
  const amountsMatch =
    routingAPITrade.trade && amountSpecified && debouncedAmount && amountFromLatestTrade?.equalTo(debouncedAmount)

  // check active swap currencies match latest trade
  const currenciesMatch =
    currencyFromTrade &&
    otherCurrencyFromTrade &&
    debouncedAmount?.currency?.equals(currencyFromTrade) &&
    debouncedOtherCurrency?.equals(otherCurrencyFromTrade)

  // either amount or currencies from latest API trade do not match swap state
  const syncing = !amountsMatch || !currenciesMatch

  const useFallback = !syncing && routingAPITrade.state === TradeState.NO_ROUTE_FOUND

  // use simple client side logic as backup if SOR is not available
  const bestV3Trade = useClientSideV3Trade(
    tradeType,
    useFallback ? debouncedAmount : undefined,
    useFallback ? debouncedOtherCurrency : undefined
  )

  return useMemo(
    () => ({
      ...(useFallback ? bestV3Trade : routingAPITrade),
      ...(syncing ? { state: TradeState.SYNCING } : {}),
      ...(debouncing ? { state: TradeState.LOADING } : {}),
    }),
    [debouncing, bestV3Trade, syncing, routingAPITrade, useFallback]
  )
}
