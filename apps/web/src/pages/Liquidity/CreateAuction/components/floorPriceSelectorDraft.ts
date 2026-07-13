import { type Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { trimFractionalTrailingZeros } from 'utilities/src/format/parseForSubscriptNotation'
import {
  canonicalFloorPriceStringFromPrice,
  exceedsDecimalCap,
  getMinimumRepresentableFloorPrice,
  getRaiseQuotePerTokenFromUsdDraftNum,
  isNumericallyEqualDraftValue,
  parsePositiveDraftHead,
  tryBuildUnclampedFloorPriceFromDraft,
  type DraftToFloorParams,
} from '~/pages/Liquidity/CreateAuction/components/floorPriceSelectorDraftMath'
import type { FloorPriceDenomination, FloorPriceInputState, InputCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { formatArithmeticResultForInput } from '~/pages/Liquidity/CreateAuction/utils'

// Re-export math helpers + types so callers and tests have a stable import surface.
export {
  canonicalFloorPriceStringFromPrice,
  exceedsDecimalCap,
  getMinimumRepresentableFloorPrice,
  type DraftToFloorParams,
}
// Two independent axes:
//   denomination – what the numeric input represents (floor price per token, or FDV)
//   inputCurrency – the currency the user types in (raise token, or USD fiat)
export type { FloorPriceDenomination, InputCurrency } from '~/pages/Liquidity/CreateAuction/types'

/** Max fraction digits when typing USD-denominated values (fiat / USD FDV). */
const USD_DRAFT_MAX_DECIMALS = 8

export function maxDecimalsForDraftInput(inputCurrency: InputCurrency, raiseTokenDecimals: number | undefined): number {
  if (inputCurrency === 'usd') {
    return USD_DRAFT_MAX_DECIMALS
  }
  return raiseTokenDecimals ?? 18
}

function oneFullAuctionToken(tokenTotalSupply: CurrencyAmount<Currency>): CurrencyAmount<Currency> {
  const oneTokenRaw = 10n ** BigInt(tokenTotalSupply.currency.decimals)
  return CurrencyAmount.fromRawAmount(tokenTotalSupply.currency, oneTokenRaw.toString())
}

/**
 * True when the draft would imply a floor strictly below the minimum representable (1 wei raise
 * per full auction token), including positive USD/raise amounts that round to zero raise wei.
 */
export function isDraftFloorBelowMinimumRepresentable(params: DraftToFloorParams): boolean {
  const price = tryBuildUnclampedFloorPriceFromDraft(params)
  if (price) {
    const minPrice = getMinimumRepresentableFloorPrice(price.baseCurrency, price.quoteCurrency)
    return price.lessThan(minPrice)
  }

  const head = parsePositiveDraftHead(params.localValue, params.tokenTotalSupply)
  if (!head || !params.raiseCurrency) {
    return false
  }
  const { trimmed, num } = head

  if (params.inputCurrency === 'usd' && params.usdPriceNum && params.usdPriceNum > 0) {
    const amount = getRaiseQuotePerTokenFromUsdDraftNum({
      num,
      usdPriceNum: params.usdPriceNum,
      raiseCurrency: params.raiseCurrency,
    })
    return Boolean(amount?.equalTo(0))
  }

  if (params.denomination === 'fdv' && params.inputCurrency === 'raise') {
    const fdvAmount = getCurrencyAmount({
      value: trimmed,
      valueType: ValueType.Exact,
      currency: params.raiseCurrency,
    })
    return Boolean(fdvAmount?.equalTo(0))
  }

  return false
}

/**
 * True when a keystroke should be rejected because the draft is below the minimum representable
 * floor AND further typing can never make it valid. Only `floorPrice` drafts qualify: appending
 * digits to a per-token price can't grow it past its prefix (`0.0000001…` stays < 1e-6), so a
 * sub-minimum draft is a dead end. FDV drafts grow ×10 per typed digit (`1` → `1000000`), so a
 * sub-minimum intermediate is a legitimate prefix of a valid value — those must not be blocked
 * (e.g. USD FDV with USDC raise and 1e9 supply has a $1000 minimum FDV, which would otherwise
 * swallow every keystroke); they're clamped on commit instead.
 */
export function shouldRejectDraftBelowMinimum(params: DraftToFloorParams): boolean {
  if (params.denomination === 'fdv') {
    return false
  }
  return isDraftFloorBelowMinimumRepresentable(params)
}

/**
 * True when `commitDraftToFloorPrice` would clamp the typed draft up to the minimum representable
 * floor (1 raise wei per full auction token). This is the one normalization detectable from the
 * draft alone; the general blur contract — the unfocused display must numerically equal what the
 * committed canonical renders as — is enforced in {@link resolveUnfocusedDraftSync}, which also
 * catches granularity truncation (e.g. USD FDV `23222` committing to a `$1000`-step floor that
 * reads back as `23000`).
 */
export function commitWouldNormalizeDraft(params: DraftToFloorParams): boolean {
  return isDraftFloorBelowMinimumRepresentable(params)
}

export type UnfocusedDraftSync =
  | { action: 'keep' }
  | { action: 'restoreSnapshot'; value: string }
  | { action: 'replace'; value: string }

/**
 * Resolve what the unfocused draft input should display, given the canonical floor and the
 * persisted snapshot. Drives the FloorPriceSelector hydrate effect (runs on blur and remount,
 * never per keystroke). The blur contract: the unfocused display must always equal — numerically —
 * what the committed canonical floor renders as in the current mode.
 *  - `keep` – the draft is numerically faithful to the canonical floor; leave the typed string alone.
 *  - `restoreSnapshot` – adopt the persisted rawValue (caller must skip the next draft commit).
 *  - `replace` – the draft no longer reads back as the canonical: a below-minimum value commit
 *    clamped up (typed `300` → shows `1000`), a value truncated to the representable granularity
 *    (typed USD FDV `23222` on a `$1000`-step USDC floor → shows `23000`), or a plain stale draft.
 */
export function resolveUnfocusedDraftSync({
  localValue,
  denomination,
  inputCurrency,
  usdPriceNum,
  tokenTotalSupply,
  raiseCurrency,
  floorPrice,
  floorPriceInput,
  hasValidFloorPrice,
}: DraftToFloorParams & {
  floorPrice: string
  floorPriceInput: FloorPriceInputState | undefined
  hasValidFloorPrice: boolean
}): UnfocusedDraftSync {
  const draftParams = { denomination, inputCurrency, usdPriceNum, tokenTotalSupply, raiseCurrency }

  // What the committed canonical renders as in the current mode — the value the unfocused input
  // must show. Empty when not derivable (no valid floor / missing currency).
  const canonicalDisplay = getDisplayValueForMode({
    denomination,
    inputCurrency,
    floorPrice,
    hasValidFloorPrice,
    tokenTotalSupply,
    raiseCurrency,
    usdPriceNum,
  })

  // A draft is faithful only when commit would not clamp it AND it is numerically identical to
  // the canonical's display — any divergence (clamp, granularity truncation, staleness) forces a
  // resync. The comparison is numeric, never raw-string: trailing zeros (`1000` vs `1000.0`) are
  // not divergence. When the canonical display is not derivable there is nothing to resync to, so
  // only the clamp check applies and the typed string survives.
  const draftFaithfulToCanonical = (value: string): boolean => {
    if (commitWouldNormalizeDraft({ localValue: value, ...draftParams })) {
      return false
    }
    return canonicalDisplay === '' || isNumericallyEqualDraftValue(value, canonicalDisplay)
  }

  if (
    floorPriceInput?.floorPrice === floorPrice &&
    floorPriceInput.denomination === denomination &&
    floorPriceInput.inputCurrency === inputCurrency &&
    draftFaithfulToCanonical(floorPriceInput.rawValue)
  ) {
    return localValue === floorPriceInput.rawValue
      ? { action: 'keep' }
      : { action: 'restoreSnapshot', value: floorPriceInput.rawValue }
  }

  // Snapshot-less (or stale-snapshot) path: keep the user's string only when it both commits to
  // the current canonical floor and reads back as the same number.
  if (localValue.trim() !== '' && draftFaithfulToCanonical(localValue)) {
    const committedFromDraft = commitDraftToFloorPrice({ localValue, ...draftParams })
    if (committedFromDraft === floorPrice) {
      return { action: 'keep' }
    }
  }

  return { action: 'replace', value: canonicalDisplay }
}

/**
 * True when the current draft state and canonical floor both already match the persisted
 * snapshot. Re-deriving the canonical via `commitDraftToFloorPrice` in that case would re-run
 * against the *current* USD oracle snapshot — which can differ slightly from the snapshot used
 * when the value was first set (oracles tick, and `useStableRaiseUsdPrice` re-snapshots on
 * remount) — and silently drift the canonical floor.
 */
export function draftMirrorsPersisted({
  floorPriceInput,
  draftForCommit,
  denomination,
  inputCurrency,
  floorPrice,
}: {
  floorPriceInput: FloorPriceInputState | undefined
  draftForCommit: string
  denomination: FloorPriceDenomination
  inputCurrency: InputCurrency
  floorPrice: string
}): boolean {
  return (
    !!floorPriceInput &&
    floorPriceInput.rawValue === draftForCommit &&
    floorPriceInput.denomination === denomination &&
    floorPriceInput.inputCurrency === inputCurrency &&
    floorPriceInput.floorPrice === floorPrice
  )
}

/**
 * Single pipeline: draft string + mode + oracles → canonical floor price (raise token per auction token).
 * Used only for non–parent-controlled modes; parent-controlled commits directly in the change handler.
 */
export function commitDraftToFloorPrice({
  localValue,
  denomination,
  inputCurrency,
  usdPriceNum,
  tokenTotalSupply,
  raiseCurrency,
}: DraftToFloorParams): string {
  const head = parsePositiveDraftHead(localValue, tokenTotalSupply)
  if (!head) {
    return ''
  }
  const { num } = head

  if (denomination === 'floorPrice' && inputCurrency === 'usd') {
    if (!usdPriceNum || usdPriceNum <= 0 || !raiseCurrency) {
      return ''
    }
    const quotePerToken = getRaiseQuotePerTokenFromUsdDraftNum({ num, usdPriceNum, raiseCurrency })
    if (!quotePerToken) {
      return ''
    }
    if (quotePerToken.equalTo(0)) {
      return canonicalFloorPriceStringFromPrice(
        getMinimumRepresentableFloorPrice(tokenTotalSupply.currency, raiseCurrency),
      )
    }
    try {
      const price = new Price({ baseAmount: oneFullAuctionToken(tokenTotalSupply), quoteAmount: quotePerToken })
      return canonicalFloorPriceStringFromPrice(price)
    } catch {
      return ''
    }
  }

  const unclamped = tryBuildUnclampedFloorPriceFromDraft({
    localValue,
    denomination,
    inputCurrency,
    usdPriceNum,
    tokenTotalSupply,
    raiseCurrency,
  })
  if (!unclamped) {
    return ''
  }
  return canonicalFloorPriceStringFromPrice(unclamped)
}

export type PreviewFdvUsdFloorDisplayParams = {
  isParentControlled: boolean
  floorPrice: string
  localValue: string
  denomination: FloorPriceDenomination
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  tokenTotalSupply: CurrencyAmount<Currency>
  raiseCurrency: Currency | undefined
}

/** While typing FDV in USD, preview canonical floor from draft so downstream math (e.g. ETH FDV) stays in sync before commit. */
export function previewFloorPriceForFdvUsdDraft(p: PreviewFdvUsdFloorDisplayParams): string {
  if (p.isParentControlled) {
    return p.floorPrice
  }
  if (
    p.denomination !== 'fdv' ||
    p.inputCurrency !== 'usd' ||
    !p.raiseCurrency ||
    p.usdPriceNum === null ||
    p.usdPriceNum <= 0 ||
    p.localValue.trim() === ''
  ) {
    return p.floorPrice
  }
  if (
    isDraftFloorBelowMinimumRepresentable({
      localValue: p.localValue,
      denomination: p.denomination,
      inputCurrency: p.inputCurrency,
      usdPriceNum: p.usdPriceNum,
      tokenTotalSupply: p.tokenTotalSupply,
      raiseCurrency: p.raiseCurrency,
    })
  ) {
    return p.floorPrice
  }
  const fromDraft = commitDraftToFloorPrice({
    localValue: p.localValue,
    denomination: p.denomination,
    inputCurrency: p.inputCurrency,
    usdPriceNum: p.usdPriceNum,
    tokenTotalSupply: p.tokenTotalSupply,
    raiseCurrency: p.raiseCurrency,
  })
  return fromDraft !== '' ? fromDraft : p.floorPrice
}

/**
 * Maps canonical floor price into the draft string for a *target* mode after a toggle.
 * Uses exact CurrencyAmount / Price math for raise-token paths so tiny floors (e.g. 1e-8) do not
 * pick up `floorPriceNum * supply` IEEE-754 noise.
 *
 * Does not support `floorPrice + raise` (parent-controlled): that mode reads `floorPrice` from props;
 * callers must not pass that combination — it returns `''` by design.
 */
export function getDisplayValueForMode({
  denomination,
  inputCurrency,
  floorPrice,
  hasValidFloorPrice,
  tokenTotalSupply,
  raiseCurrency,
  usdPriceNum,
}: {
  denomination: FloorPriceDenomination
  inputCurrency: InputCurrency
  floorPrice: string
  hasValidFloorPrice: boolean
  tokenTotalSupply: CurrencyAmount<Currency>
  raiseCurrency: Currency | undefined
  usdPriceNum: number | null
}): string {
  if (!hasValidFloorPrice || !raiseCurrency) {
    return ''
  }

  const trimmedFloor = floorPrice.trim()
  if (!trimmedFloor) {
    return ''
  }

  const quotePerToken = getCurrencyAmount({
    value: trimmedFloor,
    valueType: ValueType.Exact,
    currency: raiseCurrency,
  })
  if (!quotePerToken || quotePerToken.equalTo(0)) {
    return ''
  }

  let pricePerToken: Price<Currency, Currency>
  try {
    pricePerToken = new Price({ baseAmount: oneFullAuctionToken(tokenTotalSupply), quoteAmount: quotePerToken })
  } catch {
    return ''
  }

  if (denomination === 'floorPrice' && inputCurrency === 'usd') {
    if (usdPriceNum === null || usdPriceNum <= 0) {
      return ''
    }
    const raisePerToken = parseFloat(quotePerToken.toExact())
    if (!Number.isFinite(raisePerToken)) {
      return ''
    }
    return formatArithmeticResultForInput(raisePerToken * usdPriceNum)
  }

  if (denomination === 'fdv' && inputCurrency === 'raise') {
    const fdvRaise = pricePerToken.quote(tokenTotalSupply)
    return trimFractionalTrailingZeros(fdvRaise.toExact())
  }

  if (denomination === 'fdv' && inputCurrency === 'usd') {
    if (usdPriceNum === null || usdPriceNum <= 0) {
      return ''
    }
    const fdvRaise = pricePerToken.quote(tokenTotalSupply)
    const fdvRaiseNum = parseFloat(fdvRaise.toExact())
    if (!Number.isFinite(fdvRaiseNum)) {
      return ''
    }
    return formatArithmeticResultForInput(fdvRaiseNum * usdPriceNum)
  }

  return ''
}

/**
 * Convert a snapshot's `rawValue` between `floorPrice` and `fdv` denominations within the same
 * input currency. The conversion is `× supply` (floorPrice → fdv) or `÷ supply` (fdv → floorPrice),
 * keeping the user's typed precision intact. Returns `null` when the input isn't positive finite
 * or the supply isn't usable.
 */
function convertSnapshotAcrossDenomination({
  rawValue,
  fromDenomination,
  toDenomination,
  tokenTotalSupply,
}: {
  rawValue: string
  fromDenomination: FloorPriceDenomination
  toDenomination: FloorPriceDenomination
  tokenTotalSupply: CurrencyAmount<Currency>
}): string | null {
  if (fromDenomination === toDenomination) {
    return null
  }
  const num = parseFloat(rawValue.trim())
  if (!Number.isFinite(num) || num <= 0) {
    return null
  }
  if (tokenTotalSupply.equalTo(0)) {
    return null
  }
  const supply = parseFloat(tokenTotalSupply.toExact())
  if (!Number.isFinite(supply) || supply <= 0) {
    return null
  }
  const converted = fromDenomination === 'floorPrice' ? num * supply : num / supply
  return formatArithmeticResultForInput(converted)
}

/**
 * Pick the display string for a toggle target. Resolution order:
 * 1. Exact snapshot match (`denomination` + `inputCurrency` + `floorPrice`) → return `rawValue`.
 * 2. Denomination-only toggle on the snapshot's currency → derive via `× supply` / `÷ supply` on
 *    `rawValue`. This preserves precision the canonical roundtrip would lose (e.g. typed `$1`
 *    floorPrice + USD, toggle to fdv + USD → `1 × 1e9 = 1B` instead of `999,999,999.…`).
 * 3. Fall back to {@link getDisplayValueForMode}, which goes through canonical wei and may drift
 *    when crossing the USD ↔ raise boundary.
 */
export function pickDisplayValueForToggleTarget({
  targetDenomination,
  targetInputCurrency,
  floorPrice,
  floorPriceInput,
  hasValidFloorPrice,
  tokenTotalSupply,
  raiseCurrency,
  usdPriceNum,
}: {
  targetDenomination: FloorPriceDenomination
  targetInputCurrency: InputCurrency
  floorPrice: string
  floorPriceInput: FloorPriceInputState | undefined
  hasValidFloorPrice: boolean
  tokenTotalSupply: CurrencyAmount<Currency>
  raiseCurrency: Currency | undefined
  usdPriceNum: number | null
}): string {
  const snapshotMatchesCanonical = floorPriceInput?.floorPrice === floorPrice
  if (
    snapshotMatchesCanonical &&
    floorPriceInput.denomination === targetDenomination &&
    floorPriceInput.inputCurrency === targetInputCurrency
  ) {
    return floorPriceInput.rawValue
  }
  if (
    snapshotMatchesCanonical &&
    floorPriceInput.inputCurrency === targetInputCurrency &&
    floorPriceInput.denomination !== targetDenomination
  ) {
    const converted = convertSnapshotAcrossDenomination({
      rawValue: floorPriceInput.rawValue,
      fromDenomination: floorPriceInput.denomination,
      toDenomination: targetDenomination,
      tokenTotalSupply,
    })
    if (converted !== null && converted !== '') {
      return converted
    }
  }
  return getDisplayValueForMode({
    denomination: targetDenomination,
    inputCurrency: targetInputCurrency,
    floorPrice,
    hasValidFloorPrice,
    tokenTotalSupply,
    raiseCurrency,
    usdPriceNum,
  })
}
