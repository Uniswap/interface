import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { PoolSummary } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { normalizePoolSummary } from '~/features/Liquidity/utils/normalizePoolSummary'

const HOOK = '0xEADe493b075Cee00e6A832Af758B7c76793FE880'

const poolSummary = (overrides: Partial<PoolSummary> = {}): PoolSummary =>
  new PoolSummary({
    poolIdentifier: '0x000000000000000000000000000000000000000000000000000000000000abcd',
    chainId: 1,
    protocolVersion: Protocols.V4,
    token0Address: '0x1111111111111111111111111111111111111111',
    token1Address: '0x2222222222222222222222222222222222222222',
    feeTier: 3000,
    tvlUsd: 123456.78,
    volumeUsd1d: 42,
    apr: 0.125,
    currentTick: -12345,
    sqrtPriceX96: '79228162514264337593543950336',
    liquidity: '42426406871192851',
    hookAddress: HOOK,
    tickSpacing: 60,
    ...overrides,
  })

describe('normalizePoolSummary', () => {
  it('maps a PoolSummary to the canonical Pool shape', () => {
    const pool = normalizePoolSummary(poolSummary())

    expect(pool).toEqual({
      poolId: '0x000000000000000000000000000000000000000000000000000000000000abcd',
      chainId: 1,
      protocolVersion: ProtocolVersion.V4,
      token0Address: '0x1111111111111111111111111111111111111111',
      token1Address: '0x2222222222222222222222222222222222222222',
      feeTier: 3000,
      isDynamicFee: false,
      tickSpacing: 60,
      hookAddress: HOOK,
      liquidity: 42426406871192851n,
      tvl: 123456.78,
      volume1d: 42,
      volume30d: undefined,
      apr: 0.125,
      rewardApr: undefined,
      totalApr: undefined,
      volume1dTvlRatio: undefined,
      currentTick: -12345,
      sqrtPriceX96: '79228162514264337593543950336',
      protocolFee: undefined,
      categoryIds: [],
    })
  })

  it('carries the served category ids', () => {
    expect(normalizePoolSummary(poolSummary({ categoryIds: ['majors', 'defi'] })).categoryIds).toEqual([
      'majors',
      'defi',
    ])
  })

  it('prefers the served isDynamicFee over the fee-tier sentinel', () => {
    expect(normalizePoolSummary(poolSummary({ isDynamicFee: true, feeTier: 3000 })).isDynamicFee).toBe(true)
    expect(normalizePoolSummary(poolSummary({ isDynamicFee: false, feeTier: DYNAMIC_FEE_AMOUNT })).isDynamicFee).toBe(
      false,
    )
  })

  it('derives isDynamicFee from the dynamic-fee sentinel', () => {
    expect(normalizePoolSummary(poolSummary({ feeTier: DYNAMIC_FEE_AMOUNT })).isDynamicFee).toBe(true)
  })

  it('normalizes enum names rehydrated from persistence to the numeric enum', () => {
    const persisted = { ...poolSummary(), protocolVersion: 'V3' as unknown as Protocols }
    expect(normalizePoolSummary(persisted).protocolVersion).toBe(ProtocolVersion.V3)
  })

  it('falls back to 0n liquidity when the wire string is absent or not a plain integer', () => {
    expect(normalizePoolSummary(poolSummary({ liquidity: undefined })).liquidity).toBe(0n)
    expect(normalizePoolSummary(poolSummary({ liquidity: 'not-a-number' })).liquidity).toBe(0n)
  })
})
