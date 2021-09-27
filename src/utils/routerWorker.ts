import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list'
import { BigintIsh, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
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
  setGlobalMetric, UniswapMulticallProvider,
  URISubgraphProvider,
} from '@uniswap/smart-order-router'
import * as Comlink from 'comlink'
import { NETWORK_URLS } from 'connectors/constants'
import { ethers } from 'ethers'
import JSBI from 'jsbi'
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

const chainId = 1
const provider = new ethers.providers.JsonRpcProvider(NETWORK_URLS[chainId])

const subgraphProvider = new URISubgraphProvider(chainId, 'https://ipfs.io/ipfs/QmfArMYESGVJpPALh4eQXnjF8HProSF1ky3v8RmuYLJZT4')

const multicall2Provider =
  new UniswapMulticallProvider(chainId, provider, 375_000)

const poolProvider = new PoolProvider(ID_TO_CHAIN_ID(chainId), multicall2Provider)

const gasStationProvider = new EIP1559GasPriceProvider(provider)

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
 

const obj = {
  async getQuote(
    tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT,
    tokenIn: Pick<Token, 'address' | 'chainId' | 'decimals' | 'symbol'>,
    tokenOut: Pick<Token, 'address' | 'chainId' | 'decimals' | 'symbol'>,
    amount: BigintIsh
  ) {
    const currencyIn = new Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol)
    const currencyOut = new Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals, tokenOut.symbol)
    const currencyAmount = CurrencyAmount.fromRawAmount(currencyIn, JSBI.BigInt(amount))

    const res = tradeType === TradeType.EXACT_INPUT ? await router.routeExactIn(currencyIn, currencyOut, currencyAmount, undefined, DEFAULT_ROUTING_CONFIG)
      : await router.routeExactOut(currencyIn, currencyOut, currencyAmount, undefined, DEFAULT_ROUTING_CONFIG)

   return JSON.stringify(res)
  },
}

Comlink.expose(obj)
