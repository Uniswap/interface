import { GasStrategy, TradingApi } from '@universe/api'
import {
  createBuildQuoteRequest,
  flattenQuoteRequestResult,
  type ParsedTradeInput,
  parseTradeInputForTradingApiQuote,
  validateParsedInput,
} from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  GetQuoteRoutingParams,
  GetQuoteSlippageParams,
  type QuoteRoutingParamsResult,
  type QuoteSlippageParamsResult,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'

export type GetQuoteRequestArgs = ParsedTradeInput

export type GetQuoteRequestResult = QuoteRoutingParamsResult &
  QuoteSlippageParamsResult & {
    amount: string
    generatePermitAsTransaction?: boolean
    gasStrategies: GasStrategy[]
    isUSDQuote?: boolean
    swapper: string
    tokenIn: string
    tokenInChainId: number
    tokenOut: string
    tokenOutChainId: number
    type: TradingApi.TradeType
    urgency?: TradingApi.Urgency
  }

export type GetQuoteRequestArgsGetter = (input: UseTradeArgs) => GetQuoteRequestResult | undefined

export function createGetQuoteRequestArgs(ctx: {
  getRoutingParams: GetQuoteRoutingParams
  getSlippageParams: GetQuoteSlippageParams
}): GetQuoteRequestArgsGetter {
  const { getRoutingParams, getSlippageParams } = ctx

  // Create the quote request builder
  const buildQuoteRequest = createBuildQuoteRequest({
    getRoutingParams,
    getSlippageParams,
  })

  const getQuoteRequestArgs: GetQuoteRequestArgsGetter = (input: UseTradeArgs) => {
    // Step 1: Check skip flag
    if (input.skip) {
      return undefined
    }

    // Step 2: Parse the input
    const parsedInput = parseTradeInputForTradingApiQuote(input)

    // Step 3: Validate the data structure
    const validatedInput = validateParsedInput(parsedInput)

    if (!validatedInput) {
      return undefined
    }

    // Step 4: Build the quote request from validated input
    const result = buildQuoteRequest(validatedInput)

    // Step 5: Flatten the result to match the expected return type
    return flattenQuoteRequestResult(result)
  }

  return getQuoteRequestArgs
}
