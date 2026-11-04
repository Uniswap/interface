import { ProtocolVersion, Token as PoolsToken } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  Pool as DataApiPool,
  PoolRankStats,
  PoolTokenBoost,
  RankedPool,
  Token,
} from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { DYNAMIC_FEE_AMOUNT, V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import { normalizeRankedPool } from '~/features/Liquidity/utils/normalizeRankedPool'

const HOOK = '0xEADe493b075Cee00e6A832Af758B7c76793FE880'
const UNI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

const rankedPool = ({
  pool = {},
  stats = {},
}: {
  pool?: Partial<DataApiPool>
  stats?: Partial<PoolRankStats>
} = {}): RankedPool =>
  new RankedPool({
    pool: new DataApiPool({
      chainId: 1,
      poolId: '0x000000000000000000000000000000000000000000000000000000000000abcd',
      token0: new Token({
        chainId: 1,
        address: '0x1111111111111111111111111111111111111111',
        symbol: 'AAA',
        name: 'Token A',
        decimals: 18,
        project: { logoUrl: 'logo0' },
      }),
      token1: new Token({
        chainId: 1,
        address: '0x2222222222222222222222222222222222222222',
        symbol: 'BBB',
        name: 'Token B',
        decimals: 6,
      }),
      protocolVersion: ProtocolVersion.V4,
      tickSpacing: 60,
      feeTier: 3000,
      isDynamicFee: false,
      hookAddress: HOOK,
      ...pool,
    }),
    stats: new PoolRankStats({ tvl: 123456.78, volume1d: 42, apr: 0.125, ...stats }),
  })

describe('normalizeRankedPool', () => {
  it('maps a RankedPool to the canonical Pool shape', () => {
    const pool = normalizeRankedPool(rankedPool())

    expect(pool).toMatchObject({
      poolId: '0x000000000000000000000000000000000000000000000000000000000000abcd',
      chainId: 1,
      protocolVersion: ProtocolVersion.V4,
      token0Address: '0x1111111111111111111111111111111111111111',
      token1Address: '0x2222222222222222222222222222222222222222',
      feeTier: 3000,
      isDynamicFee: false,
      tickSpacing: 60,
      hookAddress: HOOK,
      tvl: 123456.78,
      volume1d: 42,
      apr: 0.125,
      currentTick: undefined,
      sqrtPriceX96: undefined,
      liquidity: 0n,
    })
  })

  // The backend serves fee_tier for every protocol version: the pool key's fee (the v4 dynamic-fee
  // flag) for a dynamic pool, the fixed 0.30% for a V2 pair. Both pass straight through — nothing
  // is substituted client-side any more.
  it('passes the served feeTier through for dynamic-fee and protocol-V2 pools', () => {
    const dynamic = normalizeRankedPool(rankedPool({ pool: { feeTier: DYNAMIC_FEE_AMOUNT, isDynamicFee: true } }))
    expect(dynamic?.feeTier).toBe(DYNAMIC_FEE_AMOUNT)
    expect(dynamic?.isDynamicFee).toBe(true)

    const v2Pair = normalizeRankedPool(
      rankedPool({
        pool: { feeTier: V2_DEFAULT_FEE_TIER, protocolVersion: ProtocolVersion.V2, hookAddress: undefined },
      }),
    )
    expect(v2Pair?.protocolVersion).toBe(ProtocolVersion.V2)
    expect(v2Pair?.feeTier).toBe(V2_DEFAULT_FEE_TIER)
  })

  it('passes a served feeTier through untouched for a static-fee pool', () => {
    expect(normalizeRankedPool(rankedPool({ pool: { feeTier: 3000, isDynamicFee: false } }))?.feeTier).toBe(3000)
  })

  it('leaves feeTier undefined (not 0) for a non-V2, non-dynamic pool with no served feeTier', () => {
    const pool = normalizeRankedPool(rankedPool({ pool: { feeTier: undefined, isDynamicFee: false } }))
    expect(pool?.feeTier).toBeUndefined()
  })

  // Same proto3 hazard as feeTier: an unserved tick spacing arrives as 0, which is never a valid
  // spacing. Left as 0 it would slip past the consumer's fallback into tick math and the v4
  // pool-id hash.
  it('leaves tickSpacing undefined (not 0) when none is served', () => {
    expect(normalizeRankedPool(rankedPool({ pool: { tickSpacing: 0 } }))?.tickSpacing).toBeUndefined()
    expect(normalizeRankedPool(rankedPool({ pool: { tickSpacing: undefined } }))?.tickSpacing).toBeUndefined()
    expect(normalizeRankedPool(rankedPool({ pool: { tickSpacing: 10 } }))?.tickSpacing).toBe(10)
  })

  it('returns undefined when the pool is missing or the protocol version is unspecified', () => {
    expect(normalizeRankedPool(new RankedPool({}))).toBeUndefined()
    expect(normalizeRankedPool(rankedPool({ pool: { protocolVersion: ProtocolVersion.UNSPECIFIED } }))).toBeUndefined()
  })

  it('leaves onchain state absent (liquidity 0n) when no state row is served', () => {
    const pool = normalizeRankedPool(
      rankedPool({ pool: { currentTick: undefined, sqrtPriceX96: undefined, liquidity: undefined } }),
    )
    expect(pool?.currentTick).toBeUndefined()
    expect(pool?.sqrtPriceX96).toBeUndefined()
    expect(pool?.liquidity).toBe(0n)
  })

  it('defaults missing tvl to zero and leaves volume1d absent', () => {
    const pool = normalizeRankedPool(new RankedPool({ pool: rankedPool().pool }))
    expect(pool?.tvl).toBe(0)
    expect(pool?.volume1d).toBeUndefined()
  })

  it('maps rewardApr', () => {
    const pool = normalizeRankedPool(rankedPool({ stats: { rewardApr: 0.25 } }))
    expect(pool?.rewardApr).toBe(0.25)
  })

  // `rewardApr` is the cross-token sum, so it names no token. The per-token boosts are what let a
  // surface render "+2% in UNI" rather than a bare number under a guessed symbol.
  it('maps token_boosts onto the per-token rewards, dropping ended campaigns', () => {
    const uni = { chainId: 1, address: UNI, symbol: 'UNI', decimals: 18, isNative: false }
    const usdc = { chainId: 1, address: USDC, symbol: 'USDC', decimals: 6, isNative: false }
    const pool = normalizeRankedPool(
      rankedPool({
        stats: {
          rewardApr: 6.5,
          tokenBoosts: [
            new PoolTokenBoost({ token: new PoolsToken(uni), apr: 4.5 }),
            // Zero APR is an ended campaign — no yield to badge, so no entry.
            new PoolTokenBoost({ token: new PoolsToken({ ...usdc, address: DAI }), apr: 0 }),
            new PoolTokenBoost({ token: new PoolsToken(usdc), apr: 2 }),
          ],
        },
      }),
    )

    expect(pool?.rewards).toEqual([
      { token: uni, boostedPoolApr: 4.5 },
      { token: usdc, boostedPoolApr: 2 },
    ])
  })

  it('leaves rewards empty for a pool running no live campaign', () => {
    expect(normalizeRankedPool(rankedPool())?.rewards).toEqual([])
  })

  it('passes categoryIds through in served order', () => {
    expect(
      normalizeRankedPool(rankedPool({ pool: { categoryIds: ['major-pools', 'defi-pools'] } }))?.categoryIds,
    ).toEqual(['major-pools', 'defi-pools'])
  })

  it('maps protocolFee', () => {
    const pool = normalizeRankedPool(rankedPool({ pool: { protocolFee: 50 } }))
    expect(pool?.protocolFee).toBe(50)
  })

  it('clamps non-finite tvl to 0 via normalizeTvl', () => {
    expect(normalizeRankedPool(rankedPool({ stats: { tvl: NaN } }))?.tvl).toBe(0)
    expect(normalizeRankedPool(rankedPool({ stats: { tvl: Infinity } }))?.tvl).toBe(0)
  })

  it('normalizes enum names rehydrated from persistence to the numeric enum', () => {
    const persisted = {
      pool: { ...rankedPool().pool!, protocolVersion: 'V3' as unknown as ProtocolVersion },
      stats: undefined,
    }
    expect(normalizeRankedPool(persisted)?.protocolVersion).toBe(ProtocolVersion.V3)
  })
})
