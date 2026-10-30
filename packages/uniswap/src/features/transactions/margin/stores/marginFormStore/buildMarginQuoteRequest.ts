import { TradingApi } from '@universe/api'
import {
  MARGIN_EQUITY_ACTION_KEYS,
  MARGIN_NO_LEVERAGE_SWAP_ACTION_KEYS,
  type MarginActionKey,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  bpsToSlippagePercent,
  buildMarginSwapConfig,
  toRailWireParts,
  type MarginQuoteSwapConfig,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginSwapConfig'
import { deriveMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import type { MarginDirection, MarginVenue } from 'uniswap/src/features/transactions/margin/types'

type MarginQuoteRequest = TradingApi.MarginQuoteRequest

// The FE venue union carries COMPOUND_V3, which has no generated wire enum yet; map to the wire enum
// at this one boundary and drop it, since the backend can't route it. Direction already IS the wire
// enum (see MarginDirection in types), so it rides straight through with no mapping.
function toWireVenues(venues: MarginVenue[]): TradingApi.MarginVenue[] {
  const wire: TradingApi.MarginVenue[] = []
  for (const venue of venues) {
    if (venue === 'MORPHO') {
      wire.push(TradingApi.MarginVenue.MORPHO)
    } else if (venue === 'AAVE_V3') {
      wire.push(TradingApi.MarginVenue.AAVE_V3)
    } else if (venue === 'AAVE_V4') {
      wire.push(TradingApi.MarginVenue.AAVE_V4)
    }
  }
  return wire
}

// Keys that move leverage and nothing else, so they carry NO wallet-side rail — the only two keys
// where walletToken/walletChainId/swapConfig are forbidden. Mirrors the backend's LEVERAGE_ONLY_KEYS
// exactly (the composites move equity too, so they are NOT here).
const LEVERAGE_ONLY_KEYS: ReadonlySet<MarginActionKey> = new Set<MarginActionKey>([
  'increaseLeverage',
  'decreaseLeverage',
])
// The keys with no leverage swap, so the leverage-leg tolerance is forbidden. = backend EQUITY_ONLY_KEYS.
const NO_LEVERAGE_SWAP_KEYS: ReadonlySet<MarginActionKey> = new Set(MARGIN_NO_LEVERAGE_SWAP_ACTION_KEYS)
// The keys that carry an `amount` on their action object (open + the equity-moving keys).
const AMOUNT_KEYS: ReadonlySet<MarginActionKey> = new Set(MARGIN_EQUITY_ACTION_KEYS)

export interface MarginQuoteRequestInput {
  actionKey: MarginActionKey
  positionChainId: number
  // Trader terms: LONG borrows the counter token against exposure collateral, SHORT the reverse.
  exposureToken: string
  counterToken: string
  direction: MarginDirection
  swapper?: string
  // Every key but `open` names the position it acts on.
  positionId?: string
  // Decimal string ('2.5', never a WAD). Required by the keys that move leverage, forbidden on the rest.
  leverageTarget?: string
  // `open` only, and already derived (pair venues minus exclusions).
  venues?: MarginVenue[]
  // The wallet-side rail, already complete (see buildMarginSwapConfig). Required by every key but the
  // two pure leverage moves; carries the pay/receive token, its chain, the equity magnitude, and the
  // pay-in swap's slippage — which the builder fans out to walletToken/walletChainId/amount/swapConfig.
  swapConfig?: MarginQuoteSwapConfig
  // Leverage-leg tolerance, PERCENT. Required on the eight keys that swap, forbidden on the two
  // pure-equity ones.
  slippageTolerance?: number
}

// Assembles a legal request or nothing. Every rule the wire enforces per key is enforced here too, by
// returning `undefined` rather than a request the server would 400 — an absent request is exactly what
// disables the quote query, so a half-specified form simply does not quote.
export function buildMarginQuoteRequest({
  actionKey,
  positionChainId,
  exposureToken,
  counterToken,
  direction,
  swapper,
  positionId,
  leverageTarget,
  venues,
  swapConfig,
  slippageTolerance,
}: MarginQuoteRequestInput): MarginQuoteRequest | undefined {
  // Required on every key: the directional layer resolves live position state off it.
  if (!swapper) {
    return undefined
  }

  const base: TradingApi.MarginQuoteRequestBase = {
    positionChainId,
    exposureToken,
    counterToken,
    direction,
    swapper,
  }

  const needsWallet = !LEVERAGE_ONLY_KEYS.has(actionKey)
  const rail = swapConfig ? toRailWireParts(swapConfig) : undefined
  // A wallet-bearing key with no complete rail (or no chain on it) cannot form a legal request.
  if (needsWallet && (!rail || rail.walletChainId === undefined)) {
    return undefined
  }
  const wallet: TradingApi.MarginWalletBlock | undefined =
    needsWallet && rail && rail.walletChainId !== undefined
      ? { walletToken: rail.walletToken, walletChainId: rail.walletChainId, swapConfig: rail.swapConfig }
      : undefined

  const needsLeverageLeg = !NO_LEVERAGE_SWAP_KEYS.has(actionKey)
  if (needsLeverageLeg && slippageTolerance === undefined) {
    return undefined
  }
  const lev: TradingApi.MarginLeverageLeg | undefined =
    needsLeverageLeg && slippageTolerance !== undefined ? { slippageTolerance } : undefined

  // Amount lives on the action object for open + the equity-moving keys, and comes off the rail.
  const amount = AMOUNT_KEYS.has(actionKey) ? rail?.amount : undefined
  if (AMOUNT_KEYS.has(actionKey) && amount === undefined) {
    return undefined
  }

  return assembleMarginRequest({ actionKey, base, wallet, lev, positionId, leverageTarget, amount, venues })
}

// The computed pieces of a request. wallet/lev/amount are already validated for the action's needs by
// buildMarginQuoteRequest; this only has to attach the action-specific fields (positionId, leverageTarget,
// venues) and assemble a concrete union member. Split out so neither function's branching exceeds the
// complexity bound — the composites share one shape and route through buildCompositeRequest.
interface MarginRequestParts {
  actionKey: MarginActionKey
  base: TradingApi.MarginQuoteRequestBase
  wallet?: TradingApi.MarginWalletBlock
  lev?: TradingApi.MarginLeverageLeg
  positionId?: string
  leverageTarget?: string
  amount?: string
  venues?: MarginVenue[]
}

function assembleMarginRequest(parts: MarginRequestParts): MarginQuoteRequest | undefined {
  const { actionKey, base, wallet, lev, positionId, leverageTarget, amount, venues } = parts
  switch (actionKey) {
    case 'open': {
      const wireVenues = venues ? toWireVenues(venues) : []
      return wallet && lev && wireVenues.length && leverageTarget && amount
        ? { ...base, ...wallet, ...lev, open: { leverageTarget, venues: wireVenues, amount } }
        : undefined
    }
    case 'close':
      return wallet && lev && positionId ? { ...base, ...wallet, ...lev, close: { positionId } } : undefined
    case 'increaseLeverage':
      return lev && positionId && leverageTarget
        ? { ...base, ...lev, increaseLeverage: { positionId, leverageTarget } }
        : undefined
    case 'decreaseLeverage':
      return lev && positionId && leverageTarget
        ? { ...base, ...lev, decreaseLeverage: { positionId, leverageTarget } }
        : undefined
    case 'addEquity':
      return wallet && positionId && amount ? { ...base, ...wallet, addEquity: { positionId, amount } } : undefined
    case 'withdrawEquity':
      return wallet && positionId && amount ? { ...base, ...wallet, withdrawEquity: { positionId, amount } } : undefined
    default:
      return buildCompositeRequest(parts)
  }
}

// The four equity+leverage composites share the identical { positionId, leverageTarget, amount } shape;
// only the key differs. One guard, then a keyed return per member so each stays a concrete union type.
function buildCompositeRequest(parts: MarginRequestParts): MarginQuoteRequest | undefined {
  const { actionKey, base, wallet, lev, positionId, leverageTarget, amount } = parts
  if (!wallet || !lev || !positionId || !leverageTarget || !amount) {
    return undefined
  }
  const action = { positionId, leverageTarget, amount }
  switch (actionKey) {
    case 'addEquityAndIncreaseLeverage':
      return { ...base, ...wallet, ...lev, addEquityAndIncreaseLeverage: action }
    case 'addEquityAndDecreaseLeverage':
      return { ...base, ...wallet, ...lev, addEquityAndDecreaseLeverage: action }
    case 'withdrawEquityAndIncreaseLeverage':
      return { ...base, ...wallet, ...lev, withdrawEquityAndIncreaseLeverage: action }
    case 'withdrawEquityAndDecreaseLeverage':
      return { ...base, ...wallet, ...lev, withdrawEquityAndDecreaseLeverage: action }
    default:
      return undefined
  }
}

// The OPEN request, straight off form state: the derived allowlist gates it (an empty one leaves the
// quote disabled), and the single slippage setting fills BOTH configs — the leverage leg's bound and
// the pay-in swap's own.
export function buildMarginOpenQuoteRequest({
  positionChainId,
  exposureToken,
  counterToken,
  direction,
  swapper,
  leverage,
  equityAmountRaw,
  paymentToken,
  paymentChainId,
  slippageToleranceBps,
  pairVenues,
  excludedVenues,
}: {
  positionChainId: number
  exposureToken: string
  counterToken: string
  direction: MarginDirection
  swapper?: string
  leverage: number
  // Raw units of `paymentToken`; THE equity magnitude.
  equityAmountRaw?: string
  // Wire-ready (native ETH already mapped to MARGIN_NATIVE_TOKEN_ADDRESS).
  paymentToken: string
  paymentChainId: number
  slippageToleranceBps: number
  pairVenues: MarginVenue[]
  excludedVenues: MarginVenue[]
}): MarginQuoteRequest | undefined {
  return buildMarginQuoteRequest({
    actionKey: 'open',
    positionChainId,
    exposureToken,
    counterToken,
    direction,
    swapper,
    leverageTarget: leverage.toFixed(2),
    venues: deriveMarginVenues({ pairVenues, excludedVenues }),
    slippageTolerance: bpsToSlippagePercent(slippageToleranceBps),
    swapConfig: buildMarginSwapConfig({
      token: paymentToken,
      // Must match what the quote echoes back, and a source chain != the position's is what makes
      // this cross-chain funding.
      chainId: paymentChainId,
      amountRaw: equityAmountRaw,
      slippageToleranceBps,
    }),
  })
}
