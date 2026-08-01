import { Percent } from '@uniswap/sdk-core'
import { ProtocolVersion } from '@universe/api'
import { calculateApr, getLpFeeFraction } from '~/appGraphql/data/pools/useTopPools'

describe('getLpFeeFraction', () => {
  it('returns 5/6 for v2 (protocol takes 1/6)', () => {
    expect(getLpFeeFraction(ProtocolVersion.V2)).toBe(5 / 6)
  })

  it('returns 3/4 for v3 low fee tiers 0.01% / 0.05% (protocol takes 1/4)', () => {
    expect(getLpFeeFraction(ProtocolVersion.V3, 100)).toBe(3 / 4)
    expect(getLpFeeFraction(ProtocolVersion.V3, 500)).toBe(3 / 4)
  })

  it('returns 5/6 for v3 high fee tiers 0.30% / 1.00% (protocol takes 1/6)', () => {
    expect(getLpFeeFraction(ProtocolVersion.V3, 3000)).toBe(5 / 6)
    expect(getLpFeeFraction(ProtocolVersion.V3, 10000)).toBe(5 / 6)
  })

  it('returns 1 (no protocol fee) for v4 and unknown versions', () => {
    expect(getLpFeeFraction(ProtocolVersion.V4, 3000)).toBe(1)
    expect(getLpFeeFraction(undefined, 3000)).toBe(1)
  })
})

describe('calculateApr', () => {
  it('returns 0 when required inputs are missing', () => {
    expect(calculateApr({}).equalTo(new Percent(0))).toBe(true)
    expect(calculateApr({ volume24h: 1000, tvl: 0, feeTier: 3000 }).equalTo(new Percent(0))).toBe(true)
  })

  it('excludes the protocol fee for v3 high-tier pools (LPs keep 5/6)', () => {
    const args = { volume24h: 6000, tvl: 1_000_000, feeTier: 3000 }
    // gross: 6000 * 0.003 * 365 = 6570
    expect(calculateApr(args).equalTo(new Percent(6570, 1_000_000))).toBe(true)
    // net: 6570 * 5/6 = 5475
    expect(calculateApr({ ...args, protocolVersion: ProtocolVersion.V3 }).equalTo(new Percent(5475, 1_000_000))).toBe(
      true,
    )
  })

  it('excludes the protocol fee for v3 low-tier pools (LPs keep 3/4)', () => {
    // 6000 * 0.0005 * 3/4 * 365 = 821.25 -> 821
    expect(
      calculateApr({
        volume24h: 6000,
        tvl: 1_000_000,
        feeTier: 500,
        protocolVersion: ProtocolVersion.V3,
      }).equalTo(new Percent(821, 1_000_000)),
    ).toBe(true)
  })

  it('does not deduct anything for v4 pools', () => {
    expect(
      calculateApr({
        volume24h: 6000,
        tvl: 1_000_000,
        feeTier: 3000,
        protocolVersion: ProtocolVersion.V4,
      }).equalTo(new Percent(6570, 1_000_000)),
    ).toBe(true)
  })

  it('prefers an explicit lpFeeFraction override over the version schedule', () => {
    // 6000 * 0.003 * 0.5 * 365 = 3285
    expect(
      calculateApr({
        volume24h: 6000,
        tvl: 1_000_000,
        feeTier: 3000,
        protocolVersion: ProtocolVersion.V3,
        lpFeeFraction: 0.5,
      }).equalTo(new Percent(3285, 1_000_000)),
    ).toBe(true)
  })
})
