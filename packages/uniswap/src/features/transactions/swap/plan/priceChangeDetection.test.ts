import { CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { UNI, WBTC } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { buildTradeFromPlanResponse } from 'uniswap/src/features/transactions/swap/plan/planSagaUtils'
import { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { requireAcceptNewTrade } from 'uniswap/src/features/transactions/swap/utils/trade'

const INPUT_TOKEN = UNI[UniverseChainId.Mainnet]
const OUTPUT_TOKEN = WBTC

const INPUT_AMOUNT = '1000000000000000000' // 1e18
const OUTPUT_AMOUNT = '100000000' // 1e8

function createMockTruncatedStep(slippage = 0.5): TradingApi.TruncatedPlanStep {
  return {
    stepType: TradingApi.PlanStepType.CLASSIC,
    slippage,
  }
}

function createMockPlanStep(slippage = 0.5): TradingApi.PlanStep {
  return {
    stepIndex: 0,
    stepType: TradingApi.PlanStepType.CLASSIC,
    status: TradingApi.PlanStepStatus.AWAITING_ACTION,
    method: TradingApi.PlanStepMethod.SEND_TX,
    payload: {},
    slippage,
  } as TradingApi.PlanStep
}

function createChainedTrade(outputAmount: string): ChainedActionTrade {
  return new ChainedActionTrade({
    quote: {
      routing: TradingApi.Routing.CHAINED,
      requestId: 'test-request',
      permitData: null,
      quote: {
        input: { amount: INPUT_AMOUNT, token: INPUT_TOKEN.address },
        output: { amount: outputAmount, token: OUTPUT_TOKEN.address, recipient: '0xrecipient' },
        swapper: '0xswapper',
        tokenInChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
        tokenOutChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
        tradeType: TradingApi.TradeType.EXACT_INPUT,
        slippage: 0.5,
        quoteId: 'test-quote',
        gasFee: '0',
        gasFeeUSD: '0',
        gasFeeQuote: '0',
        gasUseEstimate: '0',
        gasStrategies: [],
        steps: [createMockTruncatedStep()],
      },
    },
    currencyIn: INPUT_TOKEN,
    currencyOut: OUTPUT_TOKEN,
  })
}

function createPlanResponse(expectedOutput: string): TradingApi.PlanResponse {
  return {
    planId: 'test-plan',
    requestId: 'test-request',
    quoteId: 'test-quote',
    expectedOutput,
    swapper: '0xswapper',
    recipient: '0xrecipient',
    gasFee: '0',
    gasFeeUSD: '0',
    gasFeeQuote: '0',
    gasUseEstimate: '0',
    gasStrategies: [],
    timeEstimateMs: 10000,
    status: TradingApi.PlanStatus.ACTIVE,
    currentStepIndex: 0,
    steps: [createMockPlanStep()],
  } as TradingApi.PlanResponse
}

/** Computes a percentage of OUTPUT_AMOUNT using integer math */
function scaleOutput(numerator: number, denominator: number): string {
  const base = Number(OUTPUT_AMOUNT)
  return String(Math.floor((base * numerator) / denominator))
}

describe('plan price change detection', () => {
  const address = '0x1234567890123456789012345678901234567890' as Address

  it('does not interrupt when expectedOutput equals original', () => {
    const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
    const planResponse = createPlanResponse(OUTPUT_AMOUNT)
    const refreshedTrade = buildTradeFromPlanResponse({ originalTrade, planResponse, address })

    expect(requireAcceptNewTrade(originalTrade, refreshedTrade)).toBe(false)
  })

  it('does not interrupt when expectedOutput improves (higher)', () => {
    const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
    // 5% improvement
    const improvedOutput = scaleOutput(105, 100)
    const planResponse = createPlanResponse(improvedOutput)
    const refreshedTrade = buildTradeFromPlanResponse({ originalTrade, planResponse, address })

    expect(requireAcceptNewTrade(originalTrade, refreshedTrade)).toBe(false)
  })

  it('does not interrupt when drop is within 1% threshold', () => {
    const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
    // 0.5% drop — within the 1% threshold
    const slightDrop = scaleOutput(995, 1000)
    const planResponse = createPlanResponse(slightDrop)
    const refreshedTrade = buildTradeFromPlanResponse({ originalTrade, planResponse, address })

    expect(requireAcceptNewTrade(originalTrade, refreshedTrade)).toBe(false)
  })

  it('interrupts when expectedOutput drops more than 1%', () => {
    const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
    // 2% drop — beyond the 1% threshold
    const bigDrop = scaleOutput(98, 100)
    const planResponse = createPlanResponse(bigDrop)
    const refreshedTrade = buildTradeFromPlanResponse({ originalTrade, planResponse, address })

    expect(requireAcceptNewTrade(originalTrade, refreshedTrade)).toBe(true)
  })

  it('preserves currency information in the refreshed trade', () => {
    const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
    const planResponse = createPlanResponse(OUTPUT_AMOUNT)
    const refreshedTrade = buildTradeFromPlanResponse({ originalTrade, planResponse, address })

    expect(refreshedTrade.inputAmount.currency.equals(originalTrade.inputAmount.currency)).toBe(true)
    expect(refreshedTrade.outputAmount.currency.equals(originalTrade.outputAmount.currency)).toBe(true)
    expect(refreshedTrade.inputAmount.equalTo(originalTrade.inputAmount)).toBe(true)
  })

  it('correctly constructs output amount from plan response', () => {
    const originalTrade = createChainedTrade(OUTPUT_AMOUNT)
    const newOutput = '200000000'
    const planResponse = createPlanResponse(newOutput)
    const refreshedTrade = buildTradeFromPlanResponse({ originalTrade, planResponse, address })

    expect(refreshedTrade.outputAmount.equalTo(CurrencyAmount.fromRawAmount(OUTPUT_TOKEN, newOutput))).toBe(true)
  })
})
