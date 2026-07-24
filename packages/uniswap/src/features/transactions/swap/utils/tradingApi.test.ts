import { CurrencyAmount, TradeType as SdkTradeType } from '@uniswap/sdk-core'
import type { ChainedQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { USDC_MAINNET, USDC_UNICHAIN } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'
import { useProtocols } from 'uniswap/src/features/transactions/swap/utils/protocols'
import {
  createGetQuoteSlippageParams,
  transformTradingApiResponseToTrade,
  useQuoteRoutingParams,
  validateTrade,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { renderHook } from 'uniswap/src/test/test-utils'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/transactions/swap/utils/protocols', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/transactions/swap/utils/protocols')>()
  return {
    ...actual,
    useProtocols: vi.fn((protocols) => protocols),
  }
})

const mockUseProtocols = useProtocols as Mock

const SWAPPER = '0xAAAA44272dc658575Ba38f43C438447dDED45358'
const VAULT_ADDRESS = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'

function createChainedQuote(overrides: Partial<ChainedQuoteResponse['quote']> = {}): ChainedQuoteResponse {
  return {
    requestId: 'request-id',
    routing: TradingApi.Routing.CHAINED,
    permitData: null,
    quote: {
      swapper: SWAPPER,
      input: {
        amount: '1000000',
        maximumAmount: '1000000',
        token: USDC_UNICHAIN.address,
      },
      output: {
        amount: '2000000',
        minimumAmount: '1990000',
        token: USDC_MAINNET.address,
        recipient: SWAPPER,
      },
      tokenInChainId: UniverseChainId.Unichain as unknown as TradingApi.ChainId,
      tokenOutChainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
      tradeType: TradingApi.TradeType.EXACT_INPUT,
      quoteId: 'quote-id',
      gasStrategies: [],
      steps: [{ stepType: TradingApi.PlanStepType.BRIDGE }],
      ...overrides,
    },
  }
}

