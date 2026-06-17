import { type Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { trimFractionalTrailingZeros } from 'utilities/src/format/parseForSubscriptNotation'
import type { FloorPriceDenomination, InputCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { formatArithmeticResultForInput } from '~/pages/Liquidity/CreateAuction/utils'

/** Smallest raise-token amount (1 wei) per 1 full auction token — matches on-chain / `getCurrencyAmount` granularity. */
export function getMinimumRepresentableFloorPrice(
  auctionCurrency: Currency,
  raiseCurrency: Currency,
): Price<Currency, Currency> {
  const oneTokenRaw = 10n ** BigInt(auctionCurrency.decimals)
  const oneAuctionToken = CurrencyAmount.fromRawAmount(auctionCurrency, oneTokenRaw.toString())
  const minQuote = CurrencyAmount.fromRawAmount(raiseCurrency, '1')
  return new Price({ baseAmount: oneAuctionToken, quoteAmount: minQuote })
}

function clampFloorPriceToMinimumRepresentable(price: Price<Currency, Currency>): Price<Currency, Currency> {
  const minPrice = getMinimumRepresentableFloorPrice(price.baseCurrency, price.quoteCurrency)
  return price.lessThan(minPrice) ? minPrice : price
}

export function canonicalFloorPriceStringFromPrice(price: Price<Currency, Currency>): string {
  const clamped = clampFloorPriceToMinimumRepresentable(price)
  const oneTokenRaw = 10n ** BigInt(clamped.baseCurrency.decimals)
  const oneBase = CurrencyAmount.fromRawAmount(clamped.baseCurrency, oneTokenRaw.toString())
  const quoteForOneFullBaseToken = clamped.quote(oneBase)
  return trimFractionalTrailingZeros(quoteForOneFullBaseToken.toExact())
}

export type DraftToFloorParams = {
  localValue: string
  denomination: FloorPriceDenomination
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  tokenTotalSupply: CurrencyAmount<Currency>
  raiseCurrency: Currency | undefined
}

function oneAuctionTokenAmount(tokenTotalSupply: CurrencyAmount<Currency>): CurrencyAmount<Currency> {
  const oneTokenRaw = 10n ** BigInt(tokenTotalSupply.currency.decimals)
  return CurrencyAmount.fromRawAmount(tokenTotalSupply.currency, oneTokenRaw.toString())
}

function tryPriceOneTokenQuote(
  quotePerToken: CurrencyAmount<Currency>,
  tokenTotalSupply: CurrencyAmount<Currency>,
): Price<Currency, Currency> | null {
  try {
    return new Price({ baseAmount: oneAuctionTokenAmount(tokenTotalSupply), quoteAmount: quotePerToken })
  } catch {
    return null
  }
}

function tryPriceFdvOverSupply(
  fdvAmount: CurrencyAmount<Currency>,
  tokenTotalSupply: CurrencyAmount<Currency>,
): Price<Currency, Currency> | null {
  try {
    return new Price({ baseAmount: tokenTotalSupply, quoteAmount: fdvAmount })
  } catch {
    return null
  }
}

export function parsePositiveDraftHead(
  localValue: string,
  tokenTotalSupply: CurrencyAmount<Currency>,
): { trimmed: string; num: number } | null {
  const trimmed = localValue.trim()
  if (!trimmed) {
    return null
  }
  const num = parseFloat(trimmed)
  if (!Number.isFinite(num) || num <= 0) {
    return null
  }
  if (tokenTotalSupply.equalTo(0)) {
    return null
  }
  return { trimmed, num }
}

export function exceedsDecimalCap(normalized: string, maxDecimals: number): boolean {
  const dotIndex = normalized.indexOf('.')
  return dotIndex !== -1 && normalized.length - dotIndex - 1 > maxDecimals
}

/**
 * Numeric equality between two dot-decimal value strings. The draft layer is locale-free (group
 * separators and localized decimal marks exist only at the render boundary in
 * `useLocalizedNumberInput`), so parsing both sides means formatting-only differences (`1000` vs
 * `1000.0`) never count as divergence while genuine value changes (`23222` vs `23000`) always do.
 * A side that does not parse to a finite number is never equal.
 */
export function isNumericallyEqualDraftValue(a: string, b: string): boolean {
  const numA = parseFloat(a.trim())
  const numB = parseFloat(b.trim())
  return Number.isFinite(numA) && Number.isFinite(numB) && numA === numB
}

/**
 * Truncate a positive decimal string to a currency's wei precision. Prevents `getCurrencyAmount`
 * from throwing "fractional component exceeds decimals" when a USD draft implies a raise amount
 * finer than 1 wei (e.g. typing `$0.0000001` per token with USDC).
 */
export function clampHumanAmountToCurrencyPrecision(human: string, decimals: number): string {
  if (!exceedsDecimalCap(human, decimals)) {
    return human
  }
  const dotIdx = human.indexOf('.')
  return dotIdx === -1 ? human : human.slice(0, dotIdx + 1 + decimals)
}

/** USD draft scalar → raise-token amount per full auction token (may be zero wei). */
export function getRaiseQuotePerTokenFromUsdDraftNum({
  num,
  usdPriceNum,
  raiseCurrency,
}: {
  num: number
  usdPriceNum: number
  raiseCurrency: Currency
}): CurrencyAmount<Currency> | undefined {
  const raw = formatArithmeticResultForInput(num / usdPriceNum)
  if (!raw) {
    return undefined
  }
  const humanRaisePerToken = clampHumanAmountToCurrencyPrecision(raw, raiseCurrency.decimals)
  return (
    getCurrencyAmount({
      value: humanRaisePerToken,
      valueType: ValueType.Exact,
      currency: raiseCurrency,
    }) ?? undefined
  )
}

function tryUnclampedFloorPriceRaiseDraft({
  trimmed,
  tokenTotalSupply,
  raiseCurrency,
}: {
  trimmed: string
  tokenTotalSupply: CurrencyAmount<Currency>
  raiseCurrency: Currency | undefined
}): Price<Currency, Currency> | null {
  if (!raiseCurrency) {
    return null
  }
  const quotePerToken = getCurrencyAmount({ value: trimmed, valueType: ValueType.Exact, currency: raiseCurrency })
  if (!quotePerToken || quotePerToken.equalTo(0)) {
    return null
  }
  return tryPriceOneTokenQuote(quotePerToken, tokenTotalSupply)
}

function tryUnclampedFloorPriceUsdDraft({
  num,
  tokenTotalSupply,
  usdPriceNum,
  raiseCurrency,
}: {
  num: number
  tokenTotalSupply: CurrencyAmount<Currency>
  usdPriceNum: number | null
  raiseCurrency: Currency | undefined
}): Price<Currency, Currency> | null {
  if (!usdPriceNum || usdPriceNum <= 0 || !raiseCurrency) {
    return null
  }
  const quotePerToken = getRaiseQuotePerTokenFromUsdDraftNum({ num, usdPriceNum, raiseCurrency })
  if (!quotePerToken || quotePerToken.equalTo(0)) {
    return null
  }
  return tryPriceOneTokenQuote(quotePerToken, tokenTotalSupply)
}

function tryUnclampedFdvRaiseDraft({
  trimmed,
  tokenTotalSupply,
  raiseCurrency,
}: {
  trimmed: string
  tokenTotalSupply: CurrencyAmount<Currency>
  raiseCurrency: Currency | undefined
}): Price<Currency, Currency> | null {
  if (!raiseCurrency) {
    return null
  }
  const fdvAmount = getCurrencyAmount({ value: trimmed, valueType: ValueType.Exact, currency: raiseCurrency })
  if (!fdvAmount || fdvAmount.equalTo(0)) {
    return null
  }
  return tryPriceFdvOverSupply(fdvAmount, tokenTotalSupply)
}

function tryUnclampedFdvUsdDraft({
  num,
  tokenTotalSupply,
  usdPriceNum,
  raiseCurrency,
}: {
  num: number
  tokenTotalSupply: CurrencyAmount<Currency>
  usdPriceNum: number | null
  raiseCurrency: Currency | undefined
}): Price<Currency, Currency> | null {
  if (!usdPriceNum || usdPriceNum <= 0 || !raiseCurrency) {
    return null
  }
  const raw = formatArithmeticResultForInput(num / usdPriceNum)
  if (!raw) {
    return null
  }
  const fdvRaiseHuman = clampHumanAmountToCurrencyPrecision(raw, raiseCurrency.decimals)
  const fdvAmount = getCurrencyAmount({ value: fdvRaiseHuman, valueType: ValueType.Exact, currency: raiseCurrency })
  if (!fdvAmount || fdvAmount.equalTo(0)) {
    return null
  }
  return tryPriceFdvOverSupply(fdvAmount, tokenTotalSupply)
}

/**
 * Builds the implied per-supply floor `Price` (auction base, raise quote) without clamping.
 * Returns `null` when the draft is empty, not yet a positive finite amount, or cannot be converted
 * to a valid `Price` (including sub-wei `CurrencyAmount` that rounds to zero).
 */
export function tryBuildUnclampedFloorPriceFromDraft({
  localValue,
  denomination,
  inputCurrency,
  usdPriceNum,
  tokenTotalSupply,
  raiseCurrency,
}: DraftToFloorParams): Price<Currency, Currency> | null {
  const head = parsePositiveDraftHead(localValue, tokenTotalSupply)
  if (!head) {
    return null
  }
  const { trimmed, num } = head

  if (denomination === 'floorPrice' && inputCurrency === 'raise') {
    return tryUnclampedFloorPriceRaiseDraft({ trimmed, tokenTotalSupply, raiseCurrency })
  }
  if (denomination === 'floorPrice' && inputCurrency === 'usd') {
    return tryUnclampedFloorPriceUsdDraft({ num, tokenTotalSupply, usdPriceNum, raiseCurrency })
  }
  if (denomination === 'fdv' && inputCurrency === 'raise') {
    return tryUnclampedFdvRaiseDraft({ trimmed, tokenTotalSupply, raiseCurrency })
  }
  if (denomination === 'fdv' && inputCurrency === 'usd') {
    return tryUnclampedFdvUsdDraft({ num, tokenTotalSupply, usdPriceNum, raiseCurrency })
  }

  return null
}
