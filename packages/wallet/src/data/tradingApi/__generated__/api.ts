/* eslint-disable max-lines */
/**
 *
 * @export
 * @interface ApprovalRequest
 */
export interface ApprovalRequest {
  /**
   *
   * @type {string}
   * @memberof ApprovalRequest
   */
  walletAddress: string
  /**
   *
   * @type {string}
   * @memberof ApprovalRequest
   */
  token: string
  /**
   *
   * @type {string}
   * @memberof ApprovalRequest
   */
  amount: string
  /**
   *
   * @type {ChainId}
   * @memberof ApprovalRequest
   */
  chainId: ChainId
  /**
   *
   * @type {boolean}
   * @memberof ApprovalRequest
   */
  includeGasInfo?: boolean
}

/**
 *
 * @export
 * @interface ApprovalResponse
 */
export interface ApprovalResponse {
  /**
   *
   * @type {string}
   * @memberof ApprovalResponse
   */
  requestId: string
  /**
   *
   * @type {TransactionRequest}
   * @memberof ApprovalResponse
   */
  approval: TransactionRequest
  /**
   *
   * @type {string}
   * @memberof ApprovalResponse
   */
  gasFee?: string
}
/**
 *
 * @export
 * @enum {string}
 */

export const Chain = {
  Ethereum: 'ETHEREUM',
} as const

export type Chain = (typeof Chain)[keyof typeof Chain]

/**
 *
 * @export
 * @enum {string}
 */

export const ChainId = {
  NUMBER_1: 1,
  NUMBER_10: 10,
  NUMBER_56: 56,
  NUMBER_137: 137,
  NUMBER_8453: 8453,
  NUMBER_42161: 42161,
} as const

export type ChainId = (typeof ChainId)[keyof typeof ChainId]

/**
 *
 * @export
 * @interface ClassicInput
 */
export interface ClassicInput {
  /**
   *
   * @type {string}
   * @memberof ClassicInput
   */
  token?: string
  /**
   *
   * @type {string}
   * @memberof ClassicInput
   */
  amount?: string
}
/**
 *
 * @export
 * @interface ClassicOutput
 */
export interface ClassicOutput {
  /**
   *
   * @type {string}
   * @memberof ClassicOutput
   */
  token?: string
  /**
   *
   * @type {string}
   * @memberof ClassicOutput
   */
  amount?: string
  /**
   *
   * @type {string}
   * @memberof ClassicOutput
   */
  recipient?: string
}
/**
 *
 * @export
 * @interface ClassicQuote
 */
export interface ClassicQuote {
  /**
   *
   * @type {ClassicInput}
   * @memberof ClassicQuote
   */
  input?: ClassicInput
  /**
   *
   * @type {ClassicOutput}
   * @memberof ClassicQuote
   */
  output?: ClassicOutput
  /**
   *
   * @type {string}
   * @memberof ClassicQuote
   */
  swapper?: string
  /**
   *
   * @type {ChainId}
   * @memberof ClassicQuote
   */
  chainId?: ChainId
  /**
   *
   * @type {number}
   * @memberof ClassicQuote
   */
  slippage?: number
  /**
   *
   * @type {TradeType}
   * @memberof ClassicQuote
   */
  tradeType?: TradeType
  /**
   *
   * @type {string}
   * @memberof ClassicQuote
   */
  gasFee?: string
  /**
   *
   * @type {Array<ClassicQuoteRouteInner>}
   * @memberof ClassicQuote
   */
  route?: Array<ClassicQuoteRouteInner>
  /**
   *
   * @type {number}
   * @memberof ClassicQuote
   */
  portionBips?: number
  /**
   *
   * @type {string}
   * @memberof ClassicQuote
   */
  portionAmount?: string
  /**
   *
   * @type {string}
   * @memberof ClassicQuote
   */
  portionRecipient?: string
}

/**
 * @type ClassicQuoteRouteInner
 * @export
 */
export type ClassicQuoteRouteInner = (V2PoolInRoute | V3PoolInRoute)[]

/**
 *
 * @export
 * @interface Permit
 */
