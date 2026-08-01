import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import { getFeeBreakdown } from 'uniswap/src/features/fees/getFeeBreakdown'
import type { FeeBreakdown } from 'uniswap/src/features/fees/types'

/**
 * Protocol-fee math for the create-pool flow — the ONE place the FE computes a fee. A pool being
 * created doesn't exist yet, so the backend has no per-pool value to serve; every other (read)
 * surface consumes the backend value via `getFeeBreakdown` (served-or-nothing) and never computes.
 *
 * Two regimes, matching the backend's preview schedule (see the data-api `ProtocolFeeResolver`):
 * - v4 (additive): a continuous, piecewise-linear curve of the LP fee, from the V4 Fee Handling spec
 *   (Appendix "The fee curve"). Only valid for vanilla (hookless) pools — hooked pools (aggregator/
 *   CCA) use family defaults + a 25x multiplier, so callers must gate the curve on a vanilla pool.
 * - v2/v3 (subtractive): the fee switch carves a fixed fraction out of the displayed tier. See
 *   {@link computeSubtractiveProtocolFeeBps}.
 */
interface FeeCurveBucket {
  /** Inclusive lower bound of the LP-fee range (bps). */
  floorBps: number
  /** Protocol fee (bps) at the range floor. */
  alphaBps: number
  /** Slope: protocol-fee bps gained per bps of LP fee above the floor. */
  beta: number
}

// Protocol fee at the base of the lowest bucket (LP fee in [0, 0.03) bps).
const BASE_PROTOCOL_FEE_BPS = 0.01

// Buckets ascending by floor; the top bucket is open-ended and caps the protocol fee at 10 bps
// (LP fee >= 55 bps). Each bucket's floor fee equals the previous bucket's ceiling fee, so the
// curve is continuous.
const FEE_CURVE_BUCKETS: readonly FeeCurveBucket[] = [
  { floorBps: 0, alphaBps: BASE_PROTOCOL_FEE_BPS, beta: 0 },
  { floorBps: 0.03, alphaBps: 0.01, beta: 19 / 72 },
  { floorBps: 0.75, alphaBps: 0.2, beta: 0.2 },
  { floorBps: 1, alphaBps: 0.25, beta: 3 / 11 },
  { floorBps: 3.75, alphaBps: 1, beta: 0.2 },
  { floorBps: 5, alphaBps: 1.25, beta: 11 / 80 },
  { floorBps: 25, alphaBps: 4, beta: 0.2 },
  { floorBps: 55, alphaBps: 10, beta: 0 },
]

// Round well below display precision (4 decimals of percent = 0.01 bps) to strip floating-point
// noise from the fractional v4 slopes (19/72, 3/11, 11/80) and the v2/v3 carve-out fractions (1/6,
// 1/4) while preserving exact spec values (2.625, 0.25).
const FEE_CURVE_PRECISION = 1e6

function roundFeeBps(bps: number): number {
  return Math.round(bps * FEE_CURVE_PRECISION) / FEE_CURVE_PRECISION
}

/**
 * Protocol fee (bps) for a vanilla v4 pool at the given LP fee (bps), per the governance curve.
 * Continuous, and capped at 10 bps for LP fees >= 55 bps. Only valid for vanilla (hookless) pools.
 */
export function computeVanillaProtocolFeeBps(lpFeeBps: number): number {
  let protocolFeeBps = BASE_PROTOCOL_FEE_BPS
  for (const bucket of FEE_CURVE_BUCKETS) {
    if (lpFeeBps < bucket.floorBps) {
      break
    }
    protocolFeeBps = bucket.alphaBps + bucket.beta * (lpFeeBps - bucket.floorBps)
  }
  return roundFeeBps(protocolFeeBps)
}

// v3's fee switch (feeProtocol) takes 1/4 of the swap fee on its two lowest tiers (0.01% / 0.05%)
// and 1/6 on all higher tiers; v2's feeTo always takes 1/6 (its sole tier is 0.30%). Mirrors the
// backend data-api `ProtocolFeeResolver` preview schedule used when no on-chain value exists.
const V3_QUARTER_CARVE_TIERS: ReadonlySet<number> = new Set([FeeAmount.LOWEST, FeeAmount.LOW])
const DEFAULT_CARVE_FRACTION = 1 / 6
const LOW_TIER_CARVE_FRACTION = 1 / 4

/**
 * Protocol fee (bps) carved out of a v2/v3 pool's displayed fee tier, per the governance fee-switch
 * schedule. Unlike v4's additive curve this is *subtractive* — LP fee = displayed - this, effective
 * = displayed — so it feeds `getFeeBreakdown` as a v2/v3 `servedProtocolFeeBps`. The create flow uses
 * it for a not-yet-created pool (no served on-chain value); existing pools serve the real value.
 * `feeAmount` is the stored pip tier (v3: 100/500/3000/10000). Only valid for v2/v3.
 */
export function computeSubtractiveProtocolFeeBps(feeAmount: number, protocolVersion: ProtocolVersion): number {
  const carveFraction =
    protocolVersion === ProtocolVersion.V3 && V3_QUARTER_CARVE_TIERS.has(feeAmount)
      ? LOW_TIER_CARVE_FRACTION
      : DEFAULT_CARVE_FRACTION
  return roundFeeBps(feeAmountToBps(feeAmount) * carveFraction)
}

/**
 * Fee breakdown for a not-yet-created pool tier of any version — the single entry point the create
 * flow uses when there is no backend value to serve yet. v4 is *additive*: vanilla pools derive the
 * protocol fee from the governance curve; hooked pools can't be computed (family default + 25x
 * multiplier) so they're `unavailable` — a missing or ZERO_ADDRESS `hook` is vanilla, the sole place
 * this address→hooked check lives. v2/v3 are *subtractive*: the fee-switch schedule carves the
 * protocol fee out of the displayed tier (see {@link computeSubtractiveProtocolFeeBps}); `hook` is
 * irrelevant and ignored.
 */
export function getCreateTierFeeBreakdown({
  feeAmount,
  protocolVersion,
  hook,
}: {
  feeAmount: number
  protocolVersion: ProtocolVersion
  hook?: string | undefined
}): FeeBreakdown {
  if (protocolVersion !== ProtocolVersion.V4) {
    return getFeeBreakdown({
      feeAmount,
      protocolVersion,
      servedProtocolFeeBps: computeSubtractiveProtocolFeeBps(feeAmount, protocolVersion),
    })
  }
  const isHookedPool = Boolean(hook) && hook !== ZERO_ADDRESS
  return getFeeBreakdown({
    feeAmount,
    protocolVersion: ProtocolVersion.V4,
    servedProtocolFeeBps: isHookedPool ? undefined : computeVanillaProtocolFeeBps(feeAmountToBps(feeAmount)),
  })
}
