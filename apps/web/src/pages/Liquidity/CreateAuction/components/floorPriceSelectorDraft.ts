import { type Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { trimFractionalTrailingZeros } from 'utilities/src/format/parseForSubscriptNotation'
import {
  canonicalFloorPriceStringFromPrice,
  exceedsDecimalCap,
  getMinimumRepresentableFloorPrice,
  getRaiseQuotePerTokenFromUsdDraftNum,
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
