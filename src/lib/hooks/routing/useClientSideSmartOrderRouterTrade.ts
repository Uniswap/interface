import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useStablecoinAmountFromFiatValue } from 'hooks/useUSDCPrice'
import { useEffect, useMemo, useState } from 'react'
import { GetQuoteResult, InterfaceTrade, TradeState } from 'state/routing/types'
import { computeRoutes, transformRoutesToTrade } from 'state/routing/utils'

import useActiveWeb3React from '../useActiveWeb3React'
import { getClientSideQuote } from './clientSideSmartOrderRouter'
import { useRoutingAPIArguments } from './useRoutingAPIArguments'

const protocols: Protocol[] = [Protocol.V2, Protocol.V3]
const config = { protocols }

export default function useClientSideSmartOrderRouterTrade<TTradeType extends TradeType>(
  tradeType: TTradeType,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: TradeState
  trade: InterfaceTrade<Currency, Currency, TTradeType> | undefined
} {
  const chainId = amountSpecified?.currency.chainId
  const { library } = useActiveWeb3React()

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
  const params = useMemo(() => chainId && library && { chainId, provider: library }, [chainId, library])

  const [loading, setLoading] = useState(false)
  const [{ quoteResult, error }, setFetchedResult] = useState<{
    quoteResult: GetQuoteResult | undefined
    error: unknown
  }>({
    quoteResult: undefined,
    error: undefined,
  })

  // When arguments update, make a new call to SOR for updated quote
  useEffect(() => {
    setLoading(true)
    fetchQuote()

    async function fetchQuote() {
      try {
        if (queryArgs && params) {
          const result = await getClientSideQuote(queryArgs, params, config)
          setFetchedResult({
            quoteResult: result.data,
            error: result.error,
          })
        }
      } catch (e) {
        setFetchedResult({
          quoteResult: undefined,
          error: true,
        })
      } finally {
        setLoading(false)
      }
    }
  }, [queryArgs, params])

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

    let otherAmount = undefined
    if (tradeType === TradeType.EXACT_INPUT && currencyOut && quoteResult) {
      otherAmount = CurrencyAmount.fromRawAmount(currencyOut, quoteResult.quote)
    }
    if (tradeType === TradeType.EXACT_OUTPUT && currencyIn && quoteResult) {
      otherAmount = CurrencyAmount.fromRawAmount(currencyIn, quoteResult.quote)
    }

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
