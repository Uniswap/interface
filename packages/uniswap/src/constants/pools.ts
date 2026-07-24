export const V2_DEFAULT_FEE_TIER = 3000
// v2 protocol fee in pips. feeTo is on (verified onchain), so the pair takes a hardcoded 1/6 of the
// 0.30% fee = 0.05% = 500 pips (LPs keep 5/6). Fixed protocol-wide, and PairPosition serves no fee,
// so the FE uses this constant for v2 breakdowns instead of a per-pair fetch.
export const V2_PROTOCOL_FEE_PIPS = 500
export const DEFAULT_TICK_SPACING = 60
export const DYNAMIC_FEE_AMOUNT = 8388608
