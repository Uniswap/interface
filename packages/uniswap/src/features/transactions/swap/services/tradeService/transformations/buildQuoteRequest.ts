import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { GasStrategy, TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { getActiveGasStrategy } from 'uniswap/src/features/gas/utils'
import {
  isZeroAmount,
  parseQuoteCurrencies,
} from 'uniswap/src/features/transactions/swap/hooks/useTrade/parseQuoteCurrencies'
import type { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  buildUrgency,
  DEFAULT_URGENCY_LEVEL,
  GetQuoteRoutingParams,
  GetQuoteSlippageParams,
  getTokenAddressForApi,
  QuoteRoutingParamsResult,
  QuoteSlippageParamsResult,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'

// The TradingAPI requires an address for the swapper field; we supply a placeholder address if no account is connected.
// Note: This address was randomly generated.
export const UNCONNECTED_ADDRESS = '0xAAAA44272dc658575Ba38f43C438447dDED45358'

export interface QuoteRequestResult {
  amount: string
  generatePermitAsTransaction?: boolean
  earnIntent?: TradingApi.EarnIntent
  // Flag-off path: legacy `gasStrategies` array. Omitted on the flag-on path.
  gasStrategies?: GasStrategy[]
  isUSDQuote?: boolean
  swapper: string
  tokenIn: string
  tokenInChainId: number
  tokenOut: string
  tokenOutChainId: number
  type: TradingApi.TradeType
  urgency?: TradingApi.Urgency
  walletExecutionContext?: TradingApi.WalletExecutionContext
  routingParams: QuoteRoutingParamsResult
  slippageParams: QuoteSlippageParamsResult
}

// all required fields are guaranteed to be present
export interface ValidatedTradeInput {
  currencyIn: Currency
  currencyOut: Currency
  amount: CurrencyAmount<Currency>
  requestTradeType: TradingApi.TradeType
  activeAccountAddress: string | undefined
  tokenInChainId: number
  tokenOutChainId: number
  tokenInAddress: string
  tokenOutAddress: string
  generatePermitAsTransaction?: boolean
  earnIntent?: TradingApi.EarnIntent
  isUSDQuote?: boolean
  walletExecutionContext?: TradingApi.WalletExecutionContext
  gasOverrides?: TradingApi.UrgencyOverrides
}

interface BuildQuoteRequestContext {
  getRoutingParams: GetQuoteRoutingParams
  getSlippageParams: GetQuoteSlippageParams
}

export function createBuildQuoteRequest(
  ctx: BuildQuoteRequestContext,
): (validatedInput: ValidatedTradeInput) => QuoteRequestResult {
  const { getRoutingParams, getSlippageParams } = ctx

  return function buildQuoteRequest(validatedInput: ValidatedTradeInput): QuoteRequestResult {
    const routingParams = getRoutingParams({
      isUSDQuote: validatedInput.isUSDQuote,
    })

    const slippageParams = getSlippageParams({
      tokenInChainId: validatedInput.tokenInChainId,
      tokenOutChainId: validatedInput.tokenOutChainId,
      isUSDQuote: validatedInput.isUSDQuote,
    })

    // TODO(GasFeeOverrides): remove flag gate once the new urgency-based payload ships fully.
    const shouldUseUrgency = getFeatureFlag(FeatureFlags.GasFeeOverrides)

    const base = {
      amount: validatedInput.amount.quotient.toString(),
      generatePermitAsTransaction: validatedInput.generatePermitAsTransaction,
      earnIntent: validatedInput.earnIntent,
      isUSDQuote: validatedInput.isUSDQuote,
      swapper: validatedInput.activeAccountAddress ?? UNCONNECTED_ADDRESS,
      tokenIn: validatedInput.tokenInAddress,
      tokenInChainId: validatedInput.tokenInChainId,
      tokenOut: validatedInput.tokenOutAddress,
      tokenOutChainId: validatedInput.tokenOutChainId,
      type: validatedInput.requestTradeType,
      walletExecutionContext: validatedInput.walletExecutionContext,
      routingParams,
      slippageParams,
    }

    if (shouldUseUrgency) {
      return {
        ...base,
        urgency: buildUrgency(validatedInput.gasOverrides),
      }
    }

    return {
      ...base,
      gasStrategies: [getActiveGasStrategy({ chainId: validatedInput.tokenInChainId, type: 'swap' })],
      urgency: DEFAULT_URGENCY_LEVEL,
    }
  }
}

// Helper type for flattening the result with routing and slippage params
export type FlattenedQuoteRequestResult = Omit<QuoteRequestResult, 'routingParams' | 'slippageParams'> &
  QuoteRoutingParamsResult &
  QuoteSlippageParamsResult

export function flattenQuoteRequestResult(result: QuoteRequestResult): FlattenedQuoteRequestResult {
  const { routingParams, slippageParams, ...rest } = result
  return {
    ...rest,
    ...routingParams,
    ...slippageParams,
  }
}

// Parse trade input specifically for quote request building
export interface ParsedTradeInput {
  currencyIn: Maybe<Currency>
  currencyOut: Maybe<Currency>
  amount: Maybe<CurrencyAmount<Currency>>
  requestTradeType: TradingApi.TradeType
  activeAccountAddress: string | undefined
  tokenInChainId?: number
  tokenOutChainId?: number
  tokenInAddress?: string
  tokenOutAddress?: string
  generatePermitAsTransaction?: boolean
  earnIntent?: TradingApi.EarnIntent
  isUSDQuote?: boolean
  walletExecutionContext?: TradingApi.WalletExecutionContext
  gasOverrides?: TradingApi.UrgencyOverrides
}

export function parseTradeInputForTradingApiQuote(input: UseTradeArgs): ParsedTradeInput {
  const { currencyIn, currencyOut, requestTradeType } = parseQuoteCurrencies(input)

  return {
    currencyIn,
    currencyOut,
    amount: input.amountSpecified,
    requestTradeType,
    activeAccountAddress: input.account?.address,
    tokenInChainId: toTradingApiSupportedChainId(currencyIn?.chainId),
    tokenOutChainId: input.quoteOutputOverride?.tokenOutChainId ?? toTradingApiSupportedChainId(currencyOut?.chainId),
    tokenInAddress: getTokenAddressForApi(currencyIn),
    tokenOutAddress: input.quoteOutputOverride?.tokenOutAddress ?? getTokenAddressForApi(currencyOut),
    generatePermitAsTransaction: input.generatePermitAsTransaction,
    earnIntent: input.earnIntent,
    isUSDQuote: input.isUSDQuote ?? false,
    walletExecutionContext: input.walletExecutionContext,
    gasOverrides: input.gasOverrides,
  }
}

// Single source of truth for validation
// Takes parsed input and returns validated input or undefined
export function validateParsedInput(input: ParsedTradeInput): ValidatedTradeInput | undefined {
  // Check all conditions that would make the input invalid
  if (
    !input.tokenInChainId ||
    !input.tokenOutChainId ||
    !input.tokenInAddress ||
    !input.tokenOutAddress ||
    !input.amount ||
    !input.currencyIn ||
    !input.currencyOut ||
    isZeroAmount(input.amount) ||
    (!input.earnIntent && areCurrenciesEqual(input.currencyIn, input.currencyOut))
  ) {
    return undefined
  }

  // If we get here, all required fields are present
  // Return a validated object with explicit field mapping
  return {
    currencyIn: input.currencyIn,
    currencyOut: input.currencyOut,
    amount: input.amount,
    requestTradeType: input.requestTradeType,
    activeAccountAddress: input.activeAccountAddress,
    tokenInChainId: input.tokenInChainId,
    tokenOutChainId: input.tokenOutChainId,
    tokenInAddress: input.tokenInAddress,
    tokenOutAddress: input.tokenOutAddress,
    generatePermitAsTransaction: input.generatePermitAsTransaction,
    earnIntent: input.earnIntent,
    isUSDQuote: input.isUSDQuote,
    walletExecutionContext: input.walletExecutionContext,
    gasOverrides: input.gasOverrides,
  }
}

// Helper to check if currencies are equal
function areCurrenciesEqual(currencyIn?: Currency | null, currencyOut?: Currency | null): boolean {
  if (!currencyIn || !currencyOut) {
    return false
  }
  return currencyIn.equals(currencyOut)
}
