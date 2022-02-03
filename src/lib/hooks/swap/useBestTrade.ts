import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useClientSideV3Trade } from 'hooks/useClientSideV3Trade'
import useDebounce from 'hooks/useDebounce'
import { useMemo } from 'react'
import { InterfaceTrade, TradeState } from 'state/routing/types'

import useClientSideSmartOrderRouterTrade from '../routing/useClientSideSmartOrderRouterTrade'

function getTradeInputs(
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined,
  tradeType: TradeType
): [CurrencyAmount<Currency> | undefined, Currency | undefined, Currency | undefined] {
  if (!trade) return [undefined, undefined, undefined]
  if (tradeType === TradeType.EXACT_INPUT) {
    return [trade.inputAmount, trade.inputAmount.currency, trade.outputAmount.currency]
  }
  if (tradeType === TradeType.EXACT_OUTPUT) {
    return [trade.outputAmount, trade.outputAmount.currency, trade.inputAmount.currency]
  }
  return [undefined, undefined, undefined]
}

// Checks for case where debounced values are stale compared to latest values from trade.
function isSyncing(
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined,
  debouncedAmount: CurrencyAmount<Currency> | undefined,
  debouncedOtherCurrency: Currency | undefined,
  amountFromLatestTrade: CurrencyAmount<Currency> | undefined,
  currencyFromTrade: Currency | undefined,
  otherCurrencyFromTrade: Currency | undefined
): boolean {
  // Ensure that amount from user input matches latest trade.
  const amountsMatch = trade && debouncedAmount && amountFromLatestTrade?.equalTo(debouncedAmount)

  // Ensure active swap currencies match latest trade.
  const currenciesMatch =
    currencyFromTrade &&
    otherCurrencyFromTrade &&
    debouncedAmount?.currency?.equals(currencyFromTrade) &&
    debouncedOtherCurrency?.equals(otherCurrencyFromTrade)

  return !amountsMatch || !currenciesMatch
}

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

  const clientSORTrade = useClientSideSmartOrderRouterTrade(tradeType, debouncedAmount, debouncedOtherCurrency)

  const [amountFromLatestTrade, currencyFromTrade, otherCurrencyFromTrade] = getTradeInputs(
    clientSORTrade.trade,
    tradeType
  )

  const debouncing =
    (amountSpecified && debouncedAmount && amountSpecified !== debouncedAmount) ||
    (debouncedOtherCurrency && otherCurrency && debouncedOtherCurrency !== otherCurrency)

  const syncing = isSyncing(
    clientSORTrade?.trade,
    debouncedAmount,
    debouncedOtherCurrency,
    amountFromLatestTrade,
    currencyFromTrade,
    otherCurrencyFromTrade
  )

  const useFallback = !syncing && clientSORTrade.state === TradeState.NO_ROUTE_FOUND

  // Use a simple client side logic as backup if SOR is not available.
  const fallbackTrade = useClientSideV3Trade(
    tradeType,
    useFallback ? debouncedAmount : undefined,
    useFallback ? debouncedOtherCurrency : undefined
  )

  return useMemo(
    () => ({
      ...(useFallback ? fallbackTrade : clientSORTrade),
      ...(syncing ? { state: TradeState.SYNCING } : {}),
      ...(debouncing ? { state: TradeState.LOADING } : {}),
    }),
    [debouncing, fallbackTrade, syncing, clientSORTrade, useFallback]
  )
}
