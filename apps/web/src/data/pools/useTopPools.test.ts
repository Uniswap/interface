import { Percent } from '@uniswap/sdk-core'
import { ProtocolVersion } from '@universe/api'
import { calculate24hLpFeesUsd, calculateApr } from '~/data/pools/useTopPools'

describe('calculateApr', () => {
  it('returns 0 when required inputs are missing', () => {
    expect(calculateApr({})?.equalTo(new Percent(0))).toBe(true)
    expect(calculateApr({ volume24h: 1000, tvl: 0, feeTier: 3000 })?.equalTo(new Percent(0))).toBe(true)
  })

  it('is gross (no deduction) when the backend serves no protocol fee', () => {
    // 6000 * 0.003 * 365 = 6570 — the full fee tier, no client-side approximation
    expect(
      calculateApr({ volume24h: 6000, tvl: 1_000_000, feeTier: 3000, protocolVersion: ProtocolVersion.V3 })?.equalTo(
        new Percent(6570, 1_000_000),
      ),
    ).toBe(true)
  })

  it('carves out the served protocol fee for v3 (LPs keep the remainder)', () => {
    // high tier: protocol takes 1/6 of 0.30% => 500 pips; net = 6570 * 5/6 = 5475
    expect(
      calculateApr({
        volume24h: 6000,
        tvl: 1_000_000,
        feeTier: 3000,
        protocolVersion: ProtocolVersion.V3,
        protocolFeePips: 500,
      })?.equalTo(new Percent(5475, 1_000_000)),
    ).toBe(true)
    // low tier: protocol takes 1/4 of 0.05% => 125 pips; 6000 * 0.0005 * 3/4 * 365 = 821.25 -> 821
    expect(
      calculateApr({
        volume24h: 6000,
        tvl: 1_000_000,
        feeTier: 500,
        protocolVersion: ProtocolVersion.V3,
        protocolFeePips: 125,
      })?.equalTo(new Percent(821, 1_000_000)),
    ).toBe(true)
  })

  it('carves out the served protocol fee for v2', () => {
    // protocol takes 1/6 of 0.30% => 500 pips; net = 5475
    expect(
      calculateApr({
        volume24h: 6000,
        tvl: 1_000_000,
        feeTier: 3000,
        protocolVersion: ProtocolVersion.V2,
        protocolFeePips: 500,
      })?.equalTo(new Percent(5475, 1_000_000)),
    ).toBe(true)
  })

  it('does not deduct for v4 (the protocol fee stacks on top of the LP fee)', () => {
    expect(
      calculateApr({
        volume24h: 6000,
        tvl: 1_000_000,
        feeTier: 3000,
        protocolVersion: ProtocolVersion.V4,
        protocolFeePips: 500,
      })?.equalTo(new Percent(6570, 1_000_000)),
    ).toBe(true)
  })

  // A dynamic-fee pool's `feeTier` is the v4-sdk's dynamic-fee sentinel (8_388_608), not a literal
  // rate. Fed through uncaught, `feeTier / 1_000_000` alone is an ~8.4x rate, producing a
  // nonsensical multi-million-percent APR — `isDynamic` must skip the calculation entirely.
  // It returns `undefined` (mirroring calculate24hLpFeesUsd) rather than 0 so a dynamic-fee pool's
  // APR cell falls back the same way its 24h-fees cell does, instead of pairing a blank fees cell
  // with a definite "0.00%" APR.
  it('returns undefined for a dynamic-fee pool instead of treating the sentinel as a literal rate', () => {
    expect(
      calculateApr({
        volume24h: 6000,
        tvl: 1_000_000,
        feeTier: 8_388_608,
        isDynamic: true,
        protocolVersion: ProtocolVersion.V4,
      }),
    ).toBeUndefined()
  })

  it('returns undefined for a dynamic-fee pool even when volume/tvl are missing', () => {
    expect(calculateApr({ isDynamic: true })).toBeUndefined()
  })
})

describe('calculate24hLpFeesUsd', () => {
  it('returns undefined when volume or fee tier is unavailable', () => {
    expect(calculate24hLpFeesUsd({ feeTier: 3000 })).toBeUndefined()
    expect(calculate24hLpFeesUsd({ volume24h: 6000 })).toBeUndefined()
  })

  it('is gross when the backend serves no protocol fee', () => {
    // 6000 * 0.003 = 18
    expect(calculate24hLpFeesUsd({ volume24h: 6000, feeTier: 3000, protocolVersion: ProtocolVersion.V3 })).toBe(18)
  })

  it('carves out the served protocol fee for v3', () => {
    // 6000 * 0.003 * 5/6 = 15
    expect(
      calculate24hLpFeesUsd({
        volume24h: 6000,
        feeTier: 3000,
        protocolVersion: ProtocolVersion.V3,
        protocolFeePips: 500,
      }),
    ).toBe(15)
  })

  it('does not deduct for v4', () => {
    expect(
      calculate24hLpFeesUsd({
        volume24h: 6000,
        feeTier: 3000,
        protocolVersion: ProtocolVersion.V4,
        protocolFeePips: 500,
      }),
    ).toBe(18)
  })

  it('returns undefined for a dynamic-fee pool instead of treating the sentinel as a literal rate', () => {
    expect(
      calculate24hLpFeesUsd({
        volume24h: 6000,
        feeTier: 8_388_608,
        isDynamic: true,
        protocolVersion: ProtocolVersion.V4,
      }),
    ).toBeUndefined()
  })
})
