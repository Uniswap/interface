import JSBI from 'jsbi'
import { ChainId, Percent, Rounding, Token } from 'libs/sdk/src'
import { ZERO } from 'libs/sdk/src/constants'
import { Aggregator } from './aggregator'
import { wrappedCurrencyAmount } from './wrappedCurrency'
import { getTokenAddressMap } from 'state/lists/hooks'
import { getAddress } from 'ethers/lib/utils'

interface SwapPool {
  id: string
  exchange: string
  swapAmount?: JSBI
  swapPercentage?: number
}

type PathItem = Token

interface SwapRoute {
  slug: string
  pools: SwapPool[]
  path: PathItem[]
}

export interface SwapRouteV2 {
  swapPercentage?: number
  path: PathItem[]
  subRoutes: SwapPool[][]
}

function formatRoutesV2(routes: SwapRoute[]): SwapRouteV2[] {
  if (!routes.length) {
    return []
  }
  try {
    let itemIndex = -1
    const routesGroup = routes.reduce((a, b) => {
      let index: number
      let subRoutes: any[][] = []
      let swapPercentage: number = (b.pools && b.pools[0]?.swapPercentage) || 0
      if (a[b.slug]) {
        const route: any = a[b.slug] || {}
        index = route.index
        const temp = route.subRoutes || []
        swapPercentage += route.swapPercentage || 0
        temp.forEach((sub: any[], ind: number) => {
          const swapPool: any = (b.pools && b.pools[ind]) || ({} as any)
          const totalSwapAmount = JSBI.add(
            sub.reduce((sum, x2) => JSBI.add(sum, x2.swapAmount || ZERO), ZERO),
            swapPool.swapAmount || ZERO
          )
          // merge hop with same exchange
          let existed = false
          const newSub: any[] = sub.map(pool => {
            const p2: any = { ...pool }
            const same = p2.exchange === swapPool.exchange
            let swapAmount = p2.swapAmount || ZERO
            if (same) {
              existed = true
              swapAmount = JSBI.add(swapAmount, swapPool.swapAmount || ZERO)
            }
            const percent = new Percent(swapAmount, totalSwapAmount).toFixed(0, undefined, Rounding.ROUND_HALF_UP)
            p2.swapPercentage = parseInt(percent)
            p2.total = totalSwapAmount.toString()
            return p2
          })
          if (!existed) {
            const percent = new Percent(swapPool.swapAmount || ZERO, totalSwapAmount).toFixed(
              0,
              undefined,
              Rounding.ROUND_HALF_UP
            )
            newSub.push({ ...swapPool, swapPercentage: parseInt(percent) })
          }
          subRoutes[ind] = newSub
        })
      } else {
        itemIndex += 1
        index = itemIndex
        subRoutes = b.pools.map(p => [{ ...p, swapPercentage: 100 }])
      }
      return Object.assign({}, a, {
        [b.slug]: { index, swapPercentage, path: b.path, subRoutes }
      })
    }, {} as any)

    const routesV2Length = Object.keys(routesGroup).length
    const routesV2: SwapRouteV2[] = new Array(routesV2Length).map(() => ({} as SwapRouteV2))

    Object.values(routesGroup).forEach((route: any) => {
      if (route.index > routesV2Length) return
      routesV2.splice(route.index, 1, {
        swapPercentage: route.swapPercentage,
        path: route.path,
        subRoutes: route.subRoutes
      })
    })
    return routesV2
  } catch (e) {
    console.error('[error_routesV2]', e)
    return []
  }
}

export function getTradeComposition(
  trade?: Aggregator,
  chainId?: ChainId,
  allTokens?: { [address: string]: Token }
): SwapRouteV2[] | undefined {
  if (!trade || !trade.swaps || !chainId) {
    return undefined
  }
  const inputTokenAmount = wrappedCurrencyAmount(trade.inputAmount, chainId)

  const calcSwapPercentage = function(tokenIn: string, amount: string): number | undefined {
    if (!tokenIn || !amount) {
      return undefined
    }
    const exactTokenIn = tokenIn?.toLowerCase() === inputTokenAmount?.token.address?.toLowerCase()
    if (exactTokenIn && trade.inputAmount.greaterThan(ZERO)) {
      const percent = new Percent(JSBI.BigInt(amount || 0), trade.inputAmount.raw).toFixed(0)
      return parseInt(percent)
    }
    return undefined
  }

  const tokens = trade.tokens || ({} as any)
  const routes: SwapRoute[] = []

  // Convert all Swaps to ChartSwaps
  trade.swaps.forEach(sorMultiSwap => {
    if (sorMultiSwap.length === 1) {
      const hop = sorMultiSwap[0]
      const path = [
        allTokens?.[getAddress(hop.tokenIn)] || tokens[hop.tokenIn],
        allTokens?.[getAddress(hop.tokenOut)] || tokens[hop.tokenOut]
      ]
      routes.push({
        slug: hop.tokenOut?.toLowerCase(),
        pools: [
          {
            id: hop.pool?.toLowerCase(),
            exchange: hop.exchange,
            swapAmount: JSBI.BigInt(hop.swapAmount),
            swapPercentage: calcSwapPercentage(hop.tokenIn, hop.swapAmount)
          }
        ],
        path
      })
    } else if (sorMultiSwap.length > 1) {
      const path: PathItem[] = []
      const pools: SwapPool[] = []
      sorMultiSwap.forEach((hop: any, index: number) => {
        pools.push({
          id: hop.pool?.toLowerCase(),
          exchange: hop.exchange,
          swapAmount: JSBI.BigInt(hop.swapAmount),
          swapPercentage: index === 0 ? calcSwapPercentage(hop.tokenIn, hop.swapAmount) : 100
        })
        if (index === 0) {
          const token = tokens[hop.tokenIn] || ({} as any)
          path.push(
            allTokens?.[getAddress(token.address)] ||
              new Token(chainId, token.address, token.decimals, token.symbol, token.name)
          )
        }
        const token = tokens[hop.tokenOut] || ({} as any)
        path.push(
          allTokens?.[getAddress(token.address)] ||
            new Token(chainId, token.address, token.decimals, token.symbol, token.name)
        )
      })
      routes.push({
        slug: path
          .slice(1)
          .map(t => t.address)
          .join('-')
          .toLowerCase(),
        path,
        pools
      })
    }
  })

  // Convert to ChartSwaps v2
  return formatRoutesV2(routes)
}
