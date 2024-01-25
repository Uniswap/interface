/* tslint:disable */
/* eslint-disable */
/**
 * Token Trading
 * Uniswap trading APIs for fungible tokens.
 *
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
    'walletAddress': string;
    /**
     * 
     * @type {string}
     * @memberof ApprovalRequest
     */
    'token': string;
    /**
     * 
     * @type {string}
     * @memberof ApprovalRequest
     */
    'amount': string;
    /**
     * 
     * @type {ChainId}
     * @memberof ApprovalRequest
     */
    'chainId': ChainId;
    /**
     * 
     * @type {boolean}
     * @memberof ApprovalRequest
     */
    'includeGasInfo'?: boolean;
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
    'requestId': string;
    /**
     * 
     * @type {TransactionRequest}
     * @memberof ApprovalResponse
     */
    'approval': TransactionRequest;
    /**
     * 
     * @type {string}
     * @memberof ApprovalResponse
     */
    'gasFee'?: string;
}
/**
 * 
 * @export
 * @enum {string}
 */

export const Chain = {
    Ethereum: 'ETHEREUM'
} as const;

export type Chain = typeof Chain[keyof typeof Chain];


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
    NUMBER_42161: 42161
} as const;

export type ChainId = typeof ChainId[keyof typeof ChainId];


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
    'token'?: string;
    /**
     * 
     * @type {string}
     * @memberof ClassicInput
     */
    'amount'?: string;
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
    'token'?: string;
    /**
     * 
     * @type {string}
     * @memberof ClassicOutput
     */
    'amount'?: string;
    /**
     * 
     * @type {string}
     * @memberof ClassicOutput
     */
    'recipient'?: string;
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
    'input'?: ClassicInput;
    /**
     * 
     * @type {ClassicOutput}
     * @memberof ClassicQuote
     */
    'output'?: ClassicOutput;
    /**
     * 
     * @type {string}
     * @memberof ClassicQuote
     */
    'swapper'?: string;
    /**
     * 
     * @type {ChainId}
     * @memberof ClassicQuote
     */
    'chainId'?: ChainId;
    /**
     * 
     * @type {number}
     * @memberof ClassicQuote
     */
    'slippage'?: number;
    /**
     * 
     * @type {TradeType}
     * @memberof ClassicQuote
     */
    'tradeType'?: TradeType;
    /**
     * The gas fee in terms of wei.
     * @type {string}
     * @memberof ClassicQuote
     */
    'gasFee'?: string;
    /**
     * The gas fee in terms of USD.
     * @type {string}
     * @memberof ClassicQuote
     */
    'gasFeeUSD'?: string;
    /**
     * The gas fee in terms of the quoted currency.
     * @type {string}
     * @memberof ClassicQuote
     */
    'gasFeeQuote'?: string;
    /**
     * 
     * @type {Array<Array<ClassicQuoteRouteInnerInner>>}
     * @memberof ClassicQuote
     */
    'route'?: Array<Array<ClassicQuoteRouteInnerInner>>;
    /**
     * The portion of the swap that will be taken as a fee. The fee will be taken from the output token.
     * @type {number}
     * @memberof ClassicQuote
     */
    'portionBips'?: number;
    /**
     * The amount of the swap that will be taken as a fee. The fee will be taken from the output token.
     * @type {string}
     * @memberof ClassicQuote
     */
    'portionAmount'?: string;
    /**
     * 
     * @type {string}
     * @memberof ClassicQuote
     */
    'portionRecipient'?: string;
    /**
     * The route in string format.
     * @type {string}
     * @memberof ClassicQuote
     */
    'routeString'?: string;
    /**
     * The quote id. Used for analytics purposes.
     * @type {string}
     * @memberof ClassicQuote
     */
    'quoteId'?: string;
    /**
     * The estimated gas use.
     * @type {string}
     * @memberof ClassicQuote
     */
    'gasUseEstimate'?: string;
    /**
     * The current block number.
     * @type {number}
     * @memberof ClassicQuote
     */
    'blockNumber'?: number;
}


/**
 * @type ClassicQuoteRouteInnerInner
 * @export
 */
