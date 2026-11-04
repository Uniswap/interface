import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { describe, expect, it } from 'vitest'
import { convertPoolToPoolStat } from '~/features/Liquidity/utils/convertPoolToPoolStat'
import type { Pool } from '~/features/Liquidity/utils/pool'

function buildPool(overrides?: Partial<Pool>): Pool {
  return {
    poolId: 'pool-1',
    chainId: UniverseChainId.Mainnet,
    protocolVersion: ProtocolVersion.V3,
    token0Address: '0x1111111111111111111111111111111111111111',
    token1Address: '0x2222222222222222222222222222222222222222',
    feeTier: 3000,
    isDynamicFee: false,
    tickSpacing: 60,
    tvl: 1000,
    liquidity: 0n,
    ...overrides,
  } as Pool
}

describe('convertPoolToPoolStat', () => {
  it('passes a static fee tier through unchanged', () => {
    const stat = convertPoolToPoolStat(buildPool({ feeTier: 500, tickSpacing: 10 }))
    expect(stat.feeTier?.feeAmount).toBe(500)
    expect(stat.feeTier?.tickSpacing).toBe(10)
    expect(stat.feeTier?.isDynamic).toBe(false)
  })

  // A dynamic-fee `Pool` reaches here already carrying the SDK sentinel — normalizeRankedPool
  // substitutes it for the raw max-fee constant ListPools serves (see its own suite). Asserted
  // literally as 8388608 as well as by name, so a revert is caught even if the constant ever moves.
  // Un-normalized, the value trips the v4-sdk's fee invariant and hashes to the wrong pool id.
  it('carries the dynamic-fee sentinel through onto the stat', () => {
    const stat = convertPoolToPoolStat(buildPool({ feeTier: DYNAMIC_FEE_AMOUNT, isDynamicFee: true, tickSpacing: 200 }))
    expect(stat.feeTier?.feeAmount).toBe(8_388_608)
    expect(stat.feeTier?.feeAmount).toBe(DYNAMIC_FEE_AMOUNT)
    expect(stat.feeTier?.tickSpacing).toBe(200)
    expect(stat.feeTier?.isDynamic).toBe(true)
  })

  it('falls back to the default tick spacing when the field is absent', () => {
    const stat = convertPoolToPoolStat(buildPool({ tickSpacing: undefined }))
    expect(stat.feeTier?.tickSpacing).toBe(DEFAULT_TICK_SPACING)
  })

  // Every APR figure is served: `total_apr` is the backend's fee + reward sum, so nothing here
  // re-adds the boost, and an unserved APR stays undefined rather than becoming a displayed "0.00%".
  it('passes categoryIds straight through', () => {
    expect(convertPoolToPoolStat(buildPool({ categoryIds: ['stable-pools'] })).categoryIds).toEqual(['stable-pools'])
  })

  it('passes the served APRs straight through', () => {
    const stat = convertPoolToPoolStat(buildPool({ apr: 4.99, totalApr: 9.49, rewardApr: 4.5 }))
    expect(stat.apr).toBe(4.99)
    expect(stat.totalApr).toBe(9.49)
    expect(stat.boostedApr).toBe(4.5)

    const unserved = convertPoolToPoolStat(buildPool({ apr: undefined, totalApr: undefined }))
    expect(unserved.apr).toBeUndefined()
    expect(unserved.totalApr).toBeUndefined()
  })

  // Per-pool fee enrichment is best-effort: an unserved fee must stay undefined rather than becoming
  // a served 0, which FeeDisplay would render as a real "0%" protocol fee instead of dropping the
  // breakdown tooltip.
  it('carries the served protocol fee, leaving it undefined when unserved', () => {
    expect(convertPoolToPoolStat(buildPool({ protocolFee: 500 })).protocolFeePips).toBe(500)
    expect(convertPoolToPoolStat(buildPool({ protocolFee: undefined })).protocolFeePips).toBeUndefined()
  })
})
