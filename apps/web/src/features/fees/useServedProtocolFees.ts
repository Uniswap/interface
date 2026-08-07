import { useQueries } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
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

/** Per-pool fees served by `GetProtocolFees`, both integer pips. */
export interface ServedPoolFees {
  /**
   * v4: additive fee on top of the LP fee; v2/v3: subtractive share carved out of the fee tier.
   * Unset when undeterminable (unknown pool, or a v2/v3 pool the source can't answer for); a
   * served 0 is a real fees-off value.
   */
  protocolFee?: number
  /**
   * The LP fee tier the pool was created with, before any protocol fee. Unset for an unknown pool,
   * for a v4 dynamic-fee pool (whose pool key holds a sentinel rather than a static tier), and for
   * v2 — see {@link useServedProtocolFees}.
   */
  feeTier?: number
}

export function servedFeeKey({ chainId, poolIdOrHash }: { chainId: UniverseChainId; poolIdOrHash: string }): string {
  return `${chainId}:${poolIdOrHash}`
}

/**
 * Batched per-pool fees served by data-api `GetProtocolFees` (backend#10486) — the pool and
 * position list sources carry no protocol fee, so callers pass the pools they want fees for.
 * Pools are grouped per chain + protocol version and chunked to the 100-id request cap; the
 * response echoes each requested id verbatim, so results key back exactly. Every fee field is
 * TRUE-optional on the wire: a missing value means "unavailable" (the FE never computes fees).
 *
 * The served tier is dropped for v2: every v2 pair charges a fixed 0.3% by protocol design, so
 * there is nothing per-pool to learn, and callers already have `V2_DEFAULT_FEE_TIER`. (The backend
 * also serves v2 tiers 10x below the pip scale it uses for v3/v4 — 300 for a 0.3% pair — so taking
 * them would render every v2 pool as 0.03%.)
 *
 * Returns a map of `chainId:poolIdOrHash` → served fees; pools the backend answered nothing for
 * are absent.
 */
export function useServedProtocolFees({
  pools,
  enabled,
}: {
  pools: ServedProtocolFeePool[]
  enabled: boolean
}): ReadonlyMap<string, ServedPoolFees> {
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
      const served = new Map<string, ServedPoolFees>()
      // `results` is parallel to `requests` (useQueries preserves order and length).
      results.forEach((result, index) => {
        const request = requests[index]
        if (!result.data) {
          return
        }
        const isV2 = request.protocolVersion === ProtocolVersion.V2
        for (const entry of result.data.protocolFees) {
          const feeTier = isV2 ? undefined : entry.feeTier
          if (entry.protocolFee === undefined && feeTier === undefined) {
            continue
          }
          served.set(servedFeeKey({ chainId: request.chainId, poolIdOrHash: entry.poolId }), {
            protocolFee: entry.protocolFee,
            feeTier,
          })
        }
      })
      return served
    },
  })
}

/**
 * Single-pool convenience wrapper over {@link useServedProtocolFees} for the many read surfaces that
 * only need one pool's fees. Accepts undefined identity fields (the pool may still be loading) and
 * returns `undefined` when nothing is served.
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
}): ServedPoolFees | undefined {
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
