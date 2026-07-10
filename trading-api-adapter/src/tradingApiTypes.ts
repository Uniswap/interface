/**
 * Self-contained mirror of the *subset* of the Uniswap Trading API schema that the
 * HookSwap interface actually calls. Source of truth (do not diverge without checking):
 *   HookSwap/packages/api/src/clients/trading/api.json                (OpenAPI 1.0.0)
 *   HookSwap/packages/api/src/clients/trading/__generated__/models/*  (generated TS)
 *   HookSwap/packages/api/src/clients/trading/createTradingApiClient.ts (paths + verbs)
 *
 * We mirror (rather than import) so this service has no dependency on the interface build.
 * Kept intentionally minimal: only /quote (POST), /swap (POST), and /swappable_tokens (GET)
 * request/response shapes are needed for the interface's swap flow. /check_approval etc. are
 * documented in DEPLOY.md as further endpoints to add.
 */

// ---- Primitives -----------------------------------------------------------

/** ChainId is a plain number in the Trading API (e.g. 4326, 4663, 57073, 999, 4217, 196, 11155111). */
export type ChainId = number

export enum TradeType {
  EXACT_INPUT = 'EXACT_INPUT',
  EXACT_OUTPUT = 'EXACT_OUTPUT',
}

export enum Routing {
  CLASSIC = 'CLASSIC',
  WRAP = 'WRAP',
  UNWRAP = 'UNWRAP',
}

export enum ProtocolItems {
  V2 = 'V2',
  V3 = 'V3',
  V4 = 'V4',
}

export enum RoutingPreference {
  BEST_PRICE = 'BEST_PRICE',
  FASTEST = 'FASTEST',
}

// ---- Quote request (POST /v1/quote body) ----------------------------------
// Mirrors QuoteRequest.ts. Only fields the adapter reads are strongly typed; the rest are optional passthrough.

export interface QuoteRequest {
  type: TradeType
  /** raw base-unit amount (string), e.g. "1000000000000000000" */
  amount: string
  tokenInChainId: ChainId
  tokenOutChainId: ChainId
  /** token address (0x...) or native sentinel */
  tokenIn: string
  tokenOut: string
  /** the wallet doing the swap; used for calldata generation */
  swapper: string
  slippageTolerance?: number
  autoSlippage?: string
  routingPreference?: RoutingPreference
  protocols?: ProtocolItems[]
  recipient?: string
  deadline?: number
  // ...other Trading API fields are accepted but ignored by this adapter.
  [k: string]: unknown
}

// ---- Quote response (200 from /v1/quote) ----------------------------------
// Mirrors QuoteResponse.ts wrapping a ClassicQuote (routing = CLASSIC).

export interface TokenInRoute {
  address?: string
  chainId?: ChainId
  symbol?: string
  /** NOTE: Trading API types this as a *string* (see TokenInRoute.ts). */
  decimals?: string
  buyFeeBps?: string
  sellFeeBps?: string
}

export interface V3PoolInRoute {
  type?: string // 'v3-pool'
  address?: string
  tokenIn?: TokenInRoute
  tokenOut?: TokenInRoute
  sqrtRatioX96?: string
  liquidity?: string
  tickCurrent?: string
  fee?: string
  amountIn?: string
  amountOut?: string
}

export interface V2Reserve {
  token?: TokenInRoute
  quotient?: string
}

export interface V2PoolInRoute {
  type?: string // 'v2-pool'
  address?: string
  tokenIn?: TokenInRoute
  tokenOut?: TokenInRoute
  reserve0?: V2Reserve
  reserve1?: V2Reserve
  amountIn?: string
  amountOut?: string
}

export type PoolInRoute = V2PoolInRoute | V3PoolInRoute

export interface QuoteInput {
  amount?: string
  token?: string
  maximumAmount?: string
}

export interface QuoteOutput {
  amount?: string
  token?: string
  recipient?: string
  minimumAmount?: string
}

/** Mirrors ClassicQuote.ts (only the fields the interface reads for a classic swap). */
export interface ClassicQuote {
  input?: QuoteInput
  output?: QuoteOutput
  swapper?: string
  chainId?: ChainId
  slippage?: number
  tradeType?: TradeType
  gasFee?: string
  gasFeeUSD?: string
  route?: PoolInRoute[][]
  routeString?: string
  quoteId?: string
  gasUseEstimate?: string
  blockNumber?: string
  gasPrice?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  priceImpact?: number
  portionBips?: number
  portionAmount?: string
}

export interface QuoteResponse {
  requestId: string
  quote: ClassicQuote
  routing: Routing
  permitData: null | Record<string, unknown>
}

// ---- Swap request/response (POST /v1/swap) ---------------------------------
// Mirrors CreateSwapRequest.ts / CreateSwapResponse.ts. `quote` is the exact ClassicQuote
// object /v1/quote just returned, echoed back by the client. Only fields the adapter reads
// (from `quote`) or returns (in the response) are strongly typed; the rest are optional
// passthrough, matching the minimal-mirror style of QuoteRequest/QuoteResponse above.

export interface CreateSwapRequest {
  quote: ClassicQuote
  signature?: string
  /** @deprecated kept for schema parity with the real Trading API */
  includeGasInfo?: boolean
  refreshGasPrice?: boolean
  simulateTransaction?: boolean
  permitData?: Record<string, unknown> | null
  safetyMode?: string
  deadline?: number
  urgency?: string
  gasStrategies?: unknown[]
  // ...other Trading API fields are accepted but ignored by this adapter.
  [k: string]: unknown
}

/** A real, sendable EVM transaction (mirrors the Trading API's TransactionRequest). */
export interface TransactionRequest {
  to: string
  from: string
  data: string
  value: string
  chainId: ChainId
  gasLimit?: string
  gasPrice?: string
}

export interface CreateSwapResponse {
  requestId: string
  swap: TransactionRequest
  /** OPTIONAL — only present when the adapter has a real number; never fabricated. */
  gasFee?: Record<string, unknown>
  /** OPTIONAL — only present when the adapter has real numbers; never fabricated. */
  gasEstimates?: Record<string, unknown>[]
}

// ---- Swappable tokens (GET /v1/swappable_tokens) --------------------------
// Query: ?tokenIn=<addr>&tokenInChainId=<id>  (both required, per api.json)

export interface SwappableToken {
  address: string
  chainId: ChainId
  name: string
  symbol: string
  decimals: number
  project?: Record<string, unknown>
  isSpam?: boolean
}

export interface GetSwappableTokensResponse {
  requestId: string
  tokens: SwappableToken[]
}

// ---- Errors (Trading-API-shaped) ------------------------------------------
// api.json responses use { errorCode, detail } style bodies. We reproduce that shape so
// the interface's error handling (and its 404 warn path in createTradingApiClient) behaves.

export interface TradingApiError {
  errorCode: string
  detail: string
  id?: string
}