export interface Permit {
  /**
   *
   * @type {object}
   * @memberof Permit
   */
  domain?: object
  /**
   *
   * @type {object}
   * @memberof Permit
   */
  values?: object
  /**
   *
   * @type {object}
   * @memberof Permit
   */
  types?: object
}
/**
 * @type Quote
 * @export
 */
export type Quote = ClassicQuote

/**
 *
 * @export
 * @interface QuoteRequest
 */
export interface QuoteRequest {
  /**
   *
   * @type {TradeType}
   * @memberof QuoteRequest
   */
  type: TradeType
  /**
   *
   * @type {string}
   * @memberof QuoteRequest
   */
  amount: string
  /**
   *
   * @type {ChainId}
   * @memberof QuoteRequest
   */
  tokenInChainId: ChainId
  /**
   *
   * @type {ChainId}
   * @memberof QuoteRequest
   */
  tokenOutChainId: ChainId
  /**
   *
   * @type {string}
   * @memberof QuoteRequest
   */
  tokenIn: string
  /**
   *
   * @type {string}
   * @memberof QuoteRequest
   */
  tokenOut: string
  /**
   *
   * @type {string}
   * @memberof QuoteRequest
   */
  swapper: string
  /**
   *
   * @type {number}
   * @memberof QuoteRequest
   */
  slippageTolerance?: number
  /**
   *
   * @type {RoutingPreference}
   * @memberof QuoteRequest
   */
  routingPreference?: RoutingPreference
}

/**
 * The parameters **signature** and **permitData** should only be included if *permitData* was returned from **_/quote**.
 * @export
 * @interface CreateSwapRequest
 */
export interface CreateSwapRequest {
  /**
   *
   * @type {ClassicQuote}
   * @memberof CreateSwapRequest
   */
  quote: ClassicQuote
  /**
   * The signed permit.
   * @type {string}
   * @memberof CreateSwapRequest
   */
  signature?: string
  /**
   *
   * @type {boolean}
   * @memberof CreateSwapRequest
   */
  includeGasInfo?: boolean
  /**
   *
   * @type {Permit}
   * @memberof CreateSwapRequest
   */
  permitData?: Permit
}
/**
 *
 * @export
 * @interface CreateSwapResponse
 */
export interface CreateSwapResponse {
  /**
   *
   * @type {string}
   * @memberof CreateSwapResponse
   */
  requestId?: string
  /**
   *
   * @type {TransactionRequest}
   * @memberof CreateSwapResponse
   */
  swap?: TransactionRequest
  /**
   *
   * @type {string}
   * @memberof CreateSwapResponse
   */
  gasFee?: string
}

/**
 *
 * @export
 * @interface QuoteResponse
 */
export interface QuoteResponse {
  /**
   *
   * @type {string}
   * @memberof QuoteResponse
   */
  requestId?: string
  /**
   *
   * @type {Quote}
   * @memberof QuoteResponse
   */
  quote: Quote
  /**
   *
   * @type {Routing}
   * @memberof QuoteResponse
   */
  routing: Routing
  /**
   *
   * @type {Permit}
   * @memberof QuoteResponse
   */
  permitData?: Permit
}

/**
 *
 * @export
 * @enum {string}
 */

export const Routing = {
  DutchLimit: 'DUTCH_LIMIT',
  Classic: 'CLASSIC',
} as const

export type Routing = (typeof Routing)[keyof typeof Routing]

/**
 *
 * @export
 * @enum {string}
 */

export const RoutingPreference = {
  Classic: 'CLASSIC',
  Uniswapx: 'UNISWAPX',
  BestPrice: 'BEST_PRICE',
} as const

export type RoutingPreference = (typeof RoutingPreference)[keyof typeof RoutingPreference]

/**
 *
 * @export
 * @interface TokenInRoute
 */
export interface TokenInRoute {
  /**
   *
   * @type {string}
   * @memberof TokenInRoute
   */
  address?: string
  /**
   *
   * @type {ChainId}
   * @memberof TokenInRoute
   */
  chainId?: ChainId
  /**
   *
   * @type {string}
   * @memberof TokenInRoute
   */
  symbol?: string
  /**
   *
   * @type {string}
   * @memberof TokenInRoute
   */
  decimals?: string
}

