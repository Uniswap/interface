import { BigNumber } from '@ethersproject/bignumber'
import { BaseProvider, JsonRpcProvider } from '@ethersproject/providers'
import DEFAULT_TOKEN_LIST from '@ubeswap/default-token-list'
import { ChainId, Currency, Fraction, Token, TradeType } from '@ubeswap/sdk-core'
import { Protocol, SwapRouter, Trade, ZERO } from '@uniswap/router-sdk'
import { TokenList } from '@uniswap/token-lists'
import { Pool, Position, SqrtPriceMath, TickMath } from '@uniswap/v3-sdk'
import retry from 'async-retry'
import JSBI from 'jsbi'
import _ from 'lodash'
import NodeCache from 'node-cache'

import {
  CacheMode,
  CachedRoutes,
  CachingGasStationProvider,
  CachingTokenProviderWithFallback,
  CachingV2PoolProvider,
  CachingV2SubgraphProvider,
  CachingV3PoolProvider,
  CachingV3SubgraphProvider,
  EIP1559GasPriceProvider,
  ETHGasStationInfoProvider,
  IOnChainQuoteProvider,
  IRouteCachingProvider,
  ISwapRouterProvider,
  ITokenPropertiesProvider,
  IV2QuoteProvider,
  IV2SubgraphProvider,
  LegacyGasPriceProvider,
  NodeJSCache,
  OnChainGasPriceProvider,
  OnChainQuoteProvider,
  Simulator,
  StaticV2SubgraphProvider,
  StaticV3SubgraphProvider,
  SwapRouterProvider,
  TokenPropertiesProvider,
  UniswapMulticallProvider,
  V2QuoteProvider,
  V2SubgraphProvider,
  V2SubgraphProviderWithFallBacks,
  V3SubgraphProvider,
  V3SubgraphProviderWithFallBacks,
} from '../../providers'
import { CachingTokenListProvider, ITokenListProvider } from '../../providers/caching-token-list-provider'
import { GasPrice, IGasPriceProvider } from '../../providers/gas-price-provider'
import { IPortionProvider, PortionProvider } from '../../providers/portion-provider'
import { ProviderConfig } from '../../providers/provider'
import { OnChainTokenFeeFetcher } from '../../providers/token-fee-fetcher'
import { ITokenProvider, TokenProvider } from '../../providers/token-provider'
import { ITokenValidatorProvider, TokenValidatorProvider } from '../../providers/token-validator-provider'
import { IV2PoolProvider, V2PoolProvider } from '../../providers/v2/pool-provider'
import {
  ArbitrumGasData,
  ArbitrumGasDataProvider,
  IL2GasDataProvider,
  OptimismGasData,
  OptimismGasDataProvider,
} from '../../providers/v3/gas-data-provider'
import { IV3PoolProvider, V3PoolProvider } from '../../providers/v3/pool-provider'
import { IV3SubgraphProvider } from '../../providers/v3/subgraph-provider'
import { Erc20__factory } from '../../types/other/factories/Erc20__factory'
import { SWAP_ROUTER_02_ADDRESSES, WRAPPED_NATIVE_CURRENCY } from '../../util'
import { CurrencyAmount } from '../../util/amounts'
import { ID_TO_CHAIN_ID, V2_SUPPORTED } from '../../util/chains'
import { getHighestLiquidityV3NativePool, getHighestLiquidityV3USDPool } from '../../util/gas-factory-helpers'
import { buildSwapMethodParameters, buildTrade } from '../../util/methodParameters'
import { MetricLoggerUnit, metric } from '../../util/metric'
import { UNSUPPORTED_TOKENS } from '../../util/unsupported-tokens'
import {
  IRouter,
  ISwapToRatio,
  MethodParameters,
  MixedRoute,
  SwapAndAddConfig,
  SwapAndAddOptions,
  SwapAndAddParameters,
  SwapOptions,
  SwapRoute,
  SwapToRatioResponse,
  SwapToRatioStatus,
  V2Route,
  V3Route,
} from '../router'

import { DEFAULT_ROUTING_CONFIG_BY_CHAIN, ETH_GAS_STATION_API_URL } from './config'
import { MixedRouteWithValidQuote, RouteWithValidQuote, V3RouteWithValidQuote } from './entities/route-with-valid-quote'
import { BestSwapRoute, getBestSwapRoute } from './functions/best-swap-route'
import { calculateRatioAmountIn } from './functions/calculate-ratio-amount-in'
import {
  CandidatePoolsBySelectionCriteria,
  PoolId,
  V2CandidatePools,
  V3CandidatePools,
  getV2CandidatePools,
  getV3CandidatePools,
} from './functions/get-candidate-pools'
import {
  IGasModel,
  IOnChainGasModelFactory,
  IV2GasModelFactory,
  LiquidityCalculationPools,
} from './gas-models/gas-model'
import { MixedRouteHeuristicGasModelFactory } from './gas-models/mixedRoute/mixed-route-heuristic-gas-model'
import { V2HeuristicGasModelFactory } from './gas-models/v2/v2-heuristic-gas-model'
import { NATIVE_OVERHEAD } from './gas-models/v3/gas-costs'
import { V3HeuristicGasModelFactory } from './gas-models/v3/v3-heuristic-gas-model'
import { GetQuotesResult, MixedQuoter, V2Quoter, V3Quoter } from './quoters'

export type AlphaRouterParams = {
  /**
   * The chain id for this instance of the Alpha Router.
   */
  chainId: ChainId
  /**
   * The Web3 provider for getting on-chain data.
   */
  provider: BaseProvider
  /**
   * The provider to use for making multicalls. Used for getting on-chain data
   * like pools, tokens, quotes in batch.
   */
  multicall2Provider?: UniswapMulticallProvider
  /**
   * The provider for getting all pools that exist on V3 from the Subgraph. The pools
   * from this provider are filtered during the algorithm to a set of candidate pools.
   */
  v3SubgraphProvider?: IV3SubgraphProvider
  /**
   * The provider for getting data about V3 pools.
   */
  v3PoolProvider?: IV3PoolProvider
  /**
   * The provider for getting V3 quotes.
   */
  onChainQuoteProvider?: IOnChainQuoteProvider
  /**
   * The provider for getting all pools that exist on V2 from the Subgraph. The pools
   * from this provider are filtered during the algorithm to a set of candidate pools.
   */
  v2SubgraphProvider?: IV2SubgraphProvider
  /**
   * The provider for getting data about V2 pools.
   */
  v2PoolProvider?: IV2PoolProvider
  /**
   * The provider for getting V3 quotes.
   */
  v2QuoteProvider?: IV2QuoteProvider
  /**
   * The provider for getting data about Tokens.
   */
  tokenProvider?: ITokenProvider
  /**
   * The provider for getting the current gas price to use when account for gas in the
   * algorithm.
   */
  gasPriceProvider?: IGasPriceProvider
  /**
   * A factory for generating a gas model that is used when estimating the gas used by
   * V3 routes.
   */
  v3GasModelFactory?: IOnChainGasModelFactory
  /**
   * A factory for generating a gas model that is used when estimating the gas used by
   * V2 routes.
   */
  v2GasModelFactory?: IV2GasModelFactory
  /**
   * A factory for generating a gas model that is used when estimating the gas used by
   * V3 routes.
   */
  mixedRouteGasModelFactory?: IOnChainGasModelFactory
  /**
   * A token list that specifies Token that should be blocked from routing through.
   * Defaults to Uniswap's unsupported token list.
   */
  blockedTokenListProvider?: ITokenListProvider

  /**
   * Calls lens function on SwapRouter02 to determine ERC20 approval types for
   * LP position tokens.
   */
  swapRouterProvider?: ISwapRouterProvider

  /**
   * Calls the optimism gas oracle contract to fetch constants for calculating the l1 security fee.
   */
  optimismGasDataProvider?: IL2GasDataProvider<OptimismGasData>

  /**
   * A token validator for detecting fee-on-transfer tokens or tokens that can't be transferred.
   */
  tokenValidatorProvider?: ITokenValidatorProvider

  /**
   * Calls the arbitrum gas data contract to fetch constants for calculating the l1 fee.
   */
  arbitrumGasDataProvider?: IL2GasDataProvider<ArbitrumGasData>

  /**
   * Simulates swaps and returns new SwapRoute with updated gas estimates.
   */
  simulator?: Simulator

  /**
   * A provider for caching the best route given an amount, quoteToken, tradeType
   */
  routeCachingProvider?: IRouteCachingProvider

  /**
   * A provider for getting token properties for special tokens like fee-on-transfer tokens.
   */
  tokenPropertiesProvider?: ITokenPropertiesProvider

  /**
   * A provider for computing the portion-related data for routes and quotes.
   */
  portionProvider?: IPortionProvider
}

export class MapWithLowerCaseKey<V> extends Map<string, V> {
  override set(key: string, value: V): this {
    return super.set(key.toLowerCase(), value)
  }
}

export class LowerCaseStringArray extends Array<string> {
  constructor(...items: string[]) {
    // Convert all items to lowercase before calling the parent constructor
    super(...items.map((item) => item.toLowerCase()))
  }
}

