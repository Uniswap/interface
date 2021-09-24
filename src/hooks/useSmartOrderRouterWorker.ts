/* eslint-disable @typescript-eslint/no-unused-vars */
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import {
  SwapRoute
} from '@uniswap/smart-order-router'
import { Trade } from '@uniswap/v3-sdk'
import * as Comlink from 'comlink'
import { useEffect, useMemo, useState } from 'react'
import { V3TradeState } from 'state/routing/types'
import { useFreshData } from 'state/routing/useRoutingAPITrade'
import Worker from 'worker-loader!../utils/routerWorker'

import { useActiveWeb3React } from './web3'


function useTrade(
  tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT,
  amount?: CurrencyAmount<Currency>,
  currencyIn?: Currency,
  currencyOut?: Currency
) {
  const { chainId } = useActiveWeb3React()
  const [swapRoute, setSwapRoute] =
    useState<SwapRoute<TradeType.EXACT_INPUT> | SwapRoute<TradeType.EXACT_OUTPUT> | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const worker = useMemo(() => {
    const worker = new Worker()
    //todo: type
    return Comlink.wrap(worker) as any
  },  [/*chainId*/])

  useEffect(() => {
    if (!currencyIn || !currencyOut || !amount) {
      return
    }

    setIsLoading(true)
    setIsError(false)
    ;(async () => {
      console.time('smart order router')

      try {
        const swapRouteResponse = await worker.getQuote(tradeType, currencyIn.wrapped.address, currencyOut.wrapped.address, amount.toSignificant(), chainId)
        console.log(swapRouteResponse)
        setSwapRoute(swapRouteResponse ?? undefined)
      } catch (e) {
        console.log(e)
        setIsError(true)
        setSwapRoute(undefined)
      } finally {
        setIsLoading(false)

        console.timeEnd('smart order router')
      }
    })()

    //TODO prevent multiple calls
  }, [amount, chainId, currencyIn, currencyOut, tradeType, worker])

  return { data: swapRoute, isLoading, isError }
}

/**
 * Returns the best v3 trade by invoking the routing api
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
export function useSmartOrderTrade(
  tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT,
  amountSpecified?: CurrencyAmount<Currency>,
  otherCurrency?: Currency
): {
  state: V3TradeState
  trade: Trade<Currency, Currency, TradeType.EXACT_INPUT> | Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | null
} {
  const [currencyIn, currencyOut]: [Currency | undefined, Currency | undefined] = useMemo(
    () =>
      tradeType === TradeType.EXACT_INPUT
        ? [amountSpecified?.currency, otherCurrency]
        : [otherCurrency, amountSpecified?.currency],
    [amountSpecified, otherCurrency, tradeType]
  )

  const { isLoading, isError, data } = useTrade(tradeType, amountSpecified, currencyIn, currencyOut)
  const freshData = useFreshData(data, Number(data?.blockNumber) || 0)

  // const routes = useMemo(
  //   () => computeRoutes(currencyIn, currencyOut, quoteResult),
  //   [currencyIn, currencyOut, quoteResult]
  // )


  return useMemo(() => {
    if (!currencyIn || !currencyOut) {
      return {
        state: V3TradeState.INVALID,
        trade: null,
      }
    }

    if (isLoading) {
      return {
        state: V3TradeState.LOADING,
        trade: null,
      }
    }

    if (isError || !freshData) {
      return {
        state: V3TradeState.NO_ROUTE_FOUND,
        trade: null,
      }
    }

    return {
      // always return VALID regardless of isFetching status
      state: V3TradeState.VALID,
      trade: freshData.trade,
    }
  }, [currencyIn, currencyOut, isLoading, isError, freshData])
}
