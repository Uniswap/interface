import { ProtocolVersion } from '@universe/data-api'
import { calculate24hLpFeesUsd } from '~/data/pools/poolStats'

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

  // A v4 pool whose swap fee is taken by a hook has a real 0 static tier: fees are 0, not undefined
  // and not a fabricated tier's worth. Pairs with the parser fix that stops forcing these to 0.30%.
  it('returns 0 for a static 0 fee tier rather than inflating it', () => {
    expect(
      calculate24hLpFeesUsd({
        volume24h: 6000,
        feeTier: 0,
        isDynamic: false,
        protocolVersion: ProtocolVersion.V4,
        protocolFeePips: 0,
      }),
    ).toBe(0)
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
