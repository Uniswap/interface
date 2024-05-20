import { BigNumber } from '@ethersproject/bignumber'
import { ChainId, TradeType } from '@ubeswap/sdk-core'
import { Protocol } from '@uniswap/router-sdk'
import JSBI from 'jsbi'
import _ from 'lodash'
import FixedReverseHeap from 'mnemonist/fixed-reverse-heap'
import Queue from 'mnemonist/queue'

import { IPortionProvider } from '../../../providers/portion-provider'
import { HAS_L1_FEE } from '../../../util'
import { CurrencyAmount } from '../../../util/amounts'
import { log } from '../../../util/log'
import { metric, MetricLoggerUnit } from '../../../util/metric'
import { routeAmountsToString, routeToString } from '../../../util/routes'
import { SwapOptions } from '../../router'
import { AlphaRouterConfig } from '../alpha-router'
import { IGasModel, L1ToL2GasCosts, usdGasTokensByChain } from '../gas-models'

import { RouteWithValidQuote, V3RouteWithValidQuote } from './../entities/route-with-valid-quote'

export type BestSwapRoute = {
  quote: CurrencyAmount
  quoteGasAdjusted: CurrencyAmount
  estimatedGasUsed: BigNumber
  estimatedGasUsedUSD: CurrencyAmount
  estimatedGasUsedQuoteToken: CurrencyAmount
  routes: RouteWithValidQuote[]
}

export async function getBestSwapRoute(
  amount: CurrencyAmount,
  percents: number[],
  routesWithValidQuotes: RouteWithValidQuote[],
  routeType: TradeType,
  chainId: ChainId,
  routingConfig: AlphaRouterConfig,
  portionProvider: IPortionProvider,
  gasModel?: IGasModel<V3RouteWithValidQuote>,
  swapConfig?: SwapOptions
): Promise<BestSwapRoute | null> {
  const now = Date.now()

  const { forceMixedRoutes } = routingConfig

  /// Like with forceCrossProtocol, we apply that logic here when determining the bestSwapRoute
  if (forceMixedRoutes) {
    log.info(
      {
        forceMixedRoutes,
      },
      'Forcing mixed routes by filtering out other route types'
    )
    routesWithValidQuotes = _.filter(routesWithValidQuotes, (quotes) => {
      return quotes.protocol === Protocol.MIXED
    })
    if (!routesWithValidQuotes) {
      return null
    }
  }

  // Build a map of percentage of the input to list of valid quotes.
  // Quotes can be null for a variety of reasons (not enough liquidity etc), so we drop them here too.
  const percentToQuotes: { [percent: number]: RouteWithValidQuote[] } = {}
  for (const routeWithValidQuote of routesWithValidQuotes) {
    if (!percentToQuotes[routeWithValidQuote.percent]) {
      percentToQuotes[routeWithValidQuote.percent] = []
    }
    percentToQuotes[routeWithValidQuote.percent]!.push(routeWithValidQuote)
  }

  metric.putMetric('BuildRouteWithValidQuoteObjects', Date.now() - now, MetricLoggerUnit.Milliseconds)

  // Given all the valid quotes for each percentage find the optimal route.
  const swapRoute = await getBestSwapRouteBy(
    routeType,
    percentToQuotes,
    percents,
    chainId,
    (rq: RouteWithValidQuote) => rq.quoteAdjustedForGas,
    routingConfig,
    portionProvider,
    gasModel,
    swapConfig
  )

  // It is possible we were unable to find any valid route given the quotes.
  if (!swapRoute) {
    return null
  }

  // Due to potential loss of precision when taking percentages of the input it is possible that the sum of the amounts of each
  // route of our optimal quote may not add up exactly to exactIn or exactOut.
  //
  // We check this here, and if there is a mismatch
  // add the missing amount to a random route. The missing amount size should be neglible so the quote should still be highly accurate.
  const { routes: routeAmounts } = swapRoute
  const totalAmount = _.reduce(
    routeAmounts,
    (total, routeAmount) => total.add(routeAmount.amount),
    CurrencyAmount.fromRawAmount(routeAmounts[0]!.amount.currency, 0)
  )

  const missingAmount = amount.subtract(totalAmount)
  if (missingAmount.greaterThan(0)) {
    log.info(
      {
        missingAmount: missingAmount.quotient.toString(),
      },
      `Optimal route's amounts did not equal exactIn/exactOut total. Adding missing amount to last route in array.`
    )

    routeAmounts[routeAmounts.length - 1]!.amount = routeAmounts[routeAmounts.length - 1]!.amount.add(missingAmount)
  }

  log.info(
    {
      routes: routeAmountsToString(routeAmounts),
      numSplits: routeAmounts.length,
      amount: amount.toExact(),
      quote: swapRoute.quote.toExact(),
      quoteGasAdjusted: swapRoute.quoteGasAdjusted.toFixed(Math.min(swapRoute.quoteGasAdjusted.currency.decimals, 2)),
      estimatedGasUSD: swapRoute.estimatedGasUsedUSD.toFixed(
        Math.min(swapRoute.estimatedGasUsedUSD.currency.decimals, 2)
      ),
      estimatedGasToken: swapRoute.estimatedGasUsedQuoteToken.toFixed(
        Math.min(swapRoute.estimatedGasUsedQuoteToken.currency.decimals, 2)
      ),
    },
    `Found best swap route. ${routeAmounts.length} split.`
  )

  return swapRoute
}