export type ClassicQuoteRouteInnerInner = V2PoolInRoute | V3PoolInRoute;

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
    'quote': ClassicQuote;
    /**
     * The signed permit.
     * @type {string}
     * @memberof CreateSwapRequest
     */
    'signature'?: string;
    /**
     * 
     * @type {boolean}
     * @memberof CreateSwapRequest
     */
    'includeGasInfo'?: boolean;
    /**
     * 
     * @type {Permit}
     * @memberof CreateSwapRequest
     */
    'permitData'?: Permit;
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
    'requestId'?: string;
    /**
     * 
     * @type {TransactionRequest}
     * @memberof CreateSwapResponse
     */
    'swap'?: TransactionRequest;
    /**
     * 
     * @type {string}
     * @memberof CreateSwapResponse
     */
    'gasFee'?: string;
}
/**
 * 
 * @export
 * @interface DutchInput
 */
export interface DutchInput {
    /**
     * 
     * @type {string}
     * @memberof DutchInput
     */
    'startAmount': string;
    /**
     * 
     * @type {string}
     * @memberof DutchInput
     */
    'endAmount': string;
    /**
     * 
     * @type {string}
     * @memberof DutchInput
     */
    'token'?: string;
}
/**
 * 
 * @export
 * @interface DutchOrderInfo
 */
export interface DutchOrderInfo {
    /**
     * 
     * @type {ChainId}
     * @memberof DutchOrderInfo
     */
    'chainId': ChainId;
    /**
     * 
     * @type {string}
     * @memberof DutchOrderInfo
     */
    'nonce': string;
    /**
     * 
     * @type {string}
     * @memberof DutchOrderInfo
     */
    'reactor': string;
    /**
     * 
     * @type {string}
     * @memberof DutchOrderInfo
     */
    'swapper': string;
    /**
     * 
     * @type {number}
     * @memberof DutchOrderInfo
     */
    'deadline': number;
    /**
     * 
     * @type {string}
     * @memberof DutchOrderInfo
     */
    'additionalValidationContract'?: string;
    /**
     * 
     * @type {string}
     * @memberof DutchOrderInfo
     */
    'additionalValidationData'?: string;
    /**
     * 
     * @type {number}
     * @memberof DutchOrderInfo
     */
    'decayStartTime'?: number;
    /**
     * 
     * @type {number}
     * @memberof DutchOrderInfo
     */
    'decayEndTime'?: number;
    /**
     * 
     * @type {string}
     * @memberof DutchOrderInfo
     */
    'exclusiveFiller': string;
    /**
     * 
     * @type {string}
     * @memberof DutchOrderInfo
     */
    'exclusivityOverrideBps': string;
    /**
     * 
     * @type {DutchInput}
     * @memberof DutchOrderInfo
     */
    'input': DutchInput;
    /**
     * 
     * @type {Array<DutchOutput>}
     * @memberof DutchOrderInfo
     */
    'outputs': Array<DutchOutput>;
}


/**
 * 
 * @export
 * @interface DutchOutput
 */
export interface DutchOutput {
    /**
     * 
     * @type {string}
     * @memberof DutchOutput
     */
    'startAmount': string;
    /**
     * 
     * @type {string}
     * @memberof DutchOutput
     */
    'endAmount': string;
    /**
     * 
     * @type {string}
     * @memberof DutchOutput
     */
    'token': string;
    /**
     * 
     * @type {string}
     * @memberof DutchOutput
     */
    'recipient': string;
}
/**
 * 
 * @export
 * @interface DutchQuote
 */
export interface DutchQuote {
    /**
     * 
     * @type {string}
     * @memberof DutchQuote
     */
    'encodedOrder': string;
    /**
     * 
     * @type {string}
     * @memberof DutchQuote
     */
    'orderId': string;
    /**
     * 
     * @type {DutchOrderInfo}
     * @memberof DutchQuote
     */
    'orderInfo': DutchOrderInfo;
    /**
     * 
     * @type {number}
     * @memberof DutchQuote
     */
    'portionBips'?: number;
    /**
     * 
     * @type {string}
     * @memberof DutchQuote
     */
    'portionAmount'?: string;
    /**
     * 
     * @type {string}
     * @memberof DutchQuote
     */
    'portionRecipient'?: string;
}
/**
 * 
 * @export
 * @interface GetOrdersResponse
 */
export interface GetOrdersResponse {
    /**
     * 
     * @type {string}
     * @memberof GetOrdersResponse
     */
    'requestId'?: string;
    /**
     * 
     * @type {Array<OrderEntity>}
     * @memberof GetOrdersResponse
     */
    'orders'?: Array<OrderEntity>;
    /**
     * 
     * @type {string}
     * @memberof GetOrdersResponse
     */
    'cursor'?: string;
}
/**
 * 
 * @export
 * @interface GetSwapResponse
 */
