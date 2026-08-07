import type {
  BridgeQuote,
  ChainedQuote,
  ChainId,
  ClassicQuote,
  DutchQuoteV2,
  DutchQuoteV3,
  PermissionsRequest,
  PermissionsResponse,
  PermissionsResult,
  PriorityQuote,
  QuoteResponse,
  Routing,
  UpdatePlanRequest,
  WrapUnwrapQuote,
} from '@universe/api/src/clients/trading/__generated__'

export interface ExistingPlanRequest {
  planId: string
}

export interface UpdatePlanRequestWithPlanId extends UpdatePlanRequest, ExistingPlanRequest {}

// TradingAPI team is looking into updating type generation to produce the following types for it's current QuoteResponse type:
// See: https://linear.app/uniswap/issue/API-236/explore-changing-the-quote-schema-to-pull-out-a-basequoteresponse
export type DiscriminatedQuoteResponse =
  | ClassicQuoteResponse
  | DutchQuoteResponse
  | DutchV3QuoteResponse
  | PriorityQuoteResponse
  | BridgeQuoteResponse
  | WrapQuoteResponse
  | UnwrapQuoteResponse
  | ChainedQuoteResponse

type QuoteResponseWithRouting<TQuote, TRouting> = QuoteResponse & {
  quote: TQuote
  routing: TRouting
}

export type DutchV3QuoteResponse = QuoteResponseWithRouting<DutchQuoteV3, Routing.DUTCH_V3>
export type DutchQuoteResponse = QuoteResponseWithRouting<DutchQuoteV2, Routing.DUTCH_V2>
export type PriorityQuoteResponse = QuoteResponseWithRouting<PriorityQuote, Routing.PRIORITY>
export type ClassicQuoteResponse = QuoteResponseWithRouting<ClassicQuote, Routing.CLASSIC>
export type BridgeQuoteResponse = QuoteResponseWithRouting<BridgeQuote, Routing.BRIDGE>
export type WrapQuoteResponse = QuoteResponseWithRouting<WrapUnwrapQuote, Routing.WRAP>
export type UnwrapQuoteResponse = QuoteResponseWithRouting<WrapUnwrapQuote, Routing.UNWRAP>

export type ChainedQuoteResponse = QuoteResponseWithRouting<ChainedQuote, Routing.CHAINED>

export type SwappableTokensParams = {
  tokenIn: Address
  tokenInChainId: ChainId
}

// CheckPermissions / `/permissions` endpoint. The OpenAPI schema now documents this endpoint
// (including the `issuer` field), so these are aliases onto the generated types rather than
// hand-rolled shapes. Kept under the `CheckPermissions*` names so existing consumers don't churn.
// The generated `PermissionsResult` is a flat object with `isPermissioned` as the discriminant
// and the permissioned-only fields (`isAllowlisted`, `adapterTokenAddress`, `kycUrl`, `issuer`)
// optional; consumers narrow on `isPermissioned` at runtime.
export type CheckPermissionsRequest = PermissionsRequest
export type CheckPermissionsResult = PermissionsResult
export type CheckPermissionsResponse = PermissionsResponse
