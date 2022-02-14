import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { ChainId } from '@uniswap/smart-order-router'
import { useStablecoinAmountFromFiatValue } from 'hooks/useUSDCPrice'
import { useEffect, useMemo, useState } from 'react'
import { GetQuoteResult, InterfaceTrade, TradeState } from 'state/routing/types'
import { computeRoutes, transformRoutesToTrade } from 'state/routing/utils'

import useActiveWeb3React from '../useActiveWeb3React'
import { getClientSideQuote } from './clientSideSmartOrderRouter'
import { useRoutingAPIArguments } from './useRoutingAPIArguments'

/**
 * Reduces client-side latency by increasing the minimum percentage of the input token to use for each route in a split route while SOR is used client-side.
 * Defaults are defined in https://github.com/Uniswap/smart-order-router/blob/309e6f6603984d3b5aef0733b0cfaf129c29f602/src/routers/alpha-router/config.ts#L83.
 */
const DistributionPercents: { [key: number]: number } = {
  [ChainId.MAINNET]: 10,
  [ChainId.OPTIMISM]: 10,
  [ChainId.OPTIMISTIC_KOVAN]: 10,
  [ChainId.ARBITRUM_ONE]: 25,
  [ChainId.ARBITRUM_RINKEBY]: 25,
}

const DEFAULT_DISTRIBUTION_PERCENT = 10

function getConfig(chainId: ChainId | undefined) {
  return {
    // Limit to only V2 and V3.
    protocols: [Protocol.V2, Protocol.V3],

    distributionPercent: (chainId && DistributionPercents[chainId]) ?? DEFAULT_DISTRIBUTION_PERCENT,
  }
}

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

  const config = useMemo(() => getConfig(chainId), [chainId])

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
  }, [queryArgs, params, config])

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