export interface GetSwapResponse {
    /**
     * 
     * @type {string}
     * @memberof GetSwapResponse
     */
    'requestId'?: string;
    /**
     * 
     * @type {SwapStatus}
     * @memberof GetSwapResponse
     */
    'status'?: SwapStatus;
}


/**
 * 
 * @export
 * @interface NullablePermit
 */
export interface NullablePermit {
    /**
     * 
     * @type {object}
     * @memberof NullablePermit
     */
    'domain'?: object;
    /**
     * 
     * @type {object}
     * @memberof NullablePermit
     */
    'values'?: object;
    /**
     * 
     * @type {object}
     * @memberof NullablePermit
     */
    'types'?: object;
}
/**
 * 
 * @export
 * @interface OrderEntity
 */
export interface OrderEntity {
    /**
     * 
     * @type {OrderType}
     * @memberof OrderEntity
     */
    'type': OrderType;
    /**
     * 
     * @type {string}
     * @memberof OrderEntity
     */
    'signature': string;
    /**
     * 
     * @type {string}
     * @memberof OrderEntity
     */
    'nonce': string;
    /**
     * 
     * @type {string}
     * @memberof OrderEntity
     */
    'orderId': string;
    /**
     * 
     * @type {OrderStatus}
     * @memberof OrderEntity
     */
    'orderStatus': OrderStatus;
    /**
     * 
     * @type {ChainId}
     * @memberof OrderEntity
     */
    'chainId': ChainId;
    /**
     * 
     * @type {string}
     * @memberof OrderEntity
     */
    'swapper': string;
    /**
     * 
     * @type {string}
     * @memberof OrderEntity
     */
    'reactor'?: string;
    /**
     * 
     * @type {number}
     * @memberof OrderEntity
     */
    'startTime'?: number;
    /**
     * 
     * @type {number}
     * @memberof OrderEntity
     */
    'endTime'?: number;
    /**
     * 
     * @type {number}
     * @memberof OrderEntity
     */
    'deadline'?: number;
    /**
     * 
     * @type {string}
     * @memberof OrderEntity
     */
    'filler'?: string;
    /**
     * 
     * @type {string}
     * @memberof OrderEntity
     */
    'txHash'?: string;
    /**
     * 
     * @type {OrderInput}
     * @memberof OrderEntity
     */
    'input'?: OrderInput;
    /**
     * 
     * @type {Array<OrderOutput>}
     * @memberof OrderEntity
     */
    'outputs'?: Array<OrderOutput>;
    /**
     * 
     * @type {Array<SettledAmount>}
     * @memberof OrderEntity
     */
    'settledAmounts'?: Array<SettledAmount>;
}


/**
 * 
 * @export
 * @interface OrderInput
 */
export interface OrderInput {
    /**
     * 
     * @type {string}
     * @memberof OrderInput
     */
    'token': string;
    /**
     * 
     * @type {string}
     * @memberof OrderInput
     */
    'startAmount'?: string;
    /**
     * 
     * @type {string}
     * @memberof OrderInput
     */
    'endAmount'?: string;
}
/**
 * 
 * @export
 * @interface OrderOutput
 */
export interface OrderOutput {
    /**
     * 
     * @type {string}
     * @memberof OrderOutput
     */
    'token': string;
    /**
     * 
     * @type {string}
     * @memberof OrderOutput
     */
    'startAmount'?: string;
    /**
     * 
     * @type {string}
     * @memberof OrderOutput
     */
    'endAmount'?: string;
    /**
     * 
     * @type {boolean}
     * @memberof OrderOutput
     */
    'isFeeOutput'?: boolean;
    /**
     * 
     * @type {string}
     * @memberof OrderOutput
     */
    'recipient'?: string;
}
/**
 * 
 * @export
 * @interface OrderRequest
 */
export interface OrderRequest {
    /**
     * The signed permit.
     * @type {string}
     * @memberof OrderRequest
     */
    'signature': string;
    /**
     * 
     * @type {DutchQuote}
     * @memberof OrderRequest
     */
    'quote': DutchQuote;
}
/**
 * 
 * @export
 * @interface OrderResponse
 */