/**
 * Determines the pools that the algorithm will consider when finding the optimal swap.
 *
 * All pools on each protocol are filtered based on the heuristics specified here to generate
 * the set of candidate pools. The Top N pools are taken by Total Value Locked (TVL).
 *
 * Higher values here result in more pools to explore which results in higher latency.
 */
export type ProtocolPoolSelection = {
  /**
   * The top N pools by TVL out of all pools on the protocol.
   */
  topN: number
  /**
   * The top N pools by TVL of pools that consist of tokenIn and tokenOut.
   */
  topNDirectSwaps: number
  /**
   * The top N pools by TVL of pools where one token is tokenIn and the
   * top N pools by TVL of pools where one token is tokenOut tokenOut.
   */
  topNTokenInOut: number
  /**
   * Given the topNTokenInOut pools, gets the top N pools that involve the other token.
   * E.g. for a WETH -> USDC swap, if topNTokenInOut found WETH -> DAI and WETH -> USDT,
   * a value of 2 would find the top 2 pools that involve DAI and top 2 pools that involve USDT.
   */
  topNSecondHop: number
  /**
   * Given the topNTokenInOut pools and a token address,
   * gets the top N pools that involve the other token.
   * If token address is not on the list, we default to topNSecondHop.
   * E.g. for a WETH -> USDC swap, if topNTokenInOut found WETH -> DAI and WETH -> USDT,
   * and there's a mapping USDT => 4, but no mapping for DAI
   * it would find the top 4 pools that involve USDT, and find the topNSecondHop pools that involve DAI
   */
  topNSecondHopForTokenAddress?: MapWithLowerCaseKey<number>
  /**
   * List of token addresses to avoid using as a second hop.
   * There might be multiple reasons why we would like to avoid a specific token,
   *   but the specific reason that we are trying to solve is when the pool is not synced properly
   *   e.g. when the pool has a rebasing token that isn't syncing the pool on every rebase.
   */
  tokensToAvoidOnSecondHops?: LowerCaseStringArray
  /**
   * The top N pools for token in and token out that involve a token from a list of
   * hardcoded 'base tokens'. These are standard tokens such as WETH, USDC, DAI, etc.
   * This is similar to how the legacy routing algorithm used by Uniswap would select
   * pools and is intended to make the new pool selection algorithm close to a superset
   * of the old algorithm.
   */
  topNWithEachBaseToken: number
  /**
   * Given the topNWithEachBaseToken pools, takes the top N pools from the full list.
   * E.g. for a WETH -> USDC swap, if topNWithEachBaseToken found WETH -0.05-> DAI,
   * WETH -0.01-> DAI, WETH -0.05-> USDC, WETH -0.3-> USDC, a value of 2 would reduce
   * this set to the top 2 pools from that full list.
   */
  topNWithBaseToken: number
}

export type AlphaRouterConfig = {
  /**
   * The block number to use for all on-chain data. If not provided, the router will
   * use the latest block returned by the provider.
   */
  blockNumber?: number | Promise<number>
  /**
   * The protocols to consider when finding the optimal swap. If not provided all protocols
   * will be used.
   */
  protocols?: Protocol[]
  /**
   * Config for selecting which pools to consider routing via on V2.
   */
  v2PoolSelection: ProtocolPoolSelection
  /**
   * Config for selecting which pools to consider routing via on V3.
   */
  v3PoolSelection: ProtocolPoolSelection
  /**
   * For each route, the maximum number of hops to consider. More hops will increase latency of the algorithm.
   */
  maxSwapsPerPath: number
  /**
   * The maximum number of splits in the returned route. A higher maximum will increase latency of the algorithm.
   */
  maxSplits: number
  /**
   * The minimum number of splits in the returned route.
   * This parameters should always be set to 1. It is only included for testing purposes.
   */
  minSplits: number
  /**
   * Forces the returned swap to route across all protocols.
   * This parameter should always be false. It is only included for testing purposes.
   */
  forceCrossProtocol: boolean
  /**
   * Force the alpha router to choose a mixed route swap.
   * Default will be falsy. It is only included for testing purposes.
   */
  forceMixedRoutes?: boolean
  /**
   * The minimum percentage of the input token to use for each route in a split route.
   * All routes will have a multiple of this value. For example is distribution percentage is 5,
   * a potential return swap would be:
   *
   * 5% of input => Route 1
   * 55% of input => Route 2
   * 40% of input => Route 3
   */
  distributionPercent: number
  /**
   * Flag to indicate whether to use the cached routes or not.
   * By default, the cached routes will be used.
   */
  useCachedRoutes?: boolean
  /**
   * Flag to indicate whether to write to the cached routes or not.
   * By default, the cached routes will be written to.
   */
  writeToCachedRoutes?: boolean
  /**
   * Flag to indicate whether to use the CachedRoutes in optimistic mode.
   * Optimistic mode means that we will allow blocksToLive greater than 1.
   */
  optimisticCachedRoutes?: boolean
  /**
   * Debug param that helps to see the short-term latencies improvements without impacting the main path.
   */
  debugRouting?: boolean
  /**
   * Flag that allow us to override the cache mode.
   */
  overwriteCacheMode?: CacheMode
  /**
   * Flag for token properties provider to enable fetching fee-on-transfer tokens.
   */
  enableFeeOnTransferFeeFetching?: boolean
  /**
   * Tenderly natively support save simulation failures if failed,
   * we need this as a pass-through flag to enable/disable this feature.
   */
  saveTenderlySimulationIfFailed?: boolean
}

export class AlphaRouter implements IRouter<AlphaRouterConfig>, ISwapToRatio<AlphaRouterConfig, SwapAndAddConfig> {
  protected chainId: ChainId
  protected provider: BaseProvider
  protected multicall2Provider: UniswapMulticallProvider
  protected v3SubgraphProvider: IV3SubgraphProvider
  protected v3PoolProvider: IV3PoolProvider
  protected onChainQuoteProvider: IOnChainQuoteProvider
  protected v2SubgraphProvider: IV2SubgraphProvider
  protected v2QuoteProvider: IV2QuoteProvider
  protected v2PoolProvider: IV2PoolProvider
  protected tokenProvider: ITokenProvider
  protected gasPriceProvider: IGasPriceProvider
  protected swapRouterProvider: ISwapRouterProvider
  protected v3GasModelFactory: IOnChainGasModelFactory
  protected v2GasModelFactory: IV2GasModelFactory
  protected mixedRouteGasModelFactory: IOnChainGasModelFactory
  protected tokenValidatorProvider?: ITokenValidatorProvider
  protected blockedTokenListProvider?: ITokenListProvider
  protected l2GasDataProvider?: IL2GasDataProvider<OptimismGasData> | IL2GasDataProvider<ArbitrumGasData>
  protected simulator?: Simulator
  protected v2Quoter: V2Quoter
  protected v3Quoter: V3Quoter
  protected mixedQuoter: MixedQuoter
  protected routeCachingProvider?: IRouteCachingProvider
  protected tokenPropertiesProvider: ITokenPropertiesProvider
  protected portionProvider: IPortionProvider

