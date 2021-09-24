/* eslint-disable @typescript-eslint/no-unused-vars */
import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import {
  AlphaRouter,
  AlphaRouterConfig,
  CachingTokenListProvider,
  EIP1559GasPriceProvider,
  HeuristicGasModelFactory,
  ICache,
  ID_TO_CHAIN_ID,
  IMetric,
  MetricLoggerUnit,
  PoolProvider,
  QuoteProvider,
  setGlobalMetric,
  SwapRoute,
  UniswapMulticallProvider,
  URISubgraphProvider,
} from '@uniswap/smart-order-router'
import { Trade } from '@uniswap/v3-sdk'
import { useEffect, useMemo, useState } from 'react'
import { V3TradeState } from 'state/routing/types'
import { useFreshData } from 'state/routing/useRoutingAPITrade'
import {getQuote} from 'utils/routerWorkerWrapper'

import { useActiveWeb3React } from './web3'

const DEFAULT_ROUTING_CONFIG: AlphaRouterConfig = {
  topN: 2,
  topNDirectSwaps: 2,
  topNTokenInOut: 3,
  topNSecondHop: 0,
  topNWithEachBaseToken: 3,
  topNWithBaseToken: 6,
  topNWithBaseTokenInSet: false,
  maxSwapsPerPath: 3,
  minSplits: 1,
  maxSplits: 7,
  distributionPercent: 5,
}

class Cache<T> implements ICache<T> {
  async get(key: string) {
    return undefined
  }
  async set(key: string, value: T) {
    return false
  }
  async has(key: string) {
    return false
  }
}

class MetricLogger extends IMetric {
  putDimensions() {
    return
  }

  putMetric(key: string, value: number, unit?: MetricLoggerUnit) {
    console.info({ key, value, unit }, `[Metric]: ${key}: ${value} | ${unit ? unit : ''}`)
  }
}
setGlobalMetric(new MetricLogger())

function useRouter() {
  const { chainId, library: provider } = useActiveWeb3React()

  // const provider = useMemo(
  //   () => (chainId ? new ethers.providers.JsonRpcProvider(NETWORK_URLS[chainId as SupportedChainId]) : undefined),
  //   [chainId]
  // )

  const subgraphProvider = useMemo(
    () =>
      chainId
        ? new URISubgraphProvider(chainId, 'https://ipfs.io/ipfs/QmfArMYESGVJpPALh4eQXnjF8HProSF1ky3v8RmuYLJZT4')
        : undefined,
    [chainId]
  )

  const multicall2Provider = useMemo(
    () => (chainId && provider ? new UniswapMulticallProvider(chainId, provider, 375_000) : undefined),
    [chainId, provider]
  )

  const poolProvider = useMemo(
    () => (chainId && multicall2Provider ? new PoolProvider(ID_TO_CHAIN_ID(chainId), multicall2Provider) : undefined),
    [chainId, multicall2Provider]
  )

  const gasStationProvider = useMemo(() => (provider ? new EIP1559GasPriceProvider(provider) : undefined), [provider])

  const tokenListProvider = useMemo(
    () => (chainId ? new CachingTokenListProvider(chainId, DEFAULT_TOKEN_LIST, new Cache()) : undefined),
    [chainId]
  )

  const router = useMemo(
    () =>
      chainId &&
      provider &&
      subgraphProvider &&
      multicall2Provider &&
      poolProvider &&
      tokenListProvider &&
      gasStationProvider
        ? new AlphaRouter({
            chainId,
            provider,
            subgraphProvider,
            multicall2Provider,
            poolProvider,
            quoteProvider: new QuoteProvider(
              chainId,
              provider,
              multicall2Provider,
              {
                retries: 2,
                minTimeout: 100,
                maxTimeout: 1000,
              },
              {
                multicallChunk: 210, // 210
                gasLimitPerCall: 705_000, // 705
                quoteMinSuccessRate: 0.15,
              },
              {
                gasLimitOverride: 2_000_000,
                multicallChunk: 70,
              }
            ),
            gasPriceProvider: gasStationProvider,
            gasModelFactory: new HeuristicGasModelFactory(),
            blockedTokenListProvider: undefined,
            tokenProvider: tokenListProvider,
          })
        : undefined,
    [chainId, gasStationProvider, multicall2Provider, poolProvider, provider, subgraphProvider, tokenListProvider]
  )

  return router
}

function useTrade(
  tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT,
  amount?: CurrencyAmount<Currency>,
  currencyIn?: Currency,
  currencyOut?: Currency
) {
  const [swapRoute, setSwapRoute] =
    useState<SwapRoute<TradeType.EXACT_INPUT> | SwapRoute<TradeType.EXACT_OUTPUT> | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (!router || !currencyIn || !currencyOut || !amount) {
      return
    }

    setIsLoading(true)
    setIsError(false)
    ;(async () => {
      console.time('smart order router')

      try {
        const swapRouteResponse =
          tradeType === TradeType.EXACT_INPUT
            ? await router.routeExactIn(currencyIn, currencyOut, amount, undefined, DEFAULT_ROUTING_CONFIG)
            : await router.routeExactOut(currencyIn, currencyOut, amount, undefined, DEFAULT_ROUTING_CONFIG)
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

    //TODO prevent multiple calls?
  }, [amount, currencyIn, currencyOut, router, tradeType])

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
