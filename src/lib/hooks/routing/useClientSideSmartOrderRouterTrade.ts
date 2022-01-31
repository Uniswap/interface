import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useStablecoinAmountFromFiatValue } from 'hooks/useUSDCPrice'
import { useEffect, useMemo, useState } from 'react'
import { GetQuoteResult, InterfaceTrade, TradeState } from 'state/routing/types'
import { computeRoutes, transformRoutesToTrade } from 'state/routing/utils'

import { getClientSideQuote } from './clientSideSmartOrderRouter'
import { useRoutingAPIArguments } from './useRoutingAPIArguments'

export default function useClientSideSmartOrderRouterTrade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: TradeState
  trade: InterfaceTrade<Currency, Currency, TTradeType> | undefined
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified, otherCurrency, tradeType]
  )

  const queryArgs = useRoutingAPIArguments({
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
    useClientSideRouter: true,
  })

  const [loading, setLoading] = useState(false)
  const [fetchedResult, setFetchedResult] = useState<
    | {
        data: GetQuoteResult
        error?: unknown
      }
    | undefined
  >()

  useEffect(() => {
    async function fetchQuote() {
      if (queryArgs) {
        setLoading(false)
        const result = await getClientSideQuote(queryArgs)
        setFetchedResult({
          data: result.data,
          error: result.error,
        })
      }
    }
    setLoading(true)
    fetchQuote()
  }, [queryArgs])

  const [quoteResult, error] = useMemo(() => {
    return fetchedResult ? [fetchedResult.data, fetchedResult.error] : [undefined, undefined]
  }, [fetchedResult])

  const route = useMemo(
    () => computeRoutes(currencyIn, currencyOut, tradeType, quoteResult),
    [currencyIn, currencyOut, quoteResult, tradeType]
  )

  // get USD gas cost of trade in active chains stablecoin amount
  const gasUseEstimateUSD = useStablecoinAmountFromFiatValue(quoteResult?.gasUseEstimateUSD) ?? null

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
      }
    }

    if (loading && !quoteResult) {
      // only on first hook render
      return {
        state: TradeState.LOADING,
        trade: undefined,
      }
    }

    const otherAmount =
      tradeType === TradeType.EXACT_INPUT
        ? currencyOut && quoteResult
          ? CurrencyAmount.fromRawAmount(currencyOut, quoteResult.quote)
          : undefined
        : currencyIn && quoteResult
        ? CurrencyAmount.fromRawAmount(currencyIn, quoteResult.quote)
        : undefined

    if (error || !otherAmount || !route || route.length === 0 || !queryArgs) {
      return {
        state: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
      }
    }

    try {
      const trade = transformRoutesToTrade(route, tradeType, gasUseEstimateUSD)
      return {
        // always return VALID regardless of isFetching status
        state: TradeState.VALID,
        trade,
      }
    } catch (e) {
      console.debug('transformRoutesToTrade failed: ', e)
      return { state: TradeState.INVALID, trade: undefined }
    }
  }, [currencyIn, currencyOut, loading, quoteResult, tradeType, error, route, queryArgs, gasUseEstimateUSD])
}
