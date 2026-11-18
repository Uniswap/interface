import type { PlainMessage } from '@bufbuild/protobuf'
import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { RankedPool } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { areEvmAddressesEqual, type UniverseChainId } from '@universe/chains'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'

export const RELATED_POOLS_MAX_COUNT = 16

export interface RelatedPoolsSubject {
  chainId: UniverseChainId
  poolId: string
}

export interface RelatedPoolCardLeg {
  address: string
  symbol?: string
  logoUrl?: string
}

/** A ListPools row flattened for the PDP related-pools cards. */
export interface RelatedPoolCardItem {
  key: string
  chainId: UniverseChainId
  poolId: string
  token0: RelatedPoolCardLeg
  token1: RelatedPoolCardLeg
  protocolVersion: ProtocolVersion
  feeTier?: number
  isDynamicFee: boolean
  tickSpacing?: number
  tvl?: number
}

export function rankedPoolToCardItem(rankedPool: PlainMessage<RankedPool>): RelatedPoolCardItem | undefined {
  const { pool, stats } = rankedPool
  if (!pool || !isUniverseChainId(pool.chainId)) {
    return undefined
  }
  return {
    key: `${pool.chainId}-${pool.poolId}`,
    chainId: pool.chainId,
    poolId: pool.poolId,
    token0: {
      address: pool.token0?.address ?? '',
      symbol: pool.token0?.symbol,
      logoUrl: pool.token0?.project?.logoUrl,
    },
    token1: {
      address: pool.token1?.address ?? '',
      symbol: pool.token1?.symbol,
      logoUrl: pool.token1?.project?.logoUrl,
    },
    protocolVersion: pool.protocolVersion,
    feeTier: pool.feeTier,
    isDynamicFee: pool.isDynamicFee,
    tickSpacing: pool.tickSpacing || undefined,
    tvl: stats?.tvl,
  }
}

/** Case-insensitive on the id: v2/v3 addresses are served in mixed case, v4 ids are hashes. */
export function isSubjectPool(pool: PlainMessage<RankedPool>, subject: RelatedPoolsSubject): boolean {
  return pool.pool?.chainId === subject.chainId && areEvmAddressesEqual(pool.pool.poolId, subject.poolId)
}

export function toRelatedPools({
  pools,
  subject,
  maxCount = RELATED_POOLS_MAX_COUNT,
}: {
  pools: PlainMessage<RankedPool>[]
  subject: RelatedPoolsSubject
  maxCount?: number
}): RelatedPoolCardItem[] {
  return pools
    .filter((pool) => !isSubjectPool(pool, subject))
    .flatMap((pool) => rankedPoolToCardItem(pool) ?? [])
    .slice(0, maxCount)
}
