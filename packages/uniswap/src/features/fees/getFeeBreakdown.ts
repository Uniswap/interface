import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { feeAmountToBps } from 'uniswap/src/features/fees/feeUnits'
import type { FeeBreakdown } from 'uniswap/src/features/fees/types'

export interface GetFeeBreakdownInput {
  /** Pool's stored fee tier integer (pips), e.g. FeeData.feeAmount — 3000 = 0.30%. */
  feeAmount: number
  protocolVersion: ProtocolVersion
  /**
   * Per-pool protocol fee served by the backend (data-api `protocolFee`, converted pips → bps).
   * The FE never computes fees: when this is absent the breakdown is `unavailable`.
   */
  servedProtocolFeeBps?: number
}

/**
 * Served-or-nothing fee breakdown. The backend is the single source of truth for protocol fees —
 * when it serves a per-pool value we split the breakdown from it; otherwise the protocol fee is
 * `unavailable` and callers show the LP-fee headline with an "unavailable" note. `getFeeBreakdown`
 * itself never computes a protocol fee; the only place the FE derives one is the create-pool flow
 * for not-yet-existing vanilla pools (see feeCurve.ts), which feeds the derived value in here.
 */
export function getFeeBreakdown(input: GetFeeBreakdownInput): FeeBreakdown {
  const { feeAmount, protocolVersion, servedProtocolFeeBps } = input

  // The stored fee tier: the LP fee for v4 (protocol fee stacks on top), the all-in swap fee
  // for v2/v3 (protocol fee is carved out of it).
  const displayedFeeBps = feeAmountToBps(feeAmount)
  const isV4 = protocolVersion === ProtocolVersion.V4

  // Nothing served: the FE never computes fees, so the protocol fee is unavailable (undefined) and
  // both the LP and effective rates fall back to the displayed tier.
  if (servedProtocolFeeBps === undefined) {
    return {
      lpFeeBps: displayedFeeBps,
      protocolFeeBps: undefined,
      effectiveFeeBps: displayedFeeBps,
      version: protocolVersion,
    }
  }

  // v4 stacks the protocol fee on top of the LP fee; v2/v3 carve it out of the displayed swap
  // fee, so the LP keeps the remainder and the effective rate is the displayed tier itself.
  // For v2/v3 the backend guarantees servedProtocolFeeBps <= displayedFeeBps, so lpFeeBps stays
  // non-negative; we intentionally don't clamp so a violated invariant surfaces rather than hides.
  const lpFeeBps = isV4 ? displayedFeeBps : displayedFeeBps - servedProtocolFeeBps
  const effectiveFeeBps = isV4 ? displayedFeeBps + servedProtocolFeeBps : displayedFeeBps

  return { lpFeeBps, protocolFeeBps: servedProtocolFeeBps, effectiveFeeBps, version: protocolVersion }
}