  constructor({
    chainId,
    provider,
    multicall2Provider,
    v3PoolProvider,
    onChainQuoteProvider,
    v2PoolProvider,
    v2QuoteProvider,
    v2SubgraphProvider,
    tokenProvider,
    blockedTokenListProvider,
    v3SubgraphProvider,
    gasPriceProvider,
    v3GasModelFactory,
    v2GasModelFactory,
    mixedRouteGasModelFactory,
    swapRouterProvider,
    optimismGasDataProvider,
    tokenValidatorProvider,
    arbitrumGasDataProvider,
    simulator,
    routeCachingProvider,
    tokenPropertiesProvider,
    portionProvider,
  }: AlphaRouterParams) {
    this.chainId = chainId
    this.provider = provider
    this.multicall2Provider = multicall2Provider ?? new UniswapMulticallProvider(chainId, provider, 375_000)
    this.v3PoolProvider =
      v3PoolProvider ??
      new CachingV3PoolProvider(
        this.chainId,
        new V3PoolProvider(ID_TO_CHAIN_ID(chainId), this.multicall2Provider),
        new NodeJSCache(new NodeCache({ stdTTL: 360, useClones: false }))
      )
    this.simulator = simulator
    this.routeCachingProvider = routeCachingProvider

    if (onChainQuoteProvider) {
      this.onChainQuoteProvider = onChainQuoteProvider
    } else {
      switch (chainId) {
        case ChainId.OPTIMISM:
        case ChainId.OPTIMISM_GOERLI:
          this.onChainQuoteProvider = new OnChainQuoteProvider(
            chainId,
            provider,
            this.multicall2Provider,
            {
              retries: 2,
              minTimeout: 100,
              maxTimeout: 1000,
            },
            {
              multicallChunk: 110,
              gasLimitPerCall: 1_200_000,
              quoteMinSuccessRate: 0.1,
            },
            {
              gasLimitOverride: 3_000_000,
              multicallChunk: 45,
            },
            {
              gasLimitOverride: 3_000_000,
              multicallChunk: 45,
            },
            {
              baseBlockOffset: -10,
              rollback: {
                enabled: true,
                attemptsBeforeRollback: 1,
                rollbackBlockOffset: -10,
              },
            }
          )
          break
        case ChainId.BASE:
        case ChainId.BASE_GOERLI:
          this.onChainQuoteProvider = new OnChainQuoteProvider(
            chainId,
            provider,
            this.multicall2Provider,
            {
              retries: 2,
              minTimeout: 100,
              maxTimeout: 1000,
            },
            {
              multicallChunk: 80,
              gasLimitPerCall: 1_200_000,
              quoteMinSuccessRate: 0.1,
            },
            {
              gasLimitOverride: 3_000_000,
              multicallChunk: 45,
            },
            {
              gasLimitOverride: 3_000_000,
              multicallChunk: 45,
            },
            {
              baseBlockOffset: -10,
              rollback: {
                enabled: true,
                attemptsBeforeRollback: 1,
                rollbackBlockOffset: -10,
              },
            }
          )
          break
        case ChainId.ARBITRUM_ONE:
        case ChainId.ARBITRUM_GOERLI:
          this.onChainQuoteProvider = new OnChainQuoteProvider(
            chainId,
            provider,
            this.multicall2Provider,
            {
              retries: 2,
              minTimeout: 100,
              maxTimeout: 1000,
            },
            {
              multicallChunk: 10,
              gasLimitPerCall: 12_000_000,
              quoteMinSuccessRate: 0.1,
            },
            {
              gasLimitOverride: 30_000_000,
              multicallChunk: 6,
            },
            {
              gasLimitOverride: 30_000_000,
              multicallChunk: 6,
            }
          )
          break
        case ChainId.CELO:
        case ChainId.CELO_ALFAJORES:
          this.onChainQuoteProvider = new OnChainQuoteProvider(
            chainId,
            provider,
            this.multicall2Provider,
            {
              retries: 2,
              minTimeout: 100,
              maxTimeout: 1000,
            },
            {
              multicallChunk: 10,
              gasLimitPerCall: 5_000_000,
              quoteMinSuccessRate: 0.1,
            },
            {
              gasLimitOverride: 5_000_000,
              multicallChunk: 5,
            },
            {
              gasLimitOverride: 6_250_000,
              multicallChunk: 4,
            }
          )
          break
        default:
          this.onChainQuoteProvider = new OnChainQuoteProvider(
            chainId,
            provider,
            this.multicall2Provider,
            {
              retries: 2,
              minTimeout: 100,
              maxTimeout: 1000,
            },
            {
              multicallChunk: 210,
              gasLimitPerCall: 705_000,
              quoteMinSuccessRate: 0.15,
            },
            {
              gasLimitOverride: 2_000_000,
              multicallChunk: 70,
            }
          )
          break
      }
    }

    if (tokenValidatorProvider) {
      this.tokenValidatorProvider = tokenValidatorProvider
    } else if (this.chainId === ChainId.MAINNET) {
      this.tokenValidatorProvider = new TokenValidatorProvider(
        this.chainId,
        this.multicall2Provider,
        new NodeJSCache(new NodeCache({ stdTTL: 30000, useClones: false }))
      )
    }
    if (tokenPropertiesProvider) {
      this.tokenPropertiesProvider = tokenPropertiesProvider
    } else {
      this.tokenPropertiesProvider = new TokenPropertiesProvider(
        this.chainId,
        new NodeJSCache(new NodeCache({ stdTTL: 86400, useClones: false })),
        new OnChainTokenFeeFetcher(this.chainId, provider)
      )
    }
    this.v2PoolProvider =
      v2PoolProvider ??
      new CachingV2PoolProvider(
        chainId,
        new V2PoolProvider(chainId, this.multicall2Provider, this.tokenPropertiesProvider),
        new NodeJSCache(new NodeCache({ stdTTL: 60, useClones: false }))
      )

    this.v2QuoteProvider = v2QuoteProvider ?? new V2QuoteProvider()

    this.blockedTokenListProvider =
      blockedTokenListProvider ??
      new CachingTokenListProvider(
        chainId,
        UNSUPPORTED_TOKENS as TokenList,
        new NodeJSCache(new NodeCache({ stdTTL: 3600, useClones: false }))
      )
    this.tokenProvider =
      tokenProvider ??
      new CachingTokenProviderWithFallback(
        chainId,
        new NodeJSCache(new NodeCache({ stdTTL: 3600, useClones: false })),
        new CachingTokenListProvider(
          chainId,
          DEFAULT_TOKEN_LIST,
          new NodeJSCache(new NodeCache({ stdTTL: 3600, useClones: false }))
        ),
        new TokenProvider(chainId, this.multicall2Provider)
      )
    this.portionProvider = portionProvider ?? new PortionProvider()

    // const chainName = ID_TO_NETWORK_NAME(chainId)

    // ipfs urls in the following format: `https://cloudflare-ipfs.com/ipns/api.uniswap.org/v1/pools/${protocol}/${chainName}.json`;
    if (v2SubgraphProvider) {
      this.v2SubgraphProvider = v2SubgraphProvider
    } else {
      this.v2SubgraphProvider = new V2SubgraphProviderWithFallBacks([
        new CachingV2SubgraphProvider(
          chainId,
          new V2SubgraphProvider(chainId),
          new NodeJSCache(new NodeCache({ stdTTL: 300, useClones: false }))
        ),
        new StaticV2SubgraphProvider(chainId),
      ])
    }

    if (v3SubgraphProvider) {
      this.v3SubgraphProvider = v3SubgraphProvider
    } else {
      this.v3SubgraphProvider = new V3SubgraphProviderWithFallBacks([
        new CachingV3SubgraphProvider(
          chainId,
          new V3SubgraphProvider(chainId),
          new NodeJSCache(new NodeCache({ stdTTL: 300, useClones: false }))
        ),
        new StaticV3SubgraphProvider(chainId, this.v3PoolProvider),
      ])
    }

    let gasPriceProviderInstance: IGasPriceProvider
    if (JsonRpcProvider.isProvider(this.provider)) {
      gasPriceProviderInstance = new OnChainGasPriceProvider(
        chainId,
        new EIP1559GasPriceProvider(this.provider as JsonRpcProvider),
        new LegacyGasPriceProvider(this.provider as JsonRpcProvider)
      )
    } else {
      gasPriceProviderInstance = new ETHGasStationInfoProvider(ETH_GAS_STATION_API_URL)
    }

    this.gasPriceProvider =
      gasPriceProvider ??
      new CachingGasStationProvider(
        chainId,
        gasPriceProviderInstance,
        new NodeJSCache<GasPrice>(new NodeCache({ stdTTL: 7, useClones: false }))
      )
    this.v3GasModelFactory = v3GasModelFactory ?? new V3HeuristicGasModelFactory()
    this.v2GasModelFactory = v2GasModelFactory ?? new V2HeuristicGasModelFactory()
    this.mixedRouteGasModelFactory = mixedRouteGasModelFactory ?? new MixedRouteHeuristicGasModelFactory()

    this.swapRouterProvider = swapRouterProvider ?? new SwapRouterProvider(this.multicall2Provider, this.chainId)

    if (chainId === ChainId.OPTIMISM || chainId === ChainId.BASE) {
      this.l2GasDataProvider = optimismGasDataProvider ?? new OptimismGasDataProvider(chainId, this.multicall2Provider)
    }
    if (chainId === ChainId.ARBITRUM_ONE || chainId === ChainId.ARBITRUM_GOERLI) {
      this.l2GasDataProvider = arbitrumGasDataProvider ?? new ArbitrumGasDataProvider(chainId, this.provider)
    }

    // Initialize the Quoters.
    // Quoters are an abstraction encapsulating the business logic of fetching routes and quotes.
    this.v2Quoter = new V2Quoter(
      this.v2SubgraphProvider,
      this.v2PoolProvider,
      this.v2QuoteProvider,
      this.v2GasModelFactory,
      this.tokenProvider,
      this.chainId,
      this.blockedTokenListProvider,
      this.tokenValidatorProvider
    )

    this.v3Quoter = new V3Quoter(
      this.v3SubgraphProvider,
      this.v3PoolProvider,
      this.onChainQuoteProvider,
      this.tokenProvider,
      this.chainId,
      this.blockedTokenListProvider,
      this.tokenValidatorProvider
    )

    this.mixedQuoter = new MixedQuoter(
      this.v3SubgraphProvider,
      this.v3PoolProvider,
      this.v2SubgraphProvider,
      this.v2PoolProvider,
      this.onChainQuoteProvider,
      this.tokenProvider,
      this.chainId,
      this.blockedTokenListProvider,
      this.tokenValidatorProvider
    )
  }

