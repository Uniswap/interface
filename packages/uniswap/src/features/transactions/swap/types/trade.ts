import { CurrencyAmount, Price, type Currency, type Percent, type TradeType } from '@uniswap/sdk-core'
import type { GasEstimate } from '@universe/api'
import { TradingApi } from '@universe/api'
import type { providers } from 'ethers/lib/ethers'
import type { PollingInterval } from 'uniswap/src/constants/misc'
import type { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/bridge'
import type { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/chained'
import type { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/classic'
import type { IndicativeTrade } from 'uniswap/src/features/transactions/swap/types/indicative'
import type { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
import type { UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/uniswapx'
import type { UnwrapTrade, WrapTrade } from 'uniswap/src/features/transactions/swap/types/wrap'
import type { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'
import type { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import type { CurrencyField } from 'uniswap/src/types/currency'

export type { BaseTrade } from 'uniswap/src/features/transactions/swap/types/base'
export { createBridgeTrade } from 'uniswap/src/features/transactions/swap/types/bridge'
export type { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/bridge'
export { createChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/chained'
export type { ChainedActionEarnIntent, ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/chained'
export { createClassicTrade } from 'uniswap/src/features/transactions/swap/types/classic'
export type { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/classic'
export { createIndicativeTrade } from 'uniswap/src/features/transactions/swap/types/indicative'
export type { IndicativeTrade } from 'uniswap/src/features/transactions/swap/types/indicative'
export { createSolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
export type { SolanaTrade } from 'uniswap/src/features/transactions/swap/types/solana'
export {
  createPriorityOrderTrade,
  createUniswapXV2Trade,
  createUniswapXV3Trade,
} from 'uniswap/src/features/transactions/swap/types/uniswapx'
export type {
  PriorityOrderTrade,
  UniswapXTrade,
  UniswapXV2Trade,
  UniswapXV3Trade,
} from 'uniswap/src/features/transactions/swap/types/uniswapx'
export { createUnwrapTrade, createWrapTrade } from 'uniswap/src/features/transactions/swap/types/wrap'
export type { UnwrapTrade, WrapTrade } from 'uniswap/src/features/transactions/swap/types/wrap'

export function getWorstExecutionPrice(trade: {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  maxAmountIn: CurrencyAmount<Currency>
  minAmountOut: CurrencyAmount<Currency>
}): Price<Currency, Currency> {
  return new Price(
    trade.inputAmount.currency,
    trade.outputAmount.currency,
    trade.maxAmountIn.quotient,
    trade.minAmountOut.quotient,
  )
}

export function getTradeInputTax(trade: { inputTax?: Percent }): Percent | undefined {
  return trade.inputTax
}

export function getTradeOutputTax(trade: { outputTax?: Percent }): Percent | undefined {
  return trade.outputTax
}

export type Trade =
  | ClassicTrade
  | UniswapXTrade
  | BridgeTrade
  | WrapTrade
  | UnwrapTrade
  | SolanaTrade
  | ChainedActionTrade

export type TradeWithSlippage = Exclude<Trade, BridgeTrade>

// TODO(WALL-4573) - Cleanup usage of optionality/null/undefined
export interface TradeWithStatus<T extends Trade = Trade> {
  quoteHash?: string
  isLoading: boolean
  isFetching?: boolean
  error: Error | null
  trade: T | null
  indicativeTrade: IndicativeTrade | undefined
  isIndicativeLoading: boolean
  gasEstimate: GasEstimate | undefined
}

export interface UseTradeArgs {
  account?: AccountDetails
  amountSpecified: Maybe<CurrencyAmount<Currency>>
  otherCurrency: Maybe<Currency>
  tradeType: TradeType
  pollInterval?: PollingInterval
  customSlippageTolerance?: number
  isUSDQuote?: boolean
  sendPortionEnabled?: boolean
  // TODO(SWAP-154): Remove skip
  skip?: boolean
  selectedProtocols?: FrontendSupportedProtocol[]
  isDebouncing?: boolean
  generatePermitAsTransaction?: boolean
  isV4HookPoolsEnabled?: boolean
  walletExecutionContext?: TradingApi.WalletExecutionContext
  earnIntent?: TradingApi.EarnIntent
  /** Overrides the quote request output token. Earn vault deposits use this to quote into the vault token. */
  quoteOutputOverride?: {
    tokenOutAddress: string
    tokenOutChainId: number
  }
  skipIndicativeTrade?: boolean
  // User-supplied gas fee overrides (e.g. custom max fee / priority / gas limit) routed to the
  // TAPI `urgency.overrides` payload when the GasFeeOverrides feature flag is on.
  gasOverrides?: TradingApi.UrgencyOverrides
}

export type SwapFee = {
  recipient?: string
  percent: Percent
  amount: string
  /** Indicates if the fee is taken from the input or output token. */
  feeField: CurrencyField
}

export type SwapFeeInfo = {
  noFeeCharged: boolean
  formattedPercent: string
  formattedAmount: string
  formattedAmountFiat?: string
}

export enum ApprovalAction {
  // either native token or allowance is sufficient, no approval or permit needed
  None = 'none',

  // erc20 approval is needed for the permit2 contract
  Permit2Approve = 'permit2-approve',

  // revoke required before token can be approved
  RevokeAndPermit2Approve = 'revoke-and-permit2-approve',

  // Unable to fetch approval status, should block submission UI
  Unknown = 'unknown',
}

export type TokenApprovalInfo =
  | {
      action: ApprovalAction.None | ApprovalAction.Unknown
      txRequest: null
      cancelTxRequest: null
    }
  | {
      action: ApprovalAction.Permit2Approve
      txRequest: providers.TransactionRequest
      cancelTxRequest: null
    }
  | {
      action: ApprovalAction.RevokeAndPermit2Approve
      txRequest: providers.TransactionRequest
      cancelTxRequest: providers.TransactionRequest
    }

export type ValidatedIndicativeQuoteResponse = TradingApi.QuoteResponse & {
  input: Required<Pick<TradingApi.QuoteInput, 'amount' | 'token'>>
  output: Required<Pick<TradingApi.QuoteOutput, 'amount' | 'token' | 'recipient'>>
}

export function validateIndicativeQuoteResponse(
  response: TradingApi.QuoteResponse,
): ValidatedIndicativeQuoteResponse | undefined {
  if ('input' in response.quote && 'output' in response.quote) {
    const input = response.quote.input
    const output = response.quote.output
    if (!input || !output) {
      return undefined
    }
    if (input.amount && input.token && output.amount && output.token && output.recipient) {
      return {
        ...response,
        input: { amount: input.amount, token: input.token },
        output: { amount: output.amount, token: output.token, recipient: output.recipient },
      }
    }
  }
  return undefined
}
