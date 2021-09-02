import { Currency } from '@uniswap/sdk-core'
import { Route } from '@uniswap/v3-sdk'

export const routeToString = (route: Route<Currency, Currency>): string => {
  const routeStr = []
  const tokenPath = route.tokenPath.map((token) => `${token.symbol}`)
  const poolFeePath = route.pools.map((pool) => ` -- ${pool.fee / 10000}% --> `)

  for (let i = 0; i < tokenPath.length; i++) {
    routeStr.push(tokenPath[i])
    if (i < poolFeePath.length) {
      routeStr.push(poolFeePath[i])
    }
  }

  return routeStr.join('')
}
