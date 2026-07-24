import { BIPS_BASE } from 'uniswap/src/constants/misc'

// The codebase stores fees as an integer in hundredths-of-a-bip (pips): 3000 = 0.30% = 30 bps.
// 1 bp = 100 pips. `feeAmount / BIPS_BASE` is the raw percentage passed to `formatPercent`.
const PIPS_PER_BPS = BIPS_BASE / 100 // 100

/** Stored pip integer (e.g. FeeData.feeAmount) → bps used by the fee breakdown. */
export function feeAmountToBps(feeAmount: number): number {
  return feeAmount / PIPS_PER_BPS
}

/** bps → stored pip integer. Rounds because sub-pip bps values aren't representable onchain. */
export function bpsToFeeAmount(bps: number): number {
  return Math.round(bps * PIPS_PER_BPS)
}

/** bps → the raw percentage number to hand to `formatPercent` (30 bps → 0.3 → "0.30%"). */
export function bpsToPercent(bps: number): number {
  return bps / 100
}