export async function getBestSwapRouteBy(
  routeType: TradeType,
  percentToQuotes: { [percent: number]: RouteWithValidQuote[] },
  percents: number[],
  chainId: ChainId,
  by: (routeQuote: RouteWithValidQuote) => CurrencyAmount,
  routingConfig: AlphaRouterConfig,
  portionProvider: IPortionProvider,
  gasModel?: IGasModel<V3RouteWithValidQuote>,
  swapConfig?: SwapOptions
): Promise<BestSwapRoute | undefined> {
  // Build a map of percentage to sorted list of quotes, with the biggest quote being first in the list.
  const percentToSortedQuotes = _.mapValues(percentToQuotes, (routeQuotes: RouteWithValidQuote[]) => {
    return routeQuotes.sort((routeQuoteA, routeQuoteB) => {
      if (routeType == TradeType.EXACT_INPUT) {
        return by(routeQuoteA).greaterThan(by(routeQuoteB)) ? -1 : 1
      } else {
        return by(routeQuoteA).lessThan(by(routeQuoteB)) ? -1 : 1
      }
    })
  })

  const quoteCompFn =
    routeType == TradeType.EXACT_INPUT
      ? (a: CurrencyAmount, b: CurrencyAmount) => a.greaterThan(b)
      : (a: CurrencyAmount, b: CurrencyAmount) => a.lessThan(b)

  const sumFn = (currencyAmounts: CurrencyAmount[]): CurrencyAmount => {
    let sum = currencyAmounts[0]!
    for (let i = 1; i < currencyAmounts.length; i++) {
      sum = sum.add(currencyAmounts[i]!)
    }
    return sum
  }

  let bestQuote: CurrencyAmount | undefined
  let bestSwap: RouteWithValidQuote[] | undefined

  // Min-heap for tracking the 5 best swaps given some number of splits.
  const bestSwapsPerSplit = new FixedReverseHeap<{
    quote: CurrencyAmount
    routes: RouteWithValidQuote[]
  }>(
    Array,
    (a, b) => {
      return quoteCompFn(a.quote, b.quote) ? -1 : 1
    },
    3
  )

  const { minSplits, maxSplits, forceCrossProtocol } = routingConfig

  if (!percentToSortedQuotes[100] || minSplits > 1 || forceCrossProtocol) {
    log.info(
      {
        percentToSortedQuotes: _.mapValues(percentToSortedQuotes, (p) => p.length),
      },
      'Did not find a valid route without any splits. Continuing search anyway.'
    )
  } else {
    bestQuote = by(percentToSortedQuotes[100][0]!)
    bestSwap = [percentToSortedQuotes[100][0]!]

    for (const routeWithQuote of percentToSortedQuotes[100].slice(0, 5)) {
      bestSwapsPerSplit.push({
        quote: by(routeWithQuote),
        routes: [routeWithQuote],
      })
    }
  }

  // We do a BFS. Each additional node in a path represents us adding an additional split to the route.
  const queue = new Queue<{
    percentIndex: number
    curRoutes: RouteWithValidQuote[]
    remainingPercent: number
    special: boolean
  }>()

  // First we seed BFS queue with the best quotes for each percentage.
  // i.e. [best quote when sending 10% of amount, best quote when sending 20% of amount, ...]
  // We will explore the various combinations from each node.
  for (let i = percents.length; i >= 0; i--) {
    const percent = percents[i]!

    if (!percentToSortedQuotes[percent]) {
      continue
    }

    queue.enqueue({
      curRoutes: [percentToSortedQuotes[percent]![0]!],
      percentIndex: i,
      remainingPercent: 100 - percent,
      special: false,
    })

    if (!percentToSortedQuotes[percent] || !percentToSortedQuotes[percent]![1]) {
      continue
    }

    queue.enqueue({
      curRoutes: [percentToSortedQuotes[percent]![1]!],
      percentIndex: i,
      remainingPercent: 100 - percent,
      special: true,
    })
  }

  let splits = 1
  let startedSplit = Date.now()

  while (queue.size > 0) {
    metric.putMetric(`Split${splits}Done`, Date.now() - startedSplit, MetricLoggerUnit.Milliseconds)

    startedSplit = Date.now()

    log.info(
      {
        top5: _.map(
          Array.from(bestSwapsPerSplit.consume()),
          (q) =>
            `${q.quote.toExact()} (${_(q.routes)
              .map((r) => r.toString())
              .join(', ')})`
        ),
        onQueue: queue.size,
      },
      `Top 3 with ${splits} splits`
    )

    bestSwapsPerSplit.clear()

    // Size of the queue at this point is the number of potential routes we are investigating for the given number of splits.
    let layer = queue.size
    splits++

    // If we didn't improve our quote by adding another split, very unlikely to improve it by splitting more after that.
    if (splits >= 3 && bestSwap && bestSwap.length < splits - 1) {
      break
    }

    if (splits > maxSplits) {
      log.info('Max splits reached. Stopping search.')
      metric.putMetric(`MaxSplitsHitReached`, 1, MetricLoggerUnit.Count)
      break
    }

    while (layer > 0) {
      layer--

      const { remainingPercent, curRoutes, percentIndex, special } = queue.dequeue()!

      // For all other percentages, add a new potential route.
      // E.g. if our current aggregated route if missing 50%, we will create new nodes and add to the queue for:
      // 50% + new 10% route, 50% + new 20% route, etc.
      for (let i = percentIndex; i >= 0; i--) {
        const percentA = percents[i]!

        if (percentA > remainingPercent) {
          continue
        }

        // At some point the amount * percentage is so small that the quoter is unable to get
        // a quote. In this case there could be no quotes for that percentage.
        if (!percentToSortedQuotes[percentA]) {
          continue
        }

        const candidateRoutesA = percentToSortedQuotes[percentA]!

        // Find the best route in the complimentary percentage that doesn't re-use a pool already
        // used in the current route. Re-using pools is not allowed as each swap through a pool changes its liquidity,
        // so it would make the quotes inaccurate.
        const routeWithQuoteA = findFirstRouteNotUsingUsedPools(curRoutes, candidateRoutesA, forceCrossProtocol)

        if (!routeWithQuoteA) {
          continue
        }

        const remainingPercentNew = remainingPercent - percentA
        const curRoutesNew = [...curRoutes, routeWithQuoteA]

        // If we've found a route combination that uses all 100%, and it has at least minSplits, update our best route.
        if (remainingPercentNew == 0 && splits >= minSplits) {
          const quotesNew = _.map(curRoutesNew, (r) => by(r))
          const quoteNew = sumFn(quotesNew)

          let gasCostL1QuoteToken = CurrencyAmount.fromRawAmount(quoteNew.currency, 0)

          if (HAS_L1_FEE.includes(chainId)) {
            const onlyV3Routes = curRoutesNew.every((route) => route.protocol == Protocol.V3)

            if (gasModel == undefined || !onlyV3Routes) {
              throw new Error("Can't compute L1 gas fees.")
            } else {
              const gasCostL1 = await gasModel.calculateL1GasFees!(curRoutesNew as V3RouteWithValidQuote[])
              gasCostL1QuoteToken = gasCostL1.gasCostL1QuoteToken
            }
          }

          const quoteAfterL1Adjust =
            routeType == TradeType.EXACT_INPUT
              ? quoteNew.subtract(gasCostL1QuoteToken)
              : quoteNew.add(gasCostL1QuoteToken)

          bestSwapsPerSplit.push({
            quote: quoteAfterL1Adjust,
            routes: curRoutesNew,
          })

          if (!bestQuote || quoteCompFn(quoteAfterL1Adjust, bestQuote)) {
            bestQuote = quoteAfterL1Adjust
            bestSwap = curRoutesNew

            // Temporary experiment.
            if (special) {
              metric.putMetric(`BestSwapNotPickingBestForPercent`, 1, MetricLoggerUnit.Count)
            }
          }
        } else {
          queue.enqueue({
            curRoutes: curRoutesNew,
            remainingPercent: remainingPercentNew,
            percentIndex: i,
            special,
          })
        }
      }
    }
  }

  if (!bestSwap) {
    log.info(`Could not find a valid swap`)
    return undefined
  }

  const postSplitNow = Date.now()

  let quoteGasAdjusted = sumFn(_.map(bestSwap, (routeWithValidQuote) => routeWithValidQuote.quoteAdjustedForGas))

  // this calculates the base gas used
  // if on L1, its the estimated gas used based on hops and ticks across all the routes
  // if on L2, its the gas used on the L2 based on hops and ticks across all the routes
  const estimatedGasUsed = _(bestSwap)
    .map((routeWithValidQuote) => routeWithValidQuote.gasEstimate)
    .reduce((sum, routeWithValidQuote) => sum.add(routeWithValidQuote), BigNumber.from(0))

  if (!usdGasTokensByChain[chainId] || !usdGasTokensByChain[chainId]![0]) {
    // Each route can use a different stablecoin to account its gas costs.
    // They should all be pegged, and this is just an estimate, so we do a merge
    // to an arbitrary stable.
    throw new Error(`Could not find a USD token for computing gas costs on ${chainId}`)
  }
  const usdToken = usdGasTokensByChain[chainId]![0]!
  const usdTokenDecimals = usdToken.decimals

  // if on L2, calculate the L1 security fee
  let gasCostsL1ToL2: L1ToL2GasCosts = {
    gasUsedL1: BigNumber.from(0),
    gasCostL1USD: CurrencyAmount.fromRawAmount(usdToken, 0),
    gasCostL1QuoteToken: CurrencyAmount.fromRawAmount(
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      bestSwap[0]?.quoteToken!,
      0
    ),
  }
  // If swapping on an L2 that includes a L1 security fee, calculate the fee and include it in the gas adjusted quotes
  if (HAS_L1_FEE.includes(chainId)) {
    // ensure the gasModel exists and that the swap route is a v3 only route
    const onlyV3Routes = bestSwap.every((route) => route.protocol == Protocol.V3)
    if (gasModel == undefined || !onlyV3Routes) {
      throw new Error("Can't compute L1 gas fees.")
    } else {
      gasCostsL1ToL2 = await gasModel.calculateL1GasFees!(bestSwap as V3RouteWithValidQuote[])
    }
  }

  const { gasCostL1USD, gasCostL1QuoteToken } = gasCostsL1ToL2

  // For each gas estimate, normalize decimals to that of the chosen usd token.
  const estimatedGasUsedUSDs = _(bestSwap)
    .map((routeWithValidQuote) => {
      // TODO: will error if gasToken has decimals greater than usdToken
      const decimalsDiff = usdTokenDecimals - routeWithValidQuote.gasCostInUSD.currency.decimals

      if (decimalsDiff == 0) {
        return CurrencyAmount.fromRawAmount(usdToken, routeWithValidQuote.gasCostInUSD.quotient)
      }

      return CurrencyAmount.fromRawAmount(
        usdToken,
        JSBI.multiply(
          routeWithValidQuote.gasCostInUSD.quotient,
          JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimalsDiff))
        )
      )
    })
    .value()

  let estimatedGasUsedUSD = sumFn(estimatedGasUsedUSDs)

  // if they are different usd pools, convert to the usdToken
  if (estimatedGasUsedUSD.currency != gasCostL1USD.currency) {
    const decimalsDiff = usdTokenDecimals - gasCostL1USD.currency.decimals
    estimatedGasUsedUSD = estimatedGasUsedUSD.add(
      CurrencyAmount.fromRawAmount(
        usdToken,
        JSBI.multiply(gasCostL1USD.quotient, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimalsDiff)))
      )
    )
  } else {
    estimatedGasUsedUSD = estimatedGasUsedUSD.add(gasCostL1USD)
  }

  log.info(
    {
      estimatedGasUsedUSD: estimatedGasUsedUSD.toExact(),
      normalizedUsdToken: usdToken,
      routeUSDGasEstimates: _.map(
        bestSwap,
        (b) => `${b.percent}% ${routeToString(b.route)} ${b.gasCostInUSD.toExact()}`
      ),
      flatL1GasCostUSD: gasCostL1USD.toExact(),
    },
    'USD gas estimates of best route'
  )

  const estimatedGasUsedQuoteToken = sumFn(
    _.map(bestSwap, (routeWithValidQuote) => routeWithValidQuote.gasCostInToken)
  ).add(gasCostL1QuoteToken)

  const quote = sumFn(_.map(bestSwap, (routeWithValidQuote) => routeWithValidQuote.quote))

  // Adjust the quoteGasAdjusted for the l1 fee
  if (routeType == TradeType.EXACT_INPUT) {
    const quoteGasAdjustedForL1 = quoteGasAdjusted.subtract(gasCostL1QuoteToken)
    quoteGasAdjusted = quoteGasAdjustedForL1
  } else {
    const quoteGasAdjustedForL1 = quoteGasAdjusted.add(gasCostL1QuoteToken)
    quoteGasAdjusted = quoteGasAdjustedForL1
  }

  const routeWithQuotes = bestSwap.sort((routeAmountA, routeAmountB) =>
    routeAmountB.amount.greaterThan(routeAmountA.amount) ? 1 : -1
  )

  metric.putMetric('PostSplitDone', Date.now() - postSplitNow, MetricLoggerUnit.Milliseconds)
  return {
    quote,
    quoteGasAdjusted,
    estimatedGasUsed,
    estimatedGasUsedUSD,
    estimatedGasUsedQuoteToken,
    routes: portionProvider.getRouteWithQuotePortionAdjusted(routeType, routeWithQuotes, swapConfig),
  }
}