  public async routeToRatio(
    token0Balance: CurrencyAmount,
    token1Balance: CurrencyAmount,
    position: Position,
    swapAndAddConfig: SwapAndAddConfig,
    swapAndAddOptions?: SwapAndAddOptions,
    routingConfig: Partial<AlphaRouterConfig> = DEFAULT_ROUTING_CONFIG_BY_CHAIN(this.chainId)
  ): Promise<SwapToRatioResponse> {
    if (token1Balance.currency.wrapped.sortsBefore(token0Balance.currency.wrapped)) {
      ;[token0Balance, token1Balance] = [token1Balance, token0Balance]
    }

    let preSwapOptimalRatio = this.calculateOptimalRatio(position, position.pool.sqrtRatioX96, true)
    // set up parameters according to which token will be swapped
    let zeroForOne: boolean
    if (position.pool.tickCurrent > position.tickUpper) {
      zeroForOne = true
    } else if (position.pool.tickCurrent < position.tickLower) {
      zeroForOne = false
    } else {
      zeroForOne = new Fraction(token0Balance.quotient, token1Balance.quotient).greaterThan(preSwapOptimalRatio)
      if (!zeroForOne) preSwapOptimalRatio = preSwapOptimalRatio.invert()
    }

    const [inputBalance, outputBalance] = zeroForOne ? [token0Balance, token1Balance] : [token1Balance, token0Balance]

    let optimalRatio = preSwapOptimalRatio
    let postSwapTargetPool = position.pool
    let exchangeRate: Fraction = zeroForOne ? position.pool.token0Price : position.pool.token1Price
    let swap: SwapRoute | null = null
    let ratioAchieved = false
    let n = 0
    // iterate until we find a swap with a sufficient ratio or return null
    while (!ratioAchieved) {
      n++
      if (n > swapAndAddConfig.maxIterations) {
        console.log('max iterations exceeded')
        return {
          status: SwapToRatioStatus.NO_ROUTE_FOUND,
          error: 'max iterations exceeded',
        }
      }

      const amountToSwap = calculateRatioAmountIn(optimalRatio, exchangeRate, inputBalance, outputBalance)
      if (amountToSwap.equalTo(0)) {
        console.log(`no swap needed: amountToSwap = 0`)
        return {
          status: SwapToRatioStatus.NO_SWAP_NEEDED,
        }
      }
      swap = await this.route(amountToSwap, outputBalance.currency, TradeType.EXACT_INPUT, undefined, {
        ...DEFAULT_ROUTING_CONFIG_BY_CHAIN(this.chainId),
        ...routingConfig,
        /// @dev We do not want to query for mixedRoutes for routeToRatio as they are not supported
        /// [Protocol.V3, Protocol.V2] will make sure we only query for V3 and V2
        protocols: [Protocol.V3, Protocol.V2],
      })
      if (!swap) {
        console.log('no route found from this.route()')
        return {
          status: SwapToRatioStatus.NO_ROUTE_FOUND,
          error: 'no route found',
        }
      }

      const inputBalanceUpdated = inputBalance.subtract(swap.trade!.inputAmount)
      const outputBalanceUpdated = outputBalance.add(swap.trade!.outputAmount)
      const newRatio = inputBalanceUpdated.divide(outputBalanceUpdated)

      let targetPoolPriceUpdate
      swap.route.forEach((route) => {
        if (route.protocol === Protocol.V3) {
          const v3Route = route as V3RouteWithValidQuote
          v3Route.route.pools.forEach((pool, i) => {
            if (
              pool.token0.equals(position.pool.token0) &&
              pool.token1.equals(position.pool.token1) &&
              pool.fee === position.pool.fee
            ) {
              targetPoolPriceUpdate = JSBI.BigInt(v3Route.sqrtPriceX96AfterList[i]!.toString())
              optimalRatio = this.calculateOptimalRatio(
                position,
                JSBI.BigInt(targetPoolPriceUpdate!.toString()),
                zeroForOne
              )
            }
          })
        }
      })
      if (!targetPoolPriceUpdate) {
        optimalRatio = preSwapOptimalRatio
      }
      ratioAchieved =
        newRatio.equalTo(optimalRatio) ||
        this.absoluteValue(newRatio.asFraction.divide(optimalRatio).subtract(1)).lessThan(
          swapAndAddConfig.ratioErrorTolerance
        )

      if (ratioAchieved && targetPoolPriceUpdate) {
        postSwapTargetPool = new Pool(
          position.pool.token0,
          position.pool.token1,
          position.pool.fee,
          targetPoolPriceUpdate,
          position.pool.liquidity,
          TickMath.getTickAtSqrtRatio(targetPoolPriceUpdate),
          position.pool.tickDataProvider
        )
      }
      exchangeRate = swap.trade!.outputAmount.divide(swap.trade!.inputAmount)

      console.log(
        {
          exchangeRate: exchangeRate.asFraction.toFixed(18),
          optimalRatio: optimalRatio.asFraction.toFixed(18),
          newRatio: newRatio.asFraction.toFixed(18),
          inputBalanceUpdated: inputBalanceUpdated.asFraction.toFixed(18),
          outputBalanceUpdated: outputBalanceUpdated.asFraction.toFixed(18),
          ratioErrorTolerance: swapAndAddConfig.ratioErrorTolerance.toFixed(18),
          iterationN: n.toString(),
        },
        'QuoteToRatio Iteration Parameters'
      )

      if (exchangeRate.equalTo(0)) {
        console.log('exchangeRate to 0')
        return {
          status: SwapToRatioStatus.NO_ROUTE_FOUND,
          error: 'insufficient liquidity to swap to optimal ratio',
        }
      }
    }

    if (!swap) {
      return {
        status: SwapToRatioStatus.NO_ROUTE_FOUND,
        error: 'no route found',
      }
    }
    let methodParameters: MethodParameters | undefined
    if (swapAndAddOptions) {
      methodParameters = await this.buildSwapAndAddMethodParameters(swap.trade, swapAndAddOptions, {
        initialBalanceTokenIn: inputBalance,
        initialBalanceTokenOut: outputBalance,
        preLiquidityPosition: position,
      })
    }

    return {
      status: SwapToRatioStatus.SUCCESS,
      result: { ...swap, methodParameters, optimalRatio, postSwapTargetPool },
    }
  }

