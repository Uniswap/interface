// Default LP fee tiers (bps). New tiers pair to old ones by all-in rate: the new tier's LP fee plus
// its protocol fee equals the familiar old headline (0.75 + 0.2 ≈ 1, etc.). `protocolBps` is the
// spec's pairing value for these four tiers; it equals what the fee curve computes for that LP fee
// (see feeCurve.ts) and is cross-checked against the curve in tests. The curve — not this table — is
// what the create flow derives protocol fees from.

interface DefaultFeeTierPair {
  newBps: number
  /** Spec pairing protocol fee (bps) for the new tier: 0.75+0.2, 3.75+1, 25+4, 90+10 (== the curve). */
  protocolBps: number
  oldBps: number
}

export const DEFAULT_FEE_TIER_PAIRS: readonly DefaultFeeTierPair[] = [
  { newBps: 0.75, protocolBps: 0.2, oldBps: 1 },
  { newBps: 3.75, protocolBps: 1, oldBps: 5 },
  { newBps: 25, protocolBps: 4, oldBps: 30 },
  { newBps: 90, protocolBps: 10, oldBps: 100 },
]

export const NEW_DEFAULT_LP_FEE_TIERS_BPS: readonly number[] = DEFAULT_FEE_TIER_PAIRS.map((pair) => pair.newBps)

/** Old default LP fee (bps) paired to a new default tier by all-in rate, if any. */
export function getPairedOldFeeTierBps(newBps: number): number | undefined {
  return DEFAULT_FEE_TIER_PAIRS.find((pair) => pair.newBps === newBps)?.oldBps
}

/** New default LP fee (bps) paired to an old default tier by all-in rate, if any. */
export function getPairedNewFeeTierBps(oldBps: number): number | undefined {
  return DEFAULT_FEE_TIER_PAIRS.find((pair) => pair.oldBps === oldBps)?.newBps
}
