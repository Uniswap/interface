import {
  HistoryDuration as LiquidityHistoryDuration,
  PoolProtocol,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'

/** Query vars the Pool Details Page charts pass to the liquidity-service pool-history hooks. */
export type PDPChartQueryVars = {
  addressOrId?: string
  chainId: UniverseChainId
  duration: HistoryDuration
  isV2: boolean
  isV3: boolean
  isV4: boolean
}

// Shared request mappers for the liquidity-service pool history endpoints (GetPoolHistoryPrice /
// GetPoolHistoryVolume), which both take a PoolReference + HistoryDuration.

const LIQUIDITY_HISTORY_DURATION: Record<HistoryDuration, LiquidityHistoryDuration> = {
  [HistoryDuration.Hour]: LiquidityHistoryDuration.HOUR,
  [HistoryDuration.Day]: LiquidityHistoryDuration.DAY,
  [HistoryDuration.Week]: LiquidityHistoryDuration.WEEK,
  [HistoryDuration.Month]: LiquidityHistoryDuration.MONTH,
  [HistoryDuration.Year]: LiquidityHistoryDuration.YEAR,
  [HistoryDuration.Max]: LiquidityHistoryDuration.MAX,
}

export function toLiquidityHistoryDuration(duration: HistoryDuration): LiquidityHistoryDuration {
  return LIQUIDITY_HISTORY_DURATION[duration]
}

export function versionFromVars({ isV2, isV3, isV4 }: PDPChartQueryVars): PoolProtocol | undefined {
  if (isV4) {
    return PoolProtocol.V4
  }
  if (isV3) {
    return PoolProtocol.V3
  }
  if (isV2) {
    return PoolProtocol.V2
  }
  return undefined
}
