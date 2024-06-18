import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import { MixedRouteSDK, Trade as RouterSDKTrade } from '@taraswap/router-sdk'
import { Currency, CurrencyAmount, Percent, TradeType } from '@taraswap/sdk-core'
import { Route as V2RouteSDK } from '@taraswap/v2-sdk'
import { Route as V3RouteSDK } from '@taraswap/v3-sdk'
import { providers } from 'ethers'
import { PollingInterval } from 'wallet/src/constants/misc'
import { QuoteResponse } from 'wallet/src/data/tradingApi/__generated__/index'
import { TradeProtocolPreference } from 'wallet/src/features/transactions/transactionState/types'

// TODO: [MOB-238] use composition instead of inheritance
export class Trade<
  TInput extends Currency = Currency,
  TOutput extends Currency = Currency,
  TTradeType extends TradeType = TradeType
> extends RouterSDKTrade<TInput, TOutput, TTradeType> {
  readonly quote?: QuoteResponse
  readonly deadline: number
  readonly slippageTolerance: number
  readonly swapFee?: SwapFee

  constructor({
    quote,
    deadline,
    slippageTolerance,
    swapFee,
    ...routes
  }: {
    readonly quote?: QuoteResponse
    readonly swapFee?: SwapFee
    readonly deadline: number
    readonly slippageTolerance: number
    readonly v2Routes: {
      routev2: V2RouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    readonly v3Routes: {
      routev3: V3RouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    readonly mixedRoutes: {
      mixedRoute: MixedRouteSDK<TInput, TOutput>
      inputAmount: CurrencyAmount<TInput>
      outputAmount: CurrencyAmount<TOutput>
    }[]
    readonly tradeType: TTradeType
  }) {
    super(routes)
    this.quote = quote
    this.deadline = deadline
    this.slippageTolerance = slippageTolerance
    this.swapFee = swapFee
  }
}

export interface TradeWithStatus {
  loading: boolean
  error?: FetchBaseQueryError | SerializedError
  trade: null | Trade<Currency, Currency, TradeType>
  isFetching?: boolean
}

export interface UseTradeArgs {
  amountSpecified: Maybe<CurrencyAmount<Currency>>
  otherCurrency: Maybe<Currency>
  tradeType: TradeType
  pollInterval?: PollingInterval
  customSlippageTolerance?: number
  isUSDQuote?: boolean
  sendPortionEnabled?: boolean
  skip?: boolean
  tradeProtocolPreference?: TradeProtocolPreference
}

export type SwapFee = { recipient?: string; percent: Percent; amount: string }

export type SwapFeeInfo = {
  noFeeCharged: boolean
  formattedPercent: string
  formattedAmount: string
  formattedAmountFiat?: string
}

export enum ApprovalAction {
  // either native token or allowance is sufficient, no approval or permit needed
  None = 'none',

  // not enough allowance and token cannot be approved through .permit instead
  Approve = 'approve',

  // not enough allowance but token can be approved through permit signature
  Permit = 'permit',

  Permit2Approve = 'permit2-approve',

  // Unable to fetch approval status, should block submission UI
  Unknown = 'unknown',
}

export type TokenApprovalInfo =
  | {
      action: ApprovalAction.None | ApprovalAction.Permit | ApprovalAction.Unknown
      txRequest: null
    }
  | {
      action: ApprovalAction.Approve | ApprovalAction.Permit2Approve
      txRequest: providers.TransactionRequest
    }
