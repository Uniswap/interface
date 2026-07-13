import { Percent, TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { DYNAMIC_FEE_AMOUNT, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isChained, isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { RoutingDiagramEntry, RoutingHop, RoutingProvider } from 'uniswap/src/utils/routingDiagram/types'

// Discriminated union on `type` so switch/case narrows correctly
type V2Pool = TradingApi.V2PoolInRoute & { type: 'v2-pool' }
type V3Pool = TradingApi.V3PoolInRoute & { type: 'v3-pool' }
type V4Pool = TradingApi.V4PoolInRoute & { type: 'v4-pool' }
type ApiPool = V2Pool | V3Pool | V4Pool

function asApiPool(pool: TradingApi.V2PoolInRoute | TradingApi.V3PoolInRoute | TradingApi.V4PoolInRoute): ApiPool {
  if (pool.type === 'v2-pool' || pool.type === 'v3-pool' || pool.type === 'v4-pool') {
    return pool as ApiPool
  }
  throw new Error(`Unknown pool type: ${pool.type}`)
}

function getPoolType(pool: ApiPool): 'V2' | 'V3' | 'V4' {
  switch (pool.type) {
    case 'v2-pool':
      return 'V2'
    case 'v3-pool':
      return 'V3'
    case 'v4-pool':
      return 'V4'
    default:
      throw new Error(`Unknown pool type: ${(pool as { type: string }).type}`)
  }
}

function getProtocolLabel(hops: ApiPool[]): string {
  const poolTypes = [...new Set(hops.map((hop) => getPoolType(hop)))].sort()
  return poolTypes.join(' + ')
}

function getPoolFee(pool: ApiPool): { fee: number; isDynamic: boolean } {
  switch (pool.type) {
    case 'v2-pool':
      return { fee: V2_DEFAULT_FEE_TIER, isDynamic: false }
    case 'v3-pool': {
      const fee = parseInt(pool.fee ?? '0', 10)
      return { fee, isDynamic: false }
    }
    case 'v4-pool': {
      const fee = parseInt(pool.fee, 10)
      return { fee, isDynamic: fee === DYNAMIC_FEE_AMOUNT }
    }
    default:
      throw new Error(`Unknown pool type: ${(pool as { type: string }).type}`)
  }
}

function parseRouteHop(pool: ApiPool): RoutingHop {
  const tokenIn = pool.tokenIn
  const tokenOut = pool.tokenOut
  if (!tokenIn?.address || !tokenIn.chainId || !tokenOut?.address || !tokenOut.chainId) {
    throw new Error('Missing token data in route hop')
  }

  const { fee, isDynamic } = getPoolFee(pool)

  return {
    type: 'uniswapPool',
    inputCurrencyId: buildCurrencyId(tokenIn.chainId as number as UniverseChainId, tokenIn.address),
    outputCurrencyId: buildCurrencyId(tokenOut.chainId as number as UniverseChainId, tokenOut.address),
    poolType: getPoolType(pool),
    fee,
    isDynamic,
  }
}

// V3 packed path layout: 20-byte token + 3-byte fee repeating, ending with 20-byte token.
// Total bytes = 20 + 23 * numPools, so a valid path has (bytes - 20) divisible by 23 and bytes >= 43.
const V3_TOKEN_BYTES = 20
const V3_HOP_BYTES = 23
const V3_MIN_PATH_BYTES = V3_TOKEN_BYTES + V3_HOP_BYTES

export function summarizeSwapSteps(steps: readonly TradingApi.SwapStep[]): {
  pools: number
  versions: ('V2' | 'V3' | 'V4')[]
} {
  const versions = new Set<'V2' | 'V3' | 'V4'>()
  let pools = 0

  for (const step of steps) {
    switch (step.type) {
      case 'V2_SWAP_EXACT_IN':
      case 'V2_SWAP_EXACT_OUT':
        pools += Math.max(0, step.path.length - 1)
        versions.add('V2')
        break
      case 'V3_SWAP_EXACT_IN':
      case 'V3_SWAP_EXACT_OUT': {
        const hex = step.path.startsWith('0x') ? step.path.slice(2) : step.path
        const bytes = hex.length / 2
        if (bytes >= V3_MIN_PATH_BYTES && (bytes - V3_TOKEN_BYTES) % V3_HOP_BYTES === 0) {
          pools += (bytes - V3_TOKEN_BYTES) / V3_HOP_BYTES
        }
        versions.add('V3')
        break
      }
      case 'V4_SWAP':
        for (const action of step.v4Actions) {
          switch (action.action) {
            case 'SWAP_EXACT_IN':
            case 'SWAP_EXACT_OUT':
              pools += action.path.length
              versions.add('V4')
              break
            case 'SWAP_EXACT_IN_SINGLE':
            case 'SWAP_EXACT_OUT_SINGLE':
              pools += 1
              versions.add('V4')
              break
            // SETTLE, SETTLE_ALL, TAKE, TAKE_ALL, TAKE_PORTION contribute 0 pools.
          }
        }
        break
      case 'WRAP_ETH':
      case 'UNWRAP_WETH':
        break
    }
  }

  return { pools, versions: [...versions].sort() }
}

export const uniswapRoutingProvider: RoutingProvider = {
  name: 'Uniswap API',
  icon: UniswapLogo,
  iconColor: '$accent1',

  getRoutingEntries: (trade: Trade): RoutingDiagramEntry[] => {
    if (!isClassic(trade)) {
      throw new Error(`Invalid call to uniswapProvider.getRoutingEntries with non-classic trade: ${trade.routing}`)
    }

    const quoteRoute = trade.quote.quote.route ?? []

    // Sum up the relevant amounts across all routes for percentage calculation
    const totalAmount = quoteRoute.reduce((sum, hops) => {
      const amount =
        trade.tradeType === TradeType.EXACT_INPUT
          ? (hops[0]?.amountIn ?? '0')
          : (hops[hops.length - 1]?.amountOut ?? '0')
      return sum + BigInt(amount)
    }, BigInt(0))

    return quoteRoute.map((hops) => {
      const apiPools = hops.map(asApiPool)

      const routeAmount =
        trade.tradeType === TradeType.EXACT_INPUT
          ? (hops[0]?.amountIn ?? '0')
          : (hops[hops.length - 1]?.amountOut ?? '0')
      const percent = totalAmount > BigInt(0) ? new Percent(routeAmount, totalAmount.toString()) : new Percent(0)

      return {
        percent,
        path: apiPools.map(parseRouteHop),
        protocolLabel: getProtocolLabel(apiPools),
      }
    })
  },

  getDescription: (t) => t('swap.routing.uniswapAutoRouter.description'),
}

export const uniswapChainedRoutingProvider: RoutingProvider = {
  name: 'Uniswap API',
  icon: undefined,
  iconColor: '$neutral1',

  getRoutingEntries: (trade: Trade): RoutingDiagramEntry[] => {
    if (!isChained(trade)) {
      throw new Error(`Invalid call to uniswapProvider.getRoutingEntries with non-chained trade: ${trade.routing}`)
    }

    // TODO: SWAP-770 - Implement chained routing diagram
    return []
  },

  getDescription: (t) => t('swap.routing.uniswapAutoRouter.description'),
}