  /**
   * @inheritdoc IRouter
   */
  public async route(
    amount: CurrencyAmount,
    quoteCurrency: Currency,
    tradeType: TradeType,
    swapConfig?: SwapOptions,
    partialRoutingConfig: Partial<AlphaRouterConfig> = {}
  ): Promise<SwapRoute | null> {
    const originalAmount = amount
    if (tradeType === TradeType.EXACT_OUTPUT) {
      const portionAmount = this.portionProvider.getPortionAmount(amount, tradeType, swapConfig)
      if (portionAmount && portionAmount.greaterThan(ZERO)) {
        // In case of exact out swap, before we route, we need to make sure that the
        // token out amount accounts for flat portion, and token in amount after the best swap route contains the token in equivalent of portion.
        // In other words, in case a pool's LP fee bps is lower than the portion bps (0.01%/0.05% for v3), a pool can go insolvency.
        // This is because instead of the swapper being responsible for the portion,
        // the pool instead gets responsible for the portion.
        // The addition below avoids that situation.
        amount = amount.add(portionAmount)
      }
    }

    const { currencyIn, currencyOut } = this.determineCurrencyInOutFromTradeType(tradeType, amount, quoteCurrency)

    const tokenIn = currencyIn.wrapped
    const tokenOut = currencyOut.wrapped

    console.log('chainId', this.chainId)
    console.log('pair', `${tokenIn.symbol}/${tokenOut.symbol}`)
    console.log('tokenIn', tokenIn.address)
    console.log('tokenOut', tokenOut.address)
    console.log('tradeType', tradeType === TradeType.EXACT_INPUT ? 'ExactIn' : 'ExactOut')

    metric.putMetric(`QuoteRequestedForChain${this.chainId}`, 1, MetricLoggerUnit.Count)

    // Get a block number to specify in all our calls. Ensures data we fetch from chain is
    // from the same block.
    const blockNumber = partialRoutingConfig.blockNumber ?? this.getBlockNumberPromise()

    const routingConfig: AlphaRouterConfig = _.merge(
      {
        // These settings could be changed by the partialRoutingConfig
        useCachedRoutes: true,
        writeToCachedRoutes: true,
        optimisticCachedRoutes: false,
        debugRouting: true,
      },
      DEFAULT_ROUTING_CONFIG_BY_CHAIN(this.chainId),
      partialRoutingConfig,
      { blockNumber }
    )

    console.log('routingConfig', JSON.stringify(routingConfig))

    if (routingConfig.debugRouting) {
      console.log(`Finalized routing config is ${JSON.stringify(routingConfig)}`)
    }

    const gasPriceWei = await this.getGasPriceWei()

    const quoteToken = quoteCurrency.wrapped
    const providerConfig: ProviderConfig = {
      ...routingConfig,
      blockNumber,
      additionalGasOverhead: NATIVE_OVERHEAD(this.chainId, amount.currency, quoteCurrency),
    }

    const [v3GasModel, mixedRouteGasModel] = await this.getGasModels(
      gasPriceWei,
      amount.currency.wrapped,
      quoteToken,
      providerConfig
    )

    // Create a Set to sanitize the protocols input, a Set of undefined becomes an empty set,
    // Then create an Array from the values of that Set.
    const protocols: Protocol[] = Array.from(new Set(routingConfig.protocols).values())

    const cacheMode =
      routingConfig.overwriteCacheMode ??
      (await this.routeCachingProvider?.getCacheMode(this.chainId, amount, quoteToken, tradeType, protocols))

    console.log('cacheMode', cacheMode)

    // Fetch CachedRoutes
    let cachedRoutes: CachedRoutes | undefined
    if (routingConfig.useCachedRoutes && cacheMode !== CacheMode.Darkmode) {
      cachedRoutes = await this.routeCachingProvider?.getCachedRoute(
        this.chainId,
        amount,
        quoteToken,
        tradeType,
        protocols,
        await blockNumber,
        routingConfig.optimisticCachedRoutes
      )
    }

    metric.putMetric(
      routingConfig.useCachedRoutes ? 'GetQuoteUsingCachedRoutes' : 'GetQuoteNotUsingCachedRoutes',
      1,
      MetricLoggerUnit.Count
    )

    if (cacheMode && routingConfig.useCachedRoutes && cacheMode !== CacheMode.Darkmode && !cachedRoutes) {
      metric.putMetric(`GetCachedRoute_miss_${cacheMode}`, 1, MetricLoggerUnit.Count)
      console.log(
        {
          tokenIn: tokenIn.symbol,
          tokenInAddress: tokenIn.address,
          tokenOut: tokenOut.symbol,
          tokenOutAddress: tokenOut.address,
          cacheMode,
          amount: amount.toExact(),
          chainId: this.chainId,
          tradeType: this.tradeTypeStr(tradeType),
        },
        `GetCachedRoute miss ${cacheMode} for ${this.tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType)}`
      )
    } else if (cachedRoutes && routingConfig.useCachedRoutes) {
      metric.putMetric(`GetCachedRoute_hit_${cacheMode}`, 1, MetricLoggerUnit.Count)
      console.log(
        {
          tokenIn: tokenIn.symbol,
          tokenInAddress: tokenIn.address,
          tokenOut: tokenOut.symbol,
          tokenOutAddress: tokenOut.address,
          cacheMode,
          amount: amount.toExact(),
          chainId: this.chainId,
          tradeType: this.tradeTypeStr(tradeType),
        },
        `GetCachedRoute hit ${cacheMode} for ${this.tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType)}`
      )
    }

    let swapRouteFromCachePromise: Promise<BestSwapRoute | null> = Promise.resolve(null)
    if (cachedRoutes) {
      swapRouteFromCachePromise = this.getSwapRouteFromCache(
        cachedRoutes,
        await blockNumber,
        amount,
        quoteToken,
        tradeType,
        routingConfig,
        v3GasModel,
        mixedRouteGasModel,
        gasPriceWei,
        swapConfig
      )
    }

    let swapRouteFromChainPromise: Promise<BestSwapRoute | null> = Promise.resolve(null)
    if (!cachedRoutes || cacheMode !== CacheMode.Livemode) {
      swapRouteFromChainPromise = this.getSwapRouteFromChain(
        amount,
        tokenIn,
        tokenOut,
        protocols,
        quoteToken,
        tradeType,
        routingConfig,
        v3GasModel,
        mixedRouteGasModel,
        gasPriceWei,
        swapConfig
      )
    }

    const [swapRouteFromCache, swapRouteFromChain] = await Promise.all([
      swapRouteFromCachePromise,
      swapRouteFromChainPromise,
    ])

    let swapRouteRaw: BestSwapRoute | null
    let hitsCachedRoute = false
    if (cacheMode === CacheMode.Livemode && swapRouteFromCache) {
      console.log(`CacheMode is ${cacheMode}, and we are using swapRoute from cache`)
      hitsCachedRoute = true
      swapRouteRaw = swapRouteFromCache
    } else {
      console.log(`CacheMode is ${cacheMode}, and we are using materialized swapRoute`)
      swapRouteRaw = swapRouteFromChain
    }

    if (cacheMode === CacheMode.Tapcompare && swapRouteFromCache && swapRouteFromChain) {
      const quoteDiff = swapRouteFromChain.quote.subtract(swapRouteFromCache.quote)
      const quoteGasAdjustedDiff = swapRouteFromChain.quoteGasAdjusted.subtract(swapRouteFromCache.quoteGasAdjusted)
      const gasUsedDiff = swapRouteFromChain.estimatedGasUsed.sub(swapRouteFromCache.estimatedGasUsed)

      // Only log if quoteDiff is different from 0, or if quoteGasAdjustedDiff and gasUsedDiff are both different from 0
      if (!quoteDiff.equalTo(0) || !(quoteGasAdjustedDiff.equalTo(0) || gasUsedDiff.eq(0))) {
        // Calculates the percentage of the difference with respect to the quoteFromChain (not from cache)
        const misquotePercent = quoteGasAdjustedDiff.divide(swapRouteFromChain.quoteGasAdjusted).multiply(100)

        metric.putMetric(
          `TapcompareCachedRoute_quoteGasAdjustedDiffPercent`,
          Number(misquotePercent.toExact()),
          MetricLoggerUnit.Percent
        )

        console.log(
          {
            quoteFromChain: swapRouteFromChain.quote.toExact(),
            quoteFromCache: swapRouteFromCache.quote.toExact(),
            quoteDiff: quoteDiff.toExact(),
            quoteGasAdjustedFromChain: swapRouteFromChain.quoteGasAdjusted.toExact(),
            quoteGasAdjustedFromCache: swapRouteFromCache.quoteGasAdjusted.toExact(),
            quoteGasAdjustedDiff: quoteGasAdjustedDiff.toExact(),
            gasUsedFromChain: swapRouteFromChain.estimatedGasUsed.toString(),
            gasUsedFromCache: swapRouteFromCache.estimatedGasUsed.toString(),
            gasUsedDiff: gasUsedDiff.toString(),
            routesFromChain: swapRouteFromChain.routes.toString(),
            routesFromCache: swapRouteFromCache.routes.toString(),
            amount: amount.toExact(),
            originalAmount: cachedRoutes?.originalAmount,
            pair: this.tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType),
            blockNumber,
          },
          `Comparing quotes between Chain and Cache for ${this.tokenPairSymbolTradeTypeChainId(
            tokenIn,
            tokenOut,
            tradeType
          )}`
        )
      }
    }

    if (!swapRouteRaw) {
      return null
    }

    const {
      quote,
      quoteGasAdjusted,
      estimatedGasUsed,
      routes: routeAmounts,
      estimatedGasUsedQuoteToken,
      estimatedGasUsedUSD,
    } = swapRouteRaw

    if (
      this.routeCachingProvider &&
      routingConfig.writeToCachedRoutes &&
      cacheMode !== CacheMode.Darkmode &&
      swapRouteFromChain
    ) {
      // Generate the object to be cached
      const routesToCache = CachedRoutes.fromRoutesWithValidQuotes(
        swapRouteFromChain.routes,
        this.chainId,
        tokenIn,
        tokenOut,
        protocols.sort(), // sort it for consistency in the order of the protocols.
        await blockNumber,
        tradeType,
        amount.toExact()
      )

      if (routesToCache) {
        // Attempt to insert the entry in cache. This is fire and forget promise.
        // The catch method will prevent any exception from blocking the normal code execution.
        this.routeCachingProvider
          .setCachedRoute(routesToCache, amount)
          .then((success) => {
            const status = success ? 'success' : 'rejected'
            metric.putMetric(`SetCachedRoute_${status}`, 1, MetricLoggerUnit.Count)
          })
          .catch((reason) => {
            console.log(
              {
                reason,
                tokenPair: this.tokenPairSymbolTradeTypeChainId(tokenIn, tokenOut, tradeType),
              },
              `SetCachedRoute failure`
            )

            metric.putMetric(`SetCachedRoute_failure`, 1, MetricLoggerUnit.Count)
          })
      } else {
        metric.putMetric(`SetCachedRoute_unnecessary`, 1, MetricLoggerUnit.Count)
      }
    }

    metric.putMetric(`QuoteFoundForChain${this.chainId}`, 1, MetricLoggerUnit.Count)

    // Build Trade object that represents the optimal swap.
    const trade = buildTrade<typeof tradeType>(currencyIn, currencyOut, tradeType, routeAmounts)

    let methodParameters: MethodParameters | undefined

    // If user provided recipient, deadline etc. we also generate the calldata required to execute
    // the swap and return it too.
    if (swapConfig) {
      methodParameters = buildSwapMethodParameters(trade, swapConfig, this.chainId)
    }

    const tokenOutAmount =
      tradeType === TradeType.EXACT_OUTPUT
        ? originalAmount // we need to pass in originalAmount instead of amount, because amount already added portionAmount in case of exact out swap
        : quote
    const portionAmount = this.portionProvider.getPortionAmount(tokenOutAmount, tradeType, swapConfig)
    const portionQuoteAmount = this.portionProvider.getPortionQuoteAmount(
      tradeType,
      quote,
      amount, // we need to pass in amount instead of originalAmount here, because amount here needs to add the portion for exact out
      portionAmount
    )

    // we need to correct quote and quote gas adjusted for exact output when portion is part of the exact out swap
    const correctedQuote = this.portionProvider.getQuote(tradeType, quote, portionQuoteAmount)

