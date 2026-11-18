import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
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

/** The history query vars for a pool, its protocol flags set from its version; undefined until the pool is known. */
export function getPoolHistoryQueryVars({
  addressOrId,
  chainId,
  protocolVersion,
  duration,
}: {
  addressOrId?: string
  chainId?: UniverseChainId
  protocolVersion?: ProtocolVersion
  duration: HistoryDuration
}): PDPChartQueryVars | undefined {
  if (!addressOrId || !chainId || protocolVersion === undefined) {
    return undefined
  }
  return {
    addressOrId,
    chainId,
    duration,
    isV2: protocolVersion === ProtocolVersion.V2,
    isV3: protocolVersion === ProtocolVersion.V3,
    isV4: protocolVersion === ProtocolVersion.V4,
  }
}
