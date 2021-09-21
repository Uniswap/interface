import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import {
  AlphaRouter,
  AlphaRouterConfig,
  EIP1559GasPriceProvider,
  HeuristicGasModelFactory,
  ID_TO_CHAIN_ID,
  PoolProvider,
  QuoteProvider,
  SubgraphProvider,
  SwapRoute,
  TokenListProvider,
  UniswapMulticallProvider,
} from '@uniswap/smart-order-router'
import { Trade } from '@uniswap/v3-sdk'
import ms from 'ms.macro'
import { useEffect, useMemo, useState } from 'react'
import { V3TradeState } from 'state/routing/types'
import { useFreshData } from 'state/routing/useRoutingAPITrade'
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

/**
 * Returns query arguments for the Routing API query or undefined if the
 * query should be skipped.
 */
function useRoutingAPIArguments({
  tokenIn,
  tokenOut,
  amount,
  tradeType,
}: {
  tokenIn: Currency | undefined
  tokenOut: Currency | undefined
  amount: CurrencyAmount<Currency> | undefined
  tradeType: TradeType
}) {
  if (!tokenIn || !tokenOut || !amount || tokenIn.equals(tokenOut)) {
    return undefined
  }

  return {
    tokenInAddress: tokenIn.wrapped.address,
    tokenInChainId: tokenIn.chainId,
    tokenOutAddress: tokenOut.wrapped.address,
    tokenOutChainId: tokenOut.chainId,
    amount: amount.quotient.toString(),
    type: (tradeType === TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut') as 'exactIn' | 'exactOut',
  }
}

function useRouter() {
  const { chainId, library: provider } = useActiveWeb3React()

  // const provider = useMemo(
  //   () => (chainId ? new ethers.providers.JsonRpcProvider(NETWORK_URLS[chainId as SupportedChainId]) : undefined),
  //   [chainId]
  // )

  const subgraphProvider = useMemo(() => (chainId ? new SubgraphProvider(chainId, 1, ms`2m`) : undefined), [chainId])

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
    () => (chainId ? new TokenListProvider(chainId, DEFAULT_TOKEN_LIST) : undefined),
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
      console.log('smart order router')

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
        console.log('judo done!')
        setIsLoading(false)

        console.log('smart order router')
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

  const queryArgs = useRoutingAPIArguments({
    tokenIn: currencyIn,
    tokenOut: currencyOut,
    amount: amountSpecified,
    tradeType,
  })

  const { isLoading, isError, data } = useTrade(tradeType, amountSpecified, currencyIn, currencyOut)
  // const { isLoading, isError, data } = useGetQuoteQuery(queryArgs ?? skipToken, {
  //   pollingInterval: ms`10s`,
  //   refetchOnFocus: true,
  // })

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

    if (isError || !queryArgs || !freshData) {
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
  }, [currencyIn, currencyOut, isLoading, isError, queryArgs, freshData])
}
