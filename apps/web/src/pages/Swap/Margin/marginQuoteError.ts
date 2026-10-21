// Resolves an Adjust quote/plan-create failure into localized, per-reason copy. The backend ships a
// stable machine `errorCode` alongside an English `detail`; this is the client half of that contract,
// mirrored by hand because the codes are not code-generated.
import { FetchError } from '@universe/api'
import type { TFunction } from 'i18next'

export interface MarginQuoteErrorResult {
  message: string
  // Set only when errorCode is MARGIN_-prefixed but absent from the map below — i.e. the BE shipped a
  // per-reason code this file hasn't caught up to yet. Never set for a coarse ErrorType (an
  // un-converted create-path throw like 'UnprocessableEntity' — expected, not drift).
  unrecognizedCode?: string
}

// Substring of the backend's MARGIN_BOUNDS_ECHO_MISMATCH_ERROR message
// (packages/services/trading/src/lib/errors.ts). Hand-mirrored, like the errorCode map below.
const MARGIN_ECHO_MISMATCH_DETAIL = 'echo does not match server-derived bounds'

interface MarginQuoteErrorData {
  errorCode?: string
  detail?: string
}

// The code<->copy mapping is a switch (not a Record<string,string> + t(variable)) so i18next-parser's
// static extraction can see every key as a literal call — a dynamic t(key) is invisible to it (see
// i18next-parser.config.js; same reasoning as MarginPlanReviewModal's restartNote/stepTitle). Two
// pairs share a key: the two liquidity reasons read identically to the user, and both full-exit
// variants point at the same Close-position remedy. Exported so the plan-create catch sites
// (useExecuteMarginPlan.ts) can reuse the identical mapping while keeping their own non-mapped
// fallback (they must NOT fall back to this file's generic quoteFailed copy).
export function getMappedMarginErrorMessage({
  errorCode,
  detail,
  t,
}: {
  errorCode: string
  detail?: string
  t: TFunction
}): string | undefined {
  // Coarse ErrorType with an echo-mismatch detail: the quote went stale between pricing and confirm.
  // Distinguishable only by the detail — errorCode is the generic 'RequestValidationError'. It lives
  // in the SHARED mapper, not the quote-only one: the backend raises this from plan create
  // (MarginPlanBL), never from adjust_quote, so the create path is the only one that ever sees it.
  //
  // Matched on the message TEXT, which is what RequestValidationError.toJSONString puts in `detail`.
  // MARGIN_BOUNDS_ECHO_MISMATCH_ERROR is the constant's NAME and never appears on the wire — matching
  // it looks right and is silently dead. Venue mismatch has its own constant, and the joi-shaped
  // validation messages ('"planId" is required') cannot contain this fragment, so it cannot over-match.
  if (errorCode === 'RequestValidationError' && detail?.includes(MARGIN_ECHO_MISMATCH_DETAIL)) {
    return t('margin.error.adjust.priceMoved')
  }
  switch (errorCode) {
    case 'MARGIN_ADJUST_HEALTH_FLOOR':
      return t('margin.error.adjust.healthFloor')
    case 'MARGIN_INVALID_LEVERAGE':
      return t('margin.error.adjust.invalidLeverage')
    case 'MARGIN_SWAP_INSUFFICIENT_LIQUIDITY':
    case 'MARGIN_BORROW_INSUFFICIENT_LIQUIDITY':
      return t('margin.error.adjust.insufficientLiquidity')
    case 'MARGIN_WITHDRAW_OVER_MAX':
      return t('margin.error.adjust.withdrawOverMax')
    case 'MARGIN_MARKET_NOT_SUPPORTED':
      return t('margin.error.adjust.marketNotSupported')
    case 'MARGIN_ADJUST_NO_POSITION':
      return t('margin.error.adjust.noPosition')
    case 'MARGIN_WITHDRAW_FULL_EXIT':
    case 'MARGIN_ADJUST_FULL_EXIT':
      return t('margin.error.adjust.fullExit')
    case 'MARGIN_ADJUST_NO_CHANGE':
      return t('margin.error.adjust.noChange')
    case 'MARGIN_INVALID_REQUEST':
      return t('margin.error.adjust.invalidRequest')
    default:
      return undefined
  }
}

// Pure, no side effects — called on every render while a quote error is live (e.g. mid-drag). Logging
// unrecognizedCode drift is the caller's job (a useEffect keyed on the code), not this function's.
export function getMarginQuoteErrorMessage({ error, t }: { error: unknown; t: TFunction }): MarginQuoteErrorResult {
  const generic = t('margin.error.quoteFailed')
  if (!(error instanceof FetchError) || error.response.status >= 500) {
    return { message: generic }
  }
  const data = error.data as unknown as MarginQuoteErrorData | undefined
  const errorCode = data?.errorCode
  if (!errorCode) {
    return { message: generic }
  }
  const mapped = getMappedMarginErrorMessage({ errorCode, detail: data.detail, t })
  if (mapped !== undefined) {
    return { message: mapped }
  }
  // `data` is narrowed non-nullish here (errorCode came from data?.errorCode and passed the guard above).
  const message = data.detail ?? generic
  return errorCode.startsWith('MARGIN_') ? { message, unrecognizedCode: errorCode } : { message }
}