/**
 *
 * @export
 * @enum {string}
 */

export const TradeType = {
  Input: 'EXACT_INPUT',
  Output: 'EXACT_OUTPUT',
} as const

export type TradeType = (typeof TradeType)[keyof typeof TradeType]

/**
 *
 * @export
 * @interface TransactionRequest
 */
export interface TransactionRequest {
  /**
   *
   * @type {string}
   * @memberof TransactionRequest
   */
  to: string
  /**
   *
   * @type {string}
   * @memberof TransactionRequest
   */
  from: string
  /**
   *
   * @type {string}
   * @memberof TransactionRequest
   */
  data: string
  /**
   *
   * @type {string}
   * @memberof TransactionRequest
   */
  value: string
  /**
   *
   * @type {string}
   * @memberof TransactionRequest
   */
  gasLimit?: string
  /**
   *
   * @type {number}
   * @memberof TransactionRequest
   */
  chainId?: number
  /**
   *
   * @type {string}
   * @memberof TransactionRequest
   */
  maxFeePerGas?: string
  /**
   *
   * @type {string}
   * @memberof TransactionRequest
   */
  maxPriorityFeePerGas?: string
  /**
   *
   * @type {string}
   * @memberof TransactionRequest
   */
  gasPrice?: string
}
/**
 *
 * @export
 * @interface V2PoolInRoute
 */
export interface V2PoolInRoute {
  /**
   *
   * @type {string}
   * @memberof V2PoolInRoute
   */
  type?: string
  /**
   *
   * @type {string}
   * @memberof V2PoolInRoute
   */
  address?: string
  /**
   *
   * @type {TokenInRoute}
   * @memberof V2PoolInRoute
   */
  tokenIn?: TokenInRoute
  /**
   *
   * @type {TokenInRoute}
   * @memberof V2PoolInRoute
   */
  tokenOut?: TokenInRoute
  /**
   *
   * @type {V2Reserve}
   * @memberof V2PoolInRoute
   */
  reserve0?: V2Reserve
  /**
   *
   * @type {V2Reserve}
   * @memberof V2PoolInRoute
   */
  reserve1?: V2Reserve
  /**
   *
   * @type {string}
   * @memberof V2PoolInRoute
   */
  amountIn?: string
  /**
   *
   * @type {string}
   * @memberof V2PoolInRoute
   */
  amountOut?: string
}
/**
 *
 * @export
 * @interface V2Reserve
 */
export interface V2Reserve {
  /**
   *
   * @type {TokenInRoute}
   * @memberof V2Reserve
   */
  token?: TokenInRoute
  /**
   *
   * @type {string}
   * @memberof V2Reserve
   */
  quotient?: string
}
/**
 *
 * @export
 * @interface V3PoolInRoute
 */
export interface V3PoolInRoute {
  /**
   *
   * @type {string}
   * @memberof V3PoolInRoute
   */
  type?: string
  /**
   *
   * @type {string}
   * @memberof V3PoolInRoute
   */
  address?: string
  /**
   *
   * @type {TokenInRoute}
   * @memberof V3PoolInRoute
   */
  tokenIn?: TokenInRoute
  /**
   *
   * @type {TokenInRoute}
   * @memberof V3PoolInRoute
   */
  tokenOut?: TokenInRoute
  /**
   *
   * @type {string}
   * @memberof V3PoolInRoute
   */
  sqrtRatioX96?: string
  /**
   *
   * @type {string}
   * @memberof V3PoolInRoute
   */
  liquidity?: string
  /**
   *
   * @type {string}
   * @memberof V3PoolInRoute
   */
  tickCurrent?: string
  /**
   *
   * @type {string}
   * @memberof V3PoolInRoute
   */
  fee?: string
  /**
   *
   * @type {string}
   * @memberof V3PoolInRoute
   */
  amountIn?: string
  /**
   *
   * @type {string}
   * @memberof V3PoolInRoute
   */
  amountOut?: string
}
