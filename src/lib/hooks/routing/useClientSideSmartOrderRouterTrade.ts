import { skipToken } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { ChainId } from '@uniswap/smart-order-router'
import { useStablecoinAmountFromFiatValue } from 'hooks/useUSDCPrice'
import ms from 'ms.macro'
import { useMemo } from 'react'
import { GetQuoteResult, InterfaceTrade, TradeState } from 'state/routing/types'
import { computeRoutes, transformRoutesToTrade } from 'state/routing/utils'

import useActiveWeb3React from '../useActiveWeb3React'
import useBlockNumber from '../useBlockNumber'
import { useGetQuoteQuery } from './slice'
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

export function useFreshData<T>(data: T, dataBlockNumber: number, maxBlockAge = 10): T | undefined {
  const localBlockNumber = useBlockNumber()

  if (!localBlockNumber) return undefined
  if (localBlockNumber - dataBlockNumber > maxBlockAge) {
    return undefined
  }

  return data
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
  const config = useMemo(() => getConfig(chainId), [chainId])

  // Need populated params and config to pass to local api, otherwise entire argument should be undefined.
  const formattedArgs = useMemo(() => {
    if (!params || !config || !queryArgs) return undefined
    return {
      ...queryArgs,
      params,
      config,
    }
  }, [config, params, queryArgs])

  const { isLoading, isError, data, currentData } = useGetQuoteQuery(formattedArgs ?? skipToken, {
    pollingInterval: ms`15s`,
    refetchOnFocus: true,
  })

  const isSyncing = currentData !== data

  const quoteResult: GetQuoteResult | undefined = useFreshData(data, Number(data?.blockNumber) || 0)

  const route = useMemo(
    () => computeRoutes(currencyIn, currencyOut, tradeType, quoteResult),
    [currencyIn, currencyOut, quoteResult, tradeType]
  )
  const gasUseEstimateUSD = useStablecoinAmountFromFiatValue(quoteResult?.gasUseEstimateUSD) ?? null

  const trade = useMemo(() => {
    if (route) {
      try {
        return route && transformRoutesToTrade(route, tradeType, gasUseEstimateUSD)
      } catch (e: unknown) {
        console.debug('transformRoutesToTrade failed: ', e)
      }
    }
    return
  }, [gasUseEstimateUSD, route, tradeType])

  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: TradeState.INVALID,
        trade: undefined,
      }
    }

    if (isLoading && !quoteResult) {
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

    if (isError || !otherAmount || !route || route.length === 0 || !queryArgs) {
      return {
        state: TradeState.NO_ROUTE_FOUND,
        trade: undefined,
      }
    }

    try {
      return {
        // always return VALID regardless of isFetching status
        state: isSyncing ? TradeState.SYNCING : TradeState.VALID,
        trade,
      }
    } catch (e) {
      return { state: TradeState.INVALID, trade: undefined }
    }
  }, [currencyIn, currencyOut, isLoading, quoteResult, tradeType, isError, route, queryArgs, isSyncing, trade])
}
