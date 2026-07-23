import { CurrencyAmount, Token, TradeType as SdkTradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import {
  createBuildQuoteRequest,
  parseTradeInputForTradingApiQuote,
  validateParsedInput,
  type ValidatedTradeInput,
} from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the gating layer so we can drive the flag value per test
vi.mock('@universe/gating', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...mod,
    getFeatureFlag: vi.fn(),
  }
})

// Avoid the real gas-strategies path (depends on Statsig) — we only care about whether the
// `gasStrategies` field is present, not its contents.
vi.mock('uniswap/src/features/gas/utils', async (importOriginal) => {
  const mod = await importOriginal<typeof import('uniswap/src/features/gas/utils')>()
  return {
    ...mod,
    getActiveGasStrategy: vi.fn(() => ({
      limitInflationFactor: 1,
      displayLimitInflationFactor: 1,
      priceInflationFactor: 1,
      percentileThresholdFor1559Fee: 75,
    })),
  }
})

describe('createBuildQuoteRequest — wire shape', () => {
  const routingParams = { v4Enabled: true }
  const slippageParams = { autoSlippage: TradingApi.AutoSlippage.DEFAULT } as const
  const getRoutingParams = vi.fn(() => routingParams)
  const getSlippageParams = vi.fn(() => slippageParams)

  const ctx = {
    getRoutingParams,
    getSlippageParams,
  } as unknown as Parameters<typeof createBuildQuoteRequest>[0]

  // Cast to ValidatedTradeInput — Currency objects are not read by buildQuoteRequest itself
  const baseInput = {
    currencyIn: { chainId: 1 },
    currencyOut: { chainId: 1 },
    amount: { quotient: { toString: () => '1000' } },
    requestTradeType: TradingApi.TradeType.EXACT_INPUT,
    activeAccountAddress: '0xabc',
    tokenInChainId: 1,
    tokenOutChainId: 1,
    tokenInAddress: '0xtokIn',
    tokenOutAddress: '0xtokOut',
  } as unknown as ValidatedTradeInput

  beforeEach(() => {
    vi.mocked(getFeatureFlag).mockReset()
    getRoutingParams.mockClear()
    getSlippageParams.mockClear()
  })

  it('sends gasStrategies + string urgency when flag is OFF', () => {
    vi.mocked(getFeatureFlag).mockReturnValue(false)
    const buildQuoteRequest = createBuildQuoteRequest(ctx)
    const result = buildQuoteRequest(baseInput)
    expect(result.gasStrategies).toBeDefined()
    expect(Array.isArray(result.gasStrategies)).toBe(true)
    expect(typeof result.urgency).toBe('string')
    expect(result.urgency).toBe('urgent')
    expect(getFeatureFlag).toHaveBeenCalledWith(FeatureFlags.GasFeeOverrides)
  })

  it('sends only urgency (string form) when flag is ON and no overrides', () => {
    vi.mocked(getFeatureFlag).mockReturnValue(true)
    const buildQuoteRequest = createBuildQuoteRequest(ctx)
    const result = buildQuoteRequest(baseInput)
    expect(result.gasStrategies).toBeUndefined()
    expect(result.urgency).toBe('urgent')
  })

  it('sends urgency object form when flag is ON and overrides exist', () => {
    vi.mocked(getFeatureFlag).mockReturnValue(true)
    const buildQuoteRequest = createBuildQuoteRequest(ctx)
    const result = buildQuoteRequest({
      ...baseInput,
      gasOverrides: { maxFeePerGas: '12000000000', gasLimit: '500000' },
    })
    expect(result.gasStrategies).toBeUndefined()
    expect(result.urgency).toEqual({
      level: 'urgent',
      overrides: { maxFeePerGas: '12000000000', gasLimit: '500000' },
    })
  })

  it('parses a caller-provided API output override while preserving the selected output currency', () => {
    const inputToken = new Token(TradingApi.ChainId._130, '0xc3eacf0612346366db554c991d7858716db09f58', 18, 'TEST')
    const selectedOutputToken = new Token(
      TradingApi.ChainId._130,
      '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
      6,
      'USDC',
    )
    const earnIntent = {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      chainId: TradingApi.ChainId._1,
    }
    const quoteOutputOverride = {
      tokenOutAddress: earnIntent.vault,
      tokenOutChainId: Number(earnIntent.chainId),
    }

    const result = parseTradeInputForTradingApiQuote({
      amountSpecified: CurrencyAmount.fromRawAmount(inputToken, '100000000000000'),
      otherCurrency: selectedOutputToken,
      tradeType: SdkTradeType.EXACT_INPUT,
      earnIntent,
      quoteOutputOverride,
    })

    expect(result.currencyOut).toBe(selectedOutputToken)
    expect(result.tokenOutAddress).toBe(quoteOutputOverride.tokenOutAddress)
    expect(result.tokenOutChainId).toBe(quoteOutputOverride.tokenOutChainId)
  })

  it('validates same-token Earn deposits when the API output is the vault', () => {
    const selectedToken = new Token(TradingApi.ChainId._1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
    const earnIntent = {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0',
      chainId: TradingApi.ChainId._1,
    }

    const parsed = parseTradeInputForTradingApiQuote({
      amountSpecified: CurrencyAmount.fromRawAmount(selectedToken, '1000000'),
      otherCurrency: selectedToken,
      tradeType: SdkTradeType.EXACT_INPUT,
      earnIntent,
      quoteOutputOverride: {
        tokenOutAddress: earnIntent.vault,
        tokenOutChainId: Number(earnIntent.chainId),
      },
    })

    expect(validateParsedInput(parsed)).toEqual(expect.objectContaining({ earnIntent }))
  })

  it('rejects same-token non-Earn swaps', () => {
    const selectedToken = new Token(TradingApi.ChainId._1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')

    const parsed = parseTradeInputForTradingApiQuote({
      amountSpecified: CurrencyAmount.fromRawAmount(selectedToken, '1000000'),
      otherCurrency: selectedToken,
      tradeType: SdkTradeType.EXACT_INPUT,
    })

    expect(validateParsedInput(parsed)).toBeUndefined()
  })
})
