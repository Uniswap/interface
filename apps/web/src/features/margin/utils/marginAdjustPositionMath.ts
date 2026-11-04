import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'

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
