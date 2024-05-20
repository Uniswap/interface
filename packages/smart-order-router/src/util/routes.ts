import { Percent } from '@ubeswap/sdk-core'
import { Protocol } from '@uniswap/router-sdk'
import { Pair } from '@uniswap/v2-sdk'
import { Pool } from '@uniswap/v3-sdk'
import _ from 'lodash'

import { RouteWithValidQuote } from '../routers/alpha-router'
import { MixedRoute, V2Route, V3Route } from '../routers/router'

import { V3_CORE_FACTORY_ADDRESSES } from './addresses'

import { CurrencyAmount } from '.'

export const routeToString = (route: V3Route | V2Route | MixedRoute): string => {
  const routeStr = []
  const tokens =
    route.protocol === Protocol.V3
      ? route.tokenPath
      : // MixedRoute and V2Route have path
        route.path
  const tokenPath = _.map(tokens, (token) => `${token.symbol}`)
  const pools = route.protocol === Protocol.V3 || route.protocol === Protocol.MIXED ? route.pools : route.pairs
  const poolFeePath = _.map(pools, (pool) => {
    return `${
      pool instanceof Pool
        ? ` -- ${pool.fee / 10000}% [${Pool.getAddress(
            pool.token0,
            pool.token1,
            pool.fee,
            undefined,
            V3_CORE_FACTORY_ADDRESSES[pool.chainId]
          )}]`
        : ` -- [${Pair.getAddress((pool as Pair).token0, (pool as Pair).token1)}]`
    } --> `
  })

  for (let i = 0; i < tokenPath.length; i++) {
    routeStr.push(tokenPath[i])
    if (i < poolFeePath.length) {
      routeStr.push(poolFeePath[i])
    }
  }

  return routeStr.join('')
}

export const routeAmountsToString = (routeAmounts: RouteWithValidQuote[]): string => {
  const total = _.reduce(
    routeAmounts,
    (total: CurrencyAmount, cur: RouteWithValidQuote) => {
      return total.add(cur.amount)
    },
    CurrencyAmount.fromRawAmount(routeAmounts[0]!.amount.currency, 0)
  )

  const routeStrings = _.map(routeAmounts, ({ protocol, route, amount }) => {
    const portion = amount.divide(total)
    const percent = new Percent(portion.numerator, portion.denominator)
    /// @dev special case for MIXED routes we want to show user friendly V2+V3 instead
    return `[${protocol == Protocol.MIXED ? 'V2 + V3' : protocol}] ${percent.toFixed(2)}% = ${routeToString(route)}`
  })

  return _.join(routeStrings, ', ')
}

export const routeAmountToString = (routeAmount: RouteWithValidQuote): string => {
  const { route, amount } = routeAmount
  return `${amount.toExact()} = ${routeToString(route)}`
}

export const poolToString = (p: Pool | Pair): string => {
  return `${p.token0.symbol}/${p.token1.symbol}${p instanceof Pool ? `/${p.fee / 10000}%` : ``}`
}
