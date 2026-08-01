import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import {
  computeSubtractiveProtocolFeeBps,
  computeVanillaProtocolFeeBps,
  getCreateTierFeeBreakdown,
} from 'uniswap/src/features/fees/feeCurve'
import { DEFAULT_FEE_TIER_PAIRS } from 'uniswap/src/features/fees/feeTiers'
import { describe, expect, it } from 'vitest'

// The v4 protocol-fee curve (spec Appendix). Computed FE-side only for the create flow (vanilla
// pools), where no pool exists yet for the backend to serve a per-pool fee.
describe('computeVanillaProtocolFeeBps', () => {
  it('matches the spec worked examples', () => {
    expect(computeVanillaProtocolFeeBps(30)).toBe(5) // 30 bps LP → 5 bps protocol (35 effective)
    expect(computeVanillaProtocolFeeBps(15)).toBe(2.625) // 15 bps LP → 2.625 bps protocol (17.625 effective)
  })

  it('reproduces the fixed protocol fee the spec pairs with each new default tier', () => {
    for (const { newBps, protocolBps } of DEFAULT_FEE_TIER_PAIRS) {
      expect(computeVanillaProtocolFeeBps(newBps)).toBe(protocolBps)
    }
  })

  it('reproduces the appendix protocol fee for the old tiers', () => {
    expect(computeVanillaProtocolFeeBps(0.03)).toBe(0.01)
    expect(computeVanillaProtocolFeeBps(1)).toBe(0.25)
    expect(computeVanillaProtocolFeeBps(5)).toBe(1.25)
    expect(computeVanillaProtocolFeeBps(30)).toBe(5)
    expect(computeVanillaProtocolFeeBps(100)).toBe(10)
  })

  it('is continuous — approaching a bucket floor from below lands on the fee at the floor', () => {
    for (const floor of [0.03, 0.75, 1, 3.75, 5, 25, 55]) {
      expect(computeVanillaProtocolFeeBps(floor - 1e-6)).toBeCloseTo(computeVanillaProtocolFeeBps(floor), 5)
    }
  })

  it('caps the protocol fee at 10 bps for LP fees >= 55 bps', () => {
    expect(computeVanillaProtocolFeeBps(55)).toBe(10)
    expect(computeVanillaProtocolFeeBps(90)).toBe(10)
    expect(computeVanillaProtocolFeeBps(100)).toBe(10)
    expect(computeVanillaProtocolFeeBps(9999)).toBe(10)
  })

  it('returns the base fee at and below the lowest bucket', () => {
    expect(computeVanillaProtocolFeeBps(0)).toBe(0.01)
    expect(computeVanillaProtocolFeeBps(0.01)).toBe(0.01)
  })
})

