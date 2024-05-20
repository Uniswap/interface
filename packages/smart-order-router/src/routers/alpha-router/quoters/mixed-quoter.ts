import { ChainId, Currency, Token, TradeType } from '@ubeswap/sdk-core'
import { Protocol } from '@uniswap/router-sdk'
import _ from 'lodash'

import {
  IOnChainQuoteProvider,
  ITokenListProvider,
  ITokenProvider,
  ITokenValidatorProvider,
  IV2PoolProvider,
  IV2SubgraphProvider,
  IV3PoolProvider,
  IV3SubgraphProvider,
  TokenValidationResult,
} from '../../../providers'
import { CurrencyAmount, MetricLoggerUnit, log, metric, routeToString } from '../../../util'
import { MixedRoute } from '../../router'
import { AlphaRouterConfig } from '../alpha-router'
import { MixedRouteWithValidQuote } from '../entities'
import { computeAllMixedRoutes } from '../functions/compute-all-routes'
import {
  CandidatePoolsBySelectionCriteria,
  V2CandidatePools,
  V3CandidatePools,
  getMixedRouteCandidatePools,
} from '../functions/get-candidate-pools'
import { IGasModel } from '../gas-models'

import { BaseQuoter } from './base-quoter'
import { GetQuotesResult, GetRoutesResult } from './model'

export class MixedQuoter extends BaseQuoter<[V3CandidatePools, V2CandidatePools], MixedRoute> {
  protected v3SubgraphProvider: IV3SubgraphProvider
  protected v3PoolProvider: IV3PoolProvider
  protected v2SubgraphProvider: IV2SubgraphProvider
  protected v2PoolProvider: IV2PoolProvider
  protected onChainQuoteProvider: IOnChainQuoteProvider

  constructor(
    v3SubgraphProvider: IV3SubgraphProvider,
    v3PoolProvider: IV3PoolProvider,
    v2SubgraphProvider: IV2SubgraphProvider,
    v2PoolProvider: IV2PoolProvider,
    onChainQuoteProvider: IOnChainQuoteProvider,
    tokenProvider: ITokenProvider,
    chainId: ChainId,
    blockedTokenListProvider?: ITokenListProvider,
    tokenValidatorProvider?: ITokenValidatorProvider
  ) {
    super(tokenProvider, chainId, Protocol.MIXED, blockedTokenListProvider, tokenValidatorProvider)
    this.v3SubgraphProvider = v3SubgraphProvider
    this.v3PoolProvider = v3PoolProvider
    this.v2SubgraphProvider = v2SubgraphProvider
    this.v2PoolProvider = v2PoolProvider
    this.onChainQuoteProvider = onChainQuoteProvider
  }

  protected async getRoutes(
    tokenIn: Token,
    tokenOut: Token,
    v3v2candidatePools: [V3CandidatePools, V2CandidatePools],
    tradeType: TradeType,
    routingConfig: AlphaRouterConfig
  ): Promise<GetRoutesResult<MixedRoute>> {
    const beforeGetRoutes = Date.now()

    if (tradeType != TradeType.EXACT_INPUT) {
      throw new Error('Mixed route quotes are not supported for EXACT_OUTPUT')
    }

    const [v3CandidatePools, v2CandidatePools] = v3v2candidatePools

    const {
      V2poolAccessor,
      V3poolAccessor,
      candidatePools: mixedRouteCandidatePools,
    } = await getMixedRouteCandidatePools({
      v3CandidatePools,
      v2CandidatePools,
      tokenProvider: this.tokenProvider,
      v3poolProvider: this.v3PoolProvider,
      v2poolProvider: this.v2PoolProvider,
      routingConfig,
      chainId: this.chainId,
    })

    const V3poolsRaw = V3poolAccessor.getAllPools()
    const V2poolsRaw = V2poolAccessor.getAllPools()

    const poolsRaw = [...V3poolsRaw, ...V2poolsRaw]

    const candidatePools = mixedRouteCandidatePools

    // Drop any pools that contain fee on transfer tokens (not supported by v3) or have issues with being transferred.
    const pools = await this.applyTokenValidatorToPools(
      poolsRaw,
      (token: Currency, tokenValidation: TokenValidationResult | undefined): boolean => {
        // If there is no available validation result we assume the token is fine.
        if (!tokenValidation) {
          return false
        }

        // Only filters out *intermediate* pools that involve tokens that we detect
        // cant be transferred. This prevents us trying to route through tokens that may
        // not be transferrable, but allows users to still swap those tokens if they
        // specify.
        //
        if (tokenValidation == TokenValidationResult.STF && (token.equals(tokenIn) || token.equals(tokenOut))) {
          return false
        }

        return tokenValidation == TokenValidationResult.FOT || tokenValidation == TokenValidationResult.STF
      }
    )

    const { maxSwapsPerPath } = routingConfig

    const routes = computeAllMixedRoutes(tokenIn, tokenOut, pools, maxSwapsPerPath)

    metric.putMetric('MixedGetRoutesLoad', Date.now() - beforeGetRoutes, MetricLoggerUnit.Milliseconds)

    return {
      routes,
      candidatePools,
    }
  }

