import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import { describe, expect, it } from 'vitest'

// Served-or-nothing: the backend is the single source of truth for protocol fees. The FE never
// computes fees — without a served value the breakdown is `unavailable`.
describe('getFeeBreakdown', () => {
  it('uses the served protocol fee for a v4 pool (additive: effective = LP + protocol)', () => {
    const breakdown = getFeeBreakdown({
      feeAmount: 3000,
      protocolVersion: ProtocolVersion.V4,
      servedProtocolFeeBps: 5,
    })
    expect(breakdown).toEqual({
      lpFeeBps: 30,
      protocolFeeBps: 5,
      effectiveFeeBps: 35,
      version: ProtocolVersion.V4,
    })
  })

  it('carves the served protocol fee out of the v2 fee (subtractive: effective = displayed tier)', () => {
    const breakdown = getFeeBreakdown({
      feeAmount: 3000,
      protocolVersion: ProtocolVersion.V2,
      servedProtocolFeeBps: 5,
    })
    expect(breakdown).toEqual({
      lpFeeBps: 25,
      protocolFeeBps: 5,
      effectiveFeeBps: 30,
      version: ProtocolVersion.V2,
    })
  })

  it('carves the served protocol fee out of the v3 fee', () => {
    const breakdown = getFeeBreakdown({
      feeAmount: 500,
      protocolVersion: ProtocolVersion.V3,
      servedProtocolFeeBps: 1.25,
    })
    expect(breakdown.protocolFeeBps).toBe(1.25)
    expect(breakdown.lpFeeBps).toBe(3.75)
    expect(breakdown.effectiveFeeBps).toBe(5)
  })

  it('treats a served 0 as a real value (v4 fees-off), not as unavailable', () => {
    const breakdown = getFeeBreakdown({
      feeAmount: 3000,
      protocolVersion: ProtocolVersion.V4,
      servedProtocolFeeBps: 0,
    })
    expect(breakdown.protocolFeeBps).toBe(0)
    expect(breakdown.effectiveFeeBps).toBe(30)
  })

  it('is unavailable without a served value — the FE never computes fees (v4)', () => {
    const breakdown = getFeeBreakdown({ feeAmount: 3000, protocolVersion: ProtocolVersion.V4 })
    expect(breakdown).toEqual({
      lpFeeBps: 30,
      protocolFeeBps: undefined,
      effectiveFeeBps: 30,
      version: ProtocolVersion.V4,
    })
  })

  it('is unavailable without a served value on v2/v3 too (no static schedule fallback)', () => {
    for (const protocolVersion of [ProtocolVersion.V2, ProtocolVersion.V3]) {
      const breakdown = getFeeBreakdown({ feeAmount: 3000, protocolVersion })
      expect(breakdown.protocolFeeBps).toBeUndefined()
      // Subtractive semantics: the displayed tier is still the effective rate, LP keeps all of it.
      expect(breakdown.lpFeeBps).toBe(30)
      expect(breakdown.effectiveFeeBps).toBe(30)
    }
  })

  it('served pips convert to bps exactly (integer pips / 100, no rounding)', () => {
    // The proto serves integer pips; 425 pips = 4.25 bps exactly.
    const breakdown = getFeeBreakdown({
      feeAmount: 2500,
      protocolVersion: ProtocolVersion.V4,
      servedProtocolFeeBps: 425 / 100,
    })
    expect(breakdown.protocolFeeBps).toBe(4.25)
    expect(breakdown.effectiveFeeBps).toBe(29.25)
  })

  it('keeps LP + protocol = effective across versions when served', () => {
    const versions = [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4]
    for (const protocolVersion of versions) {
      const breakdown = getFeeBreakdown({ feeAmount: 3000, protocolVersion, servedProtocolFeeBps: 5 })
      expect(breakdown.lpFeeBps + (breakdown.protocolFeeBps ?? 0)).toBe(breakdown.effectiveFeeBps)
    }
  })
})