// The v2/v3 subtractive carve-out schedule (backend ProtocolFeeResolver preview): v2's feeTo takes
// 1/6; v3's feeProtocol takes 1/4 on its two lowest tiers (0.01% / 0.05%) and 1/6 on the rest.
describe('computeSubtractiveProtocolFeeBps', () => {
  it('carves a constant 1/6 out of the v2 0.30% tier (5 bps)', () => {
    expect(computeSubtractiveProtocolFeeBps(FeeAmount.MEDIUM, ProtocolVersion.V2)).toBe(5)
  })

  it('takes 1/4 on the v3 0.01% and 0.05% tiers', () => {
    expect(computeSubtractiveProtocolFeeBps(FeeAmount.LOWEST, ProtocolVersion.V3)).toBe(0.25) // 1 bps → 0.25
    expect(computeSubtractiveProtocolFeeBps(FeeAmount.LOW, ProtocolVersion.V3)).toBe(1.25) // 5 bps → 1.25
  })

  it('takes 1/6 on the higher v3 tiers', () => {
    expect(computeSubtractiveProtocolFeeBps(FeeAmount.MEDIUM, ProtocolVersion.V3)).toBe(5) // 30 bps → 5
    expect(computeSubtractiveProtocolFeeBps(FeeAmount.HIGH, ProtocolVersion.V3)).toBeCloseTo(100 / 6, 5) // 100 bps → 16.67
  })

  it('leaves the LP with the paired new-tier LP fee on the low v3 tiers (the cross-version symmetry)', () => {
    // v3 0.01% (1 bps) carves 0.25 → LP keeps 0.75 (the new 0.0075% tier); 0.05% (5 bps) carves 1.25 → LP keeps 3.75.
    expect(1 - computeSubtractiveProtocolFeeBps(FeeAmount.LOWEST, ProtocolVersion.V3)).toBe(0.75)
    expect(5 - computeSubtractiveProtocolFeeBps(FeeAmount.LOW, ProtocolVersion.V3)).toBe(3.75)
  })

  it('uses 1/6 for a non-standard v3 tier (not one of the two lowest)', () => {
    expect(computeSubtractiveProtocolFeeBps(400, ProtocolVersion.V3)).toBeCloseTo(4 / 6, 5) // 0.04% → 0.667
  })

  it('applies the quarter carve to v3 only — v2 always takes 1/6, even at the low fee amounts', () => {
    expect(computeSubtractiveProtocolFeeBps(FeeAmount.LOWEST, ProtocolVersion.V2)).toBeCloseTo(1 / 6, 5)
  })
})

describe('getCreateTierFeeBreakdown', () => {
  it('derives the additive v4 breakdown from the curve for a vanilla pool (no hook)', () => {
    // 30 bps LP (3000 pips) → curve gives 5 bps protocol, 35 bps effective.
    expect(
      getCreateTierFeeBreakdown({ feeAmount: 3000, protocolVersion: ProtocolVersion.V4, hook: undefined }),
    ).toEqual({
      lpFeeBps: 30,
      protocolFeeBps: 5,
      effectiveFeeBps: 35,
      version: ProtocolVersion.V4,
    })
  })

  it('treats a ZERO_ADDRESS hook as a vanilla pool and derives from the curve', () => {
    expect(
      getCreateTierFeeBreakdown({ feeAmount: 3000, protocolVersion: ProtocolVersion.V4, hook: ZERO_ADDRESS }),
    ).toEqual({
      lpFeeBps: 30,
      protocolFeeBps: 5,
      effectiveFeeBps: 35,
      version: ProtocolVersion.V4,
    })
  })

  it('is unavailable for a hooked pool (family default + 25x — never computed)', () => {
    const breakdown = getCreateTierFeeBreakdown({
      feeAmount: 3000,
      protocolVersion: ProtocolVersion.V4,
      hook: '0x0000000000000000000000000000000000000088',
    })
    expect(breakdown.protocolFeeBps).toBeUndefined()
    expect(breakdown.effectiveFeeBps).toBe(breakdown.lpFeeBps)
  })

  it('carves the subtractive protocol fee out of a v2 tier (1/6)', () => {
    // v2 0.30% (3000 pips): 25 LP + 5 protocol = 30 effective (the displayed tier).
    expect(getCreateTierFeeBreakdown({ feeAmount: 3000, protocolVersion: ProtocolVersion.V2 })).toEqual({
      lpFeeBps: 25,
      protocolFeeBps: 5,
      effectiveFeeBps: 30,
      version: ProtocolVersion.V2,
    })
  })

  it('carves the subtractive protocol fee out of a v3 low tier (1/4)', () => {
    // v3 0.05% (500 pips): 3.75 LP + 1.25 protocol = 5 effective (the displayed tier).
    expect(getCreateTierFeeBreakdown({ feeAmount: FeeAmount.LOW, protocolVersion: ProtocolVersion.V3 })).toEqual({
      lpFeeBps: 3.75,
      protocolFeeBps: 1.25,
      effectiveFeeBps: 5,
      version: ProtocolVersion.V3,
    })
  })
})
