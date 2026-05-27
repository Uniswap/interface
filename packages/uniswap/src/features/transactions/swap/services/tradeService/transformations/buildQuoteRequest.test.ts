import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import {
  createBuildQuoteRequest,
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

  const ctx = {
    getRoutingParams: vi.fn(() => routingParams),
    getSlippageParams: vi.fn(() => slippageParams),
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
})
