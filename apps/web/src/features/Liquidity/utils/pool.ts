import type { PlainMessage } from '@bufbuild/protobuf'
import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { PoolRankStats } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { PositionRewardApr } from 'uniswap/src/features/positions/types'

export const INTEGER_STRING_REGEX = /^\d+$/

// Every Pool adapter clamps tvl through this: consumers feed it to BigInt(Math.trunc(tvl)), which throws on non-finite values.
export function normalizeTvl(tvl: number): number {
  return Number.isFinite(tvl) ? tvl : 0
}

/** Display metadata for one side of a pool; the subset of a rich token the pool table renders. */
export type PoolTokenMetadata = {
  symbol?: string
  name?: string
  decimals?: number
  logoUrl?: string
}

/**
 * Canonical pool shape shared by the pool data sources: data.v2 `ListPools` (via
 * `normalizeRankedPool`) and liquidity-service `GetPool` (via `normalizePoolSummary`). Identity
 * fields mirror data.v2 `Pool`, stats mirror data.v2 `PoolRankStats`.
 *
 * `token0Address`/`token1Address` stay flat strings rather than data.v2's rich `Token`. The
 * PoolBrowser table needs display metadata, so `token0Metadata`/`token1Metadata` carry the subset
 * it reads; sources without metadata leave them undefined.
 *
 * `liquidity`/`currentTick`/`sqrtPriceX96` sit on data.v2 `Pool` (V3/V4 only; absent until a state
 * row is indexed). `liquidity` is normalized to bigint here so consumers don't each re-parse the
 * wire string; 0n means absent or unparseable.
 *
 * `rewardApr` is the Merkl reward yield summed across every token paying it, and `rewards` is the
 * per-token breakdown behind it. Both come from the ranked source only: `PoolFromGetPool` omits
 * them, because the GetPool response's rewards reach their surfaces as `PoolData` instead.
 */
export type Pool = {
  poolId: string
  chainId: number
  protocolVersion: ProtocolVersion
  token0Address: string
  token1Address: string
  token0Metadata?: PoolTokenMetadata
  token1Metadata?: PoolTokenMetadata
  feeTier?: number
  isDynamicFee: boolean
  // The LP fee the pool charges right now (pips). Equals `feeTier` except on a v4 dynamic-fee pool,
  // where it's the most recent swap's fee; unset when that can't be established yet.
  currentLpFee?: number
  tickSpacing?: number
  hookAddress?: string
  liquidity: bigint
  // Required here even though PoolRankStats leaves it optional: the adapter always sets it
  // (0 when non-numeric), and consumers rank pools by it — a statless pool must not win by
  // comparing against undefined.
  tvl: number
  currentTick?: number
  sqrtPriceX96?: string
  protocolFee?: number
  /** BE-ranked pool category ids; the first resolvable one is the row tag. Ranked sources only. */
  categoryIds?: string[]
  /** The pool's quote token, always token0Address or token1Address; unset until the backend resolves one. */
  quoteTokenAddress?: string
  // The tokens `rewardApr` is paid in, one entry per token, and the normalized replacement for
  // `PoolRankStats.tokenBoosts` (omitted below) — the wire shape carries a served `Token` this
  // flattens to what the badges actually render.
  // Required for the same reason as `tvl`: the adapter that populates it always does, and an empty
  // array is the real answer for a pool running no campaign.
  rewards: PositionRewardApr[]
} & Omit<PlainMessage<PoolRankStats>, 'tokenBoosts'>
