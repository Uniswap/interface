// CTA gate decisions for the open form, extracted so the quote-freshness and leverage-cap logic are
// unit-testable.
import { FetchError } from '@universe/api'

// Structural: a MarginMarket and a selector row (MarginPair) both carry the venue's cap, and the
// ceiling is the same max() over either.
interface MarginLeverageCapped {
  maxLeverage?: number
}

// Open-form leverage floor: the least leverage worth opening a position at. NOT the backend's floor —
// the backend rejects only `leverageTarget <= 1.0`, exclusive.
export const MIN_LEVERAGE = 1.1

// Manage-flow leverage floor. The open floor is far too high here: a deleverage exists to get a
// position DOWN, and clamping it at 1.1 both blocks the move and misreports positions already below
// that (add-margin drifts leverage arbitrarily close to 1). Sits just above the backend's exclusive
// 1.0 bound, which a full deleverage-to-exactly-1x cannot clear.
export const MANAGE_MIN_LEVERAGE = 1.01

// The wire carries a machine errorCode (UNROUTABLE_PAYMENT_TOKEN), but the BE doesn't always
// emit it — keep the substring match as a fallback so detection doesn't regress.
const UNROUTABLE_DETAIL_FRAGMENT = 'Insufficient swap liquidity'

export function isUnroutablePaymentTokenError(error: unknown): boolean {
  if (!(error instanceof FetchError)) {
    return false
  }
  const body = error.data as { errorCode?: string; detail?: string } | undefined
  return body?.errorCode === 'UNROUTABLE_PAYMENT_TOKEN' || Boolean(body?.detail?.includes(UNROUTABLE_DETAIL_FRAGMENT))
}

// A placeholder-bridged quote (leverage slider moved, RQ-v5 bridges the prior quote across the query-key
// change) must still block the CTA — isQuoteLoading (RQ's isLoading) is false during a placeholder
// refetch, which would otherwise let a slider-then-click submit against a stale echo and guarantee a
// MARGIN_BOUNDS_ECHO_MISMATCH 400.
export function isMarginOpenLoading(input: {
  isQuoteLoading: boolean
  isDebouncing: boolean
  isFetching: boolean
  isPlaceholderData: boolean
}): boolean {
  return input.isQuoteLoading || input.isDebouncing || input.isFetching || input.isPlaceholderData
}

// The slider ceiling: a client max() over the server-authored `venues[].maxLeverage` of the markets
// the request is allowed to route to (the whole pair's, minus the user's exclusions — or the single
// pinned market on a manage surface, which can never re-route). Deriving a cap from lltv is
// forbidden — the policy buffer is the server's — so a set carrying no server-authored cap yields no
// ceiling at all rather than a fabricated one; callers decide what an unknown ceiling means.
export function getMarginLeverageCap({ markets }: { markets: readonly MarginLeverageCapped[] }): number | undefined {
  const caps = markets
    .map((market) => market.maxLeverage)
    .filter((cap): cap is number => cap !== undefined && Number.isFinite(cap))
  const cap = caps.length ? Math.max(...caps) : undefined
  // A cap below the minimum is not an honest ceiling — a paused/unconfigured venue can report one,
  // and flooring it would offer leverage above the venue's stated max. Route it into the
  // no-ceiling path (retry disables, display renders '—') instead.
  return cap !== undefined && cap >= MIN_LEVERAGE ? cap : undefined
}

// Whether the leverage slider should clamp down to the cap. Only against an HONEST ceiling: when the
// pair has no enabled venue `maxLeverage` is undefined and the cap falls to MIN_LEVERAGE — clamping
// there would silently reset the user's leverage with no way back, since re-enabling a venue does not
// restore it. A real lower ceiling (excluding the top-leverage venue) still clamps.
export function shouldClampLeverageToCap({
  maxLeverage,
  leverage,
  cap,
}: {
  maxLeverage: number | undefined
  leverage: number
  cap: number
}): boolean {
  return maxLeverage !== undefined && leverage > cap
}
