import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniverseChainId } from '@universe/chains'

/** TVL quick-select bucket ids. Kept as a union so the id, its USD range, and its chip label stay in sync. */
export type PoolsFilterTvlBucketId = 'lt-100k' | '100k-1m' | 'gt-10m'

/** Smallest/largest APR (percent) across a surface's loaded pools, shown as placeholder hints in the APR fields. */
export interface PoolsAprRange {
  min: number
  max: number
}

/**
 * State for the advanced pools filter. Lives in `~/types` rather
 * than the Liquidity feature so both the Liquidity filter component and the Explore filter store can share
 * it without crossing the Liquidity import boundary.
 */
export interface PoolsFilterState {
  chainId?: UniverseChainId
  protocols: ProtocolVersion[]
  aprMin: string
  aprMax: string
  rewardsOnly: boolean
  tvlBucketId?: PoolsFilterTvlBucketId
}

export const EMPTY_POOLS_FILTER_STATE: PoolsFilterState = {
  chainId: undefined,
  protocols: [],
  aprMin: '',
  aprMax: '',
  rewardsOnly: false,
  tvlBucketId: undefined,
}