  public async getQuotes(
    routes: MixedRoute[],
    amounts: CurrencyAmount[],
    percents: number[],
    quoteToken: Token,
    tradeType: TradeType,
    routingConfig: AlphaRouterConfig,
    candidatePools?: CandidatePoolsBySelectionCriteria,
    gasModel?: IGasModel<MixedRouteWithValidQuote>
  ): Promise<GetQuotesResult> {
    const beforeGetQuotes = Date.now()
    log.info('Starting to get mixed quotes')
    if (gasModel === undefined) {
      throw new Error('GasModel for MixedRouteWithValidQuote is required to getQuotes')
    }
    if (routes.length == 0) {
      return { routesWithValidQuotes: [], candidatePools }
    }

    // For all our routes, and all the fractional amounts, fetch quotes on-chain.
    const quoteFn = this.onChainQuoteProvider.getQuotesManyExactIn.bind(this.onChainQuoteProvider)

    const beforeQuotes = Date.now()
    log.info(`Getting quotes for mixed for ${routes.length} routes with ${amounts.length} amounts per route.`)

    const { routesWithQuotes } = await quoteFn<MixedRoute>(amounts, routes, {
      blockNumber: routingConfig.blockNumber,
    })

    metric.putMetric('MixedQuotesLoad', Date.now() - beforeQuotes, MetricLoggerUnit.Milliseconds)

    metric.putMetric(
      'MixedQuotesFetched',
      _(routesWithQuotes)
        .map(([, quotes]) => quotes.length)
        .sum(),
      MetricLoggerUnit.Count
    )

    const routesWithValidQuotes = []

    for (const routeWithQuote of routesWithQuotes) {
      const [route, quotes] = routeWithQuote

      for (let i = 0; i < quotes.length; i++) {
        const percent = percents[i]!
        const amountQuote = quotes[i]!
        const { quote, amount, sqrtPriceX96AfterList, initializedTicksCrossedList, gasEstimate } = amountQuote

        if (!quote || !sqrtPriceX96AfterList || !initializedTicksCrossedList || !gasEstimate) {
          log.debug(
            {
              route: routeToString(route),
              amountQuote,
            },
            'Dropping a null mixed quote for route.'
          )
          continue
        }

        const routeWithValidQuote = new MixedRouteWithValidQuote({
          route,
          rawQuote: quote,
          amount,
          percent,
          sqrtPriceX96AfterList,
          initializedTicksCrossedList,
          quoterGasEstimate: gasEstimate,
          mixedRouteGasModel: gasModel,
          quoteToken,
          tradeType,
          v3PoolProvider: this.v3PoolProvider,
          v2PoolProvider: this.v2PoolProvider,
        })

        routesWithValidQuotes.push(routeWithValidQuote)
      }
    }

    metric.putMetric('MixedGetQuotesLoad', Date.now() - beforeGetQuotes, MetricLoggerUnit.Milliseconds)

    return {
      routesWithValidQuotes,
      candidatePools,
    }
  }
}
