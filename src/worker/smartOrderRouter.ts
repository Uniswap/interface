import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list'
import { BigintIsh, Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import {
  AlphaRouter,
  AlphaRouterConfig,
  CachingGasStationProvider,
  CachingTokenListProvider,
  EIP1559GasPriceProvider,
  HeuristicGasModelFactory,
  ICache,
  ID_TO_CHAIN_ID,
  IMetric,
  MetricLoggerUnit,
  PoolProvider,
  QuoteProvider,
  routeAmountsToString,
  setGlobalMetric, SwapRoute, UniswapMulticallProvider,
  URISubgraphProvider
} from '@uniswap/smart-order-router'
import * as Comlink from 'comlink'
import { NETWORK_URLS } from 'connectors/constants'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
import { GetQuoteResult } from 'state/routing/types'

type TokenInRoute = Pick<Token, 'address' | 'chainId' | 'symbol' | 'decimals'>
type PoolInRoute = {
  type: 'v3-pool'
  address: string
  tokenIn: TokenInRoute
  tokenOut: TokenInRoute
  sqrtRatioX96: string
  liquidity: string
  tickCurrent: string
  fee: string
  amountIn?: string
  amountOut?: string
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
  async get() {
    return undefined
  }
  async set() {
    return false
  }
  async has() {
    return false
  }
}

const chainId = 1
const provider = new ethers.providers.JsonRpcProvider(NETWORK_URLS[chainId])

const subgraphProvider = new URISubgraphProvider(chainId, 'https://ipfs.io/ipfs/QmfArMYESGVJpPALh4eQXnjF8HProSF1ky3v8RmuYLJZT4')

const multicall2Provider =
  new UniswapMulticallProvider(chainId, provider, 375_000)

const poolProvider = new PoolProvider(ID_TO_CHAIN_ID(chainId), multicall2Provider)

const tokenListProvider = new CachingTokenListProvider(chainId, DEFAULT_TOKEN_LIST, new Cache())

const router = new AlphaRouter({
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
  gasPriceProvider: new CachingGasStationProvider(chainId, new EIP1559GasPriceProvider(provider), new Cache()),
  gasModelFactory: new HeuristicGasModelFactory(),
  blockedTokenListProvider: undefined,
  tokenProvider: tokenListProvider,
})

function processSwapRoute(tradeType: TradeType,
  amount: CurrencyAmount<Currency>,
  {
    quote,
    quoteGasAdjusted,
    route,
    estimatedGasUsed,
    estimatedGasUsedQuoteToken,
    estimatedGasUsedUSD,
    gasPriceWei,
    methodParameters,
    blockNumber,
  }: SwapRoute<TradeType.EXACT_INPUT> | SwapRoute<TradeType.EXACT_OUTPUT>) {
  const routeResponse: Array<PoolInRoute[]> = [];

  for (const subRoute of route) {
    const {
      route: { tokenPath, pools },
      amount,
      quote,
    } = subRoute;

    const curRoute: PoolInRoute[] = [];
    for (let i = 0; i < pools.length; i++) {
      const nextPool = pools[i];
      const tokenIn = tokenPath[i];
      const tokenOut = tokenPath[i + 1];

      let edgeAmountIn = undefined;
      if (i == 0) {
        edgeAmountIn =
          tradeType === TradeType.EXACT_INPUT
            ? amount.quotient.toString()
            : quote.quotient.toString();
      }

      let edgeAmountOut = undefined;
      if (i == pools.length - 1) {
        edgeAmountOut =
          tradeType === TradeType.EXACT_OUTPUT
            ? quote.quotient.toString()
            : amount.quotient.toString();
      }

      curRoute.push({
        type: 'v3-pool',
        address: poolProvider.getPoolAddress(
          nextPool.token0,
          nextPool.token1,
          nextPool.fee
        ).poolAddress,
        tokenIn: { chainId: tokenIn.chainId, decimals: tokenIn.decimals, address: tokenIn.address, symbol: tokenIn.symbol },
        tokenOut: { chainId: tokenOut.chainId, decimals: tokenOut.decimals, address: tokenOut.address, symbol: tokenOut.symbol },
        fee: nextPool.fee.toString(),
        liquidity: nextPool.liquidity.toString(),
        sqrtRatioX96: nextPool.sqrtRatioX96.toString(),
        tickCurrent: nextPool.tickCurrent.toString(),
        amountIn: edgeAmountIn,
        amountOut: edgeAmountOut,
      });
    }

    routeResponse.push(curRoute);
  }

  const result: GetQuoteResult = {
    methodParameters,
    amount: amount.quotient.toString(),
    amountDecimals: amount.toExact(),
    blockNumber: blockNumber.toString(),
    quote: quote.quotient.toString(),
    quoteDecimals: quote.toExact(),
    quoteGasAdjusted: quoteGasAdjusted.quotient.toString(),
    quoteGasAdjustedDecimals: quoteGasAdjusted.toExact(),
    gasUseEstimateQuote: estimatedGasUsedQuoteToken.quotient.toString(),
    gasUseEstimateQuoteDecimals: estimatedGasUsedQuoteToken.toExact(),
    gasUseEstimate: estimatedGasUsed.toString(),
    gasUseEstimateUSD: estimatedGasUsedUSD.toExact(),
    gasPriceWei: gasPriceWei.toString(),
    route: routeResponse,
    routeString: routeAmountsToString(route),
  };

  return result
}

const service = {
  async getQuote({
    tradeType,
    tokenIn,
    tokenOut,
    amount: amountRaw,
  }: {
    tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT
    tokenIn: { address: string, chainId: number, decimals: number, symbol?: string }
    tokenOut: { address: string, chainId: number, decimals: number, symbol?: string }
    amount: BigintIsh
  }) {
    const currencyIn = new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol)
    const currencyOut = new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals, tokenOut.symbol)
    const amount = CurrencyAmount.fromRawAmount(currencyIn, JSBI.BigInt(amountRaw))

    const swapRoute = tradeType === TradeType.EXACT_INPUT ?
      await router.routeExactIn(currencyIn, currencyOut, amount, undefined, DEFAULT_ROUTING_CONFIG) :
      await router.routeExactOut(currencyIn, currencyOut, amount, undefined, DEFAULT_ROUTING_CONFIG)

    return swapRoute ? processSwapRoute(tradeType, amount, swapRoute) : undefined
  },
}

export type GetQuoteWorkerType = typeof service

Comlink.expose(service)
