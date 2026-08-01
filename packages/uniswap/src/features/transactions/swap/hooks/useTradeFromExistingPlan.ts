import { ChainedQuoteResponse, TradingApi } from '@universe/api'
import { useMemo } from 'react'
import { createEarnChainedActionDisplayAmounts } from 'uniswap/src/features/earn/chainedDisplayAmounts'
import { getEarnPreviewFromPlanResponse } from 'uniswap/src/features/earn/planPreview'
import {
  areEarnPlanReuseIdentitiesCompatible,
  getEarnPlanReuseIdentityFromValidatedInput,
} from 'uniswap/src/features/transactions/swap/plan/earnPlanReuseIdentity'
import { getPlanCompoundSlippageTolerance } from 'uniswap/src/features/transactions/swap/plan/slippage'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { prepareTradingApiTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/evmTradeService'
import { ValidatedTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import {
  createChainedActionTrade,
  type TradeWithStatus,
  type UseTradeArgs,
} from 'uniswap/src/features/transactions/swap/types/trade'
import { useStore } from 'zustand'

export interface TransformPlanParams {
  planResponse: TradingApi.PlanResponse
  validatedInput: ValidatedTradeInput
  slippageTolerance: number
}

export function transformPlanResponseToChainedQuote({
  planResponse,
  validatedInput,
  slippageTolerance,
}: TransformPlanParams): ChainedQuoteResponse {
  // Extract amount string from CurrencyAmount
  const inputAmount = validatedInput.amount.quotient.toString()
  const input: TradingApi.QuoteInput = {
    amount: inputAmount,
    maximumAmount: inputAmount,
    token: validatedInput.tokenInAddress,
  }
  const output: TradingApi.QuoteOutput = {
    amount: planResponse.expectedOutput,
    minimumAmount: getMinimumAmountOut(planResponse.expectedOutput, slippageTolerance),
    token: validatedInput.tokenOutAddress,
    recipient: planResponse.recipient,
  }
  // Build ChainedQuote with proper structure
  const chainedQuote: TradingApi.ChainedQuote = {
    input,
    output,
    swapper: planResponse.swapper,
    tokenInChainId: validatedInput.tokenInChainId as TradingApi.ChainId,
    tokenOutChainId: validatedInput.tokenOutChainId as TradingApi.ChainId,
    tradeType: validatedInput.requestTradeType,
    slippage: slippageTolerance,
    quoteId: planResponse.quoteId,
    // Gas field mapping
    gasFee: planResponse.gasFee,
    gasFeeUSD: planResponse.gasFeeUSD,
    gasFeeQuote: planResponse.gasFeeQuote,
    gasUseEstimate: planResponse.gasUseEstimate,
    timeEstimateMs: planResponse.timeEstimateMs,
    gasStrategies: planResponse.gasStrategies ?? [],
    steps: planResponse.steps.map((step) => ({
      ...step,
      // stepType should be defined but if not CLASSIC is a safe fallback since it's only used for estimations
      stepType: step.stepType ?? TradingApi.PlanStepType.CLASSIC,
    })),
    earnIntent: planResponse.earnIntent,
    earnPreview: getEarnPreviewFromPlanResponse(planResponse),
  }
  // Construct complete ChainedQuoteResponse
  const chainedQuoteResponse: ChainedQuoteResponse = {
    routing: TradingApi.Routing.CHAINED,
    quote: chainedQuote,
    requestId: planResponse.requestId,
    permitData: null, // Plans don't require new permits
  } as ChainedQuoteResponse
  return chainedQuoteResponse
}

export function useTradeFromExistingPlan(params: UseTradeArgs): TradeWithStatus | undefined {
  const activePlan = useStore(activePlanStore, (state) => state.activePlan)

  return useMemo(() => {
    if (!activePlan) {
      return undefined
    }

    const validatedInput = prepareTradingApiTradeInput(params)
    if (!validatedInput) {
      return undefined
    }
    const activePlanResponse = activePlan.response
    const earnIntent = params.earnIntent ?? activePlanResponse.earnIntent
    const currentIdentity = getEarnPlanReuseIdentityFromValidatedInput(validatedInput, earnIntent)
    if (
      !areEarnPlanReuseIdentitiesCompatible({
        activeIdentity: activePlan.earnReuseIdentity,
        currentIdentity,
      })
    ) {
      return undefined
    }

    const slippageTolerance =
      getPlanCompoundSlippageTolerance(activePlanResponse.steps) ?? params.customSlippageTolerance ?? 0

    const adaptedChainedQuote = transformPlanResponseToChainedQuote({
      planResponse: activePlanResponse,
      validatedInput,
      slippageTolerance,
    })

    const earnDisplayAmounts = earnIntent
      ? createEarnChainedActionDisplayAmounts({
          quote: adaptedChainedQuote,
          currencyIn: validatedInput.currencyIn,
          currencyOut: validatedInput.currencyOut,
          earnIntent,
        })
      : undefined

    if (earnIntent && !earnDisplayAmounts) {
      return undefined
    }

    const trade = createChainedActionTrade({
      quote: adaptedChainedQuote,
      currencyIn: validatedInput.currencyIn,
      currencyOut: validatedInput.currencyOut,
      earnIntent,
      displayAmountsOverride: earnDisplayAmounts ?? undefined,
    })

    if (!trade) {
      return undefined
    }

    return {
      trade,
      isLoading: false,
      isFetching: false,
      error: null,
      indicativeTrade: undefined,
      isIndicativeLoading: false,
      gasEstimate: undefined,
    }
  }, [activePlan, params])
}

function getMinimumAmountOut(amount: string, slippageTolerance: number): string {
  const slippageBps = BigInt(Math.round(slippageTolerance * 100))
  const bipsBase = BigInt(10_000)
  return ((BigInt(amount) * (bipsBase - slippageBps)) / bipsBase).toString()
}