describe('useQuoteRoutingParams', () => {
  const tokenInChainId = UniverseChainId.Mainnet
  const tokenOutChainId = UniverseChainId.Mainnet
  const defaultProtocols: FrontendSupportedProtocol[] = [
    TradingApi.ProtocolItems.V2,
    TradingApi.ProtocolItems.V3,
    TradingApi.ProtocolItems.V4,
  ]

  beforeEach(() => {
    mockUseProtocols.mockImplementation((protocols) => protocols)
  })

  it('should return only V2, V3, V4 protocols for USD quotes and no hooksOptions', () => {
    const { result } = renderHook(() =>
      useQuoteRoutingParams({
        selectedProtocols: defaultProtocols,
        tokenInChainId,
        tokenOutChainId,
        isUSDQuote: true,
        isV4HookPoolsEnabled: true,
      }),
    )
    expect(result.current).toEqual({
      protocols: [TradingApi.ProtocolItems.V2, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V4],
    })
  })

  it('should return BEST_PRICE routingPreference for bridging quotes', () => {
    const { result } = renderHook(() =>
      useQuoteRoutingParams({
        selectedProtocols: defaultProtocols,
        tokenInChainId: UniverseChainId.Mainnet,
        tokenOutChainId: UniverseChainId.ArbitrumOne,
        isV4HookPoolsEnabled: true,
      }),
    )
    expect(result.current).toEqual({
      hooksOptions: TradingApi.HooksOptions.V4_HOOKS_INCLUSIVE,
      protocols: [TradingApi.ProtocolItems.V2, TradingApi.ProtocolItems.V3, TradingApi.ProtocolItems.V4],
    })
  })

  it('should pass through UniswapX latest when selected and enabled', () => {
    const selectedProtocols: FrontendSupportedProtocol[] = [
      TradingApi.ProtocolItems.UNISWAPX_LATEST,
      TradingApi.ProtocolItems.V4,
      TradingApi.ProtocolItems.V3,
      TradingApi.ProtocolItems.V2,
    ]
    mockUseProtocols.mockImplementation(() => selectedProtocols)

    const { result } = renderHook(() =>
      useQuoteRoutingParams({
        selectedProtocols,
        tokenInChainId,
        tokenOutChainId,
        isV4HookPoolsEnabled: true,
      }),
    )

    expect(mockUseProtocols).toHaveBeenCalledWith(selectedProtocols)
    expect(result.current).toEqual({
      protocols: selectedProtocols,
      hooksOptions: TradingApi.HooksOptions.V4_HOOKS_INCLUSIVE,
    })
  })

  describe('when V4 Hooks are enabled', () => {
    describe('and isV4HookPoolsEnabled is true', () => {
      const isV4HookPoolsEnabled = true

      it('should return V4_HOOKS_INCLUSIVE for hooksOptions if V4 is already in protocols', () => {
        const selectedProtocols: FrontendSupportedProtocol[] = [
          TradingApi.ProtocolItems.V2,
          TradingApi.ProtocolItems.V3,
          TradingApi.ProtocolItems.V4,
        ]
        mockUseProtocols.mockImplementation(() => selectedProtocols)

        const { result } = renderHook(() =>
          useQuoteRoutingParams({
            selectedProtocols,
            tokenInChainId,
            tokenOutChainId,
            isV4HookPoolsEnabled,
          }),
        )

        expect(mockUseProtocols).toHaveBeenCalledWith(selectedProtocols)
        expect(result.current).toEqual({
          protocols: selectedProtocols,
          hooksOptions: TradingApi.HooksOptions.V4_HOOKS_INCLUSIVE,
        })
      })

      it('should add V4 to protocols and return V4_HOOKS_ONLY for hooksOptions if V4 is not in protocols', () => {
        const selectedProtocols: FrontendSupportedProtocol[] = [
          TradingApi.ProtocolItems.V2,
          TradingApi.ProtocolItems.V3,
        ]
        const expectedProtocols = [
          TradingApi.ProtocolItems.V2,
          TradingApi.ProtocolItems.V3,
          TradingApi.ProtocolItems.V4,
        ]
        mockUseProtocols.mockImplementation(() => selectedProtocols)

        const { result } = renderHook(() =>
          useQuoteRoutingParams({
            selectedProtocols,
            tokenInChainId,
            tokenOutChainId,
            isV4HookPoolsEnabled,
          }),
        )

        expect(mockUseProtocols).toHaveBeenCalledWith(selectedProtocols)
        expect(result.current).toEqual({
          protocols: expectedProtocols,
          hooksOptions: TradingApi.HooksOptions.V4_HOOKS_ONLY,
        })
      })
    })

    describe('and isV4HookPoolsEnabled is false', () => {
      const isV4HookPoolsEnabled = false

      it('should return the original protocols and V4_NO_HOOKS for hooksOptions', () => {
        const selectedProtocols: FrontendSupportedProtocol[] = [
          TradingApi.ProtocolItems.V2,
          TradingApi.ProtocolItems.V3,
          TradingApi.ProtocolItems.V4,
        ]
        mockUseProtocols.mockImplementation(() => selectedProtocols)

        const { result } = renderHook(() =>
          useQuoteRoutingParams({
            selectedProtocols,
            tokenInChainId,
            tokenOutChainId,
            isV4HookPoolsEnabled,
          }),
        )

        expect(mockUseProtocols).toHaveBeenCalledWith(selectedProtocols)
        expect(result.current).toEqual({
          protocols: selectedProtocols,
          hooksOptions: TradingApi.HooksOptions.V4_NO_HOOKS,
        })
      })

      it('should return the original protocols (without V4) and V4_NO_HOOKS for hooksOptions', () => {
        const selectedProtocols: FrontendSupportedProtocol[] = [
          TradingApi.ProtocolItems.V2,
          TradingApi.ProtocolItems.V3,
        ]
        mockUseProtocols.mockImplementation(() => selectedProtocols)

        const { result } = renderHook(() =>
          useQuoteRoutingParams({
            selectedProtocols,
            tokenInChainId,
            tokenOutChainId,
            isV4HookPoolsEnabled,
          }),
        )

        expect(mockUseProtocols).toHaveBeenCalledWith(selectedProtocols)
        expect(result.current).toEqual({
          protocols: selectedProtocols,
          hooksOptions: TradingApi.HooksOptions.V4_NO_HOOKS,
        })
      })
    })
  })
})

