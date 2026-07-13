import { CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import type { DiscriminatedQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { createEVMTradeService } from 'uniswap/src/features/transactions/swap/services/tradeService/evmTradeService'
import type { TradeRepository } from 'uniswap/src/features/transactions/swap/services/tradeService/tradeRepository'
import type { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the gating layer so we can drive the global UniswapX flag per test
vi.mock('@universe/gating', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...mod,
    getFeatureFlag: vi.fn(),
  }
})

// Avoid the real gas-strategies path (depends on Statsig)
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

describe('createEVMTradeService — UniswapX gating', () => {
  const mockFetchQuote = vi.fn().mockResolvedValue({
    quote: {},
    routing: TradingApi.Routing.CLASSIC,
    requestId: '123',
  } as DiscriminatedQuoteResponse)
  const mockFetchIndicativeQuote = vi.fn()

  const tradeRepository = {
    fetchQuote: mockFetchQuote,
    fetchIndicativeQuote: mockFetchIndicativeQuote,
  } as unknown as TradeRepository

  const input = {
    account: { address: '0xabc' },
    amountSpecified: CurrencyAmount.fromRawAmount(USDC, '1000000'),
    otherCurrency: DAI,
    tradeType: TradeType.EXACT_INPUT,
    selectedProtocols: [TradingApi.ProtocolItems.UNISWAPX_LATEST, TradingApi.ProtocolItems.V3],
  } as unknown as UseTradeArgs

  const getProtocolsSentToApi = (): TradingApi.ProtocolItems[] => mockFetchQuote.mock.calls[0]?.[0]?.protocols ?? []

  beforeEach(() => {
    vi.clearAllMocks()
    // UniswapX global flag ON for all cases — we're isolating the mismatch dimension
    vi.mocked(getFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.UniswapX)
  })

  it('keeps UniswapX when the account/chain supports it', async () => {
    const service = createEVMTradeService({
      tradeRepository,
      getIsL2ChainId: () => false,
      getMinAutoSlippageToleranceL2: () => 2.5,
      getIsUniswapXSupported: () => true,
    })

    await service.getTrade(input)

    expect(getProtocolsSentToApi()).toContain(TradingApi.ProtocolItems.UNISWAPX_LATEST)
  })

  it('removes UniswapX when the account has a delegation mismatch (getIsUniswapXSupported=false)', async () => {
    const service = createEVMTradeService({
      tradeRepository,
      getIsL2ChainId: () => false,
      getMinAutoSlippageToleranceL2: () => 2.5,
      getIsUniswapXSupported: () => false,
    })

    await service.getTrade(input)

    expect(getProtocolsSentToApi()).not.toContain(TradingApi.ProtocolItems.UNISWAPX_LATEST)
    expect(getProtocolsSentToApi()).toContain(TradingApi.ProtocolItems.V3)
  })

  it('defaults to supported when no getIsUniswapXSupported is provided', async () => {
    const service = createEVMTradeService({
      tradeRepository,
      getIsL2ChainId: () => false,
      getMinAutoSlippageToleranceL2: () => 2.5,
    })

    await service.getTrade(input)

    expect(getProtocolsSentToApi()).toContain(TradingApi.ProtocolItems.UNISWAPX_LATEST)
  })
})
