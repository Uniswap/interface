import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginDirection } from 'uniswap/src/features/transactions/margin/types'

// Client display math only: server-echoed values win once a quote resolves. These drive the
// instant before/after preview while the user edits the unified Adjust-position modal.

// Resulting EXPOSURE leverage if debt stays constant and equity moves by deltaCollateral (signed,
// collateral units) — the drift-mode slider display. 1/(1−ltv) is the balance sheet; a short's
// collateral is the stable leg, so what it carries is one turn less.
export function driftLeverageForEquityDelta({
  collateral,
  debt,
  mark,
  deltaCollateral,
  direction,
}: {
  collateral: number
  debt: number
  mark: number
  deltaCollateral: number
  direction: MarginDirection
}): number | undefined {
  // A non-positive mark is UNKNOWABLE, not insolvent — the two must not share a sentinel. The branches
  // even disagree on it (LONG divides by it and lands on Infinity, SHORT multiplies and lands on 0), so
  // it is named here rather than left to the direction. Callers that render this figure need the
  // difference: +Infinity is a real answer to show, undefined is a projection they must not state.
  // `!(mark > 0)` rather than `mark <= 0`: NaN fails BOTH comparisons, so the `<=` form let it through
  // to produce 1/(1-NaN) = NaN — which the consumer reads as non-finite and renders as ∞, the "at or
  // past liquidation" claim an unknowable mark must never make. Same NaN exit marginHealthFromLeverage
  // carries one file over, for the same reason.
  if (!(mark > 0)) {
    return undefined
  }
  const collateralAfter = collateral + deltaCollateral
  const isShort = direction === 'SHORT'
  const ltvAfter = isShort ? (debt * mark) / collateralAfter : debt / (collateralAfter * mark)
  // Both remaining arms are genuinely +Infinity. Non-positive collateral is a withdrawal past the whole
  // position — it flips the LTV's sign, which would slip under the `>= 1` test and report a LOW leverage
  // for the most extreme case there is.
  if (collateralAfter <= 0 || ltvAfter >= 1) {
    return Number.POSITIVE_INFINITY
  }
  const balanceSheet = 1 / (1 - ltvAfter)
  return isShort ? balanceSheet - 1 : balanceSheet
}

// Current EXPOSURE leverage, off the wire (decimal string). Undefined carries TWO claims, and callers
// must not collapse them:
//   - the wire OMITS the field — the position has no finite leverage (equity at or below zero), which
//     is a real state and renders as ∞;
//   - the wire value is MALFORMED (blank, null, non-numeric) — nothing is known, and rendering ∞ would
//     assert a debt-free position from a parse failure. That case wants an em dash.
// This function cannot tell them apart on its own; a caller that needs to should check
// `position.leverage === undefined` for the first before falling back. Gate arithmetic that must stay
// finite substitutes 1 either way.
export function positionLeverage(position: Pick<MarginActivePosition, 'leverage'>): number | undefined {
  // A real 0 is meaningful here — a debt-free position IS 0x — so the guard is about which INPUTS may
  // produce one. `Number('')` and `Number(null)` are both 0 and finite, so a blank or null wire value
  // would masquerade as debt-free and marginHealthFromLeverage would paint it healthy green. Only a
  // non-blank string may become a number; everything else is NaN, hence undefined.
  const raw = position.leverage
  const leverage = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : Number.NaN
  return Number.isFinite(leverage) ? leverage : undefined
}

// LIVE equity, raw counter-token units, SIGNED — the Adjust modal's pre-fill and the ΔE baseline.
// Straight off the wire: the server already computes collateral-marked-to-oracle minus debt.
export function currentEquityRawFromPosition(position: Pick<MarginActivePosition, 'equity'>): bigint | undefined {
  // Guarded like every other wire reader in this tier: BigInt throws a SyntaxError on any non-integer
  // string, and this one runs in the Adjust modal's render body — an unguarded throw takes the sheet to
  // the error boundary instead of blanking one figure. The modal already treats an unknowable equity as
  // "margin can't be added or taken out", so the undefined lands on a path that exists.
  // The blank check is not redundant with the catch: `BigInt('')` is `0n`, not a throw, so an absent
  // equity would arrive as a real zero and the modal would price a top-up from a baseline of nothing.
  if (typeof position.equity !== 'string' || position.equity.trim() === '') {
    return undefined
  }
  try {
    return BigInt(position.equity)
  } catch {
    return undefined
  }
}
