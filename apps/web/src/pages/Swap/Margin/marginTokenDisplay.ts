import { normalizeTokenAddressForCache } from '@universe/chains'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { buildCurrencyId, buildNativeCurrencyId, normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import {
  MARGIN_CHAIN_ID,
  MARGIN_QUOTE_TOKEN_ADDRESSES,
  type MarginMarket,
  type MarginPairGroup,
  type MarginTokenInfo,
} from '~/constants/margin'

// Resolves a wire token address to its display symbol, or undefined when the caller can't resolve it.
export type MarginSymbolResolver = (address: string) => string | undefined

// The margin chain's wrapped-native (WETH) address, lower-cased. Single source of truth for the
// WETH↔ETH display swap.
export const MARGIN_WRAPPED_NATIVE_ADDRESS: string = normalizeTokenAddressForCache(
  nativeOnChain(MARGIN_CHAIN_ID).wrapped.address,
)

export function isMarginWrappedNative(input: { address: string }): boolean {
  return normalizeTokenAddressForCache(input.address) === MARGIN_WRAPPED_NATIVE_ADDRESS
}

// Display symbol: native (ETH) for wrapped-native, else the token's own symbol. Display-only.
// Takes a whole token so a caller can't pair one token's address with another's symbol.
export function marginUnwrapSymbol(token: { address: string; symbol: string }): string {
  return isMarginWrappedNative({ address: token.address })
    ? (nativeOnChain(MARGIN_CHAIN_ID).symbol ?? token.symbol)
    : token.symbol
}

// Display name: native (Ethereum) for wrapped-native, else the given name (address and name come
// from different sources here — the token address + a currency-info name — so this stays split).
export function marginUnwrapName(input: { address: string; name: string }): string {
  return isMarginWrappedNative({ address: input.address })
    ? (nativeOnChain(MARGIN_CHAIN_ID).name ?? input.name)
    : input.name
}

export function isMarginQuoteToken(input: { address: string }): boolean {
  return MARGIN_QUOTE_TOKEN_ADDRESSES.has(normalizeTokenAddressForCache(input.address))
}

// Mirror of the backend's marketDirection(). Params are named for the WIRE fields on purpose:
// MarginPosition also has `collateral`/`debt`, but those hold raw amounts, not addresses.
export function marginMarketDirection(input: { collateralToken: string; debtToken: string }): MarginDirection {
  return isMarginQuoteToken({ address: input.debtToken }) && !isMarginQuoteToken({ address: input.collateralToken })
    ? MarginDirection.LONG
    : MarginDirection.SHORT
}

// Direction for any wire row that carries the field: the server's classification when present, the
// pair's token identity otherwise (rows predating shorts). The single resolver — a row and the market
// it resolved to can never disagree, because this only ever reads the row's own tokens.
export function marginRowDirection(row: {
  direction?: MarginDirection
  collateralToken: string
  debtToken: string
}): MarginDirection {
  return row.direction ?? marginMarketDirection(row)
}

// Base = the traded (volatile) leg, quote = the stable leg. Token identity decides; `direction` only
// breaks the tie the backend already excludes.
export function marginPairLegs(input: {
  collateral: MarginTokenInfo
  debt: MarginTokenInfo
  direction?: MarginDirection
}): { base: MarginTokenInfo; quote: MarginTokenInfo } {
  const collateralIsQuote = isMarginQuoteToken({ address: input.collateral.address })
  const debtIsQuote = isMarginQuoteToken({ address: input.debt.address })
  if (collateralIsQuote !== debtIsQuote) {
    return collateralIsQuote
      ? { base: input.debt, quote: input.collateral }
      : { base: input.collateral, quote: input.debt }
  }
  return input.direction === MarginDirection.SHORT
    ? { base: input.debt, quote: input.collateral }
    : { base: input.collateral, quote: input.debt }
}

// The leg every wire row's `size` is denominated in: a LONG's exposure is its collateral, a SHORT's is
// the debt it borrowed. Reading the collateral leg for both scales a short's size by the stable's
// decimals (1 WETH renders as 1e12) and labels it with the stable's symbol.
export function marginExposureLeg(input: {
  market: Pick<MarginMarket, 'collateral' | 'debt'>
  direction: MarginDirection
}): MarginTokenInfo {
  return input.direction === MarginDirection.SHORT ? input.market.debt : input.market.collateral
}

// "<base> / <quote>" — the stable leg always second, both unwrapped for display.
export function marginPairLabel(input: { market: Pick<MarginMarket, 'collateral' | 'debt' | 'direction'> }): string {
  const { base, quote } = marginPairLegs(input.market)
  return `${marginUnwrapSymbol(base)} / ${marginUnwrapSymbol(quote)}`
}

// Same label for a pair GROUP, whose legs are already resolved as display base/quote — marginPairLegs
// would have to re-derive them from a collateral/debt pair a group no longer carries.
export function marginPairGroupLabel(input: { group: Pick<MarginPairGroup, 'base' | 'quote'> }): string {
  return `${marginUnwrapSymbol(input.group.base)} / ${marginUnwrapSymbol(input.group.quote)}`
}

// currencyId for a fallback token by its raw wire address — WETH routes to native, mirroring how a
// resolved MarginTokenInfo's currencyId is built, so its symbol still resolves as ETH.
function marginFallbackCurrencyId(address: string): string {
  return isMarginWrappedNative({ address })
    ? buildNativeCurrencyId(MARGIN_CHAIN_ID)
    : buildCurrencyId(MARGIN_CHAIN_ID, address)
}

// Symbol for a single token of a market the registry couldn't resolve. Undefined when the token
// isn't in the map at all — callers decide whether to omit the symbol or fall back to an address.
export function resolveMarginFallbackSymbol({
  address,
  currencyInfos,
}: {
  address: string
  currencyInfos: Map<string, CurrencyInfo>
}): string | undefined {
  return currencyInfos.get(normalizeCurrencyIdForMapLookup(marginFallbackCurrencyId(address)))?.currency.symbol
}

// Best-effort "<base> / <quote>" for a market the live registry couldn't resolve: orders the two
// wire addresses the same way marginPairLegs does, then renders resolved symbols from the given
// currency-info map. If either leg's symbol is unresolved, both legs render as a shortened address
// rather than mixing a resolved symbol with a hex string.
export function marginFallbackPairLabel(input: {
  collateralToken: string
  debtToken: string
  currencyInfos: Map<string, CurrencyInfo>
}): string {
  const [baseAddress, quoteAddress] = isMarginQuoteToken({ address: input.collateralToken })
    ? [input.debtToken, input.collateralToken]
    : [input.collateralToken, input.debtToken]
  const baseSymbol = resolveMarginFallbackSymbol({ address: baseAddress, currencyInfos: input.currencyInfos })
  const quoteSymbol = resolveMarginFallbackSymbol({ address: quoteAddress, currencyInfos: input.currencyInfos })
  return baseSymbol && quoteSymbol
    ? `${baseSymbol} / ${quoteSymbol}`
    : `${shortenAddress({ address: baseAddress })} / ${shortenAddress({ address: quoteAddress })}`
}
