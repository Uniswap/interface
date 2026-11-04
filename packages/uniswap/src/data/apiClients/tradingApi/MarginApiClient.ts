/* oxlint-disable max-lines -- ~760 of these lines are the hand-written wire contract for the margin
   TAPI surface, which has not merged to the backend's spec yet (see the injection note in
   modifyTradingApiTypes.mts). They collapse to generated imports once it has, so splitting them into a
   sibling module now would create a file whose only future is deletion. */
import {
  TradingApi,
  createFetcher,
  createTradingApiFetchClient,
  provideSessionService,
  tryProvideSession,
} from '@universe/api'
import { SessionGateSource } from '@universe/sessions'
import { config } from 'uniswap/src/config'
import { getUniswapServiceUrls } from 'uniswap/src/constants/urls'
import { BASE_UNISWAP_HEADERS } from 'uniswap/src/data/apiClients/createUniswapFetchClient'
import {
  toMarginPositionActivityView,
  toMarginPositionsView,
  type MarginPositionActivityWireResponse,
  type MarginPositionsWireResponse,
} from 'uniswap/src/data/apiClients/tradingApi/marginPositionsView'
import { toMarginQuoteView, type MarginTokenDecimals } from 'uniswap/src/data/apiClients/tradingApi/marginQuoteView'
import { TradingApiSessionClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiSessionClient'
import type { MarginDirection, MarginVenue } from 'uniswap/src/features/transactions/margin/types'

// The margin endpoints are not in the committed Trading API OpenAPI spec, so the
// request/response types are hand-written here (mirrors the tradeTypes.ts precedent).
//
// Units on this wire: amounts are raw-unit decimal strings; leverage is a DECIMAL
// string ('2.5', never a WAD); prices, rates, LTVs and ratios are unsuffixed
// 18-decimal fixed-point strings; slippage tolerances are explicit percents.

// ---- shared enums / primitives (prod-exact casing) ----
export type MarginPlanIntent = 'OPEN' | 'CLOSE' | 'RECOVER' | 'ADJUST'
// Recovery is sweep-only, so the wallet is the one source a create can name.
export type MarginFundingSource = 'WALLET'

// Native ETH payment on the wire (both directions).
export const MARGIN_NATIVE_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'

// ---- the ten action keys ----
// Exactly one rides a quote request. The oneof makes "no key" and "two keys"
// unrepresentable, and every field inside a key is required — a dropped field is
// a 400, never a different action.
export const MARGIN_ACTION_KEYS = [
  'open',
  'close',
  'increaseLeverage',
  'decreaseLeverage',
  'addEquity',
  'withdrawEquity',
  'addEquityAndIncreaseLeverage',
  'addEquityAndDecreaseLeverage',
  'withdrawEquityAndIncreaseLeverage',
  'withdrawEquityAndDecreaseLeverage',
] as const
export type MarginActionKey = (typeof MARGIN_ACTION_KEYS)[number]

// The key a REQUEST carries, for the surfaces that must branch before the
// response echoes it back (retry policy, analytics). The oneof guarantees at
// most one is set.
export function marginRequestActionKey(request: MarginQuoteRequest): MarginActionKey | undefined {
  return MARGIN_ACTION_KEYS.find((key) => key in request)
}

// The position a request prices against. It rides inside the action key rather than on the envelope,
// so surfaces that need the SUBJECT of a request — cache bridging, analytics — read it through here.
// `open` reports absent: it has no position yet.
export function marginRequestPositionId(request: MarginQuoteRequest): string | undefined {
  if ('close' in request) {
    return request.close.positionId
  }
  if ('increaseLeverage' in request) {
    return request.increaseLeverage.positionId
  }
  if ('decreaseLeverage' in request) {
    return request.decreaseLeverage.positionId
  }
  if ('addEquity' in request) {
    return request.addEquity.positionId
  }
  if ('withdrawEquity' in request) {
    return request.withdrawEquity.positionId
  }
  if ('addEquityAndIncreaseLeverage' in request) {
    return request.addEquityAndIncreaseLeverage.positionId
  }
  if ('addEquityAndDecreaseLeverage' in request) {
    return request.addEquityAndDecreaseLeverage.positionId
  }
  if ('withdrawEquityAndIncreaseLeverage' in request) {
    return request.withdrawEquityAndIncreaseLeverage.positionId
  }
  if ('withdrawEquityAndDecreaseLeverage' in request) {
    return request.withdrawEquityAndDecreaseLeverage.positionId
  }
  return undefined
}

// The venue allowlist an `open` request was quoted against, as a stable string. Only `open` carries
// one — a position action prices at the venue its position already sits in. Sorted before joining
// because the allowlist is a SET: two requests naming the same venues in a different order are the
// same subject, and treating them as different would blank the form for no reason.
export function marginRequestVenueKey(request: MarginQuoteRequest): string | undefined {
  return 'open' in request ? [...request.open.venues].sort().join(',') : undefined
}

// The wallet-side pay/receive token and its chain. Present on every key but the two pure leverage
// moves, so read through these rather than off the envelope — the subject comparison keys on them.
export function marginRequestWalletToken(request: MarginQuoteRequest): string | undefined {
  return 'walletToken' in request ? request.walletToken : undefined
}
export function marginRequestWalletChainId(request: MarginQuoteRequest): number | undefined {
  return 'walletChainId' in request ? request.walletChainId : undefined
}

// Keys naming an equity direction, so the wallet-side rail is required: the six
// add/withdraw keys plus `open`, whose equity magnitude has no other source
// (size = leverage × equity).
export const MARGIN_EQUITY_ACTION_KEYS = [
  'open',
  'addEquity',
  'withdrawEquity',
  'addEquityAndIncreaseLeverage',
  'addEquityAndDecreaseLeverage',
  'withdrawEquityAndIncreaseLeverage',
  'withdrawEquityAndDecreaseLeverage',
] as const satisfies readonly MarginActionKey[]

// The keys that move equity IN on an existing position. `swapConfig` alone cannot
// tell the direction — the schema requires a `token` on a withdrawal too, where the
// server discards it and reads the amount as COLLATERAL — so the action key is the
// only discriminator, of the direction and of the amount's denomination alike.
export const MARGIN_ADD_EQUITY_ACTION_KEYS = [
  'addEquity',
  'addEquityAndIncreaseLeverage',
  'addEquityAndDecreaseLeverage',
] as const satisfies readonly MarginActionKey[]

// Keys with no leverage swap at all: size is held, so the leverage-leg tolerance
// bounds nothing and is forbidden on them.
export const MARGIN_NO_LEVERAGE_SWAP_ACTION_KEYS = [
  'addEquity',
  'withdrawEquity',
] as const satisfies readonly MarginActionKey[]

// Keys carrying a leverageTarget, split by the direction they assert. The
// increase side admits > 1; the decrease side admits >= 1 (a full deleverage at
// exactly 1 is what produces the zero-debt position a swap-free close consumes).
export const MARGIN_INCREASE_LEVERAGE_ACTION_KEYS = [
  'open',
  'increaseLeverage',
  'addEquityAndIncreaseLeverage',
  'withdrawEquityAndIncreaseLeverage',
] as const satisfies readonly MarginActionKey[]
export const MARGIN_DECREASE_LEVERAGE_ACTION_KEYS = [
  'decreaseLeverage',
  'addEquityAndDecreaseLeverage',
  'withdrawEquityAndDecreaseLeverage',
] as const satisfies readonly MarginActionKey[]

// ---- the wallet-side rail ----
// What the caller pays with, or wants to receive. Wholly independent of the
// leverage leg — neither tolerance defaults from the other. Flow direction comes
// from the action key, never from this object.
export interface MarginSwapConfig {
  // Native ETH = MARGIN_NATIVE_TOKEN_ADDRESS.
  token?: string
  // != the position's chain ⇒ cross-chain funding (pay-in only). Requires `token`.
  chainId?: number
  type?: 'EXACT_INPUT' | 'EXACT_OUTPUT'
  // THE equity magnitude, raw units of `token`.
  amount?: string
  // Percent; xor autoSlippage on a request. Governs ONLY this swap.
  slippageTolerance?: number
  // REQUEST-ONLY: resolved to a concrete percent at the quote boundary, so the
  // response echoes the band its floors were actually cut at.
  autoSlippage?: string
  protocols?: string[]
  // RESPONSE-ONLY (server-authored): floor on this swap's output.
  minAmount?: string
  // RESPONSE-ONLY, cross-chain pay-in only: guaranteed bridge floor.
  minBridgeOut?: string
}

// ---- the ten-key quote request ----
export interface MarginOpenAction {
  // Decimal string, > 1.
  leverageTarget: string
  // LENDING allowlist, >= 1 entry, no duplicates. Derived from GET /margin/markets
  // (never an FE constant) minus the user's exclusions.
  venues: MarginVenue[]
}
// close · addEquity · withdrawEquity — the axis moves, its magnitude does not come
// from a leverage number.
export interface MarginPositionAction {
  positionId: string
}
// The leverage moves, and the four composites.
export interface MarginPositionLeverageAction {
  positionId: string
  // Decimal string; > 1 to increase, >= 1 to decrease.
  leverageTarget: string
}

// Generated from the backend OpenAPI spec (SWAP-3352): the ten-key request is a discriminated union
// of one per-action member, each an intersection of the shared base + (walletBlock?) + (leverageLeg?)
// + its action object. The FE builder constructs members directly; a wire rename now fails to compile.
export type MarginQuoteRequest = TradingApi.MarginQuoteRequest

// ---- server-authored bounds ----
// Echoed VERBATIM inside the posted quote and re-derived + cross-checked at plan
// creation. The groups are keyed by the ON-CHAIN CALL each field stamps into, so
// a composite action populates two of them. Identity/leverage pins and the
// wallet-side rail are NOT bounds and stay on the envelope.
export interface MarginBoundsIncrease {
  // Exact-out buy, collateral asset.
  collateralToBuy?: string
  // Binding slippage cap on debt spent.
  maxDebtIn?: string
  // Equity this leg's pre-swap should deliver, and that pre-swap's floor.
  expectedEquityDelta?: string
  minEquityDelta?: string
  // Stamps 0 while single-hop.
  minHopPrice?: string
  // This call's quoted fill; the PRICE_DRIFT reference.
  effectivePrice?: string
  // The pool this leg was priced on, canonically serialized. Exact-compared at
  // plan creation, so the caps above cannot be enforced against a pool the user
  // was never quoted on.
  swapPoolKey?: string
  // Per-leg market identity pin.
  venueMarketId?: string
}
export interface MarginBoundsDecrease {
  // Close: the full live debt + the UR dust buffer. Absent when the server authored no bound;
  // consumers must treat absence as "unknown", never zero.
  debtToRepay?: string
  // Cap on collateral sold; round-UP slippage pad. Absent → unknown, not zero.
  maxCollateralIn?: string
  minHopPrice?: string
  effectivePrice?: string
  swapPoolKey?: string
  venueMarketId?: string
  // Partial decrease only (ASSERT_HEALTH); absent on a full close, which leaves
  // no position to bound.
  maxLtvAfter?: string
}
// Serves every action that moves equity (addCollateral / repay / borrow /
// withdrawCollateral); the action key gives the sign.
export interface MarginBoundsEquity {
  equityDelta: string
  // Withdraw with a post-swap: floor reaching the swapper.
  minReceiveAmount?: string
  effectivePrice?: string
  // Withdrawals only: a stamp-time pin, because no on-chain guard covers the
  // account primitives this group bounds.
  maxLtvAfter?: string
}
export interface MarginBounds {
  venue?: MarginVenue
  subId?: string
  // Exact-compared when present; on an adjust, absence means debt-constant mode.
  leverageTarget?: string
  // Leverage leg, percent.
  slippageTolerance?: number
  protocols?: string[]
  swapConfig?: MarginSwapConfig
  // Every PRICED action populates at least one group; composites populate two.
  increase?: MarginBoundsIncrease
  decrease?: MarginBoundsDecrease
  equity?: MarginBoundsEquity
}

export interface MarginPaymentSwapQuote {
  // Token addresses along the winning path (payment → [mid →] collateral).
  route: string[]
  // Σ hop fee tiers in bps (3000 → 30).
  feeBps: number
  impactBps: string
  expectedOut: string
  // Absent when the server authored no slippage floor; do not fabricate one from expectedOut.
  minOut?: string
}

// Display-only cross-chain summary (route row + fee list); never part of the bounds.
export interface MarginPaymentSourceInfo {
  chainId: number
  // [payToken, sourceUsdc] addresses; absent when paying source USDC directly.
  swapRoute?: string[]
  bridgeFeeBps: number
}

export interface MarginGasEstimate {
  gasLimit: string
  gasFeeWei: string
  // 18-dec fixed-point USD; format via scaledE18ToNumber.
  gasFeeUsd?: string
}

// A token as a RESPONSE carries it. No `symbol`: the quote path resolves markets,
// not token metadata — the FE resolves symbols from its own token lists.
export interface MarginTokenMetadata {
  address: string
  chainId: number
  decimals: number
}

// PROJECTED-ONLY: what the position looks like AFTER this action. Never
// before/after — the FE composes "before" from the GET /margin/positions row it
// already holds. Presence follows the action key; a field the action does not
// produce is ABSENT, never null.
export interface MarginQuoteDisplay {
  // Exposure-token units (a short's exposure is its debt leg).
  size?: string
  // Decimal string, EXPOSURE leverage.
  leverage?: string
  // Size-weighted aggregate over the legs.
  effectivePrice?: string
  liquidationPrice?: string
  // Borrow APR, 18-dec.
  borrowRate?: string
  // Thresholds stay client-side. Absent on `close`, which leaves no position.
  healthFactor?: string
  // The venue's oracle mark, on the same snapshot as liquidationPrice and healthFactor.
  oraclePrice?: string
  // ---- close only ----
  collateralReturned?: string
  debtRepaid?: string
}

// One venue leg. Single-element in v1; the array is the shape a multi-venue fill
// would take, so read legs[0] rather than expecting row-level venue identity.
export interface MarginQuoteLeg {
  venue: MarginVenue
  // Venue terms — the leg's own legs, not the trader's.
  collateralToken: string
  debtToken: string
  // Morpho's market id. Absent for venues whose market identity IS the pair.
  venueMarketId?: string
  // Absent on `open` (plan create allocates it).
  subId?: string
  size?: string
  // This leg's share of the position's equity, 18-dec (1e18 = all of it).
  equityShare: string
  liquidationPrice?: string
  buffer?: string
  borrowRate?: string
  bounds: MarginBounds
}

// Posted back VERBATIM as `marginQuote` on the shared POST /plan — the only source of
// identity, rails and bounds for every non-RECOVER create.
export interface MarginQuoteResponse {
  requestId: string
  // ---- identity + confirmed inputs ----
  // The request's action key, echoed as a string (consumers already switch on it
  // for `display`; a second oneof would make them switch twice).
  action: MarginActionKey
  chainId: number
  swapper: string
  // Prices below arrive pre-inverted for SHORT — never invert them client-side.
  direction: MarginDirection
  exposureToken: MarginTokenMetadata
  counterToken: MarginTokenMetadata
  // Omitted on `open` until plan create allocates one.
  positionId?: string
  // Present iff the action moved leverage.
  leverageTarget?: string
  // Leverage leg, confirmed as sent.
  slippageTolerance?: number
  protocols?: string[]
  // The wallet-side rail confirmed as sent, PLUS the floors the server authored
  // on it — cross-checked at create exactly like a bounds field.
  swapConfig?: MarginSwapConfig
  display: MarginQuoteDisplay
  legs: MarginQuoteLeg[]
  deadlineSuggestion: string
  // Absent on `close`, the one body that estimates no gas.
  gasEstimate?: MarginGasEstimate
  // Display-only funding-rail summaries; the rail's binding floors live on swapConfig.
  paymentSwap?: MarginPaymentSwapQuote
  paymentSource?: MarginPaymentSourceInfo
  // The verbatim wire `execution` subtree, carried UNTOUCHED for the POST /plan echo: the backend
  // reads `marginQuote.execution` (re-deriving every bound on chain) and ignores the flat/display
  // fields above, which exist only for the terminal UI. Always set by toMarginQuoteView on a real
  // quote; optional only so display-only test fixtures need not synthesize an execution subtree.
  execution?: TradingApi.MarginExecution
}

// ---- error taxonomy (hand-mirrored from the BE's lib/errors.ts enums) ----
// The wire `errorCode` for a margin business failure. Values ARE the BE error
// subclasses' `.name`, assembled into the wire body by TradingAPIHttpError.
export type MarginErrorCode =
  // structural admission (the ten keys are a oneof)
  | 'MARGIN_NO_ACTION'
  | 'MARGIN_MULTIPLE_ACTIONS'
  // directional admission — the detail names the key to retry with
  | 'MARGIN_INTENT_MISMATCH'
  | 'MARGIN_POSITION_EXISTS'
  | 'MARGIN_POSITION_NOT_FOUND'
  // venue selection admitted nobody
  | 'MARGIN_NO_ELIGIBLE_VENUE'
  // pricing / sizing
  | 'MARGIN_ADJUST_HEALTH_FLOOR'
  | 'MARGIN_INVALID_LEVERAGE'
  | 'MARGIN_SWAP_INSUFFICIENT_LIQUIDITY'
  | 'MARGIN_SWAP_PRICE_IMPACT'
  | 'MARGIN_INSUFFICIENT_BORROW_LIQUIDITY'
  | 'MARGIN_WITHDRAW_OVER_MAX'
  | 'MARGIN_MARKET_NOT_SUPPORTED'
  | 'MARGIN_ADJUST_NO_POSITION'
  | 'MARGIN_WITHDRAW_FULL_EXIT'
  | 'MARGIN_ADJUST_FULL_EXIT'
  | 'MARGIN_ADJUST_NO_CHANGE'
  | 'MARGIN_INVALID_REQUEST'

// Why the selection policy rejected a venue, as MARGIN_NO_ELIGIBLE_VENUE reports
// it. SUB_MINIMUM_DEBT is deliberately its own reason: it is the only rejection a
// SMALLER position makes worse, so folding it into CAP_REACHED would have the
// client retry in the wrong direction.
export type MarginVenueRejectReason =
  | 'NOT_ALLOWLISTED'
  | 'READ_FAILED'
  | 'LEVERAGE_TOO_HIGH'
  | 'INSUFFICIENT_BORROW_LIQUIDITY'
  | 'CAP_REACHED'
  | 'SUB_MINIMUM_DEBT'

// The MARGIN_NO_ELIGIBLE_VENUE payload: the per-venue reasons plus the ceiling
// that powers a one-tap "Lower to N×" instead of an un-exitable loop.
export interface MarginNoEligibleVenueDetails {
  venues: Array<{ venue: string; reason: MarginVenueRejectReason }>
  // Max over the allowlist, decimal leverage.
  maxServiceableLeverage?: string
}

// ---- plan execution model — the FE-internal shape the /plan adapters map the shared PlanResponse
// (+ marginIntent) onto. Mirrors the prod PlanResponse/PlanStep JSON with margin-local stepType
// strings; step status COMPLETE vs plan status COMPLETED. ----
export type MarginPlanStepType =
  | 'APPROVAL_TXN'
  // The approve-to-zero half of a zero-then-set allowance, which USDT-style tokens require. Emitted by
  // the shared composer and passed through by the margin cross-chain route, so it reaches this client
  // on a bridge-funded open — modelled here rather than left to the pass-through cast, which would put
  // the raw enum string on screen as a step label.
  | 'RESET_APPROVAL_TXN'
  | 'APPROVAL_PERMIT'
  | 'MARGIN_PRE_SWAP'
  | 'MARGIN_OPEN'
  | 'MARGIN_CLOSE'
  | 'MARGIN_BRIDGE'
  | 'MARGIN_RECOVER'
  | 'MARGIN_ADJUST'
export type MarginPlanStepMethod = 'SEND_TX' | 'SIGN_MSG'
export type MarginPlanStepPayloadType = 'TX' | 'EIP_712'
export type MarginPlanStepStatus = 'NOT_READY' | 'AWAITING_ACTION' | 'IN_PROGRESS' | 'COMPLETE' | 'STEP_ERROR'
export type MarginPlanStatus = 'ACTIVE' | 'AWAITING_ACTION' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
// The frozen step-level failure taxonomy. A union rather than a bare string so a
// retired code fails at the callsite instead of silently never matching.
export type MarginPlanStepErrorCode =
  | 'TX_REVERTED'
  | 'PRICE_DRIFT'
  | 'SWAP_INSUFFICIENT_LIQUIDITY'
  | 'INSUFFICIENT_BORROW_LIQUIDITY'
  | 'GAS_ESTIMATION_REVERT'
  | 'BRIDGE_UNDERFILLED'
  | 'BRIDGE_EXPIRED'
  | 'SOURCE_STEP_UNRECOVERABLE'
  | 'PROOF_REVERIFY_FAILED'
  | 'PROOF_UNRECOVERABLE'
  | 'SUBID_RESERVATION_EXPIRED'
  | 'INSUFFICIENT_SOURCE_FUNDS'
  | 'DEADLINE_EXPIRED'
  | 'UNROUTABLE_PAYMENT_TOKEN'
  | 'TX_STUCK_TIMEOUT'
  | 'MAX_REMATERIALIZE_EXCEEDED'

export interface MarginTxStepPayload {
  to: string
  from?: string
  data: string
  // HEX-encoded wei ('0x0' when none) — BigInt(value) parses both hex and decimal.
  value?: string
  chainId: number
  gasLimit?: string
}
export interface MarginEip712StepPayload {
  domain: { name?: string; version?: string; chainId: number; verifyingContract: string }
  types: Record<string, Array<{ name: string; type: string }>>
  values: Record<string, unknown>
}
export interface MarginPlanStepProof {
  txHash?: string
  signature?: string
}
export interface MarginPlanStep {
  // 0-based, stable identity (never reordered).
  stepIndex: number
  stepType: MarginPlanStepType
  // The plan service's own type, before the relabel onto `stepType`: it is what tells a WRAP funding leg
  // from a routed swap, which `MARGIN_PRE_SWAP` covers both of.
  wireStepType?: TradingApi.PlanStepType
  method: MarginPlanStepMethod
  payloadType: MarginPlanStepPayloadType
  // Empty object while NOT_READY; materialized at activation/regeneration.
  payload: MarginTxStepPayload | MarginEip712StepPayload | Record<string, never>
  status: MarginPlanStepStatus
  proof?: MarginPlanStepProof
  // APPROVAL_TXN: the token being approved (payload.to must equal this — FE validates).
  tokenIn?: string
  tokenInAmount?: string
  tokenOut?: string
  tokenOutAmount?: string
  // MARGIN_PRE_SWAP: the UR output recipient — always the swapper wallet, intent-independent
  // (every intermediate hop lands there; only the position step itself lands at the account).
  // FE pins it.
  recipient?: string
  // MARGIN_BRIDGE chain dimension: source/dest chain of the step's tokens.
  tokenInChainId?: number
  tokenOutChainId?: number
  // MARGIN_BRIDGE only — estimated fill duration in seconds.
  estFillTimeSec?: number
  // MARGIN_BRIDGE only — unix seconds; FE wait budget.
  fillDeadline?: string
  // Populated on STEP_ERROR.
  errorCode?: MarginPlanStepErrorCode
  errorDetail?: string
}
export interface MarginPlanResponse {
  requestId: string
  planId: string
  swapper: string
  intent: MarginPlanIntent
  // Which action an ADJUST plan carries (add/withdraw margin, leverage up/down, or a composite); absent
  // for a wire intent this client does not know.
  action?: MarginActionKey
  marketKey: string
  // Lending venue — resolve the FE market by tokens + venue (never by cross-repo marketKey).
  // Optional: BE omits it when empty.
  venue?: MarginVenue
  // Mapped server-side from the plan's marginState — resolve the FE market by
  // addresses (findMarginMarketByTokens), never by cross-repo marketKey format.
  collateralToken: string
  debtToken: string
  // Server-allocated owner sub-account index.
  subId: string
  status: MarginPlanStatus
  currentStepIndex: number
  steps: MarginPlanStep[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// QUOTE-ONLY: every non-RECOVER create posts the /margin/quote response VERBATIM
// and restates nothing. Hand-restating a large intent manufactures the assembly
// mismatch the cross-check exists to catch.
//
// RECOVER is the one create-only mode — it prices nothing, so it carries no quote
// and no action key. Exactly one of `marginQuote` and `intent` is set.
export interface MarginCreatePlanRequest {
  chainId: number
  swapper: string
  marginQuote?: MarginQuoteResponse
  // ---- the frozen RECOVER leg ----
  intent?: 'RECOVER'
  fundingSource?: MarginFundingSource
  collateralToken?: string
  debtToken?: string
  subId?: string
  venue?: MarginVenue
  slippageTolerance?: number
  // RECOVER prices nothing, so it is the one create whose bounds name no group.
  bounds?: MarginBounds
}
export interface MarginGetPlanRequest {
  planId: string
}
// Production UpdatePlanRequest shape — an array of one.
export interface MarginUpdatePlanRequest {
  planId: string
  steps: Array<{ stepIndex: number; proof: MarginPlanStepProof }>
}

// ---- GET /margin/markets — one row per (exposureToken, counterToken, direction).
//      Display metadata (asset names, symbols) is NOT on the wire: the FE resolves
//      it from its own token lists, merged by token address. ----
export interface MarginMarketVenue {
  venue: MarginVenue
  adapter: string
  // Morpho's market id. Absent on the venues where the (adapter, pair) IS the market.
  venueMarketId?: string
  // Decimal string, server-authored from the venue's BORROW-side ltv. The FE's
  // slider ceiling is a max() over this, never client math off lltv.
  maxLeverage: string
  // Liquidation boundary, 18-dec fixed-point.
  lltv: string
  // Borrow APR, 18-dec. Absent when the venue's rate read failed.
  borrowRate?: string
  availableBorrowLiquidity: string
  // LP pool fee, bps (500 millionths → 5).
  feeBps: number
}
// The scalars beside venues[] are the HEADLINE venue's — read `headlineVenue`,
// never infer it by matching them back.
export interface MarginMarketRow {
  exposureToken: MarginTokenMetadata
  counterToken: MarginTokenMetadata
  // oraclePrice arrives pre-inverted for a SHORT row — never invert client-side.
  direction: MarginDirection
  // The venue the selection policy routes to at zero size.
  headlineVenue: MarginVenue
  maxLeverage: string
  lltv: string
  borrowRate?: string
  // Pair-level mark, 18-dec fixed-point.
  oraclePrice: string
  venues: MarginMarketVenue[]
}
export interface MarginMarketsRequest {
  chainId: number
  // Optional narrowing. No swapper (not user-scoped) and no pagination.
  exposureToken?: string
  counterToken?: string
  direction?: MarginDirection
  // The LENDING allowlist, as the opt-out sheet sends it back. A named subset
  // also re-decides headlineVenue over that subset.
  venues?: MarginVenue[]
}
export interface MarginMarketsResponse {
  requestId: string
  markets: MarginMarketRow[]
}

export const MarginPositionStatus = TradingApi.MarginPositionStatus
export type MarginPositionStatus = TradingApi.MarginPositionStatus

// The two status sets the server accepts. ACTIVE is read on chain and the finished statuses from the
// position store, so ACTIVE is only ever requested alone (mixing them is a 400).
export const MARGIN_ACTIVE_POSITION_STATUSES = [MarginPositionStatus.ACTIVE] as const
export const MARGIN_TERMINAL_POSITION_STATUSES = [
  MarginPositionStatus.COMPLETED,
  MarginPositionStatus.LIQUIDATED,
  MarginPositionStatus.PARTIALLY_LIQUIDATED,
] as const

export interface MarginPositionsRequest {
  swapper: string
  chainId: number
  // Selects the tab: the response carries only rows in these statuses, newest close first for the
  // terminal set. One of the two sets above, never an arbitrary MarginPositionStatus[], so a mixed
  // request the server would 400 does not compile.
  statuses: typeof MARGIN_ACTIVE_POSITION_STATUSES | typeof MARGIN_TERMINAL_POSITION_STATUSES
  // Opaque; echo nextCursor back verbatim, with the statuses that returned it.
  cursor?: string
  limit?: number
}

// The wire takes the list comma-separated.
type MarginPositionsWireRequest = Omit<MarginPositionsRequest, 'statuses'> & { statuses: string }

// One venue leg of a position. v1 positions are single-leg — the array is the
// shape a multi-venue position fills later without a wire break, so read legs[0]
// rather than expecting row-level venue identity.
export interface MarginPositionLeg {
  venue: MarginVenue
  // The (owner, subId) MarginAccount slot.
  subId: string
  // The CREATE2 MarginAccount clone.
  account: string
  // Live debt, raw debt-token units.
  debt: string
  // Borrow APR, 18-dec fixed-point.
  borrowRate?: string
}

// Every status carries these. A field outside the row's status group is ABSENT,
// never null — switch on `status` instead of null-probing.
interface MarginPositionCommon {
  // Opaque to clients: v1 spells it as the account's subId, which is what a
  // quote's positionId action key takes back.
  positionId: string
  // Entry/liq/oracle prices arrive pre-inverted for a SHORT — never invert them.
  direction: MarginDirection
  // What the bet is on; `size` is denominated here.
  exposureToken: MarginTokenMetadata
  // What the bet is priced in.
  counterToken: MarginTokenMetadata
  size: string
  // Oracle mark at open; "0" is the documented sentinel for an unattributable
  // basis, which clients render as nothing rather than $0.
  entryPrice: string
  // Unix seconds; "0" when unattributable.
  openedAt: string
  openTxHash?: string
  // The lifecycle GET /margin/positions/activity serves. Absent for a position the store has not indexed.
  activityId?: string
  legs: MarginPositionLeg[]
  // False when the pair has no single USD leg (stable/stable or volatile/volatile),
  // so `direction` is unclassifiable and every USD figure on the row is meaningless.
  // The flat-row wire does not carry it; only an explicit false suppresses the figures.
  isTradable?: boolean
}

export interface MarginActivePosition extends MarginPositionCommon {
  status: 'ACTIVE'
  // Live equity in COLLATERAL-token raw units: collateral minus the debt valued
  // at the oracle mark, floored at 0. The collateral leg is the exposure token
  // for a LONG and the stable counter token for a SHORT.
  equity: string
  // LIVE leverage = collateral / equity (both collateral units), NOT the
  // open-time figure (that is openedLeverage). Absent when equity is zero:
  // such a position has no finite leverage — render ∞.
  leverage?: string
  // Counter per 1 exposure, 18-dec fixed-point.
  oraclePrice: string
  liquidationPrice: string
  // Fractional price move to liquidation, 18-dec.
  buffer: string
  // Headline leg's borrow APR, 18-dec fixed-point.
  borrowRate?: string
  // Signed, collateral-token raw units: equity + collateral returned − depositedEquity.
  unrealizedPnl?: string
  // unrealizedPnl / depositedEquity, 18-dec fraction, signed.
  roe?: string
  // liveDebt − debtBaseline, floored at 0.
  accruedInterest?: string
  // 18-dec; the tier thresholds stay client-side.
  healthFactor: string
  // The manage sliders' pre-quote ceiling, in collateral raw units: the most a
  // withdraw can remove from CURRENT state and stay above the health floor.
  // A composite's real ceiling comes from its quote.
  maxWithdrawable: string
  notionalUsd?: string
  // Exposure leverage at open, decimal string.
  openedLeverage?: string
  collateralAtOpen?: string
  // Equity the owner has deposited, collateral-token raw units — the basis unrealizedPnl and roe are
  // measured against.
  depositedEquity?: string
  // True when this still-open position survived a partial liquidation.
  liquidated?: boolean
  lastLiquidationTxHash?: string
  // Pro-rata USD cost basis of the equity still in the position. Raw stable-leg
  // units, like notionalUsd. Unrealized PnL = current USD equity − this.
  costBasisUsd?: string
  // Deposits minus withdrawals, no pro-rata: total P&L = current USD equity − this.
  netContributedUsd?: string
  // Realized on mid-life withdrawals so far, signed, same units.
  realizedPnlUsd?: string
}

// PARTIALLY_LIQUIDATED is TERMINAL (the user closed an epoch that had already been
// partially liquidated); a LIVE position that survived one stays ACTIVE.
export interface MarginTerminalPosition extends MarginPositionCommon {
  status: 'COMPLETED' | 'LIQUIDATED' | 'PARTIALLY_LIQUIDATED'
  // Unix seconds, decimal string.
  closedAt: string
  // Absent for zero-debt closes (nothing was sold).
  exitPrice?: string
  // Signed, collateral-token raw units.
  realizedPnl?: string
  closeTxHash?: string
  lastLiquidationTxHash?: string
  // Realized at the exit, measured against ACTUAL PROCEEDS rather than
  // oracle-marked equity, so the close's own swap cost lands here.
  realizedPnlUsd?: string
}

export type MarginPosition = MarginActivePosition | MarginTerminalPosition

// A non-terminal OPEN/ADJUST-intent plan — the live in-flight surface, so the FE
// renders a Cancel strand card instead of silently hijacking the Open CTA.
export interface MarginPendingPlan {
  planId: string
  // Plan's stored createdAt, passed through verbatim (format not assumed FE-side).
  createdAt?: string
  marketKey: string
  venue?: MarginVenue
  direction?: MarginDirection
  collateralToken: string
  debtToken: string
  // The wallet-side rail this plan was created with.
  swapConfig?: MarginSwapConfig
  leverageTarget?: string
  // 0-based index of the first non-COMPLETE step.
  currentStep: number
  stepCount: number
  cancellable: boolean
}
export interface MarginPositionsResponse {
  requestId: string
  // Only rows in the requested statuses.
  positions: MarginPosition[]
  pendingPlans: MarginPendingPlan[]
  // Present iff more TERMINAL rows remain; ACTIVE never pages.
  nextCursor?: string
}

export type MarginActivityKind =
  | 'MARGIN_ACTIVITY_KIND_OPEN'
  | 'MARGIN_ACTIVITY_KIND_INCREASE'
  | 'MARGIN_ACTIVITY_KIND_DECREASE'
  | 'MARGIN_ACTIVITY_KIND_ADD_EQUITY'
  | 'MARGIN_ACTIVITY_KIND_WITHDRAW_EQUITY'
  // Partial or full; a full one also ends the lifecycle.
  | 'MARGIN_ACTIVITY_KIND_LIQUIDATION'
  | 'MARGIN_ACTIVITY_KIND_CLOSE'
  // A move the store could not attribute: no amounts, only the position it left.
  | 'MARGIN_ACTIVITY_KIND_ADJUSTMENT'

// One event of a position's lifecycle. Amounts are raw units; an amount the event has none of is absent.
export interface MarginPositionActivity {
  kind: MarginActivityKind
  txHash: string
  // Unix seconds, decimal string.
  timestamp: string
  collateralBought?: string
  debtDrawn?: string
  collateralSold?: string
  debtRepaid?: string
  equityDeposited?: string
  equityWithdrawn?: string
  // The event's fill, in the same terms as the row's entryPrice. Absent when the event has none.
  price?: string
  // The position as the event left it.
  collateralAfter: string
  debtAfter: string
  entryPrice?: string
}

// Built through the trading factory so web requests carry the session cookie + x-api-key,
// and resolve the same base URL (TRADING_API_URL_OVERRIDE aware) as every other trading call.
const MarginFetchClient = createTradingApiFetchClient({
  getBaseUrl: () => getUniswapServiceUrls(config).tradingApiUrl,
  getHeaders: () => ({
    ...BASE_UNISWAP_HEADERS,
    'x-api-key': config.tradingApiKey,
  }),
  getSessionService: () =>
    provideSessionService({
      getBaseUrl: () => getUniswapServiceUrls(config).apiBaseUrlV2,
    }),
  getSession: tryProvideSession,
  source: SessionGateSource.FetchUniswap,
})

// Test env (REACT_APP_TRADING_API_TEST_ENV=true) drops the /v1 prefix, matching TradingApiClient.
function getMarginApiPath(path: string): string {
  const prefix = config.tradingApiWebTestEnv === 'true' ? '' : '/v1'
  return `${prefix}/${path}`
}

// ---- shared /plan adapters ----
// The plan methods below delegate to the shared chained-plan client (TradingApiSessionClient),
// which posts to the entry gateway under session auth and auto-attaches x-chained-actions-enabled.
// These adapters bridge the OpenAPI-generated request/response types and the hand-written execution
// model above: the generated types model enums where the execution model uses string unions with
// identical runtime values, so those fields are reinterpreted at this boundary.

function toSharedCreatePlanBody(request: MarginCreatePlanRequest): TradingApi.CreatePlanRequest {
  if (request.intent === 'RECOVER') {
    // RECOVER is create-only and currently dormant: no live FE surface builds it, and the shared
    // CreatePlanRequest exposes no field to carry the RECOVER leg. Fail loud rather than POST a
    // quote-less body the BE would reject.
    throw new Error('RECOVER margin plans are not yet supported on the shared /plan endpoint')
  }
  // POST /plan decodes `marginQuote` as the proto trading.v1.MarginQuoteResponse with STRICT field
  // checking: it rejects the first unknown key, and the flat display view carries many (`action`,
  // `swapper`, `paymentSwap`, per-leg `bounds`, …). Echo ONLY the wire fields — `requestId` plus the
  // verbatim `execution` subtree the server stamped — which is all /plan consumes (it re-derives every
  // bound from `execution` and ignores `display`). The committed spec still names `quote`; the backend
  // accepts `marginQuote` xor `quote`, so cast the body rather than weaken the shared request type.
  const marginQuote = request.marginQuote
  return {
    routing: TradingApi.CreatePlanRequest.routing.CHAINED,
    marginQuote: marginQuote && { requestId: marginQuote.requestId, execution: marginQuote.execution },
  } as unknown as TradingApi.CreatePlanRequest
}

// The folded /plan routes a margin plan's funding legs through the shared chained
// composer, which types them as GENERIC routing steps (a CLASSIC swap, a WRAP/UNWRAP,
// a BRIDGE) rather than the margin-native funding types the executor's fund-safety
// validators and step handling are built around — the venue and approval steps already
// carry margin types. Re-label the funding legs to their margin twins. A CLASSIC/WRAP/
// UNWRAP funding leg is a routed swap/wrap at the canonical Universal Router paying the
// swapper — exactly what MARGIN_PRE_SWAP validates — so the mapping preserves every
// guard rather than loosening one. Anything already margin-typed passes through.
// Keyed on the GENERATED step type, not on `string`: these four are spec members, so a re-sync that
// renames or drops one becomes a build error here instead of a silently unmapped funding leg — which
// would reach the executor as an unrecognised type and fail closed.
const FUNDING_STEP_TYPE_TO_MARGIN: Partial<Record<TradingApi.PlanStepType, MarginPlanStepType>> = {
  CLASSIC: 'MARGIN_PRE_SWAP',
  WRAP: 'MARGIN_PRE_SWAP',
  UNWRAP: 'MARGIN_PRE_SWAP',
  BRIDGE: 'MARGIN_BRIDGE',
}

// A plan's `marginIntent.intent` is the proto enum member with its prefix stripped (`ADD_EQUITY`, never
// `MARGIN_INTENT_ADD_EQUITY`) — the plan service writes `MarginIntent[intent]`, unlike the quote, which
// carries the full name. Derived from the generated enum so a new member is a compile error here.
type MarginWirePlanIntent = `${TradingApi.MarginIntent}` extends infer Name
  ? Name extends `MARGIN_INTENT_${infer Short}`
    ? Short
    : never
  : never

interface MarginPlanIntentResolution {
  intent: MarginPlanIntent
  action: MarginActionKey
}

// Every leverage/equity variant is an ADJUST to this client; `action` keeps which one it was, since the
// submit modal names the plan by it.
const WIRE_PLAN_INTENTS: Readonly<Record<MarginWirePlanIntent, MarginPlanIntentResolution>> = {
  OPEN: { intent: 'OPEN', action: 'open' },
  CLOSE: { intent: 'CLOSE', action: 'close' },
  INCREASE_LEVERAGE: { intent: 'ADJUST', action: 'increaseLeverage' },
  DECREASE_LEVERAGE: { intent: 'ADJUST', action: 'decreaseLeverage' },
  ADD_EQUITY: { intent: 'ADJUST', action: 'addEquity' },
  WITHDRAW_EQUITY: { intent: 'ADJUST', action: 'withdrawEquity' },
  ADD_EQUITY_AND_INCREASE_LEVERAGE: { intent: 'ADJUST', action: 'addEquityAndIncreaseLeverage' },
  ADD_EQUITY_AND_DECREASE_LEVERAGE: { intent: 'ADJUST', action: 'addEquityAndDecreaseLeverage' },
  WITHDRAW_EQUITY_AND_INCREASE_LEVERAGE: { intent: 'ADJUST', action: 'withdrawEquityAndIncreaseLeverage' },
  WITHDRAW_EQUITY_AND_DECREASE_LEVERAGE: { intent: 'ADJUST', action: 'withdrawEquityAndDecreaseLeverage' },
}

function isWirePlanIntent(value: string | undefined): value is MarginWirePlanIntent {
  return value !== undefined && Object.keys(WIRE_PLAN_INTENTS).includes(value)
}

function resolveWirePlanIntent(wireIntent: string | undefined): { intent: MarginPlanIntent; action?: MarginActionKey } {
  if (isWirePlanIntent(wireIntent)) {
    return WIRE_PLAN_INTENTS[wireIntent]
  }
  // An unknown wire intent passes through verbatim rather than being guessed into a known one.
  return { intent: wireIntent as unknown as MarginPlanIntent }
}

// The BE emits a single MARGIN_EXECUTE for every margin action and names the action only on
// `marginIntent.intent`; the executor, activity extractor, and review modal all branch on the
// action-specific step types this client has always exposed. Resolve the execute step to its intent's
// step type here, at the boundary, so one normalisation keeps every downstream switch intact.
const MARGIN_INTENT_TO_EXECUTE_STEP_TYPE: Readonly<Record<MarginPlanIntent, MarginPlanStepType>> = {
  OPEN: 'MARGIN_OPEN',
  CLOSE: 'MARGIN_CLOSE',
  ADJUST: 'MARGIN_ADJUST',
  RECOVER: 'MARGIN_RECOVER',
}

function toMarginStepType(
  wireStepType: TradingApi.PlanStepType | undefined,
  intent: MarginPlanIntent,
): MarginPlanStepType {
  // Optional on the GENERATED model only — the plan service's own model declares `stepType` required on
  // every step, so an absent one is a contract violation rather than a state worth modelling. Asserted
  // here at the boundary instead of pushed onto every consumer as an optional they could only ignore;
  // passed through verbatim, because inventing a type would route an unidentifiable step into a handler.
  if (wireStepType === undefined) {
    return wireStepType as unknown as MarginPlanStepType
  }
  // The BE collapses every margin action onto one MARGIN_EXECUTE step; resolve it back to the action's
  // own step type via the plan intent so the executor and activity extractor dispatch it correctly.
  if (wireStepType === TradingApi.PlanStepType.MARGIN_EXECUTE) {
    return MARGIN_INTENT_TO_EXECUTE_STEP_TYPE[intent]
  }
  return FUNDING_STEP_TYPE_TO_MARGIN[wireStepType] ?? (wireStepType as unknown as MarginPlanStepType)
}

function toMarginPlanStep(step: TradingApi.PlanStep, intent: MarginPlanIntent): MarginPlanStep {
  return {
    stepIndex: step.stepIndex,
    stepType: toMarginStepType(step.stepType, intent),
    wireStepType: step.stepType,
    method: step.method as unknown as MarginPlanStepMethod,
    payloadType: step.payloadType as unknown as MarginPlanStepPayloadType,
    payload: step.payload as unknown as MarginPlanStep['payload'],
    status: step.status as unknown as MarginPlanStepStatus,
    proof: step.proof,
    tokenIn: step.tokenIn,
    tokenInAmount: step.tokenInAmount,
    tokenOut: step.tokenOut,
    tokenOutAmount: step.tokenOutAmount,
    recipient: step.recipient,
    tokenInChainId: step.tokenInChainId,
    tokenOutChainId: step.tokenOutChainId,
    estFillTimeSec: step.estFillTimeSec,
    fillDeadline: step.fillDeadline,
    errorCode: step.errorCode as MarginPlanStepErrorCode | undefined,
    errorDetail: step.errorDetail,
  }
}

function toMarginPlanResponse(plan: TradingApi.PlanResponse): MarginPlanResponse {
  const marginIntent = plan.marginIntent
  if (!marginIntent) {
    // The FE only ever hands margin plans to this adapter; a missing marginIntent means the shared
    // endpoint did not treat this plan as margin — surface it rather than silently degrade.
    throw new Error('Margin plan response is missing marginIntent')
  }
  const { intent, action } = resolveWirePlanIntent(marginIntent.intent)
  return {
    requestId: plan.requestId,
    planId: plan.planId,
    swapper: plan.swapper,
    intent,
    action,
    marketKey: marginIntent.marketKey ?? '',
    venue: marginIntent.venue as MarginVenue | undefined,
    collateralToken: marginIntent.collateralToken ?? '',
    debtToken: marginIntent.debtToken ?? '',
    subId: marginIntent.subId ?? '',
    status: plan.status as unknown as MarginPlanStatus,
    currentStepIndex: plan.currentStepIndex,
    steps: plan.steps.map((step: TradingApi.PlanStep) => toMarginPlanStep(step, intent)),
    createdAt: plan.createdAt ?? '',
    updatedAt: plan.updatedAt ?? '',
    completedAt: plan.completedAt,
  }
}

// The wire dispatcher returns the generated `execution` envelope; the exported client adapts it to the
// FE view (see toMarginQuoteView) so consumers keep reading the flat/bounds shape — SWAP-3352.
const fetchMarginQuoteWire = createFetcher<MarginQuoteRequest, TradingApi.MarginQuoteResponse>({
  client: MarginFetchClient,
  url: getMarginApiPath('margin/quote'),
  method: 'post',
})

const fetchMarginPositionsWire = createFetcher<MarginPositionsWireRequest, MarginPositionsWireResponse>({
  client: MarginFetchClient,
  url: getMarginApiPath('margin/positions'),
  method: 'get',
})

interface MarginPositionActivityWireRequest {
  activityId: string
  // Opaque; echo nextCursor back verbatim with the same activityId.
  cursor?: string
}

const fetchMarginPositionActivityWire = createFetcher<
  MarginPositionActivityWireRequest,
  MarginPositionActivityWireResponse
>({
  client: MarginFetchClient,
  url: getMarginApiPath('margin/positions/activity'),
  method: 'get',
})

// The endpoint serves at most 50 events a page, oldest first, so the newest events are on the last page.
// A cursor the server keeps handing back would otherwise loop forever; past this many pages the newest
// events are dropped rather than the request never settling.
const MAX_MARGIN_POSITION_ACTIVITY_PAGES = 10

// Every event of the lifecycle, oldest first.
async function fetchMarginPositionActivity({ activityId }: { activityId: string }): Promise<MarginPositionActivity[]> {
  const pages: MarginPositionActivityWireResponse[] = []
  let cursor: string | undefined
  do {
    const page = await fetchMarginPositionActivityWire({ activityId, ...(cursor !== undefined && { cursor }) })
    pages.push(page)
    cursor = page.nextCursor
  } while (cursor !== undefined && pages.length < MAX_MARGIN_POSITION_ACTIVITY_PAGES)
  return toMarginPositionActivityView(pages)
}

export const MarginApiClient = {
  // One dispatcher for all ten action keys — /margin/close_quote and
  // /margin/adjust_quote are retired routes.
  fetchMarginQuote: async (
    params: MarginQuoteRequest,
    { tokenDecimals, customHeaders }: { tokenDecimals: MarginTokenDecimals; customHeaders?: HeadersInit },
  ): Promise<MarginQuoteResponse> =>
    toMarginQuoteView(await fetchMarginQuoteWire(params, customHeaders), tokenDecimals),
  fetchMarginPositions: async ({ statuses, ...params }: MarginPositionsRequest): Promise<MarginPositionsResponse> =>
    toMarginPositionsView(await fetchMarginPositionsWire({ ...params, statuses: statuses.join(',') })),
  fetchMarginPositionActivity,
  fetchMarginMarkets: createFetcher<MarginMarketsRequest, MarginMarketsResponse>({
    client: MarginFetchClient,
    url: getMarginApiPath('margin/markets'),
    method: 'get',
  }),
  // The plan methods delegate to the shared chained-plan endpoint via the adapters above,
  // keeping their names + signatures so the executor call sites are untouched.
  createMarginPlan: async (request: MarginCreatePlanRequest): Promise<MarginPlanResponse> => {
    return toMarginPlanResponse(await TradingApiSessionClient.createNewPlan(toSharedCreatePlanBody(request)))
  },
  getMarginPlan: async ({ planId }: MarginGetPlanRequest): Promise<MarginPlanResponse> => {
    return toMarginPlanResponse(await TradingApiSessionClient.getExistingPlan({ planId }))
  },
  updateMarginPlan: async ({ planId, steps }: MarginUpdatePlanRequest): Promise<MarginPlanResponse> => {
    return toMarginPlanResponse(await TradingApiSessionClient.updateExistingPlan({ planId, steps }))
  },
}