describe(validateTrade, () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('allows Earn deposit display output to differ from the selected swap output currency', () => {
    const earnIntent: TradingApi.EarnIntent = {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: VAULT_ADDRESS,
      chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    }
    const trade = transformTradingApiResponseToTrade({
      data: createChainedQuote({
        output: {
          amount: '2800994864966439066',
          minimumAmount: '2786990000000000000',
          token: VAULT_ADDRESS,
          recipient: SWAPPER,
        },
        earnPreview: {
          type: TradingApi.EarnDepositPreview.type.DEPOSIT,
          depositAssets: [
            {
              token: USDC_MAINNET.address,
              chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
              amount: '2000000',
            },
          ],
          estimatedSharesOut: '2800994864966439066',
        },
      }),
      currencyIn: USDC_UNICHAIN,
      currencyOut: USDC_UNICHAIN,
      deadline: undefined,
      earnIntent,
      tradeType: SdkTradeType.EXACT_INPUT,
    })

    const result = validateTrade({
      trade,
      currencyIn: USDC_UNICHAIN,
      currencyOut: USDC_UNICHAIN,
      exactAmount: CurrencyAmount.fromRawAmount(USDC_UNICHAIN, '1000000'),
      exactCurrencyField: CurrencyField.INPUT,
    })

    expect(result).toBe(trade)
    expect(result?.outputAmount.currency.equals(USDC_MAINNET)).toBe(true)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('rejects Earn deposits whose quote output is not the Earn intent vault', () => {
    const earnIntent: TradingApi.EarnIntent = {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: VAULT_ADDRESS,
      chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
    }
    const trade = transformTradingApiResponseToTrade({
      data: createChainedQuote({
        output: {
          amount: '2800994864966439066',
          minimumAmount: '2786990000000000000',
          token: '0x999944272dc658575ba38f43c438447dded45999',
          recipient: SWAPPER,
        },
        earnPreview: {
          type: TradingApi.EarnDepositPreview.type.DEPOSIT,
          depositAssets: [
            {
              token: USDC_MAINNET.address,
              chainId: UniverseChainId.Mainnet as unknown as TradingApi.ChainId,
              amount: '2000000',
            },
          ],
          estimatedSharesOut: '2800994864966439066',
        },
      }),
      currencyIn: USDC_UNICHAIN,
      currencyOut: USDC_UNICHAIN,
      deadline: undefined,
      earnIntent,
      tradeType: SdkTradeType.EXACT_INPUT,
    })

    const result = validateTrade({
      trade,
      currencyIn: USDC_UNICHAIN,
      currencyOut: USDC_UNICHAIN,
      exactAmount: CurrencyAmount.fromRawAmount(USDC_UNICHAIN, '1000000'),
      exactCurrencyField: CurrencyField.INPUT,
    })

    expect(result).toBeNull()
    expect(logger.error).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
  })

  it('still rejects non-Earn chained trades whose output currency does not match the selected output', () => {
    const trade = transformTradingApiResponseToTrade({
      data: createChainedQuote(),
      currencyIn: USDC_UNICHAIN,
      currencyOut: USDC_MAINNET,
      deadline: undefined,
      tradeType: SdkTradeType.EXACT_INPUT,
    })

    const result = validateTrade({
      trade,
      currencyIn: USDC_UNICHAIN,
      currencyOut: USDC_UNICHAIN,
      exactAmount: CurrencyAmount.fromRawAmount(USDC_UNICHAIN, '1000000'),
      exactCurrencyField: CurrencyField.INPUT,
    })

    expect(result).toBeNull()
    expect(logger.error).toHaveBeenCalledWith(expect.any(Error), expect.any(Object))
  })
})

describe(createGetQuoteSlippageParams, () => {
  const MIN_L2_SLIPPAGE = 2.5

  function createSlippageParams({
    customSlippageTolerance,
    isL2ChainId = false,
    minAutoSlippageToleranceL2,
  }: { customSlippageTolerance?: number; isL2ChainId?: boolean; minAutoSlippageToleranceL2?: number } = {}) {
    return createGetQuoteSlippageParams({
      getMinAutoSlippageToleranceL2: () => minAutoSlippageToleranceL2,
      getIsL2ChainId: () => isL2ChainId,
      getCustomSlippageTolerance: () => customSlippageTolerance,
    })
  }

  it('returns the configured slippage tolerance for same-chain L2 swaps when the dynamic config value is set', () => {
    const getQuoteSlippageParams = createSlippageParams({
      isL2ChainId: true,
      minAutoSlippageToleranceL2: MIN_L2_SLIPPAGE,
    })

    const result = getQuoteSlippageParams({
      tokenInChainId: UniverseChainId.Base,
      tokenOutChainId: UniverseChainId.Base,
    })

    expect(result).toEqual({ slippageTolerance: MIN_L2_SLIPPAGE })
  })

  it('returns autoSlippage for same-chain L2 swaps when the dynamic config value is unset', () => {
    const getQuoteSlippageParams = createSlippageParams({ isL2ChainId: true })

    const result = getQuoteSlippageParams({
      tokenInChainId: UniverseChainId.Base,
      tokenOutChainId: UniverseChainId.Base,
    })

    expect(result).toEqual({ autoSlippage: TradingApi.AutoSlippage.DEFAULT })
    expect(result).not.toHaveProperty('slippageTolerance')
  })

  it('returns the custom slippage tolerance when the user has set one', () => {
    const getQuoteSlippageParams = createSlippageParams({
      customSlippageTolerance: 1.5,
      isL2ChainId: true,
      minAutoSlippageToleranceL2: MIN_L2_SLIPPAGE,
    })

    const result = getQuoteSlippageParams({
      tokenInChainId: UniverseChainId.Base,
      tokenOutChainId: UniverseChainId.Base,
    })

    expect(result).toEqual({ slippageTolerance: 1.5 })
  })

  it('returns autoSlippage for cross-chain swaps regardless of the dynamic config value', () => {
    const getQuoteSlippageParams = createSlippageParams({
      isL2ChainId: true,
      minAutoSlippageToleranceL2: MIN_L2_SLIPPAGE,
    })

    const result = getQuoteSlippageParams({
      tokenInChainId: UniverseChainId.Base,
      tokenOutChainId: UniverseChainId.Mainnet,
    })

    expect(result).toEqual({ autoSlippage: TradingApi.AutoSlippage.DEFAULT })
  })

  it('returns autoSlippage for USD quotes regardless of the dynamic config value', () => {
    const getQuoteSlippageParams = createSlippageParams({
      isL2ChainId: true,
      minAutoSlippageToleranceL2: MIN_L2_SLIPPAGE,
    })

    const result = getQuoteSlippageParams({
      tokenInChainId: UniverseChainId.Base,
      tokenOutChainId: UniverseChainId.Base,
      isUSDQuote: true,
    })

    expect(result).toEqual({ autoSlippage: TradingApi.AutoSlippage.DEFAULT })
  })

  it('returns autoSlippage for same-chain L1 swaps', () => {
    const getQuoteSlippageParams = createSlippageParams({ minAutoSlippageToleranceL2: MIN_L2_SLIPPAGE })

    const result = getQuoteSlippageParams({
      tokenInChainId: UniverseChainId.Mainnet,
      tokenOutChainId: UniverseChainId.Mainnet,
    })

    expect(result).toEqual({ autoSlippage: TradingApi.AutoSlippage.DEFAULT })
  })
})
