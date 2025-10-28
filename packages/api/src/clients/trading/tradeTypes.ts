/* eslint-disable @typescript-eslint/naming-convention */
/**
 * TODO: SWAP-429 - Replaces with auto-generated types from TAPI api when available
 */

import type {
  BridgeQuote,
  ChainId,
  ClassicQuote,
  DutchQuoteV2,
  DutchQuoteV3,
  PriorityQuote,
  Quote,
  QuoteResponse,
  Routing,
  WrapUnwrapQuote,
} from '@universe/api/src/clients/trading/__generated__'

export enum Method {
  SEND_TX = 'SEND_TX',
  SIGN_MSG = 'SIGN_MSG',
  SEND_CALLS = 'SEND_CALLS',
}

enum PayloadType {
  TX = 'tx',
  EIP_712 = '712',
  EIP_5792 = '5792',
}

export enum PlanStepStatus {
  NOT_READY = 'NOT_READY',
  AWAITING_ACTION = 'AWAITING_ACTION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  STEP_ERROR = 'STEP_ERROR',
}

interface StepProof {
  txHash?: string
  signature?: string
  orderId?: string
}

export interface PlanStep {
  stepId: string
  method: Method
  payloadType: PayloadType
  payload: Record<string, unknown>
  status: PlanStepStatus
  proof?: StepProof
  tokenIn: string
  tokenOut: string
  tokenInChainId: ChainId
  tokenOutChainId: ChainId
  input?: string
  output?: string
  swapper: string
  recipient: string
  timeEstimateMs: number
}

export interface TradeResponse {
  tradeId: string
  steps: PlanStep[]
  expectedOutput: number
  timeEstimateMs: number //ms
  gasFee: string
}

export interface NewTradeRequest {
  quote: Quote
}

export interface ExistingTradeRequest {
  tradeId: string
}

export interface UpdateExistingTradeRequest extends ExistingTradeRequest {
  steps: {
    stepId: string
    proof: StepProof
  }[]
}

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

// TODO: SWAP-458 - Add chained quote type when available. For now we will use the classic quote type.
export type ChainedQuoteResponse = QuoteResponseWithRouting<ClassicQuote, Routing.CHAINED>

export type SwappableTokensParams = {
  tokenIn: Address
  tokenInChainId: ChainId
}
