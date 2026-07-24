import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'

/**
 * The full fee breakdown for a pool, all values in bps.
 *
 * v4 protocol fees are **additive**: the stored fee tier is the LP fee and
 * effectiveFeeBps = lpFeeBps + protocolFeeBps (a 30 bps LP pool costs the swapper 35 bps
 * once fees are on).
 *
 * v2/v3 are **subtractive**: the stored fee tier already equals the effective rate and the
 * protocol fee is carved out of it, so effectiveFeeBps = the displayed tier and
 * lpFeeBps = effectiveFeeBps - protocolFeeBps (a 30 bps v2 pool splits 25 LP / 5 protocol).
 *
 * `protocolFeeBps` is `undefined` when nothing was served — no trustworthy protocol fee, so
 * callers show the LP-fee headline with an "unavailable" note. The FE never computes fees; the
 * backend is the single source of truth. A served `0` (v4 fees-off) is a real value, distinct
 * from `undefined`. Whenever it is defined, lpFeeBps + protocolFeeBps === effectiveFeeBps — the
 * hover breakdown always reads LP + protocol = total.
 */
export interface FeeBreakdown {
  lpFeeBps: number
  protocolFeeBps: number | undefined
  effectiveFeeBps: number
  version: ProtocolVersion
}
