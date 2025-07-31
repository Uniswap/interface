import { GasEstimate } from 'uniswap/src/data/tradingApi/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { GetQuoteRequestResult } from 'uniswap/src/features/transactions/swap/hooks/useTrade/createGetQuoteRequestArgs'
import type {
  IndicativeQuoteRequest,
  TradeRepository,
} from 'uniswap/src/features/transactions/swap/services/tradeService/tradeRepository'
import {
  UNCONNECTED_ADDRESS,
  createBuildQuoteRequest,
  flattenQuoteRequestResult,
  parseTradeInputForQuote,
  validateParsedInput,
  type ValidatedTradeInput,
} from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import { transformQuoteToTrade } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/transformQuoteToTrade'
import {
  IndicativeTrade,
  Trade,
  validateIndicativeQuoteResponse,
  type UseTradeArgs,
} from 'uniswap/src/features/transactions/swap/types/trade'
import {
  DEFAULT_PROTOCOL_OPTIONS,
  createGetProtocolsForChain,
} from 'uniswap/src/features/transactions/swap/utils/protocols'
import {
  createGetQuoteRoutingParams,
  createGetQuoteSlippageParams,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import type { Logger } from 'utilities/src/logger/logger'

export interface TradeWithGasEstimates {
  trade: Trade | null
  gasEstimate?: GasEstimate
}

export interface TradeService {
  getTrade(input: UseTradeArgs): Promise<TradeWithGasEstimates>
  prepareTradeInput(input?: UseTradeArgs): ValidatedTradeInput | null
  getIndicativeTrade(input: UseTradeArgs): Promise<IndicativeTrade | null>
  prepareIndicativeTradeInput(input?: UseTradeArgs): ValidatedTradeInput | null
}

interface TradeServiceContext {
  // Core dependencies
  tradeRepository: TradeRepository
  logger?: Logger
  onTradeError?: (
    error: Error,
    ctx: {
      input: UseTradeArgs
      quoteRequestArgs?: GetQuoteRequestResult
    },
  ) => void

  // Configuration dependencies
  getIsUniswapXSupported?: (chainId?: number) => boolean
  getEnabledChains: () => UniverseChainId[]
  getIsL2ChainId: (chainId?: UniverseChainId) => boolean
  getMinAutoSlippageToleranceL2: () => number
}

export function createTradeService(ctx: TradeServiceContext): TradeService {
  const {
    tradeRepository,
    getIsUniswapXSupported,
    getEnabledChains,
    getIsL2ChainId,
    getMinAutoSlippageToleranceL2,
    onTradeError,
  } = ctx

  // Create protocols filter
  const getProtocolsForChain = createGetProtocolsForChain({
    getIsUniswapXSupported,
    getEnabledChains,
  })

  return {
    prepareTradeInput,
    prepareIndicativeTradeInput,
    async getTrade(input: UseTradeArgs): Promise<TradeWithGasEstimates> {
      let quoteRequestArgs: GetQuoteRequestResult | undefined

      try {
        // Create routing params getter for this specific request
        const getRoutingParams = createGetQuoteRoutingParams({
          getProtocols: () =>
            getProtocolsForChain(
              input.selectedProtocols ?? DEFAULT_PROTOCOL_OPTIONS,
              input.amountSpecified?.currency.chainId,
            ),
          getIsV4HookPoolsEnabled: () => input.isV4HookPoolsEnabled ?? true,
        })

        // Create slippage params getter for this specific request
        const getSlippageParams = createGetQuoteSlippageParams({
          getIsL2ChainId,
          getMinAutoSlippageToleranceL2,
          getCustomSlippageTolerance: () => input.customSlippageTolerance,
        })

        // Create the quote request builder with these params
        const buildQuoteRequest = createBuildQuoteRequest({
          getRoutingParams,
          getSlippageParams,
        })

        // Step 1: Prepare trade input
        const validatedInput = prepareTradeInput(input)

        // Step 2: Early exit if input is null
        if (!validatedInput) {
          return { trade: null }
        }

        // Step 3: Build quote request with all params
        const quoteRequestParams = buildQuoteRequest(validatedInput)
        quoteRequestArgs = flattenQuoteRequestResult(quoteRequestParams)

        // Step 4: Fetch quote from API
        const quoteResponse = await tradeRepository.fetchQuote(quoteRequestArgs)

        // Step 5: Transform quote to trade
        const result = transformQuoteToTrade({
          quote: quoteResponse,
          amountSpecified: validatedInput.amount,
          quoteCurrencyData: {
            currencyIn: validatedInput.currencyIn,
            currencyOut: validatedInput.currencyOut,
            requestTradeType: validatedInput.requestTradeType,
          },
        })
        // Return trade with gas estimates
        return {
          trade: result?.trade ?? null,
          gasEstimate: result?.gasEstimate,
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Unknown error')
        onTradeError?.(error, {
          input,
          quoteRequestArgs,
        })
        quoteRequestArgs = undefined
        throw error
      }
    },
    async getIndicativeTrade(input: UseTradeArgs): Promise<IndicativeTrade | null> {
      // Step 1: validate indicative quote request
      const validatedInput = prepareIndicativeTradeInput(input)
      if (!validatedInput) {
        return null
      }

      // Step 2: build indicative quote request
      const indicativeRequest = validatedIndicativeQuoteRequest(validatedInput)

      try {
        // Step 3: Fetch indicative quote from API
        const quoteResponse = await tradeRepository.fetchIndicativeQuote(indicativeRequest)

        // Step 4: Validate and transform to IndicativeTrade
        const validatedResponse = validateIndicativeQuoteResponse(quoteResponse)
        if (!validatedResponse) {
          return null
        }

        const trade = new IndicativeTrade({
          quote: validatedResponse,
          currencyIn: validatedInput.currencyIn,
          currencyOut: validatedInput.currencyOut,
        })

        return trade
      } catch (error) {
        ctx.logger?.error(error, {
          tags: { file: 'tradeService.ts', function: 'getIndicativeTrade' },
        })
        // Indicative trade errors should not block regular trades
        return null
      }
    },
  }
}

/**
 * Prepares the trade input
 * @param input - UseTradeArgs: the input to prepare the trade input for
 * @returns The validated trade input, or null if the input is falsy, skipped, or USD quote
 */
function prepareTradeInput(input?: UseTradeArgs): ValidatedTradeInput | null {
  // Step 1: Early exit if skipped
  if (!input || input.skip) {
    return null
  }

  // Step 2: Parse input into structured format
  const parsedInput = parseTradeInputForQuote(input)

  // Step 3: Validate all required fields are present
  const validatedInput = validateParsedInput(parsedInput)
  if (!validatedInput) {
    return null
  }

  return validatedInput
}
/**
 * Prepares the indicative trade input
 * @param input - UseTradeArgs: the input to prepare the indicative trade input for
 * @returns The validated indicative trade input, or null if the input is falsy, skipped, or USD quote
 */
function prepareIndicativeTradeInput(input?: UseTradeArgs): ValidatedTradeInput | null {
  // Early exit if input is falsy, skipped, or USD quote
  if (!input || input.skip || input.isUSDQuote) {
    return null
  }

  return prepareTradeInput(input)
}

/**
 * Validates the input and returns a minimal indicative quote request
 * @param validatedInput - ValidatedTradeInput: the validated input to build the indicative quote request for
 * @returns A minimal indicative quote request
 */
function validatedIndicativeQuoteRequest(validatedInput: ValidatedTradeInput): IndicativeQuoteRequest {
  const indicativeRequest: IndicativeQuoteRequest = {
    type: validatedInput.requestTradeType,
    amount: validatedInput.amount.quotient.toString(),
    tokenInChainId: validatedInput.tokenInChainId,
    tokenOutChainId: validatedInput.tokenOutChainId,
    tokenIn: validatedInput.tokenInAddress,
    tokenOut: validatedInput.tokenOutAddress,
    swapper: validatedInput.activeAccountAddress || UNCONNECTED_ADDRESS,
  }

  return indicativeRequest
}