export interface OrderResponse {
    /**
     * 
     * @type {string}
     * @memberof OrderResponse
     */
    'requestId': string;
    /**
     * 
     * @type {string}
     * @memberof OrderResponse
     */
    'orderId': string;
    /**
     * 
     * @type {OrderStatus}
     * @memberof OrderResponse
     */
    'orderStatus': OrderStatus;
}


/**
 * 
 * @export
 * @enum {string}
 */

export const OrderStatus = {
    Open: 'open',
    Expired: 'expired',
    Error: 'error',
    Cancelled: 'cancelled',
    Filled: 'filled',
    Unverified: 'unverified',
    InsufficientFunds: 'insufficient-funds'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];


/**
 * 
 * @export
 * @enum {string}
 */

export const OrderType = {
    DutchLimit: 'DutchLimit'
} as const;

export type OrderType = typeof OrderType[keyof typeof OrderType];


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
    'domain'?: object;
    /**
     * 
     * @type {object}
     * @memberof Permit
     */
    'values'?: object;
    /**
     * 
     * @type {object}
     * @memberof Permit
     */
    'types'?: object;
}
/**
 * @type Quote
 * @export
 */
export type Quote = ClassicQuote | DutchQuote;

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
    'type': TradeType;
    /**
     * 
     * @type {string}
     * @memberof QuoteRequest
     */
    'amount': string;
    /**
     * 
     * @type {ChainId}
     * @memberof QuoteRequest
     */
    'tokenInChainId': ChainId;
    /**
     * 
     * @type {ChainId}
     * @memberof QuoteRequest
     */
    'tokenOutChainId': ChainId;
    /**
     * 
     * @type {string}
     * @memberof QuoteRequest
     */
    'tokenIn': string;
    /**
     * 
     * @type {string}
     * @memberof QuoteRequest
     */
    'tokenOut': string;
    /**
     * 
     * @type {string}
     * @memberof QuoteRequest
     */
    'swapper': string;
    /**
     * The slippage tolerance is a percentage represented as a percentage. For **Classic** swaps, the slippage tolerance is the maximum amount the price can change between the time the transaction is submitted and the time it is executed. For **DutchLimit** swaps, the slippage tolerance determines how much the `endAmount` can decay from the `startAmount`.
     * @type {number}
     * @memberof QuoteRequest
     */
    'slippageTolerance'?: number;
    /**
     * 
     * @type {RoutingPreference}
     * @memberof QuoteRequest
     */
    'routingPreference'?: RoutingPreference;
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
    'requestId'?: string;
    /**
     * 
     * @type {Quote}
     * @memberof QuoteResponse
     */
    'quote': Quote;
    /**
     * 
     * @type {Routing}
     * @memberof QuoteResponse
     */
    'routing': Routing;
    /**
     * 
     * @type {NullablePermit}
     * @memberof QuoteResponse
     */
    'permitData': NullablePermit;
}


/**
 * 
 * @export
 * @enum {string}
 */

export const Routing = {
    DutchLimit: 'DUTCH_LIMIT',
    Classic: 'CLASSIC'
} as const;

export type Routing = typeof Routing[keyof typeof Routing];


/**
 * The routing preference determines which protocol to use for the swap. If the routing preference is `DUTCH_LIMIT`, then the swap will be routed through the Dutch Auction Protocol. If the routing preference is `CLASSIC`, then the swap will be routed through the Classic Protocol. If the routing preference is `BEST_PRICE`, then the swap will be routed through the protocol that provides the best price.
 * @export
 * @enum {string}
 */

export const RoutingPreference = {
    Classic: 'CLASSIC',
    Uniswapx: 'UNISWAPX',
    BestPrice: 'BEST_PRICE'
} as const;

export type RoutingPreference = typeof RoutingPreference[keyof typeof RoutingPreference];


/**
 * 
 * @export
 * @interface SettledAmount
 */
export interface SettledAmount {
    /**
     * 
     * @type {string}
     * @memberof SettledAmount
     */
    'tokenOut'?: string;
    /**
     * 
     * @type {string}
     * @memberof SettledAmount
     */
    'amountOut'?: string;
    /**
     * 
     * @type {string}
     * @memberof SettledAmount
     */
    'tokenIn'?: string;
    /**
     * 
     * @type {string}
     * @memberof SettledAmount
     */
    'amountIn'?: string;
}
/**
 * 
 * @export
 * @enum {string}
 */

export const SortKey = {
    CreatedAt: 'createdAt'
} as const;

