import {
  MARGIN_DECREASE_LEVERAGE_ACTION_KEYS,
  MARGIN_EQUITY_ACTION_KEYS,
  MARGIN_INCREASE_LEVERAGE_ACTION_KEYS,
  MARGIN_NO_LEVERAGE_SWAP_ACTION_KEYS,
  type MarginActionKey,
  type MarginQuoteRequest,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import {
  bpsToSlippagePercent,
  buildMarginSwapConfig,
  toRequestSwapConfig,
  type MarginQuoteSwapConfig,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginSwapConfig'
import { deriveMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import type { MarginDirection, MarginVenue } from 'uniswap/src/features/transactions/margin/types'

const EQUITY_KEYS: ReadonlySet<MarginActionKey> = new Set(MARGIN_EQUITY_ACTION_KEYS)
const NO_LEVERAGE_SWAP_KEYS: ReadonlySet<MarginActionKey> = new Set(MARGIN_NO_LEVERAGE_SWAP_ACTION_KEYS)
const LEVERAGE_TARGET_KEYS: ReadonlySet<MarginActionKey> = new Set([
  ...MARGIN_INCREASE_LEVERAGE_ACTION_KEYS,
  ...MARGIN_DECREASE_LEVERAGE_ACTION_KEYS,
])
// Exactly one of the ten keys, as the request carries it.
type MarginActionField = Pick<MarginQuoteRequest, MarginActionKey>

export interface MarginQuoteRequestInput {
  actionKey: MarginActionKey
  chainId: number
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
  // The wallet-side rail, already complete (see buildMarginSwapConfig). Required by the equity keys,
  // FORBIDDEN on the rest — the wire rejects one it did not ask for.
  swapConfig?: MarginQuoteSwapConfig
  // Leverage-leg tolerance, PERCENT. Required on the eight keys that swap, forbidden on the two
  // pure-equity ones.
  slippageTolerance?: number
  protocols?: string[]
}

// Assembles a legal request or nothing. Every rule the dispatcher enforces structurally is enforced
// here too, by returning `undefined` rather than a request the server would 400 — an absent request
// is exactly what disables the quote query, so a half-specified form simply does not quote.
export function buildMarginQuoteRequest({
  actionKey,
  chainId,
  exposureToken,
  counterToken,
  direction,
  swapper,
  positionId,
  leverageTarget,
  venues,
  swapConfig,
  slippageTolerance,
  protocols,
}: MarginQuoteRequestInput): MarginQuoteRequest | undefined {
  // Required on every key: the directional layer resolves live position state off it.
  if (!swapper) {
    return undefined
  }

  const actionField = buildMarginActionField({ actionKey, positionId, leverageTarget, venues })
  if (!actionField) {
    return undefined
  }

  // Only the keys naming an equity direction move a wallet-side balance; `close` and the pure
  // leverage moves carry no rail at all. Those keys also have no other source for the magnitude they
  // move — on `open` it is the whole basis for size = leverage × equity.
  const movesEquity = EQUITY_KEYS.has(actionKey)
  if (movesEquity && !swapConfig) {
    return undefined
  }
  const rail = movesEquity && swapConfig ? toRequestSwapConfig(swapConfig) : undefined

  const bindsALeverageSwap = !NO_LEVERAGE_SWAP_KEYS.has(actionKey)
  // Explicit on every key that swaps: it derives maxDebtIn/maxCollateralIn, the MEV backstop.
  if (bindsALeverageSwap && slippageTolerance === undefined) {
    return undefined
  }

  return {
    chainId,
    exposureToken,
    counterToken,
    direction,
    swapper,
    ...(bindsALeverageSwap ? { slippageTolerance, ...(protocols ? { protocols } : {}) } : {}),
    ...(rail ? { swapConfig: rail } : {}),
    ...actionField,
  }
}

// A switch, not a computed property, so each branch is checked against its own action-value type
// rather than the ten-way union.
function buildMarginActionField({
  actionKey,
  positionId,
  leverageTarget,
  venues,
}: {
  actionKey: MarginActionKey
  positionId: string | undefined
  leverageTarget: string | undefined
  venues: MarginVenue[] | undefined
}): MarginActionField | undefined {
  if (actionKey === 'open') {
    // An empty allowlist is not a request the wire accepts (`open` needs >= 1 venue), so the user
    // having excluded every venue for this pair disables the quote instead of asking for a route
    // that cannot exist.
    return venues?.length && leverageTarget ? { open: { leverageTarget, venues } } : undefined
  }
  if (!positionId) {
    return undefined
  }
  const position = { positionId }
  const leverage = LEVERAGE_TARGET_KEYS.has(actionKey) && leverageTarget ? { positionId, leverageTarget } : undefined
  switch (actionKey) {
    case 'close':
      return { close: position }
    case 'addEquity':
      return { addEquity: position }
    case 'withdrawEquity':
      return { withdrawEquity: position }
    case 'increaseLeverage':
      return leverage ? { increaseLeverage: leverage } : undefined
    case 'decreaseLeverage':
      return leverage ? { decreaseLeverage: leverage } : undefined
    case 'addEquityAndIncreaseLeverage':
      return leverage ? { addEquityAndIncreaseLeverage: leverage } : undefined
    case 'addEquityAndDecreaseLeverage':
      return leverage ? { addEquityAndDecreaseLeverage: leverage } : undefined
    case 'withdrawEquityAndIncreaseLeverage':
      return leverage ? { withdrawEquityAndIncreaseLeverage: leverage } : undefined
    case 'withdrawEquityAndDecreaseLeverage':
      return leverage ? { withdrawEquityAndDecreaseLeverage: leverage } : undefined
    default:
      return undefined
  }
}

// The OPEN request, straight off form state: the derived allowlist gates it (an empty one leaves the
// quote disabled), and the single slippage setting fills BOTH configs — the leverage leg's bound and
// the pay-in swap's own.
export function buildMarginOpenQuoteRequest({
  chainId,
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
  chainId: number
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
    chainId,
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
