import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { GetProtocolStatsResponse, ProtocolStats } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useMemo } from 'react'
import { useGetProtocolStatsQuery } from 'uniswap/src/data/apiClients/dataApiService/explore/useGetProtocolStatsQuery'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ProtocolVersionLabel } from 'uniswap/src/features/positions/utils'

/** Splits the response's per-version entries back out by protocol; missing versions stay undefined. */
function getStatsByProtocol(
  data: GetProtocolStatsResponse | undefined,
): Record<ProtocolVersionLabel, ProtocolStats | undefined> {
  const byVersion = new Map(data?.protocolVersionStats.map((entry) => [entry.protocolVersion, entry.stats]))
  return {
    v2: byVersion.get(ProtocolVersion.V2),
    v3: byVersion.get(ProtocolVersion.V3),
    v4: byVersion.get(ProtocolVersion.V4),
  }
}

export function useProtocolStats() {
  const { chains: enabledChainIds } = useEnabledChains()
  return useGetProtocolStatsQuery({ chainIds: enabledChainIds })
}

/**
 * Returns:
 * - total 1D volume over the requested chains
 * - each protocol’s 1D volume (v2, v3, and v4)
 * - server-computed 1D total volume percentage change (undefined when the endpoint omits it)
 */
export function use24hProtocolVolume(): {
  isLoading: boolean
  totalVolume: number
  totalChangePercent: number | undefined
  protocolVolumes: Record<ProtocolVersionLabel, number>
} {
  const { data, isLoading } = useProtocolStats()

  return useMemo(() => {
    const byProtocol = getStatsByProtocol(data)
    return {
      isLoading,
      totalVolume: data?.stats?.volume1d ?? 0,
      totalChangePercent: data?.stats?.volumeChange1d,
      protocolVolumes: {
        v2: byProtocol.v2?.volume1d ?? 0,
        v3: byProtocol.v3?.volume1d ?? 0,
        v4: byProtocol.v4?.volume1d ?? 0,
      },
    }
  }, [data, isLoading])
}

/**
 * Returns:
 * - total TVL over the requested chains
 * - each protocol’s TVL (v2, v3, and v4)
 * - server-computed 1D total TVL percentage change (undefined when the endpoint omits it)
 * - each protocol’s 1D TVL percentage change (v2, v3, and v4)
 */
export function useDailyTVLWithChange(): {
  isLoading: boolean
  totalTVL: number
  protocolTVL: Record<ProtocolVersionLabel, number>
  totalChangePercent: number | undefined
  protocolChangePercent: Record<ProtocolVersionLabel, number | undefined>
} {
  const { data, isLoading } = useProtocolStats()

  return useMemo(() => {
    const byProtocol = getStatsByProtocol(data)
    return {
      isLoading,
      totalTVL: data?.stats?.tvl ?? 0,
      protocolTVL: {
        v2: byProtocol.v2?.tvl ?? 0,
        v3: byProtocol.v3?.tvl ?? 0,
        v4: byProtocol.v4?.tvl ?? 0,
      },
      totalChangePercent: data?.stats?.tvlChange1d,
      protocolChangePercent: {
        v2: byProtocol.v2?.tvlChange1d,
        v3: byProtocol.v3?.tvlChange1d,
        v4: byProtocol.v4?.tvlChange1d,
      },
    }
  }, [data, isLoading])
}