export type SortKey = typeof SortKey[keyof typeof SortKey];


/**
 * 
 * @export
 * @enum {string}
 */

export const SwapStatus = {
    Pending: 'pending',
    Success: 'success',
    Error: 'error'
} as const;

export type SwapStatus = typeof SwapStatus[keyof typeof SwapStatus];


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
    'address'?: string;
    /**
     * 
     * @type {ChainId}
     * @memberof TokenInRoute
     */
    'chainId'?: ChainId;
    /**
     * 
     * @type {string}
     * @memberof TokenInRoute
     */
    'symbol'?: string;
    /**
     * 
     * @type {string}
     * @memberof TokenInRoute
     */
    'decimals'?: string;
    /**
     * 
     * @type {string}
     * @memberof TokenInRoute
     */
    'buyFeeBps'?: string;
    /**
     * 
     * @type {string}
     * @memberof TokenInRoute
     */
    'sellFeeBps'?: string;
}


/**
 * 
 * @export
 * @enum {string}
 */

export const TradeType = {
    Input: 'EXACT_INPUT',
    Output: 'EXACT_OUTPUT'
} as const;

export type TradeType = typeof TradeType[keyof typeof TradeType];


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
    'to': string;
    /**
     * 
     * @type {string}
     * @memberof TransactionRequest
     */
    'from': string;
    /**
     * 
     * @type {string}
     * @memberof TransactionRequest
     */
    'data': string;
    /**
     * 
     * @type {string}
     * @memberof TransactionRequest
     */
    'value': string;
    /**
     * 
     * @type {string}
     * @memberof TransactionRequest
     */
    'gasLimit'?: string;
    /**
     * 
     * @type {number}
     * @memberof TransactionRequest
     */
    'chainId': number;
    /**
     * 
     * @type {string}
     * @memberof TransactionRequest
     */
    'maxFeePerGas'?: string;
    /**
     * 
     * @type {string}
     * @memberof TransactionRequest
     */
    'maxPriorityFeePerGas'?: string;
    /**
     * 
     * @type {string}
     * @memberof TransactionRequest
     */
    'gasPrice'?: string;
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
    'type'?: string;
    /**
     * 
     * @type {string}
     * @memberof V2PoolInRoute
     */
    'address'?: string;
    /**
     * 
     * @type {TokenInRoute}
     * @memberof V2PoolInRoute
     */
    'tokenIn'?: TokenInRoute;
    /**
     * 
     * @type {TokenInRoute}
     * @memberof V2PoolInRoute
     */
    'tokenOut'?: TokenInRoute;
    /**
     * 
     * @type {V2Reserve}
     * @memberof V2PoolInRoute
     */
    'reserve0'?: V2Reserve;
    /**
     * 
     * @type {V2Reserve}
     * @memberof V2PoolInRoute
     */
    'reserve1'?: V2Reserve;
    /**
     * 
     * @type {string}
     * @memberof V2PoolInRoute
     */
    'amountIn'?: string;
    /**
     * 
     * @type {string}
     * @memberof V2PoolInRoute
     */
    'amountOut'?: string;
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
    'token'?: TokenInRoute;
    /**
     * 
     * @type {string}
     * @memberof V2Reserve
     */
    'quotient'?: string;
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
    'type'?: string;
    /**
     * 
     * @type {string}
     * @memberof V3PoolInRoute
     */
    'address'?: string;
    /**
     * 
     * @type {TokenInRoute}
     * @memberof V3PoolInRoute
     */
    'tokenIn'?: TokenInRoute;
    /**
     * 
     * @type {TokenInRoute}
     * @memberof V3PoolInRoute
     */
    'tokenOut'?: TokenInRoute;
    /**
     * 
     * @type {string}
     * @memberof V3PoolInRoute
     */
    'sqrtRatioX96'?: string;
    /**
     * 
     * @type {string}
     * @memberof V3PoolInRoute
     */
    'liquidity'?: string;
    /**
     * 
     * @type {string}
     * @memberof V3PoolInRoute
     */
    'tickCurrent'?: string;
    /**
     * 
     * @type {string}
     * @memberof V3PoolInRoute
     */
    'fee'?: string;
    /**
     * 
     * @type {string}
     * @memberof V3PoolInRoute
     */
    'amountIn'?: string;
    /**
     * 
     * @type {string}
     * @memberof V3PoolInRoute
     */
    'amountOut'?: string;
}