    const correctedQuoteGasAdjusted = this.portionProvider.getQuoteGasAdjusted(
      tradeType,
      quoteGasAdjusted,
      portionQuoteAmount
    )
    const quoteGasAndPortionAdjusted = this.portionProvider.getQuoteGasAndPortionAdjusted(
      tradeType,
      quoteGasAdjusted,
      portionAmount
    )
    const swapRoute: SwapRoute = {
      quote: correctedQuote,
      quoteGasAdjusted: correctedQuoteGasAdjusted,
      estimatedGasUsed,
      estimatedGasUsedQuoteToken,
      estimatedGasUsedUSD,
      gasPriceWei,
      route: routeAmounts,
      trade,
      methodParameters,
      blockNumber: BigNumber.from(await blockNumber),
      hitsCachedRoute,
      portionAmount,
      quoteGasAndPortionAdjusted,
    }

    if (swapConfig && swapConfig.simulate && methodParameters && methodParameters.calldata) {
      if (!this.simulator) {
        throw new Error('Simulator not initialized!')
      }
      console.log({ swapConfig, methodParameters }, 'Starting simulation')
      const fromAddress = swapConfig.simulate.fromAddress
      const beforeSimulate = Date.now()
      const swapRouteWithSimulation = await this.simulator.simulate(
        fromAddress,
        swapConfig,
        swapRoute,
        amount,
        // Quote will be in WETH even if quoteCurrency is ETH
        // So we init a new CurrencyAmount object here
        CurrencyAmount.fromRawAmount(quoteCurrency, quote.quotient.toString()),
        this.l2GasDataProvider ? await this.l2GasDataProvider!.getGasData() : undefined,
        providerConfig
      )
      metric.putMetric('SimulateTransaction', Date.now() - beforeSimulate, MetricLoggerUnit.Milliseconds)
      return swapRouteWithSimulation
    }

