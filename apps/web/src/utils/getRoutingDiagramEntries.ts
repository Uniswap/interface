import { Protocol } from '@uniswap/router-sdk'
import { Percent, TradeType } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool } from '@uniswap/v3-sdk'
import { ClassicTrade } from 'state/routing/types'
import { RoutingDiagramEntry } from 'uniswap/src/utils/getRoutingDiagramEntries'

const V2_DEFAULT_FEE_TIER = 3000

/**
 * Loops through all routes on a trade and returns an array of diagram entries.
 */
export default function getRoutingDiagramEntries(trade: ClassicTrade): RoutingDiagramEntry[] {
  return trade.swaps.map(({ route: { path: tokenPath, pools, protocol }, inputAmount, outputAmount }) => {
    const portion =
      trade.tradeType === TradeType.EXACT_INPUT
        ? inputAmount.divide(trade.inputAmount)
        : outputAmount.divide(trade.outputAmount)
    const percent = new Percent(portion.numerator, portion.denominator)
    const path: RoutingDiagramEntry['path'] = []
    for (let i = 0; i < pools.length; i++) {
      const nextPool = pools[i]
      const tokenIn = tokenPath[i]
      const tokenOut = tokenPath[i + 1]
      const poolProtocol =
        nextPool instanceof Pair ? Protocol.V2 : nextPool instanceof V3Pool ? Protocol.V3 : Protocol.V4
      const entry: RoutingDiagramEntry['path'][0] = [
        tokenIn,
        tokenOut,
        nextPool instanceof Pair ? V2_DEFAULT_FEE_TIER : nextPool.fee,
        poolProtocol,
      ]
      path.push(entry)
    }
    return {
      percent,
      path,
      protocol,
    }
  })
}
