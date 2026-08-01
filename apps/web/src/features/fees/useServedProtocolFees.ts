import { useQueries } from '@tanstack/react-query'
import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useMemo } from 'react'
import { getProtocolFeesQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/pools/queries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// data-api GetProtocolFees accepts at most 100 pool ids per request (backend#10486).
const MAX_PROTOCOL_FEES_BATCH_SIZE = 100

export interface ServedProtocolFeePool {
  chainId: UniverseChainId
  protocolVersion: ProtocolVersion
  /** v4: pool id (bytes32 hex); v3: pool address; v2: pair address. */
  poolIdOrHash: string
}

export function servedFeeKey({ chainId, poolIdOrHash }: { chainId: UniverseChainId; poolIdOrHash: string }): string {
  return `${chainId}:${poolIdOrHash}`
}

/**
 * Batched per-pool protocol fees served by data-api `GetProtocolFees` (backend#10486) — the pool
 * and position list sources carry no fee fields, so callers pass the pools they want fees for.
 * Pools are grouped per chain + protocol version and chunked to the 100-id request cap; the
 * response echoes each requested id verbatim, so results key back exactly. Both fee fields are
 * TRUE-optional on the wire: a missing value means "unavailable" (the FE never computes fees),
 * while a served 0 is a real fees-off value.
 *
 * Returns a map of `chainId:poolIdOrHash` → served protocol fee (integer pips).
 */
export function useServedProtocolFees({
  pools,
  enabled,
}: {
  pools: ServedProtocolFeePool[]
  enabled: boolean
}): ReadonlyMap<string, number> {
  const requests = useMemo(() => {
    if (!enabled || !pools.length) {
      return []
    }
    const groups = new Map<string, { chainId: UniverseChainId; protocolVersion: ProtocolVersion; poolIds: string[] }>()
    for (const pool of pools) {
      const groupKey = `${pool.chainId}:${pool.protocolVersion}`
      const group = groups.get(groupKey)
      if (group) {
        group.poolIds.push(pool.poolIdOrHash)
      } else {
        groups.set(groupKey, {
          chainId: pool.chainId,
          protocolVersion: pool.protocolVersion,
          poolIds: [pool.poolIdOrHash],
        })
      }
    }
    return Array.from(groups.values()).flatMap((group) => {
      const chunks: (typeof group)[] = []
      for (let start = 0; start < group.poolIds.length; start += MAX_PROTOCOL_FEES_BATCH_SIZE) {
        chunks.push({ ...group, poolIds: group.poolIds.slice(start, start + MAX_PROTOCOL_FEES_BATCH_SIZE) })
      }
      return chunks
    })
  }, [pools, enabled])

  return useQueries({
    queries: requests.map((params) => getProtocolFeesQueryOptions({ params, enabled })),
    combine: (results) => {
      const served = new Map<string, number>()
      // `results` is parallel to `requests` (useQueries preserves order and length).
      results.forEach((result, index) => {
        const request = requests[index]
        if (!result.data) {
          return
        }
        for (const entry of result.data.protocolFees) {
          if (entry.protocolFee !== undefined) {
            served.set(servedFeeKey({ chainId: request.chainId, poolIdOrHash: entry.poolId }), entry.protocolFee)
          }
        }
      })
      return served
    },
  })
}

/**
 * Single-pool convenience wrapper over {@link useServedProtocolFees} for the many read surfaces that
 * only need one pool's fee. Accepts undefined identity fields (the pool may still be loading) and
 * returns the served protocol fee in integer pips, or `undefined` when nothing is served.
 */
export function useServedProtocolFee({
  chainId,
  protocolVersion,
  poolIdOrHash,
  enabled,
}: {
  chainId?: UniverseChainId
  protocolVersion?: ProtocolVersion
  poolIdOrHash?: string
  enabled: boolean
}): number | undefined {
  const pools = useMemo<ServedProtocolFeePool[]>(() => {
    if (chainId === undefined || protocolVersion === undefined || !poolIdOrHash) {
      return []
    }
    return [{ chainId, protocolVersion, poolIdOrHash }]
  }, [chainId, protocolVersion, poolIdOrHash])

  const served = useServedProtocolFees({ pools, enabled })
  if (chainId === undefined || !poolIdOrHash) {
    return undefined
  }
  return served.get(servedFeeKey({ chainId, poolIdOrHash }))
}