    return swapRoute
  }

  private async getSwapRouteFromCache(
    cachedRoutes: CachedRoutes,
    blockNumber: number,
    amount: CurrencyAmount,
    quoteToken: Token,
    tradeType: TradeType,
    routingConfig: AlphaRouterConfig,
    v3GasModel: IGasModel<V3RouteWithValidQuote>,
    mixedRouteGasModel: IGasModel<MixedRouteWithValidQuote>,
    gasPriceWei: BigNumber,
    swapConfig?: SwapOptions
  ): Promise<BestSwapRoute | null> {
    console.log(
      {
        protocols: cachedRoutes.protocolsCovered,
        tradeType: cachedRoutes.tradeType,
        cachedBlockNumber: cachedRoutes.blockNumber,
        quoteBlockNumber: blockNumber,
      },
      'Routing across CachedRoute'
    )
    const quotePromises: Promise<GetQuotesResult>[] = []

    const v3Routes = cachedRoutes.routes.filter((route) => route.protocol === Protocol.V3)
    const v2Routes = cachedRoutes.routes.filter((route) => route.protocol === Protocol.V2)
    const mixedRoutes = cachedRoutes.routes.filter((route) => route.protocol === Protocol.MIXED)

    let percents: number[]
    let amounts: CurrencyAmount[]
    if (cachedRoutes.routes.length > 1) {
      // If we have more than 1 route, we will quote the different percents for it, following the regular process
      ;[percents, amounts] = this.getAmountDistribution(amount, routingConfig)
    } else if (cachedRoutes.routes.length == 1) {
      ;[percents, amounts] = [[100], [amount]]
    } else {
      // In this case this means that there's no route, so we return null
      return Promise.resolve(null)
    }

    if (v3Routes.length > 0) {
      const v3RoutesFromCache: V3Route[] = v3Routes.map((cachedRoute) => cachedRoute.route as V3Route)
      metric.putMetric('SwapRouteFromCache_V3_GetQuotes_Request', 1, MetricLoggerUnit.Count)

      const beforeGetQuotes = Date.now()

      quotePromises.push(
        this.v3Quoter
          .getQuotes(v3RoutesFromCache, amounts, percents, quoteToken, tradeType, routingConfig, undefined, v3GasModel)
          .then((result) => {
            metric.putMetric(
              `SwapRouteFromCache_V3_GetQuotes_Load`,
              Date.now() - beforeGetQuotes,
              MetricLoggerUnit.Milliseconds
            )

            return result
          })
      )
    }

    if (v2Routes.length > 0) {
      const v2RoutesFromCache: V2Route[] = v2Routes.map((cachedRoute) => cachedRoute.route as V2Route)
      metric.putMetric('SwapRouteFromCache_V2_GetQuotes_Request', 1, MetricLoggerUnit.Count)

      const beforeGetQuotes = Date.now()

      quotePromises.push(
        this.v2Quoter
          .refreshRoutesThenGetQuotes(
            cachedRoutes.tokenIn,
            cachedRoutes.tokenOut,
            v2RoutesFromCache,
            amounts,
            percents,
            quoteToken,
            tradeType,
            routingConfig,
            gasPriceWei
          )
          .then((result) => {
            metric.putMetric(
              `SwapRouteFromCache_V2_GetQuotes_Load`,
              Date.now() - beforeGetQuotes,
              MetricLoggerUnit.Milliseconds
            )

            return result
          })
      )
    }

    if (mixedRoutes.length > 0) {
      const mixedRoutesFromCache: MixedRoute[] = mixedRoutes.map((cachedRoute) => cachedRoute.route as MixedRoute)
      metric.putMetric('SwapRouteFromCache_Mixed_GetQuotes_Request', 1, MetricLoggerUnit.Count)

      const beforeGetQuotes = Date.now()

      quotePromises.push(
        this.mixedQuoter
          .getQuotes(
            mixedRoutesFromCache,
            amounts,
            percents,
            quoteToken,
            tradeType,
            routingConfig,
            undefined,
            mixedRouteGasModel
          )
          .then((result) => {
            metric.putMetric(
              `SwapRouteFromCache_Mixed_GetQuotes_Load`,
              Date.now() - beforeGetQuotes,
              MetricLoggerUnit.Milliseconds
            )

            return result
          })
      )
    }

    const getQuotesResults = await Promise.all(quotePromises)
    const allRoutesWithValidQuotes = _.flatMap(getQuotesResults, (quoteResult) => quoteResult.routesWithValidQuotes)

    return getBestSwapRoute(
      amount,
      percents,
      allRoutesWithValidQuotes,
      tradeType,
      this.chainId,
      routingConfig,
      this.portionProvider,
      v3GasModel,
      swapConfig
    )
  }

  private async getSwapRouteFromChain(
    amount: CurrencyAmount,
    tokenIn: Token,
    tokenOut: Token,
    protocols: Protocol[],
    quoteToken: Token,
    tradeType: TradeType,
    routingConfig: AlphaRouterConfig,
    v3GasModel: IGasModel<V3RouteWithValidQuote>,
    mixedRouteGasModel: IGasModel<MixedRouteWithValidQuote>,
    gasPriceWei: BigNumber,
    swapConfig?: SwapOptions
  ): Promise<BestSwapRoute | null> {
    // Generate our distribution of amounts, i.e. fractions of the input amount.
    // We will get quotes for fractions of the input amount for different routes, then
    // combine to generate split routes.
    const [percents, amounts] = this.getAmountDistribution(amount, routingConfig)

    const noProtocolsSpecified = protocols.length === 0
    const v3ProtocolSpecified = protocols.includes(Protocol.V3)
    const v2ProtocolSpecified = protocols.includes(Protocol.V2)
    const v2SupportedInChain = V2_SUPPORTED.includes(this.chainId)
    const shouldQueryMixedProtocol = protocols.includes(Protocol.MIXED) || (noProtocolsSpecified && v2SupportedInChain)
    const mixedProtocolAllowed =
      [ChainId.MAINNET, ChainId.CELO].includes(this.chainId) && tradeType === TradeType.EXACT_INPUT

    const beforeGetCandidates = Date.now()

    let v3CandidatePoolsPromise: Promise<V3CandidatePools | undefined> = Promise.resolve(undefined)
    if (v3ProtocolSpecified || noProtocolsSpecified || (shouldQueryMixedProtocol && mixedProtocolAllowed)) {
      console.log('V3333333333333333')
      v3CandidatePoolsPromise = getV3CandidatePools({
        tokenIn,
        tokenOut,
        tokenProvider: this.tokenProvider,
        blockedTokenListProvider: this.blockedTokenListProvider,
        poolProvider: this.v3PoolProvider,
        routeType: tradeType,
        subgraphProvider: this.v3SubgraphProvider,
        routingConfig,
        chainId: this.chainId,
      }).then((candidatePools) => {
        metric.putMetric('GetV3CandidatePools', Date.now() - beforeGetCandidates, MetricLoggerUnit.Milliseconds)
        console.log('V3 candidatePools', candidatePools)
        return candidatePools
      })
    }

    let v2CandidatePoolsPromise: Promise<V2CandidatePools | undefined> = Promise.resolve(undefined)
    if (
      (v2SupportedInChain && (v2ProtocolSpecified || noProtocolsSpecified)) ||
      (shouldQueryMixedProtocol && mixedProtocolAllowed)
    ) {
      // Fetch all the pools that we will consider routing via. There are thousands
      // of pools, so we filter them to a set of candidate pools that we expect will
      // result in good prices.
      console.log('V2222222222222')
      v2CandidatePoolsPromise = getV2CandidatePools({
        tokenIn,
        tokenOut,
        tokenProvider: this.tokenProvider,
        blockedTokenListProvider: this.blockedTokenListProvider,
        poolProvider: this.v2PoolProvider,
        routeType: tradeType,
        subgraphProvider: this.v2SubgraphProvider,
        routingConfig,
        chainId: this.chainId,
      }).then((candidatePools) => {
        metric.putMetric('GetV2CandidatePools', Date.now() - beforeGetCandidates, MetricLoggerUnit.Milliseconds)
        console.log('V2 candidatePools', candidatePools)
        return candidatePools
      })
    }

    const quotePromises: Promise<GetQuotesResult>[] = []

    // Maybe Quote V3 - if V3 is specified, or no protocol is specified
    if (v3ProtocolSpecified || noProtocolsSpecified) {
      console.log({ protocols, tradeType }, 'Routing across V3')

      metric.putMetric('SwapRouteFromChain_V3_GetRoutesThenQuotes_Request', 1, MetricLoggerUnit.Count)
      const beforeGetRoutesThenQuotes = Date.now()

      quotePromises.push(
        v3CandidatePoolsPromise.then((v3CandidatePools) =>
          this.v3Quoter
            .getRoutesThenQuotes(
              tokenIn,
              tokenOut,
              amount,
              amounts,
              percents,
              quoteToken,
              v3CandidatePools!,
              tradeType,
              routingConfig,
              v3GasModel
            )
            .then((result) => {
              metric.putMetric(
                `SwapRouteFromChain_V3_GetRoutesThenQuotes_Load`,
                Date.now() - beforeGetRoutesThenQuotes,
                MetricLoggerUnit.Milliseconds
              )

              return result
            })
        )
      )
    }

    // Maybe Quote V2 - if V2 is specified, or no protocol is specified AND v2 is supported in this chain
    if (v2SupportedInChain && (v2ProtocolSpecified || noProtocolsSpecified)) {
      console.log({ protocols, tradeType }, 'Routing across V2')

      metric.putMetric('SwapRouteFromChain_V2_GetRoutesThenQuotes_Request', 1, MetricLoggerUnit.Count)
      const beforeGetRoutesThenQuotes = Date.now()

      quotePromises.push(
        v2CandidatePoolsPromise.then((v2CandidatePools) =>
          this.v2Quoter
            .getRoutesThenQuotes(
              tokenIn,
              tokenOut,
              amount,
              amounts,
              percents,
              quoteToken,
              v2CandidatePools!,
              tradeType,
              routingConfig,
              undefined,
              gasPriceWei
            )
            .then((result) => {
              metric.putMetric(
                `SwapRouteFromChain_V2_GetRoutesThenQuotes_Load`,
                Date.now() - beforeGetRoutesThenQuotes,
                MetricLoggerUnit.Milliseconds
              )

              return result
            })
        )
      )
    }

    // Maybe Quote mixed routes
    // if MixedProtocol is specified or no protocol is specified and v2 is supported AND tradeType is ExactIn
    // AND is Mainnet or Gorli
    if (shouldQueryMixedProtocol && mixedProtocolAllowed) {
      console.log({ protocols, tradeType }, 'Routing across MixedRoutes')

      metric.putMetric('SwapRouteFromChain_Mixed_GetRoutesThenQuotes_Request', 1, MetricLoggerUnit.Count)
      const beforeGetRoutesThenQuotes = Date.now()

      quotePromises.push(
        Promise.all([v3CandidatePoolsPromise, v2CandidatePoolsPromise]).then(([v3CandidatePools, v2CandidatePools]) =>
          this.mixedQuoter
            .getRoutesThenQuotes(
              tokenIn,
              tokenOut,
              amount,
              amounts,
              percents,
              quoteToken,
              [v3CandidatePools!, v2CandidatePools!],
              tradeType,
              routingConfig,
              mixedRouteGasModel
            )
            .then((result) => {
              metric.putMetric(
                `SwapRouteFromChain_Mixed_GetRoutesThenQuotes_Load`,
                Date.now() - beforeGetRoutesThenQuotes,
                MetricLoggerUnit.Milliseconds
              )

              return result
            })
        )
      )
    }

    const getQuotesResults = await Promise.all(quotePromises)

    const allRoutesWithValidQuotes: RouteWithValidQuote[] = []
    const allCandidatePools: CandidatePoolsBySelectionCriteria[] = []
    getQuotesResults.forEach((getQuoteResult) => {
      allRoutesWithValidQuotes.push(...getQuoteResult.routesWithValidQuotes)
      if (getQuoteResult.candidatePools) {
        allCandidatePools.push(getQuoteResult.candidatePools)
      }
    })

    if (allRoutesWithValidQuotes.length === 0) {
      console.log({ allRoutesWithValidQuotes }, 'Received no valid quotes')
      return null
    }

    // Given all the quotes for all the amounts for all the routes, find the best combination.
    const bestSwapRoute = await getBestSwapRoute(
      amount,
      percents,
      allRoutesWithValidQuotes,
      tradeType,
      this.chainId,
      routingConfig,
      this.portionProvider,
      v3GasModel,
      swapConfig
    )

    if (bestSwapRoute) {
      this.emitPoolSelectionMetrics(bestSwapRoute, allCandidatePools)
    }

    return bestSwapRoute
  }

  private tradeTypeStr(tradeType: TradeType): string {
    return tradeType === TradeType.EXACT_INPUT ? 'ExactIn' : 'ExactOut'
  }

  private tokenPairSymbolTradeTypeChainId(tokenIn: Token, tokenOut: Token, tradeType: TradeType) {
    return `${tokenIn.symbol}/${tokenOut.symbol}/${this.tradeTypeStr(tradeType)}/${this.chainId}`
  }

  private determineCurrencyInOutFromTradeType(tradeType: TradeType, amount: CurrencyAmount, quoteCurrency: Currency) {
    if (tradeType === TradeType.EXACT_INPUT) {
      return {
        currencyIn: amount.currency,
        currencyOut: quoteCurrency,
      }
    } else {
      return {
        currencyIn: quoteCurrency,
        currencyOut: amount.currency,
      }
    }
  }

  private async getGasPriceWei(): Promise<BigNumber> {
    // Track how long it takes to resolve this async call.
    const beforeGasTimestamp = Date.now()

    // Get an estimate of the gas price to use when estimating gas cost of different routes.
    const { gasPriceWei } = await this.gasPriceProvider.getGasPrice()

    metric.putMetric('GasPriceLoad', Date.now() - beforeGasTimestamp, MetricLoggerUnit.Milliseconds)

    return gasPriceWei
  }

  private async getGasModels(
    gasPriceWei: BigNumber,
    amountToken: Token,
    quoteToken: Token,
    providerConfig?: ProviderConfig
  ): Promise<[IGasModel<V3RouteWithValidQuote>, IGasModel<MixedRouteWithValidQuote>]> {
    const beforeGasModel = Date.now()

    const usdPoolPromise = getHighestLiquidityV3USDPool(this.chainId, this.v3PoolProvider, providerConfig)
    const nativeCurrency = WRAPPED_NATIVE_CURRENCY[this.chainId]
    const nativeQuoteTokenV3PoolPromise = !quoteToken.equals(nativeCurrency)
      ? getHighestLiquidityV3NativePool(quoteToken, this.v3PoolProvider, providerConfig)
      : Promise.resolve(null)
    const nativeAmountTokenV3PoolPromise = !amountToken.equals(nativeCurrency)
      ? getHighestLiquidityV3NativePool(amountToken, this.v3PoolProvider, providerConfig)
      : Promise.resolve(null)

    const [usdPool, nativeQuoteTokenV3Pool, nativeAmountTokenV3Pool] = await Promise.all([
      usdPoolPromise,
      nativeQuoteTokenV3PoolPromise,
      nativeAmountTokenV3PoolPromise,
    ])

    const pools: LiquidityCalculationPools = {
      usdPool,
      nativeQuoteTokenV3Pool,
      nativeAmountTokenV3Pool,
    }

    const v3GasModelPromise = this.v3GasModelFactory.buildGasModel({
      chainId: this.chainId,
      gasPriceWei,
      pools,
      amountToken,
      quoteToken,
      v2poolProvider: this.v2PoolProvider,
      l2GasDataProvider: this.l2GasDataProvider,
      providerConfig,
    })

    const mixedRouteGasModelPromise = this.mixedRouteGasModelFactory.buildGasModel({
      chainId: this.chainId,
      gasPriceWei,
      pools,
      amountToken,
      quoteToken,
      v2poolProvider: this.v2PoolProvider,
      providerConfig,
    })

    const [v3GasModel, mixedRouteGasModel] = await Promise.all([v3GasModelPromise, mixedRouteGasModelPromise])

    metric.putMetric('GasModelCreation', Date.now() - beforeGasModel, MetricLoggerUnit.Milliseconds)

    return [v3GasModel, mixedRouteGasModel]
  }

  // Note multiplications here can result in a loss of precision in the amounts (e.g. taking 50% of 101)
  // This is reconcilled at the end of the algorithm by adding any lost precision to one of
  // the splits in the route.
  private getAmountDistribution(
    amount: CurrencyAmount,
    routingConfig: AlphaRouterConfig
  ): [number[], CurrencyAmount[]] {
    const { distributionPercent } = routingConfig
    const percents = []
    const amounts = []

    for (let i = 1; i <= 100 / distributionPercent; i++) {
      percents.push(i * distributionPercent)
      amounts.push(amount.multiply(new Fraction(i * distributionPercent, 100)))
    }

    return [percents, amounts]
  }

  private async buildSwapAndAddMethodParameters(
    trade: Trade<Currency, Currency, TradeType>,
    swapAndAddOptions: SwapAndAddOptions,
    swapAndAddParameters: SwapAndAddParameters
  ): Promise<MethodParameters> {
    const {
      swapOptions: { recipient, slippageTolerance, deadline, inputTokenPermit },
      addLiquidityOptions: addLiquidityConfig,
    } = swapAndAddOptions

    const preLiquidityPosition = swapAndAddParameters.preLiquidityPosition
    const finalBalanceTokenIn = swapAndAddParameters.initialBalanceTokenIn.subtract(trade.inputAmount)
    const finalBalanceTokenOut = swapAndAddParameters.initialBalanceTokenOut.add(trade.outputAmount)
    const approvalTypes = await this.swapRouterProvider.getApprovalType(finalBalanceTokenIn, finalBalanceTokenOut)
    const zeroForOne = finalBalanceTokenIn.currency.wrapped.sortsBefore(finalBalanceTokenOut.currency.wrapped)
    return {
      ...SwapRouter.swapAndAddCallParameters(
        trade,
        {
          recipient,
          slippageTolerance,
          deadlineOrPreviousBlockhash: deadline,
          inputTokenPermit,
        },
        Position.fromAmounts({
          pool: preLiquidityPosition.pool,
          tickLower: preLiquidityPosition.tickLower,
          tickUpper: preLiquidityPosition.tickUpper,
          amount0: zeroForOne ? finalBalanceTokenIn.quotient.toString() : finalBalanceTokenOut.quotient.toString(),
          amount1: zeroForOne ? finalBalanceTokenOut.quotient.toString() : finalBalanceTokenIn.quotient.toString(),
          useFullPrecision: false,
        }),
        addLiquidityConfig,
        approvalTypes.approvalTokenIn,
        approvalTypes.approvalTokenOut
      ),
      to: SWAP_ROUTER_02_ADDRESSES(this.chainId),
    }
  }

  private emitPoolSelectionMetrics(
    swapRouteRaw: {
      quote: CurrencyAmount
      quoteGasAdjusted: CurrencyAmount
      routes: RouteWithValidQuote[]
      estimatedGasUsed: BigNumber
    },
    allPoolsBySelection: CandidatePoolsBySelectionCriteria[]
  ) {
    const poolAddressesUsed = new Set<string>()
    const { routes: routeAmounts } = swapRouteRaw
    _(routeAmounts)
      .flatMap((routeAmount) => {
        const { poolAddresses } = routeAmount
        return poolAddresses
      })
      .forEach((address: string) => {
        poolAddressesUsed.add(address.toLowerCase())
      })

    for (const poolsBySelection of allPoolsBySelection) {
      const { protocol } = poolsBySelection
      _.forIn(poolsBySelection.selections, (pools: PoolId[], topNSelection: string) => {
        const topNUsed = _.findLastIndex(pools, (pool) => poolAddressesUsed.has(pool.id.toLowerCase())) + 1
        metric.putMetric(_.capitalize(`${protocol}${topNSelection}`), topNUsed, MetricLoggerUnit.Count)
      })
    }

    let hasV3Route = false
    let hasV2Route = false
    let hasMixedRoute = false
    for (const routeAmount of routeAmounts) {
      if (routeAmount.protocol === Protocol.V3) {
        hasV3Route = true
      }
      if (routeAmount.protocol === Protocol.V2) {
        hasV2Route = true
      }
      if (routeAmount.protocol === Protocol.MIXED) {
        hasMixedRoute = true
      }
    }

    if (hasMixedRoute && (hasV3Route || hasV2Route)) {
      if (hasV3Route && hasV2Route) {
        metric.putMetric(`MixedAndV3AndV2SplitRoute`, 1, MetricLoggerUnit.Count)
        metric.putMetric(`MixedAndV3AndV2SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count)
      } else if (hasV3Route) {
        metric.putMetric(`MixedAndV3SplitRoute`, 1, MetricLoggerUnit.Count)
        metric.putMetric(`MixedAndV3SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count)
      } else if (hasV2Route) {
        metric.putMetric(`MixedAndV2SplitRoute`, 1, MetricLoggerUnit.Count)
        metric.putMetric(`MixedAndV2SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count)
      }
    } else if (hasV3Route && hasV2Route) {
      metric.putMetric(`V3AndV2SplitRoute`, 1, MetricLoggerUnit.Count)
      metric.putMetric(`V3AndV2SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count)
    } else if (hasMixedRoute) {
      if (routeAmounts.length > 1) {
        metric.putMetric(`MixedSplitRoute`, 1, MetricLoggerUnit.Count)
        metric.putMetric(`MixedSplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count)
      } else {
        metric.putMetric(`MixedRoute`, 1, MetricLoggerUnit.Count)
        metric.putMetric(`MixedRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count)
      }
    } else if (hasV3Route) {
      if (routeAmounts.length > 1) {
        metric.putMetric(`V3SplitRoute`, 1, MetricLoggerUnit.Count)
        metric.putMetric(`V3SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count)
      } else {
        metric.putMetric(`V3Route`, 1, MetricLoggerUnit.Count)
        metric.putMetric(`V3RouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count)
      }
    } else if (hasV2Route) {
      if (routeAmounts.length > 1) {
        metric.putMetric(`V2SplitRoute`, 1, MetricLoggerUnit.Count)
        metric.putMetric(`V2SplitRouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count)
      } else {
        metric.putMetric(`V2Route`, 1, MetricLoggerUnit.Count)
        metric.putMetric(`V2RouteForChain${this.chainId}`, 1, MetricLoggerUnit.Count)
      }
    }
  }

  private calculateOptimalRatio(position: Position, sqrtRatioX96: JSBI, zeroForOne: boolean): Fraction {
    const upperSqrtRatioX96 = TickMath.getSqrtRatioAtTick(position.tickUpper)
    const lowerSqrtRatioX96 = TickMath.getSqrtRatioAtTick(position.tickLower)

    // returns Fraction(0, 1) for any out of range position regardless of zeroForOne. Implication: function
    // cannot be used to determine the trading direction of out of range positions.
    if (JSBI.greaterThan(sqrtRatioX96, upperSqrtRatioX96) || JSBI.lessThan(sqrtRatioX96, lowerSqrtRatioX96)) {
      return new Fraction(0, 1)
    }

    const precision = JSBI.BigInt('1' + '0'.repeat(18))
    let optimalRatio = new Fraction(
      SqrtPriceMath.getAmount0Delta(sqrtRatioX96, upperSqrtRatioX96, precision, true),
      SqrtPriceMath.getAmount1Delta(sqrtRatioX96, lowerSqrtRatioX96, precision, true)
    )
    if (!zeroForOne) optimalRatio = optimalRatio.invert()
    return optimalRatio
  }

  public async userHasSufficientBalance(
    fromAddress: string,
    tradeType: TradeType,
    amount: CurrencyAmount,
    quote: CurrencyAmount
  ): Promise<boolean> {
    try {
      const neededBalance = tradeType === TradeType.EXACT_INPUT ? amount : quote
      let balance
      if (neededBalance.currency.isNative) {
        balance = await this.provider.getBalance(fromAddress)
      } else {
        const tokenContract = Erc20__factory.connect(neededBalance.currency.address, this.provider)
        balance = await tokenContract.balanceOf(fromAddress)
      }
      return balance.gte(BigNumber.from(neededBalance.quotient.toString()))
    } catch (e) {
      console.log(e, 'Error while checking user balance')
      return false
    }
  }

  private absoluteValue(fraction: Fraction): Fraction {
    const numeratorAbs = JSBI.lessThan(fraction.numerator, JSBI.BigInt(0))
      ? JSBI.unaryMinus(fraction.numerator)
      : fraction.numerator
    const denominatorAbs = JSBI.lessThan(fraction.denominator, JSBI.BigInt(0))
      ? JSBI.unaryMinus(fraction.denominator)
      : fraction.denominator
    return new Fraction(numeratorAbs, denominatorAbs)
  }

  private getBlockNumberPromise(): number | Promise<number> {
    return retry(
      async (_b, attempt) => {
        if (attempt > 1) {
          console.log(`Get block number attempt ${attempt}`)
        }
        return this.provider.getBlockNumber()
      },
      {
        retries: 2,
        minTimeout: 100,
        maxTimeout: 1000,
      }
    )
  }
}