// We do not allow pools to be re-used across split routes, as swapping through a pool changes the pools state.
// Given a list of used routes, this function finds the first route in the list of candidate routes that does not re-use an already used pool.
const findFirstRouteNotUsingUsedPools = (
  usedRoutes: RouteWithValidQuote[],
  candidateRouteQuotes: RouteWithValidQuote[],
  forceCrossProtocol: boolean
): RouteWithValidQuote | null => {
  const poolAddressSet = new Set()
  const usedPoolAddresses = _(usedRoutes)
    .flatMap((r) => r.poolAddresses)
    .value()

  for (const poolAddress of usedPoolAddresses) {
    poolAddressSet.add(poolAddress)
  }

  const protocolsSet = new Set()
  const usedProtocols = _(usedRoutes)
    .flatMap((r) => r.protocol)
    .uniq()
    .value()

  for (const protocol of usedProtocols) {
    protocolsSet.add(protocol)
  }

  for (const routeQuote of candidateRouteQuotes) {
    const { poolAddresses, protocol } = routeQuote

    if (poolAddresses.some((poolAddress) => poolAddressSet.has(poolAddress))) {
      continue
    }

    // This code is just for debugging. Allows us to force a cross-protocol split route by skipping
    // consideration of routes that come from the same protocol as a used route.
    const needToForce = forceCrossProtocol && protocolsSet.size == 1
    if (needToForce && protocolsSet.has(protocol)) {
      continue
    }

    return routeQuote
  }

  return null
}
